const {Client, Collection} = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    parseMessage,
    checkIn
}

//array to hold active reminders for checking against, with hour (0-23), type, and content
const reminders = new Array();

//time in advance to notify, in milliseconds
const millisInAdvance = 3600000;

//parses message based on the consistency with which Nancy makes daily reminders
function parseMessage(client, message){
    console.log("Set Reminders: ");
    const lines = message.content.split('\n');
    for(line of lines)
    {
        let words = line.split(" ");
        //doesn't use line if first word isn't an entry marker
        //if we introduce SPARK to this we will have to re-evaluate this approach
        if(words[0] != "RevUp" && words[0] != "RAP")continue;

        //sets link from .env
        let type = (words[0] == "RevUp")?process.env.REVUP_LINK:process.env.RAP_LINK;
        
        //parses time from hour:minute+pm/am
        let times = words[1].replace(/(am)|(pm)+/i,"").split(":");
        let hour = times[0];
        let timeM = (times.length > 1)?times[1]:0;
        if(words[1].match(/am/gi) != null && hour == 12) hour = 0;
        if(words[1].match(/pm/gi) != null && hour != 12) hour = parseInt(hour) + 12;
        //constructing date for later usage
        let myDate = new Date(Date.now());
        myDate.setHours(hour, timeM, 0,0);
        
        let content = line.slice(line.indexOf("-")+1).trim();

        reminders.push({
            "type":type,
            "time":myDate,
            "content":content
        })
    }
    console.log(reminders);
}

//runs every minute, sends announcement if a reminder is due
function checkIn(client){
    const curTime = new Date(Date.now());
    
    for(i=0;i<reminders.length;i++)
    {
        let r = reminders.shift();
        if (r.time - curTime <= millisInAdvance)
        {
            console.debug("checkIn posting at: " + curTime)
            client.channels.fetch("953340419469639685").then(
                foundChannel =>{
                    foundChannel.send(
                        "Dont forget! There is a study group in an hour!\n" +
                        "Today's topic is: " + r.content + "\n" +
                        "Registration link: " + r.type
                    )
                    .catch(console.error);
                }
            )
        }else
        {
            reminders.push(r);
        }
    }
}
//TODO: add functionality for adding reminders by command and/or csv