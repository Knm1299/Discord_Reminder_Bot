const { SlashCommandBuilder } = require("@discordjs/builders");
const { addReminder } = require('../Services/reminderManager');
const configMan = require('../services/configManager');

let config = configMan.config;
const channelNames = Object.keys(config.regLinks);
let choiceArr = new Array();
for(let i = 0 ; i<channelNames.length; i++){
    choiceArr[i] = [channelNames[i], channelNames[i]];
}

module.exports = {
    data: new SlashCommandBuilder().setName('newreminder')
    .setDescription('add a single additional reminder for the specified group')
    .addStringOption(option=>
        option.setName('group')
            .setDescription('The group to configure this channel for')
            .setChoices(choiceArr)
            .setRequired(true))
    .addStringOption(option=>
        option.setName('time')
            .setDescription('the date/time for this reminder in a javascript readable format ex 2022-05-13T15:50')
            .setRequired(true))
    .addStringOption(option=>
        option.setName('advance')
            .setDescription('the number of millis in advance to fire the reminder')
            .setRequired(false))
    .addStringOption(option=>
        option.setName('contents')
            .setDescription('the contents of the reminder to be scheduled')
            .setRequired(true)),
    async execute(interaction){
        let advance = interaction.options.data[2].value ? interaction.options.data[2].value : config.timeInAdvance;
        addReminder(interaction.options.data[0].value, interaction.options.data[1].value, advance, interaction.options.data[3].value);
        interaction.reply({content:'Reminder scheduled successfully', ephemeral:true});
    }
}