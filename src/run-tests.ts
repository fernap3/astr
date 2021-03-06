import process = require("process");
import fs = require("fs");
import path = require("path");
import { argv } from "yargs";
import * as puppeteer from "puppeteer";
import * as supportsColor from "supports-color";

import { Assert, AssertionError, Test, TestModule } from "./astr.js";
import * as astr from "./astr.js";
import { writeTrx } from "./trx.js";
import { tests, state, TestResult, TestStatus, TestResultTest } from "./tests.js";
import { dirname } from "path";

const consoleColors = {
	Reset: "\x1b[0m",
	Bright: "\x1b[1m",
	Dim: "\x1b[2m",
	Underscore: "\x1b[4m",
	Blink: "\x1b[5m",
	Reverse: "\x1b[7m",
	Hidden: "\x1b[8m",

	FgBlack: "\x1b[30m",
	FgRed: "\x1b[31m",
	FgGreen: "\x1b[32m",
	FgYellow: "\x1b[33m",
	FgBlue: "\x1b[34m",
	FgMagenta: "\x1b[35m",
	FgCyan: "\x1b[36m",
	FgWhite: "\x1b[37m",

	BgBlack: "\x1b[40m",
	BgRed: "\x1b[41m",
	BgGreen: "\x1b[42m",
	BgYellow: "\x1b[43m",
	BgBlue: "\x1b[44m",
	BgMagenta: "\x1b[45m",
	BgCyan: "\x1b[46m",
	BgWhite: "\x1b[47m",
};

const consoleColorSequences = new Set(Object.values(consoleColors));

type AstrRuntime = "node" | "puppeteer";
export type FinalResults = Map<TestResultTest, TestResult>;
const results: FinalResults = new Map<TestResultTest, TestResult>();



function withColor(strings: TemplateStringsArray, ...vars: any[]): string
{
	let result = [] as string[];
	
	for (let i = 0; i < strings.length; i++)
	{
		result.push(strings[i]);

		if (vars[i] && (supportsColor.stdout || !consoleColorSequences.has(vars[i])))
			result.push(vars[i]);
	}

	return result.join("");
}

(async () =>
{
	const passedTests = [];
	const failedTests = [];

	const singleTestToRunIndex: number | undefined = argv.index as number;
	const showHelp: boolean = argv.help as boolean ?? false;
	const listTests: boolean = argv.list as boolean ?? false;
	const testDir = argv.testdir as string | undefined;
	const runtime = (argv.runtime || "node") as AstrRuntime;
	const trxOutPath = argv.trx as string | undefined;

	if (showHelp)
	{
		printArgs();
		process.exit(0);
	}

	if (!testDir)
	{
		printArgs();
		console.log("\nError: must supply test directory with --testdir")
		process.exit(0);
	}

	if (trxOutPath != null && (typeof trxOutPath !== "string" || trxOutPath === ""))
	{
		printArgs();
		console.log("\nError: must supply an output file path with --trx (eg. --trx outfile.trx)")
		process.exit(0);
	}
	
	scrapeTests(path.resolve(testDir));

	if (listTests)
	{
		let testNum = 0;
		for (const testModule of tests)
		{
			console.log(`${testModule.name}`);
			for (const test of testModule.tests)
			{
				console.log(withColor`${consoleColors.FgYellow}${testNum + 1}: ${consoleColors.Reset}${test.name}`);
				testNum++;
			}
		}
		process.exit(0);
	}

	let browser: puppeteer.Browser;
	let page: puppeteer.Page;

	if (runtime === "puppeteer")
	{
		browser = await puppeteer.launch({
			headless: true,
		});

		page = await browser.newPage();
	}
	
	// TODO: Run any initializations that need to happen before the whole test run starts

	let testNum = 0;
	for (let module of tests)
	{
		if (module.name)
			console.log(`\nRunning tests from ${module.name}`);
		
		for (let i = 0; i < module.tests.length; i++, testNum++)
		{
			if (singleTestToRunIndex && testNum + 1 !== singleTestToRunIndex)
				continue;


			const test = module.tests[i];
			process.stdout.write(withColor`${consoleColors.FgYellow}${testNum + 1}: ${consoleColors.Reset}${test.name}...`)

			const startTime = new Date();
			let testStatus = "pass" as TestStatus;
			let testErrorMessage = undefined as string | undefined;

			try
			{
				if (runtime === "node")
				{
					module.testInit?.();
					await test.func(new Assert());
				}
				else
				{
					await page!.reload();
					await page!.addScriptTag({
						path: path.join(__dirname, "astr-puppeteer.js")
					});

					for (let dependency of test.dependencies ?? [])
					{
						await page!.addScriptTag({
							path: path.join(testDir, dependency)
						});
					}

					const error = await page!.evaluate(`
						(async () => {
							try
							{
								await (${module.testInit?.toString()})?.();
							}
							catch(e)
							{
								return e.message;
							}

							try {
								await (${test.func.toString()})(new window.astr.Assert());
							}
							catch(e) {
								if (e.astrError)
									return e;
								else
									return e.message + " " + e.stack;
							}
						})();
					`) as ReturnType<AssertionError["toJSON"]>;

					if (error?.type)
						throw AssertionError.fromJSON(error);
					else if(error)
						throw error;
				}
				
				process.stdout.write(withColor`${consoleColors.FgGreen}PASS${consoleColors.Reset}\n`)
				passedTests.push(test);
			}
			catch (err)
			{
				testStatus = "fail";
				
				if (err instanceof AssertionError)
				{
					if (err.expected)
					{
						testErrorMessage = `${err.type} assertion failed: expected ${err.expected}, got ${err.actual}. ${err.message ?? ""}`;
						process.stdout.write(withColor`${consoleColors.FgRed}FAIL${consoleColors.Reset} ${testErrorMessage}\n`);
					}
					else
					{
						testErrorMessage = `${err.type} assertion failed: ${err.message ?? ""}`;
						process.stdout.write(withColor`${consoleColors.FgRed}FAIL${consoleColors.Reset} ${testErrorMessage}\n`);
					}
				}
				else
				{
					testErrorMessage = `Test threw error: \n${err}`;
					process.stdout.write(withColor`${consoleColors.FgRed}FAIL${consoleColors.Reset} ${testErrorMessage}\n`);
				}

				failedTests.push(test);
			}

			results.set(
				{
					...test,
					moduleName: module.name ?? "(No module)"
				},
				{
					startTime,
					endTime: new Date(),
					status: testStatus,
					errorMessage: testErrorMessage,
				}
			);
		}
	}
	
	if (failedTests.length)
		console.log(withColor`${consoleColors.FgGreen}${passedTests.length}${consoleColors.Reset} passing, ${consoleColors.FgRed}${failedTests.length}${consoleColors.Reset} failing`);
	else
		console.log(withColor`All ${consoleColors.FgGreen}${passedTests.length}${consoleColors.Reset} tests passing`);

	if (trxOutPath)
	{
		ensureDirectoryExists(trxOutPath);
		await writeTrx(results, trxOutPath);
	}

	if (failedTests.length)
		process.exit(-1);
	else
		process.exit(0);
})();

function ensureDirectoryExists(filePath: string)
{
	const dirName = path.dirname(filePath);
	if (!fs.existsSync(dirName))
		fs.mkdirSync(dirName, { recursive: true });
}

function scrapeTests(testDir: string)
{
	if (!fs.existsSync(testDir) || !fs.lstatSync(testDir).isDirectory())
	{
		console.log(`Error: the test directory provided does not exist or is not a directory: ${testDir}`);
		process.exit(1);
	}
	
	const dirEntries = fs.readdirSync(testDir);

	for (let fileName of dirEntries)
	{	
		const fullFilePath = path.join(testDir, fileName);

		state.currentTestFilePath = fullFilePath;
		
		if (!(/.js$/.test(fileName)))
			continue;
		
		// console.log(`Found tests in ${path.join(testDir, fileName)}`);
		require(fullFilePath);
	}
}

function printArgs()
{
	console.log(`npm test --testdir tests/                       - Run all tests, under NodeJS`);
	console.log(`npm test --testdir tests/ --runtime puppeteer   - Run all tests, in Chromium`);
	console.log(`npm test --testdir tests/ --index 5             - Run just the fifth test`);
	console.log(`npm test --testdir tests/ --list                - Show all the tests`);
	console.log(`npm test --testdir tests/ --trx results/out.trx - Output to a TRX file`);
	console.log(`npm test --help                                 - Show this documentation`);
}
