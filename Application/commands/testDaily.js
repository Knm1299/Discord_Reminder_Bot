const { SlashCommandBuilder } = require('@discordjs/builders');
const {  dailySummary } = require('../services/reminderManager');

module.exports = {
    data: new SlashCommandBuilder().setName('testdaily')
    .setDescription('test daily reminders by firing one right now'),
    async execute(interaction){
        dailySummary(interaction.client);
        interaction.reply({content:"Sending daily summary", ephemeral:true});
    }
}