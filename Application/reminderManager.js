const {Client, Collection} = require('discord.js');
const dotenv = require('dotenv');
const https = require('https');
const fs = require('node:fs');
let config = JSON.parse(fs.readFileSync('./config.json'));

dotenv.config();

module.exports = {
    parseMessage,
    checkIn
}

//array to hold active reminders for checking against, with hour (0-23), type, and content
let reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;

//time in advance to notify, in milliseconds
const millisInAdvance = 3600000;

//This function blocks, room for improvement
function parseMessage(type, message)
{
    console.log("Set Reminders: ");
    let csv = message.attachments.first();
    let csvArr;
    
    const req = https.request(csv.url, res => {
        console.log(`Status Code: ${res.statusCode}`)

        res.on('data', d => {
            csvArr = csvStringToArray(d);
            setReminders(type,csvArr);
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.end()
}

//runs once every minute, sends announcement if a reminder is due
function checkIn(client)
{
    //reload config to ensure channel add/remove is respected
    config = JSON.parse(fs.readFileSync('./config.json'));

    const curTime = Date.now();

    //array of changes to prevent mutation issues
    let changes = [];
    //TODO: figure out why this only half works
    
    //iterate through array, if reminder is due, post reminder and remove from array
    //if past due, remove from array and log
    for(const [i,r] of reminders.entries())
    {
        if (r.time != null && curTime < r.time)
        {
            if(r.time - curTime <= millisInAdvance)
            {
                for(channelId of config.channels[r.typeName])
                {
                    console.debug("checkIn posting at: " + new Date(curTime));
                    client.channels.fetch(channelId).then(
                        foundChannel =>{
                            foundChannel.send(
                                "Dont forget! There is a " + r.typeName +
                                " study group at " +  new Date(r.time).toLocaleTimeString("en-US",{"timeStyle":"short","timeZone":'America/New_York'}) +
                                "!\n" +
                                "Today's topic: " + r.content + "\n" +
                                "Registration link: " + r.link
                            )
                            .catch(console.error);
                        }
                    )
                    .catch(console.error);
                }
                console.debug("checkIn pruning entry at " + new Date(curTime));
                changes.push(i);
            }

        }else
        {
            console.debug("checkIn pruning entry at " + new Date(curTime));
            changes.push(i);
        }
    }
    for(let [i,c] of changes.entries())
    {
        reminders.splice(c-i,1);
    }
    fs.writeFileSync('./schedule.json', JSON.stringify({"reminders":reminders}));
}

//Shamelessly stolen csv parser, outputs a 2d array
/**@returns 2d array of csv entries @param strData csv content as a string */
const csvStringToArray = strData =>{
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"),"gi");
    let arrMatches = null, arrData = [[]];
    while (arrMatches = objPattern.exec(strData))
    {
        if (arrMatches[1].length && arrMatches[1] !== ",")arrData.push([]);
        arrData[arrData.length - 1].push(arrMatches[2] ? 
            arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"") :
            arrMatches[3]);
    }
    return arrData;
}

//Sets reminders in local array, also writes to file
function setReminders(type,lineArr)
{
    for(line of lineArr)
    {
        let date = Date.parse(line[0]);
        if(!date)continue;//skip line if first entry not valid date
        // date = new Date(date); //stored as epoch for now, timezone concerns
        let date1 = parseTime(date, line[1]);
        let date2 = parseTime(date, line[4]);
        let content1 = line[2];
        let content2 = line[5];
        let link = config.sites[type];

        reminders.push({
            "typeName":type,
            "link":link,
            "time":date1,
            "content":content1
        })

        if(date2 && content2)reminders.push({
            "typeName":type,
            "link":link,
            "time":date2,
            "content":content2
        })

    }
    //write to file
    fs.writeFileSync('./schedule.json', JSON.stringify({"reminders":reminders}));
}

//TODO: account for potential timezone issue if bot not in EDT/EST
/** 
    Sets hour and minute from a given string

    @returns the date object with set hour and minute, null if invalid time

    @param date date object to set time of
    @param time string starting with hh:mm PM/AM, minutes are optional, case insensitive
**/
function parseTime(date, time)
{
    if(!time)return null;
    //parses time from string like 1pm
    time = time.split(" ")[0];
    let hhMM = time.replace(/(am)|(pm)+/i,"").split(":");

    //here I decided to account for minutes for no good reason
    let hour = hhMM[0];
    let minute = (hhMM.length > 1)?hhMM[1]:0;
    let builtDate = new Date(date);
    if(time.match(/am/i) && hour == 12) hour = 0;
    if(time.match(/pm/i) && hour != 12) hour = parseInt(hour) + 12;
    builtDate.setHours(hour, minute, 0,0);
    return builtDate.getTime();
}