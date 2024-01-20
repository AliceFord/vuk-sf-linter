import {
	Diagnostic,
	DiagnosticSeverity,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import {
	lineRequirements,
	blockLineRequirements
} from './constants';

interface DiagnosticData {
	pattern: RegExp;
	message: string;
}

export function doParse(path: string[], content: string, vscode: boolean, textDocument: TextDocument | undefined): Diagnostic[] {
	function posAt(offset: number) {
		if (vscode) return textDocument!.positionAt(offset);
		// let line = 0;
		// let col = 0;
		// for (let i = 0; i < offset; i++) {
		// 	if (content[i] == '\n') {
		// 		line++;
		// 		col = 0;
		// 	} else {
		// 		col++;
		// 	}
		// }
		return {line: 0, character: offset};  // Using the structure a bit differently!
	}

	const lineRequirementsMap: Map<string, DiagnosticData> = new Map(Object.entries(lineRequirements));
	const blockLineRequirementsMap: Map<string, DiagnosticData[]> = new Map(Object.entries(blockLineRequirements));


	for (let i = path.length - 1; i >= 0; i--) {
		if (path[i] === 'Airports') {
			path = path.slice(i + 2);  // Just final part of path
			break;
		}
		else if (path[i] === 'Agreements') {
			path = ["Agreement"]
			break;
		}
		else if (path[i] == 'ATS%20Routes') {  // Only heli different
			if (path[i + 1] == 'Other') {
				path = ["ATS Route"]
			}
			else if (path[i + 1] == 'RNAV') {
				path = ["ATS Route"]
			}
			else if (path[i + 1] == 'Conventional%20-%20Non-UK') {
				path = ["ATS Route"]
			}
			else if (path[i + 1] == 'Helicopter') {
				path = ["ATS Route Heli"]
			}
			break;
		}
		else if (path[i] == "ARTCC") {
			path = ["ARTCC"]
			break;
		}
		else if (path[i] === "Navaids") {
			if (path[i+1].startsWith("FIXES") || path[i+1].startsWith("Fixes")) {
				path = ["Fixes"]
			} else {
				path = ["NDBVOR"]
			}
		}
	}

	let usefulPath = path.join('/');

	const text = content;
	let m: RegExpExecArray | null;
	const diagnostics: Diagnostic[] = [];

	let offset = 0;
	const requirement: DiagnosticData | undefined = lineRequirementsMap.get(usefulPath);
	if (!requirement) {
		const blockRequirements: DiagnosticData[] | undefined = blockLineRequirementsMap.get(usefulPath);
		if (!blockRequirements) {
			return diagnostics;
		}
		

		let blockIndicator: number = 0;
		// Block requirements
		for (let line of text.split('\r\n')) {
			if (line.length == 0) {  // Remove empty lines
				offset += 2;
				continue;
			} else if (line.startsWith(";")) {
				offset += line.length + 2;
				continue;
			}

			let index: number;

			if ((index = line.indexOf(';')) != -1) {  // Remove trailing comments and trailing whitespace
				while (line[index - 1] == ' ' && index > 0) {
					index--;
				}
				let initialLen = line.length;
				line = line.slice(0, index);
				offset += initialLen - index;
			}

			// Match specific requirements
			const pattern = blockRequirements[blockIndicator].pattern;
			if (!(m = pattern.exec(line))) {
				// If in block, try next block indicator. Else, jump to next block and try. Finally throw initial error if no match in second block
				if (blockIndicator < blockRequirements.length - 1) {
					blockIndicator++;
				} else if (blockIndicator == blockRequirements.length - 1) {
					blockIndicator = 0;
				}

				const pattern = blockRequirements[blockIndicator].pattern;
				if (!(m = pattern.exec(line))) {
					let prevBlockIndicator = blockIndicator == 0 ?  blockRequirements.length - 1 : blockIndicator - 1;

					const diagnostic: Diagnostic = {
						severity: DiagnosticSeverity.Warning,
						range: {
							start: posAt(offset),
							end: posAt(offset + line.length)
						},
						message: blockRequirements[prevBlockIndicator].message,
						source: 'VUK SF Linter'
					};
					diagnostics.push(diagnostic);
				}
			}
			offset += line.length + 2;
		}
	} else {  // Line-by-line requirements
		for (let line of text.split('\r\n')) {
			// Preprocessing for line
			if (line.length == 0) {
				offset += 2;
				continue;
			} else if (line.startsWith(";")) {
				offset += line.length + 2;
				continue;
			}

			let index: number;

			if ((index = line.indexOf(';')) != -1) {  // Remove comments and trailing whitespace
				while (line[index - 1] == ' ' && index > 0) {
					index--;
				}
				let initialLen = line.length;
				line = line.slice(0, index);
				offset += initialLen - index;
			}

			// Match specific requirements
			const pattern = requirement.pattern;
			if (!(m = pattern.exec(line))) {
				const diagnostic: Diagnostic = {
					severity: DiagnosticSeverity.Warning,
					range: {
						start: posAt(offset),
						end: posAt(offset + line.length)
					},
					message: requirement.message,
					source: 'VUK SF Linter'
				};
				diagnostics.push(diagnostic);
			}
			offset += line.length + 2;
		}
	}

	return diagnostics;
}