/**
 * @fileoverview Error class for when a user is not allowed to be deleted.
 * @description Users may have purchased premium or consumables and absolutley MUST NOT be deleted to prevent us from deleting their purchases.
 */
class MustNotDeleteUsersError extends Error {
    constructor(message = "Users must not be deleted.") {
        super(message);
        this.name = "MustNotDeleteUsersError";
        this.code = "BOT-001";
    }
}

module.exports = MustNotDeleteUsersError;