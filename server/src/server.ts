import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	RequestType
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as fs from 'fs/promises';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
documents.listen(connection);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		// console.log(params.workspaceFolders?.[0]);
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}

	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}

	console.log("parsing")
	
	// parseFiles();
});

// async function parseFiles() {
// 	for (let path of paths) {
// 		const content = await readFileAsync("C:/Users/olive/OneDrive/Documents/GitHub/uksf2" + path);
// 		validateTextDocument(TextDocument.create("file:///c%3A/Users/olive/OneDrive/Documents/GitHub/uksf2" + path, "plaintext", 0, content));
// 	}
// }

// async function readFileAsync(filePath: string): Promise<string> {
// 	try {
// 		const content = await fs.readFile(filePath, 'utf8');
// 		return content;
// 	} catch (err) {
// 		console.error(err);
// 		return "";
// 	}
// }

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
	// documents.all().forEach(console.log);
});

interface DiagnosticData {
	pattern: RegExp;
	message: string;
}

const latPattern = String.raw`[NS][0-9]{3}\.[0-9]{2}\.[0-9]{2}\.[0-9]{3}`;
const lonPattern = String.raw`[EW][0-9]{3}\.[0-9]{2}\.[0-9]{2}\.[0-9]{3}`;

const spaceCoordinatePattern = String.raw`${latPattern} ${lonPattern}`;
const colonCoordinatePattern = String.raw`${latPattern}:${lonPattern}`;

const lineRequirements = {
	"Airspace.txt": {
		pattern: new RegExp(String.raw`(?:^.+? ${spaceCoordinatePattern} ${spaceCoordinatePattern}$)|(?:^@ARC\(region [A-Za-z0-9/\- ]+? centre ${spaceCoordinatePattern} radius [0-9]+(?:\.[0-9]+)?\)$)`, 'm'),
		message: "Invalid airspace line"
	},
	"Airspace_Bases.txt": {
		pattern: new RegExp(String.raw`^${colonCoordinatePattern}:[A-Za-z0-9 ]+?:(?:\d+'E?.*?$)|(?:FL\d+\*?E?$)`, 'm'),
		message: "Invalid airspace base line"
	},
	"Centreline.txt": {
		pattern: new RegExp(String.raw`^${spaceCoordinatePattern} ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid centerline line"
	},
	"Fixes.txt": {
		pattern: new RegExp(String.raw`^[A-Z0-9]+ ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid fix line"
	},
	"Positions.txt": {
		pattern: new RegExp(String.raw`^[A-Z]+[A-Z0-9_\-]+:.+?:1\d{2}\.\d{3}:[A-Z0-9]{1,4}:[A-Z0-9]+:[A-Z+\-~]+:(?:DEL|PLN|TWR|GND|APP|CTR|ATIS):(?:[A-Z_]+|-):(?:[A-Z_]+|-):(?:\d{4}|-|):(?:\d{4}|-|):(?:(?:${latPattern})|):(?:(?:${lonPattern})|)::$`, 'm'),
		message: "Invalid position line"
	},
	"Positions_Mentor.txt": {
		pattern: new RegExp(String.raw`^[A-Z]+[A-Z0-9_\-]+:.+?:199.998:[A-Z0-9]{1,4}:[A-Z0-9]+:[A-Z+\-~_]+:(?:DEL|PLN|TWR|GND|APP|CTR|ATIS):(?:[A-Z_]+|-):(?:[A-Z_]+|-):(?:\d{4}|-|):(?:\d{4}|-|):(?:(?:${latPattern})|):(?:(?:${lonPattern})|)::$`, 'm'),
		message: "Invalid mentor position line"
	},
	"Runway.txt": {
		pattern: new RegExp(String.raw`^[0-9]{2}[LCRG ]? [0-9]{2}[LCRG ]? [0-9]{3} [0-9]{3} ${spaceCoordinatePattern} ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid runway line"
	},
	"Sids.txt": {
		pattern: new RegExp(String.raw`^SID:[A-Z]{4}:\d{2}(?:[LCRG]|):#?[A-Z\- ]+(?:\d+(?:[A-Z]|\d)?)?:(?:[A-Z0-9]+ )*(?:[A-Z0-9]+)$`, 'm'),
		message: "Invalid SID line"
	},
	"Stars.txt": {
		pattern: new RegExp(String.raw`^STAR:[A-Z]{4}:\d{2}(?:[LCRG]|):#?(?:old)?[A-Z\- ]+(?:\d+(?:[A-Z]|\d)?)?:(?:[A-Z0-9]+ )*(?:[A-Z0-9]+)$`, 'm'),
		message: "Invalid STAR line"
	},
	"VRPs.txt": {
		pattern: new RegExp(String.raw`^\*[^:]+:${colonCoordinatePattern}$`, 'm'),
		message: "Invalid VRP line"
	},

	"SMR/Geo.txt": {
		pattern: new RegExp(String.raw`(?:^EG[A-Z]{2} .* S999\.00\.00\.000 E999\.00\.00\.000 S999\.00\.00\.000 E999\.00\.00\.000$)|(?:^${spaceCoordinatePattern} ${spaceCoordinatePattern} [A-Za-z0-9]+$)`, 'm'),
		message: "Invalid SMR geo line"
	},
	"SMR/Labels.txt": {
		pattern: new RegExp(String.raw`^".+?" +${spaceCoordinatePattern} [A-Za-z0-9]+$`, 'm'),
		message: "Invalid SMR label line"
	},

	"ATS Route": {
		pattern: new RegExp(String.raw`^([A-Z ]{5}) \1 ([A-Z]{3,5}) {0,2} \2 {0,2}$`, 'm'),
		message: "Invalid ATS Route line"
	},
	"ATS Route Heli": {
		pattern: new RegExp(String.raw`^${spaceCoordinatePattern} ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid Helicopter ATS Route line"
	},

	"Agreement": {
		pattern: new RegExp(String.raw`^(?:FIR_COPX|COPX):(?:\*|[A-Z0-9]{3,5}):(?:\*|[0-9LRCG]+):(?:\*|[A-Z0-9]{3,5}):(?:\*|[A-Z]{3,5}):(?:\*|[0-9LRCG]+):.*?:.*?:(?:\*|[0-9]+):(?:\*|[0-9]+):[A-Za-z0-9+-^#|]+$`, 'm'),
		message: "Invalid Agreement line"
	},

	"ARTCC": {
		pattern: new RegExp(String.raw`^[A-Za-z0-9- ]+?${spaceCoordinatePattern} ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid Danger line"
	},

	"Fixes": {
		pattern: new RegExp(String.raw`^[A-Z0-9]+ ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid Fixes line"
	},
	"NDBVOR": {
		pattern: new RegExp(String.raw`^[A-Z0-9 ]+ [0-9]{3}\.[0-9]{3} ${spaceCoordinatePattern}$`, 'm'),
		message: "Invalid NDB / VOR line"
	}
}

const blockLineRequirements = {
	"SMR/Regions.txt": [
		// {
		// 	pattern: new RegExp(String.raw`^;.*$`, 'm'),
		// 	message: "Invalid SMR region comment line"
		// },
		{
			pattern: new RegExp(String.raw`^REGIONNAME .+$`, 'm'),
			message: "Invalid SMR region name line"
		},
		{
			pattern: new RegExp(String.raw`^[A-Za-z0-9]+ ${spaceCoordinatePattern}$`, 'm'),
			message: "Invalid SMR region colour definition line"
		},
		{
			pattern: new RegExp(String.raw`^${spaceCoordinatePattern}$`, 'm'),
			message: "Invalid SMR region coordinate line"
		}
	],
	"Ground_Network.txt": [
		{
			pattern: new RegExp(String.raw`(?:^EXIT:[0-9LCRG]+:.+?:.+?:.+$|^TAXI:.+?:.+?(?::.+)?$)`, 'm'),
			message: "Invalid Ground Network line"
		},
		{
			pattern: new RegExp(String.raw`^COORD:${colonCoordinatePattern}$`, 'm'),
			message: "Invalid Ground Network coordinate line"
		}
	],
	"Basic.txt": [
		{
			pattern: new RegExp(String.raw`^(?!1|N0).+$`, 'm'),
			message: "Invalid aerodrome name"
		},
		{
			pattern: new RegExp(String.raw`^${spaceCoordinatePattern}$`, 'm'),
			message: "Invalid aerodrome position"
		},
		{
			pattern: new RegExp(String.raw`(?:^1[1-3][0-9]\.[0-9]{2}[05]$)|(?:^000\.000$)`, 'm'),
			message: "Invalid aerodrome frequency"
		}
	]
}

const lineRequirementsMap: Map<string, DiagnosticData> = new Map(Object.entries(lineRequirements));
const blockLineRequirementsMap: Map<string, DiagnosticData[]> = new Map(Object.entries(blockLineRequirements));

function doParse(textDocument: TextDocument) {

}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// format: file:///c%3A/Users/olive/OneDrive/Documents/GitHub/uksf2/Airports/EGTC/Basic.txt
	let path: string[] = textDocument.uri.toString().split('/');
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

	const text = textDocument.getText();
	let m: RegExpExecArray | null;
	const diagnostics: Diagnostic[] = [];

	let offset = 0;
	const requirement: DiagnosticData | undefined = lineRequirementsMap.get(usefulPath);
	if (!requirement) {
		const blockRequirements: DiagnosticData[] | undefined = blockLineRequirementsMap.get(usefulPath);
		if (!blockRequirements) {
			return;
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
							start: textDocument.positionAt(offset),
							end: textDocument.positionAt(offset + line.length)
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
						start: textDocument.positionAt(offset),
						end: textDocument.positionAt(offset + line.length)
					},
					message: requirement.message,
					source: 'VUK SF Linter'
				};
				diagnostics.push(diagnostic);
			}
			offset += line.length + 2;
		}
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
