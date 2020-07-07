import { TestModule } from "./astr";


export const tests: TestModule[] = [];

export const state = {
	currentTestFilePath: undefined
} as {
	currentTestFilePath: string | undefined
};
