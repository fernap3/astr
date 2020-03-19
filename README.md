astr is test runner, made for simple integration with TypeScript projects.
It supports asynchronous (promise-based) tests.

    npm install --save astr

Then use the run-scripts.js script to run your tests:

    node node_modules/astr/bin/run-tests.js --testdir tests/

The above command will run tests found in all .js files in the `tests/` directory.

Author your tests like this:

	import { registerTest } from "astr";

	registerTest({
		name: "One equals one",
		func: async (assert) =>
		{
			assert.equals(1, 1);
		}
	});
