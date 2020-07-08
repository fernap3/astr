import { TestModule, Test } from "./astr";


export const tests: TestModule[] = [];

export const state = {
	currentTestFilePath: undefined
} as {
	currentTestFilePath: string | undefined
};

export type TestStatus = "pass" | "fail";

export interface TestResult
{
	status: TestStatus;
	startTime: Date;
	endTime: Date;
	errorMessage?: string;
}

export interface TestResultTest extends Test
{
	moduleName: string;
}
