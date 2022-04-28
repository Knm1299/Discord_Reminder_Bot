const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
const configMan = require('../services/configManager');

let config = configMan.config;


module.exports = {
    data: new SlashCommandBuilder().setName('addtoblacklist')
    .setDescription('add content to current channel\'s blacklisted content, case insensitive')
    .addStringOption(option=>
        option.setName('content')
            .setDescription('The content to disallow')
            .setRequired(true)),
    async execute(interaction){
        let config = configMan.readConfig();

        if(config.contentBlacklist[interaction.channelId].includes(interaction.options.data[0].value.toUpperCase())){
            interaction.reply({content:'Content already blacklisted', ephemeral:true});
        }else{
            config.contentBlacklist[interaction.channelId].push(interaction.options.data[0].value.toUpperCase());
            configMan.writeConfig(config);
            interaction.reply({content:"Content blacklisted! Reminders containing that phrase will no longer be posted!", ephemeral:true});
        }
    }
}