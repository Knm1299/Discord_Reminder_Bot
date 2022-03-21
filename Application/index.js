const { Client, Intents } = require('discord.js');
const { parseMessage, checkIn } = require('./reminderService/reminderManager.js');//why isn't this a class you ask? Iono
const dotenv = require('dotenv');

//dotenv config for gitignored constants
dotenv.config();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

//keyword for message syntax, currently Nancy's daily good morning
const keyphrase = "Good morning @everyone ! The topics that will be covered in today's study groups are:";

// When the client is ready, run this code (only once)
client.once('ready', () => {
    setInterval(checkIn, 60000, client);
    //TODO: set up channel list + add/remove channel commands for posting
    // made a change
    
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

    //proof of concept, showing that I can retrieve referenced messages
	if (commandName === 'ping') {
        client.channels.fetch("953340419469639685").then(
            foundChannel =>{
                foundChannel.messages.fetch("954950776399224832").then(
                    foundMessage =>{
                        interaction.reply(`${foundMessage.content}`);
                    }
                )
            }
        ).catch(
            error=>{
                interaction.reply('Pong!');
                console.error(error);
            }
        )
	}
});


//Message interaction for catching keyphrase and setting reminders
client.on('messageCreate', async message => {
    if(!message.content.includes(keyphrase)) return;
    parseMessage(client, message);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
