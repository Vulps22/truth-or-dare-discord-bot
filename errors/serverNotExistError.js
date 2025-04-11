class ServerNotExistError extends Error {
    constructor(message = "Attempt to delete Server that does not exist.") {
        super(message);
        this.name = "ServerNotExistError";
        this.code = "BOT-003";
    }
}

module.exports = ServerNotExistError;