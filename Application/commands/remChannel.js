const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
const configMan = require('../services/configManager');

let config = configMan.config;
const channelNames = Object.keys(config.regLinks);
let choiceArr = new Array();
for(let i = 0 ; i<channelNames.length; i++){
    choiceArr[i] = [channelNames[i], channelNames[i]];
}


module.exports = {
    data: new SlashCommandBuilder().setName('remchannel')
    .setDescription('remove current channel from specified reminder group')
    .addStringOption(option=>
        option.setName('group')
            .setDescription('The group to remove this channel from')
            .setChoices(choiceArr)
            .setRequired(true)),
    async execute(interaction){
        let config = configMan.readConfig();
        if(config.channels[interaction.channelId][interaction.options.data[0].value]){

            delete config.channels[interaction.channelId][interaction.options.data[0].value];

            //removing blacklist for channel if last registered
            if(Object.keys(config.channels[interaction.channelId]).length == 1)
            delete(config.channels[interaction.channelId]);

            configMan.writeConfig(config);
            interaction.reply({content:"Channel unregistered!", ephemeral:true});
        }else{
            interaction.reply({content:'Channel not registered', ephemeral:true});
        }
    }
}