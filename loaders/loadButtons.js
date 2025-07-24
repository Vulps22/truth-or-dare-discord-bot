const fs = require('node:fs');
const path = require('node:path');

function loadButtons() {
    const buttonsPath = path.join(__dirname, '../buttons');
    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));
    const buttons = new Map();
    buttonFiles.forEach(file => {
        const filePath = path.join(buttonsPath, file);
        const button = require(filePath);
        if (button.name && button.execute) {
            buttons.set(button.name, button);
        } else {
                console.warn(`[WARNING] The button at ${filePath} is missing a required 'name' or 'execute' property`);
            }
    });
    return buttons;
}

module.exports = loadButtons;
