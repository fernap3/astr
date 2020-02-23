import dotenv = require("dotenv");
dotenv.config();

import process = require("process");

const tests: Test[] = [];

export class Astr
{
	public test(testName: string, test: (assert: Assert) => Promise<void>): void
	{
		tests.push({
			name: testName,
			func: test,
		});
	}
}

class Assert
{
	public equals(expected: any, actual: any)
	{
		if (expected !== actual)
			throw new AssertionError("equals", expected, actual);
	}
}

class AssertionError
{
	constructor (public type: "equals", public expected: any, public actual: any) { }
}

interface Test
{
	name: string;
	func: (assert: Assert) => Promise<void>;
}

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

// Get this information by running:
// instruments -s devices
const opts = {
    platformName: "iOS",
    platformVersion: "12.4",
	deviceName: "iPhone Simulator",
	udid: process.env.TEST_UDID,
    app: process.env.TEST_APPPATH,
	automationName: "XCUITest",
	fullReset: false,
};

require("./tests.js");

(async () =>
{
	const passedTests = [];
	const failedTests = [];
	let singleTestToRun = null;

	if (process.argv[2] && process.argv[2].trim())
	{
		singleTestToRun = parseInt(process.argv[2]);
		if (isNaN(singleTestToRun))
		{
			singleTestToRun = null;
			if (process.argv[2].toLowerCase() === "help")
			{
				console.log(`npm test       - Run all tests`);
				console.log(`npm test 5     - Run just the fifth test`);
				console.log(`npm test clean - Reset the test environment (reinitialize database, Redis caches, etc.)`);
				console.log(`npm test list  - Show all the tests`);
				console.log(`npm test help  - Show this documentation`);
				process.exit(0);
			}
			else if (process.argv[2].toLowerCase() === "clean")
			{
				
				process.exit(0);
			}
			else if (process.argv[2].toLowerCase() === "list")
			{
				for (let i = 0; i < tests.length; i++)
				{
					const test = tests[i];
					console.log(`${consoleColors.FgYellow}${i + 1}: ${consoleColors.Reset}${test.name}`);
				}
				process.exit(0);
			}
		}
	}
	
	// TODO: Run any initializations that need to happen before the whole test run starts

	for (let i = 0; i < tests.length; i++)
	{
		if (singleTestToRun && i+1 !== singleTestToRun)
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

