const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
let config = JSON.parse(fs.readFileSync('./config.json'));
const channelNames = Object.keys(config.channels);
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
            .setRequired(true)),
    async execute(interaction){
        /*  object structure is weird here, just know that we're using the name of the option(RevUP, RAP) as array name, it's an array of channel snowflakes
            sending appropriate message if already in array, if new, write to config file
        */
        //reloading file first, NOTE: this is synchronous, so at large file sizes, may block
        let config = JSON.parse(fs.readFileSync('./config.json'));
        if(config.channels[interaction.options.data[0].value].includes(interaction.channelId)){
            interaction.reply({content:'Channel already registered', ephemeral:true});
        }else{
            config.channels[interaction.options.data[0].value].push(interaction.channelId);
            if(!config.contentBlacklist.hasOwnProperty(interaction.channelId)) config.contentBlacklist[interaction.channelId] = [];
            fs.writeFileSync('./config.json', JSON.stringify(config));
            interaction.reply({content:"Channel registered! Remember to use the appropriate command to add topics that you don't want posted here!", ephemeral:true});
        }
    }
}