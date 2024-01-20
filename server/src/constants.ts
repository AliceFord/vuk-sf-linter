const latPattern = String.raw`[NS][0-9]{3}\.[0-9]{2}\.[0-9]{2}\.[0-9]{3}`;
const lonPattern = String.raw`[EW][0-9]{3}\.[0-9]{2}\.[0-9]{2}\.[0-9]{3}`;

const spaceCoordinatePattern = String.raw`${latPattern} ${lonPattern}`;
const colonCoordinatePattern = String.raw`${latPattern}:${lonPattern}`;

export const lineRequirements = {
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
		pattern: new RegExp(String.raw`(?:^[A-Za-z0-9-() ]+?(?:([A-Z ]{5}) +\1 +)|(?:${spaceCoordinatePattern}) (?:([A-Z ]{5}) +\2 +)|(?:${spaceCoordinatePattern})$)|(?:^@ARC\(region [A-Za-z0-9/\- ]+? centre ${spaceCoordinatePattern} radius [0-9]+(?:\.[0-9]+)?\)$)`, 'm'),
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

export const blockLineRequirements = {
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
