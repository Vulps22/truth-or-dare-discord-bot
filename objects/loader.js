const User = require("objects/user");


/**
 * Creates a User instance from a plain object without needing to reload from the database.
 * @param {object} data - The object containing user data.
 * @returns {User} The instantiated User object.
 */
function userFromObject(data) {

    const user = new User(data.id, data.username);
    user.globalLevel = data.global_level;
    user.globalLevelXp = data.global_level_xp;
    user.rulesAccepted = data.rulesAccepted;
    user.isBanned = data.isBanned;
    user.banReason = data.ban_reason;
    user.voteCount = data.voteCount;
    user.ban_message_id = data.ban_message_id;
    user.deleteDate = data.deleteDate;
    user._loaded = true;

    return user;
}

module.exports = { userFromObject };
