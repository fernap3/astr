export class Assert
{
	public equals(expected: any, actual: any)
	{
		if (expected !== actual)
			throw new AssertionError("equals", expected, actual);
	}
}

export class AssertionError
{
	constructor (public type: "equals", public expected: any, public actual: any) { }
}

export interface Test
{
	name: string;
	func: (assert: Assert) => Promise<void>;
}

export const tests: Test[] = [];


export function registerTest(test: Test): void
{
	tests.push(test);
}
