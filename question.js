
class Question {

	constructor(question, creator) {
		this.id = null;
		this.question = question
		this.creator = creator
		this.isBanned = 0
	}

	toJson() {
		let string = {}
		string.id = this.id ?? "No ID";
		string.question = this.question;
		string.creator = this.creator;
		string.isBanned = this.isBanned;
		return string;
	}
}

module.exports = Question