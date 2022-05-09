const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const dotenv = require('dotenv');
dotenv.config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.BOT_ID;


const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, process.argv[2]), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
//IF YOU'RE HERE BECAUSE YOU  CAN'T REGISTER COMMANDS, USE THE SERVER ID AS THE FIRST ARGUMENT AFTER NODE DEPLOY-COMMANDS.JS	