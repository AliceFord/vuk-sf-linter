import {
	doParse
} from "../server/src/parser";


// from https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
const Path = require("path");
import * as fs from "fs";
let Files: string[]  = [];

function ThroughDirectory(Directory: string) {
    fs.readdirSync(Directory).forEach(File => {
        const Absolute = Path.join(Directory, File);
        if (fs.statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute);
        else return Files.push(Absolute);
    });
}

ThroughDirectory(process.cwd());

console.time("linting");

for (let file of Files) {
	let path = file.split("/");
	let content = fs.readFileSync(file, "utf8");

	let resultDiagnostics = doParse(path, content, false, undefined);

	if (resultDiagnostics.length != 0) {
		console.log(`Errors found in file ${path.join('/')}:`);
		for (let diagnostic of resultDiagnostics) {
			// find line of error
			let line = 1;
			for (let i = 0; i < diagnostic.range.start.character; i++) {
				if (content[i] == '\n') {
					line++;
				}
			}
			console.error(`Line ${line}: \`` + content.substring(diagnostic.range.start.character, diagnostic.range.end.character) + "` -> " + diagnostic.message);
		}
	}
}

console.timeEnd("linting");
