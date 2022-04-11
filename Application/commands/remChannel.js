const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
let config = JSON.parse(fs.readFileSync('./config.json'));
const siteNames = Object.keys(config.sites);
let choiceArr = new Array();
for(let i = 0 ; i<siteNames.length; i++){
    choiceArr[i] = [siteNames[i], siteNames[i]];
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
        /*  object structure is weird here, just know that we're using the name of the option(RevUP, RAP) as array name, it's an array of channel snowflakes
            sending appropriate message if not already in array, if already present, splice out and write to config file
        */
        //reloading file first, NOTE: this is synchronous, so at large file sizes, may block
        let config = JSON.parse(fs.readFileSync('./config.json'));
        if(config.channels[interaction.options.data[0].value].includes(interaction.channelId)){
            let i = config.channels[interaction.options.data[0].value].indexOf(interaction.channelId);
            config.channels[interaction.options.data[0].value].splice(i, 1);
            fs.writeFileSync('./config.json', JSON.stringify(config));
            interaction.reply({content:"Channel unregistered!", ephemeral:true});
        }else{
            interaction.reply({content:'Channel not registered', ephemeral:true});
        }
    }
}