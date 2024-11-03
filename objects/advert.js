const Database = require("../objects/database");

class Advert {
    // Declare instance variables at the top
    db = new Database();
    serverId = null;
    messageId = null;
    description = null;
    created = null;
    updated = null;

    /**
     * Constructs an Advert instance.
     * @param {number} id - The ID of the Server the advert belongs to
     */
    constructor(id = null) {
        this.serverId = id;
    }


    /**
     * Loads the advert data into the current instance by ID and returns 'this'.
     * @returns {Promise<Advert|null>} - Returns the current Advert instance if loaded successfully, or null if not found.
     */
    async get() {
        const loaded = await this.load();
        return loaded ? this : null;
    }


    /**
     * Loads an advert from the database by ID.
     * @returns {Promise<boolean>} - Returns true if loaded successfully, false if not found.
     */
    async load() {
        if (!this.serverId) throw new Error("ID is required to load an advert.");

        const row = await this.db.get("adverts", this.serverId, 'serverId');
        if (row) {
            this.messageId = row.messageId;
            this.description = row.description;
            this.created = row.created;
            this.updated = row.updated;
            return true;
        }

        return false;
    }

    /**
     * Sets the values of the advert.
     * @param {string} messageId - The message ID associated with the advert.
     */
    setMessage(messageId) {
        this.messageId = messageId;
    }

    /**
     * sets the short text describing the server for the advert
     * @param {string} description
     */
    setDescription(description) {
        this.description = description;
    }

    /**
     * Saves the advert to the database. Inserts a new row if it doesn’t exist, otherwise updates it.
     * @returns {Promise<void>}
     */
    async save() {
        const valueObject = {
            serverId: this.serverId,
            messageId: this.messageId,
            description: this.description,
        };

        console.log("Saving: ", valueObject);

        this.serverId = await this.db.set("adverts", valueObject, 'serverId'); // Inserts or updates and sets `this.serverId` to the inserted ID if new
    }

    /**
     * Deletes the advert from the database.
     * @returns {Promise<void>}
     */
    async delete() {
        if (!this.serverId) throw new Error("ID is required to delete an advert.");
        await this.db.delete("adverts", this.serverId, 'serverId');

        // Reset properties
        this.serverId = null;
        this.serverId = null;
        this.messageId = null;
        this.created = null;
        this.updated = null;
    }

    /**
     * Check if the advert can be bumped (i.e., if it hasn't been updated in the last 24 hours).
     * @returns {boolean}
     */
    canBump() {
        if (!this.updated) return true; // If there's no previous update, allow bumping

        const lastUpdated = new Date(this.updated);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);

        return hoursSinceUpdate >= 24;
    }

}

module.exports = Advert;
