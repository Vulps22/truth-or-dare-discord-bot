module.exports = {
  name: 'report_view_offender',
  async execute(interaction) {
    // TODO: Implement logic to view offender details
    await interaction.reply({ content: 'Viewing offender details...', ephemeral: true });
  }
};
