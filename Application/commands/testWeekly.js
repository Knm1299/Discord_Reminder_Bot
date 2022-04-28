const { SlashCommandBuilder } = require('@discordjs/builders');
const { weeklySummary } = require('../services/reminderManager');

module.exports = {
    data: new SlashCommandBuilder().setName('testweekly')
    .setDescription('test weekly reminders by firing one right now'),
    async execute(interaction){
        weeklySummary(interaction.client);
        interaction.reply({content:"Sending weekly summary", ephemeral:true});
    }
}