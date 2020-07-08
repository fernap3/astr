import { FinalResults } from "./run-tests";
import * as builder from "xmlbuilder";
import { guid } from "./utils";
import { writeFileSync } from "fs";
import username = require("username");
import { hostname } from "os";
import { TestResult, TestResultTest } from "./tests";

class TestList
{
	public readonly id = guid();
	public readonly name: string;
	public tests = [] as TestEntry[];
	
	constructor(name: string)
	{
		this.name = name;
	}
}

interface TestEntry
{
	testId: string;
	executionId: string;
	test: TestResultTest;
	testResult: TestResult;
}

export async function writeTrx(results: FinalResults, trxOutFile: string)
{
	const testLists = new Map<string, TestList>();
	const mainTestList = new TestList("Results Not in a List");
	testLists.set(guid(), mainTestList);
	testLists.set(guid(), new TestList("All Loaded Results"));
	
	for (let result of results)
	{
		mainTestList.tests.push({
			testId: guid(),
			executionId: guid(),
			test: result[0],
			testResult: result[1],
		});
	}
	
	const root = builder.create("TestRun", { encoding: "utf-8" }).att({
		"xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
		"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
		"id": guid(),
		"name": `astr JS unit test ${new Date()}`,
		"runUser": await username(),
		"xmlns": "http://microsoft.com/schemas/VisualStudio/TeamTest/2010",
	});

	// Results, sorted by start time
	const resultValues = [...results.values()].slice().sort((a, b) => {
		return a.startTime < b.startTime ? -1 : b.startTime < a.startTime ? 1 : 0;
	});

	const summaryOutcome = resultValues
	  .some(r => r.status === "fail") ? "Failed" : "Passed";

	const resultSummary = root.ele("ResultSummary", { "outcome": summaryOutcome });
	const testsPassed = resultValues.filter(r => r.status === "pass").length;
	const testsFailed = results.size - testsPassed;
	const countersNode = resultSummary.ele("Counters", {
		total: results.size,
		executed: results.size,
		passed: testsPassed,
	});

	if (testsFailed > 0)
		countersNode.att("failed", testsFailed);


	const resultsNode = root.ele("Results");

	for (const [ testListId, list ] of testLists)
	{
		for (const testEntry of list.tests)
		{
			const testResult = testEntry.testResult;

			const durationMs = testResult.endTime.getTime() - testResult.startTime.getTime();
			const { hours, minutes, seconds, ms } = msToComponents(durationMs);
			
			const unitTestResultNode = resultsNode.ele("UnitTestResult", {
				testName: testEntry.test.name,
				testType: "13cdc9d9-ddb5-4fa4-a97d-d965ccfc6d4b",
				testId: testEntry.testId,
				executionId: testEntry.executionId,
				testListId: list.id,
				outcome: testResult.status === "fail" ? "Failed" : "Passed",
				computerName: hostname(),
				startTime: testResult.startTime.toISOString(),
				endTime: testResult.endTime.toISOString(),
				duration: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`,
			});

			if (testResult.status === "fail")
			{
				unitTestResultNode.ele("Output")
					.ele("ErrorInfo")
					.ele("Message", {
						"xmlns:q1": "http://www.w3.org/2001/XMLSchema",
						"d6p1:type": "q1:string",
						"xmlns:d6p1": "http://www.w3.org/2001/XMLSchema-instance",
					})
					.text(testResult.errorMessage!);
			}
		}
	}


	const testDefinitionsNode = root.ele("TestDefinitions");
	for (const [ testListId, list ] of testLists)
	{
		for (const testEntry of list.tests)
		{
			const testResult = testEntry.testResult;

			const unitTestNode = testDefinitionsNode.ele("UnitTest", {
				id: testEntry.testId,
				name: testEntry.test.name,
				storage: testEntry.test.filePath
			});

			unitTestNode.ele("Execution", { id: testEntry.executionId });
			unitTestNode.ele("TestMethod", { 
				codeBase: testEntry.test.filePath,
				className: testEntry.test.moduleName,
				name: testEntry.test.name,
				adapterTypeName: "Microsoft.VisualStudio.TestTools.TestTypes.Unit.UnitTestAdapter",
			});
		}
	}

	const testEntriesNode = root.ele("TestEntries");
	for (const [ testListId, list ] of testLists)
	{
		for (const testEntry of list.tests)
		{
			const testResult = testEntry.testResult;

			testEntriesNode.ele("TestEntry", {
				testId: testEntry.testId,
				executionId: testEntry.executionId,
				testListId: list.id,
			});
		}
	}

	const listsNode = root.ele("TestLists");
	for (const list of testLists)
		listsNode.ele("TestList", { id: list[0], name: list[1].name });


	const firstTest = resultValues[0];
	const lastTest = resultValues[resultValues.length - 1];

	root.ele("Times", {
		creation: firstTest.startTime.toISOString(),
		queuing: firstTest.startTime.toISOString(),
		start: firstTest.startTime.toISOString(),
		finish: lastTest.endTime.toISOString(),
	});

	root.ele("TestSettings", {
		id: guid(),
		name: "Default",
	})
		.ele("Execution")
		.ele("TestTypeSpecific");


	const xmlText = root.end({ pretty: true });
	writeFileSync(trxOutFile, xmlText);
}

function msToComponents(ms: number): { hours: number, minutes: number, seconds: number, ms: number }
{
	ms = Math.floor(ms);
	
	const hours = Math.floor(ms / 1000 / 60 / 60);
	ms -= hours * 1000 * 60 * 60;

	const minutes = Math.floor(ms / 1000 / 60);
	ms -= hours * 1000 * 60;

	const seconds = Math.floor(ms / 1000);
	ms -= hours * 1000;

	return {
		hours, minutes, seconds, ms
	};
}
