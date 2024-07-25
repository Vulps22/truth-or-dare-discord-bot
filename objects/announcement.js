const { EmbedBuilder } = require("discord.js");

class Announcement {
    title = "";
    description = "";
    fields = [];
    date = new Date();
    version = "";
    /**
     * 
     * @param {string} title 
     * @param {string} description 
     * @param {string} fields - A comma separated list of fields in the form of title:value
     * @param {date} date 
     * @param {string} version - If included this should be shown at the bottom of the embed
     */
    constructor(title, description, fields, date, version) {
        this.title = title;
        this.description = description; //comma separated list of fields in the form of title:value
        this.fields = this.validFields(fields);
        this.date = date;
        this.version = version;
    }

    /**
     * Formats the fields to be valid for the embed
     * @param {string} fields
     * @returns {Array<Object>}
     */
    validFields(fields) {
        let validFields = [];
        let fieldArray = fields.split(",");
        for (let field of fieldArray) {
            let fieldSplit = field.split(":");
            if (fieldSplit.length == 2) {
                validFields.push({ name: fieldSplit[0], value: fieldSplit[1] });
            } else if (fieldSplit.length == 1) {
                validFields.push({ name: " ", value: fieldSplit[0] });
            }
        }


    }

    /**
     * 
     * @returns {EmbedBuilder}
     */
    generateEmbed() {

        //if any of the values are empty, then we don't want to generate the embed
        if (this.title == "" || this.description == "" || this.fields == []) { return null; }

        let embed = new EmbedBuilder()
            .setTitle(this.title)
            .setDescription(this.description)
            .addFields(...this.fields)
            .setTimestamp(this.date);

        if (this.version != "") {
            embed.setFooter(`Version: ${this.version}`);
        }
        return embed;
    }
}