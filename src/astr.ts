import { tests, state } from "./tests";

export class Assert
{
	public equals(expected: any, actual: any, message?: string)
	{
		if (expected !== actual)
			throw new AssertionError("equals", expected, actual, message);
	}

	public truthy(value: any, message?: string)
	{
		if (value != true)
			throw new AssertionError("truthy", undefined, undefined, message);
	}

	public throws(func: Function, message?: string)
	{
		let threw = false;
		try
		{
			func();
		}
		catch(e)
		{
			threw = true;
		}

		if (!threw)
			throw new AssertionError("throws", undefined, undefined, message);
	}

	private isPrimitive(obj: any)
	{
		return (obj !== Object(obj));
	}

	public deepEqual(expected: any, actual: any, message?: string): void
	{
		if (expected === actual) // it's just the same object. No need to compare.
        	return;

		if (this.isPrimitive(expected) && this.isPrimitive(actual)) // compare primitives
		{
			if(expected !== actual)
				throw new AssertionError("deepEqual", expected, actual, message);
		}

		if (Object.keys(expected).length !== Object.keys(actual).length)
			throw new AssertionError("deepEqual", expected, actual, message);

		// compare objects with same number of keys
		for (let key in expected)
		{
			if(!(key in actual)) //other object doesn't have this prop
				throw new AssertionError("deepEqual", expected, actual, message);
			
			this.deepEqual(expected[key], actual[key]);
		}
	}
}

export class AssertionError
{
	constructor (public type: "equals" | "truthy" | "throws" | "deepEqual", public expected?: any, public actual?: any, public message?: string) { }
	toJSON()
	{
		return {
			type: this.type,
			expected: this.expected,
			actual: this.actual,
			message: this.message,
		};
	}

	static fromJSON(errorObj: ReturnType<AssertionError["toJSON"]>): AssertionError
	{
		return new AssertionError(errorObj.type, errorObj.expected, errorObj.actual, errorObj.message);
	}
}

export interface Test
{
	name: string;
	dependencies?: string[];
	func: (assert: Assert) => Promise<void>;
	filePath?: string;
}

export interface TestResultTest extends Test
{
	moduleName: string;
}

export interface TestModule
{
	name: string | null;
	testInit?: () => void;
	tests: Test[];
}



export function registerTest(test: Test): void
{
	if (tests.length === 0)
	{
		tests.push({
			name: null,
			tests: [],
		});
	}

	tests[tests.length - 1].tests.push({
		...test,
		filePath: state.currentTestFilePath!,
	});
}

export function registerTestInit(func: () => void): void
{
	tests[tests.length - 1].testInit = func;
}

export function registerModule(name: string): void
{
	tests.push({
		name: name,
		tests: [],
	});
}