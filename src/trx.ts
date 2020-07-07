import { FinalResults } from "./run-tests";
import * as builder from "xmlbuilder";
import { guid } from "./utils";
import { writeFileSync } from "fs";
import username = require("username");
import { hostname } from "os";

export async function writeTrx(results: FinalResults, trxOutFile: string)
{
	const root = builder.begin().ele("TestRun", {
		"xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
		"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
		"id": guid(),
		"name": `astr JS unit test ${new Date()}`,
		"runUser": await username(),
		"xmlns": "http://microsoft.com/schemas/VisualStudio/TeamTest/2010",
	});

	const resultValues = [...results.values()];

	const summaryOutcome = resultValues
	  .some(r => r.status === "fail") ? "Failed" : "Passed";

	const resultSummary = root.ele("ResultSummary", { "outcome": summaryOutcome });
	resultSummary.ele("Counters", {
		total: results.size,
		executed: results.size,
		passed: resultValues.filter(r => r.status === "pass").length,
	});

	const resultsNode = root.ele("Results");

	for (const result of results)
	{
		const test = result[0];
		const testResult = result[1];

		const durationMs = testResult.endTime.getTime() - testResult.startTime.getTime();
		const hours = Math.floor(durationMs / 1000 / 60 / 60).toString().padStart(2, "0");
		const minutes = Math.floor(durationMs / 1000 / 60).toString().padStart(2, "0");
		const seconds = Math.floor(durationMs / 1000).toString().padStart(2, "0");
		
		resultsNode.ele("UnitTestResult", {
			testName: test.name,
			testType: "",
			testId: "",
			executionId: "",
			testListId: "",
			outcome: testResult.status === "fail" ? "Failed" : "Passed",
			computerName: hostname(),
			startTime: testResult.startTime.toISOString(),
			endTime: testResult.endTime.toISOString(),
			duration: `${hours}:${minutes}:${seconds}`,
		});
	}

	const xmlText = root.end({ pretty: true });
	writeFileSync(trxOutFile, xmlText);
}