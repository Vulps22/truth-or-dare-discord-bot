const Database = require("./database");
const { Entity, EntityType } = require("./entity");
const Question = require("./question");

class Report {
	type; //truth, dare, guild TODO: make Enum
	sender; //discord user id
	reason; //make Enum
	offenderId; //the id of the truth, dare, or guild (use discord guild ID's for guilds)
	offender; //the Guild or question being reported

	constructor(id = null, type, sender, reason, offenderId) {
		this.id = id;
		this.db = new Database();
		this.type = type.name;
		this.sender = sender;
		this.reason = reason;
		this.offenderId = offenderId;
		let offender = this.db.get(type.table, id);

		if(!offender) return false;

		switch(type.type) {
			case 'question':
				this.offender = new Question(offender.question, offender.creator, offender.isBanned);
				break;
			case 'guild':
				this.offender = offender;
				break;
			default:
				console.log("Failed to find Entity Type of Report:");
				console.log(offender);
				console.log(type);
				console.log('==============ABORTED========')
				return false;
		}
	}

	save(){
		this.db.set('reports', this.toJson());
	}
}

module.exports = Report