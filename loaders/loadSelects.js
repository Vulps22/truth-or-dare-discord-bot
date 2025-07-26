const fs = require('node:fs');
const path = require('node:path');

function loadSelects() {
    const selectsPath = path.join(__dirname, '../selects');
    const selectFiles = fs.readdirSync(selectsPath).filter(file => file.endsWith('.js'));
    
    selectFiles.forEach(file => {
        const filePath = path.join(selectsPath, file);
        const select = require(filePath);
        if (select.name && select.execute) {
            client.selects.set(select.name, select);
        } else {
            console.warn(`[WARNING] The select at ${filePath} is missing a required 'name' or 'execute' property`);
            }
    });

    console.log(`Loaded ${selectFiles.length} selects.`);
}

module.exports = loadSelects;
