import dotenv = require("dotenv");
dotenv.config();

import process = require("process");
import fs = require("fs");
import path = require("path");
import { argv } from "yargs";

import { tests, Assert, AssertionError } from "./tsc-test.js";

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


(async () =>
{
	const passedTests = [];
	const failedTests = [];

	const singleTestToRunIndex: number | undefined = argv.index as number;
	const showHelp: boolean = argv.help as boolean ?? false;
	const listTests: boolean = argv.list as boolean ?? false;
	const testDir = argv.testdir as string | undefined;

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
	
	scrapeTests(path.resolve(testDir));

	if (listTests)
	{
		for (let i = 0; i < tests.length; i++)
		{
			const test = tests[i];
			console.log(`${consoleColors.FgYellow}${i + 1}: ${consoleColors.Reset}${test.name}`);
		}
		process.exit(0);
	}

	
	// TODO: Run any initializations that need to happen before the whole test run starts

	for (let i = 0; i < tests.length; i++)
	{
		if (singleTestToRunIndex && i+1 !== singleTestToRunIndex)
			continue;

		// TODO: Run any initializations that need to happen before any one test runs

		const test = tests[i];
		process.stdout.write(`${consoleColors.FgYellow}${i + 1}: ${consoleColors.Reset}${test.name}...`)

		try
		{
			await test.func(new Assert());
			process.stdout.write(`${consoleColors.FgGreen}PASS${consoleColors.Reset}\n`)
			passedTests.push(test);
		}
		catch (err)
		{
			if (err instanceof AssertionError)
				process.stdout.write(`${consoleColors.FgRed}FAIL${consoleColors.Reset} (${err.type} assertion failed: expected ${err.expected}, got ${err.actual})\n`);
			else
				process.stdout.write(`${consoleColors.FgRed}FAIL${consoleColors.Reset} (test threw error)\n${err}\n`);

			failedTests.push(test);
		}
	}
	
	if (failedTests.length)
		console.log(`${consoleColors.FgGreen}${passedTests.length}${consoleColors.Reset} passing, ${consoleColors.FgRed}${failedTests.length}${consoleColors.Reset} failing`);
	else
		console.log(`All ${consoleColors.FgGreen}${passedTests.length}${consoleColors.Reset} tests passing`);

	if (failedTests.length)
		process.exit(-1);
	else
		process.exit(0);
})();

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
		if (!(/.js$/.test(fileName)))
			continue;
		
		console.log(`Requiring ${path.join(testDir, fileName)}`)
		require(path.join(testDir, fileName));
	}
}

function printArgs()
{
	console.log(`npm test --testdir tests/            - Run all tests`);
	console.log(`npm test --testdir tests/ --index 5  - Run just the fifth test`);
	console.log(`npm test --testdir tests/ --list     - Show all the tests`);
	console.log(`npm test --help                      - Show this documentation`);
}
