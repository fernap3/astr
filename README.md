# Astr, a flexible test runner for TypeScript and JavaScript projects

## Features include

* Supports async test methods or tests that return Promises
* Can run tests under NodeJS or Chromium, using Puppeteer

## Basic usage

To get started:

    npm install --save astr

Then use the run-scripts.js script to run your tests:

    node node_modules/astr/bin/run-tests.js --testdir tests/

The above command will run tests found in all .js files in the `tests/` directory.

Author your tests like this:

	import { registerTest, registerModule } from "astr";

	registerModule("Basic tests");

	registerTest({
		name: "One equals one",
		func: async (assert) =>
		{
			assert.equals(1, 1);
		}
	});

To run tests in Chromium instead, use the `--runtime` argument:

    node node_modules/astr/bin/run-tests.js --testdir tests/ --runtime puppeteer

When tests run in Chromium, note that the function passed as the `func` property to `registerTest` will execute in the context of the browser page. In this case, the function can access `window`, `document`, etc., but keep in mind that variables outside of the function body will not be in scope during execution.

## API

The `astr` module exposes the following functions and interfaces:

```
registerTest(options: {
	/** A name for the test. Used when displaying test results */
	name: string,

	/** Paths to JavaScript files that should be included in the page before the test is executed. */
	dependencies?: string[],

	/** The test to execute. */
	func: (assert: Assert) => (void | Promise<void>),
})
```

```
/**
  * Indicates that subsequent calls to registerTest should place tests inside a module with
  * a given name. Test modules are used to group test result output. Calls to registerTest
  * before any call to registerModule has been made will place tests in a default module
  * with no name.
 */
registerModule(name: string)
```

```
/**
  * Registers a function to be called before every test in the current module
 */
registerTestInit(func: () => void | Promise<void>))
```

```
interface Assert
{
	equals(expected: any, actual: any, message?: string);
	
	truthy(value: any, message?: string);

	throws(func: Function, message?: string);

	deepEqual(expected: any, actual: any, message?: string);
}
```
