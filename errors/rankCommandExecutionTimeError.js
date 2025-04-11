class RankCommandExecutionTimeError extends Error {
    /**
     * The Rank Command took too long to execute.
     * @param {number} time The time it took to execute the command in milliseconds
     */
    constructor(time) {
        let message = "Rank command took too long to execute: " + time + "ms";
        super(message);
        this.name = "RankCommandExecutionTimeError";
        this.code = "BOT-002";
    }
}

module.exports = RankCommandExecutionTimeError;