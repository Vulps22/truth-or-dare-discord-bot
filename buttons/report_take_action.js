module.exports = {
  name: 'report_take_action',
  async execute(interaction) {
    // TODO: Implement logic to move report to ACTIONING state
    await interaction.reply({ content: 'Taking action on report...', ephemeral: true });
  }
};
