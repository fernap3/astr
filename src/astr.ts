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
}

export class AssertionError
{
	constructor (public type: "equals" | "truthy" | "throws", public expected?: any, public actual?: any, public message?: string) { }
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
}

export const tests: Test[] = [];


export function registerTest(test: Test): void
{
	tests.push(test);
}
