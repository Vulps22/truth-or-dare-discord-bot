module.exports = {
  name: 'report_action-ban',
  async execute(interaction) {
    // TODO: Implement logic to ban based on selected reason
    await interaction.reply({ content: 'Ban action executed.', ephemeral: true });
  }
};
