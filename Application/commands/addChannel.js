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
    data: new SlashCommandBuilder().setName('addchannel')
    .setDescription('add current channel to specified reminder group')
    .addStringOption(option=>
        option.setName('group')
            .setDescription('The group to add this channel to')
            .setChoices(choiceArr)
            .setRequired(true))
    .addBooleanOption(option=>
        option.setName('individuals')
        .setDescription('Whether or not to post individual reminders')
        .setRequired(true))
    .addBooleanOption(option=>
        option.setName('weeklies')
        .setDescription('Whether or not to post weekly schedules')
        .setRequired(true))
    .addBooleanOption(option=>
        option.setName('dailies')
        .setDescription('Whether or not to post daily schedules')
        .setRequired(true)),
    async execute(interaction){
        let config = configMan.readConfig();
        if(config.channels.hasOwnProperty(interaction.channelId) && config.channels[interaction.channelId].hasOwnProperty(interaction.options.data[0].value)){
            interaction.reply({content:'Channel already registered', ephemeral:true});
        }else{
            //setting channel object
            /* config structure looks like:
                config{
                    channels{
                        channelId{
                            groupName{
                                boolean individuals
                                boolean weeklies
                                boolean dailies
                            },
                            blacklist = []
                        }
                    }
                }
            */
            if(!config.channels.hasOwnProperty(interaction.channelId)){
                config.channels[interaction.channelId] = {};
            }
            config.channels[interaction.channelId][interaction.options.data[0].value] = {
                individuals: interaction.options.data[1].value,
                weeklies : interaction.options.data[2].value,
                dailies : interaction.options.data[3].value
            };
            if(!config.channels[interaction.channelId].hasOwnProperty('blacklist'))config.channels[interaction.channelId].blacklist = [];
            configMan.writeConfig(config);
            interaction.reply({content:"Channel registered! Remember to use the appropriate command to add topics that you don't want posted here!", ephemeral:true});
        }
    }
}