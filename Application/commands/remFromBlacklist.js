const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('node:fs');
let config = JSON.parse(fs.readFileSync('./config.json'));


module.exports = {
    data: new SlashCommandBuilder().setName('remfromblacklist')
    .setDescription('remove content from current channel\'s blacklisted content, case insensitive')
    .addStringOption(option=>
        option.setName('content')
            .setDescription('The content to re-allow')
            .setRequired(true)),
    async execute(interaction){
        //reloading file first, NOTE: this is synchronous, so at large file sizes, may block
        let config = JSON.parse(fs.readFileSync('./config.json'));

        if(config.contentBlacklist[interaction.channelId].includes(interaction.options.data[0].value.toUpperCase())){
            config.contentBlacklist[interaction.channelId].splice(config.contentBlacklist[interaction.channelId].indexOf(interaction.options.data[0].value.toUpperCase()),1);
            fs.writeFileSync('./config.json', JSON.stringify(config));
            interaction.reply({content:"Content reinstated! Reminders containing that phrase will once again be posted", ephemeral:true});
        }else{
            interaction.reply({content:'Content not blacklisted', ephemeral:true});
        }
    }
}