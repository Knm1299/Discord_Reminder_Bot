const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { parseMessage, checkIn } = require('./reminderManager.js');//why isn't this a class you ask? Ion
const dotenv = require('dotenv');

//dotenv config for gitignored constants
dotenv.config();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials:[ "CHANNEL" ] });

//make a commands collection and add to client instance
//then add all commands from the /commands directory
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

//keyword to identify message with csv payload
const keyphraseRevUP = "RB SET SCHEDULE REVUP";
const keyphraseRAP = "RB SET SCHEDULE RAP";

// When the client is ready, run this code (only once)
client.once('ready', () => {
    setInterval(checkIn, 60000, client);
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


//Message interaction for catching keyphrase and setting reminders
//NOTE: only good for RevUP or RAP due to unreliable formatting, could include a column for study group type to help
client.on('messageCreate', async message => {
    if(message.content.toUpperCase().includes(keyphraseRevUP)){
        console.log("ready for csv");
        parseMessage("RevUP", message);
    }else if(message.content.toUpperCase().includes(keyphraseRAP)){
        console.log("ready for csv");
        parseMessage("RAP", message);
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
