const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
const configMan = require('../services/configManager');

let config = configMan.config;
const channelNames = Object.keys(config.regLinks);
let choiceArr = new Array();
for(let i = 0 ; i<channelNames.length; i++){
    choiceArr[i] = [channelNames[i], channelNames[i]];
}

//TODO switch to an auto-comlete list to configure each switch individually
// or set them as not required and enumerate which ones have been selected instead of setting by index
module.exports = {
    data: new SlashCommandBuilder().setName('configchannel')
    .setDescription('configure current channel for specified reminder group')
    .addStringOption(option=>
        option.setName('group')
            .setDescription('The group to configure this channel for')
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
        .setRequired(true))
    .addBooleanOption(option=>
        option.setName('orientations')
        .setDescription('Whether or not to post orientation reminders')
        .setRequired(true))
    .addBooleanOption(option=>
        option.setName('checkProgress')
        .setDescription('Whether or not to post progress check reminders')
        .setRequired(true))
    .addBooleanOption(option=>
        option.setName('sparkSurvey')
        .setDescription('Whether or not to post weekly spark survey reminders')
        .setRequired(true)),
    async execute(interaction){
        let config = configMan.readConfig();
        //setting channel object
        /* config structure looks like:
            config{
                channels{
                    channelId{
                        groupName{
                            boolean individuals
                            boolean weeklies
                            boolean dailies
                            boolean orientation
                            boolean checkProgress
                            boolean sparkSurvey
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
            dailies : interaction.options.data[3].value,
            orientation : interaction.options.data[4].value,
            checkProgress : interaction.options.data[5].value,
            sparkSurvey : interaction.options.data[6].value
        };
        if(!config.channels[interaction.channelId].hasOwnProperty('blacklist')){
            config.channels[interaction.channelId].blacklist = [];
        }
        configMan.writeConfig(config);
        interaction.reply({content:"Channel configured for " + interaction.options.data[0].value + "!", ephemeral:true});
        
    }
}