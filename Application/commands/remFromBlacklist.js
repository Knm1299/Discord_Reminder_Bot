const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
const configMan = require('../services/configManager');

let config = configMan.config;


module.exports = {
    data: new SlashCommandBuilder().setName('remfromblacklist')
    .setDescription('remove content from current channel\'s blacklisted content, case insensitive')
    .addStringOption(option=>
        option.setName('content')
            .setDescription('The content to re-allow')
            .setRequired(true)),
    async execute(interaction){
        let config = configMan.readConfig()

        if(config.channels[interaction.channelId].blacklist.includes(interaction.options.data[0].value.toUpperCase())){
            config.channels[interaction.channelId].blacklist.splice(config.channels[interaction.channelId].blacklist.indexOf(interaction.options.data[0].value.toUpperCase()),1);
            configMan.writeConfig();
            interaction.reply({content:"Content reinstated! Reminders containing that phrase will once again be posted", ephemeral:true});
        }else{
            interaction.reply({content:'Content not blacklisted', ephemeral:true});
        }
    }
}