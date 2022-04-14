const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
const { weeklySummary } = require('../reminderManager');

module.exports = {
    data: new SlashCommandBuilder().setName('testweekly')
    .setDescription('test weekly reminders by firing one right now'),
    async execute(interaction){
        //reloading file first, NOTE: this is synchronous, so at large file sizes, may block
        // let config = JSON.parse(fs.readFileSync('./config.json'));
        weeklySummary(interaction.client);
        interaction.reply({content:"Sending weekly summary", ephemeral:true});
    }
}