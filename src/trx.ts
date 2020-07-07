import { FinalResults } from "./run-tests";
import * as builder from "xmlbuilder";
import { guid } from "./utils";
import { writeFileSync } from "fs";
import username = require("username");

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

	const xmlText = root.end({ pretty: true });

	writeFileSync(trxOutFile, xmlText);
}