class Logger {
    static log(message) {
        const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_COMMAND_URL });

		webhookClient.send(`**Command**: ${interaction.commandName} | **server**: ${interaction.guild.name} ${message ? '| ' + message : ''}`);
    }
}