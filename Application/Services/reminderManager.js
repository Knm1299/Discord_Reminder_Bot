const {Client, Collection} = require('discord.js');
const dotenv = require('dotenv');
const https = require('https');
const fs = require('node:fs');
let configMan = require('../services/configManager');
let config = configMan.config;


dotenv.config();

module.exports = {
    parseMessage,
    checkIn,
    weeklySummary
}

//array to hold active reminders TODO: move this literally anywhere but top level
let reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;

/**
 * Parses a message that consists of a command phrase and a csv with the schedule to set
 * 
 * @param {String} type Name of the program the reminder belongs to
 * @param {Message} message the message object to parse
 */
function parseMessage(type, message)
{
    console.log("Set Reminders: ");
    let csv = message.attachments.first();
    if(!csv)return;
    let csvArr;
    
    const req = https.request(csv.url, res => {
        console.log(`Status Code: ${res.statusCode}`)
        let fullString = "";

        res.on('data', d => {
            fullString += d;
        })

        res.on('end',()=>{
            if(res.complete){
                csvArr = csvStringToArray(fullString);
                setReminders(type, csvArr);
            }
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.end()
}

/**
 * meant to be run periodically, sends announcement if a reminder is due within specified time
 * 
 * @param {Client} client the active client to send the message with
 */
function checkIn(client)
{
    //reload config to ensure channel add/remove is respected
    config = configMan.readConfig();

    const curTime = Date.now();

    
    //trigger weekly announcement at 10AM Monday, feel free to make a pull req if you can improve this
    let nowString = new Date(curTime).toLocaleString('en-US',{dateStyle:'full',timeStyle:'short',timeZone:'America/New_York'}).match(/(Monday)|(10:00 AM)/gi);
    let weeklyFlag = config.weekliesActive && nowString != null && nowString.length == 2;
    if(weeklyFlag) weeklySummary(client);
    
    //checking if reminders are active before continuing
    if(!config.remindersActive)return;

    //array of changes to prevent mutation issues
    let changes = [];
    
    //iterate through array, if reminder is due, post reminder and remove from array
    //if past due, remove from array and log
    //TODO: you can't really leave this mess for others to have to look at
    for(const [i,r] of reminders.entries())
    {
        if (r.time == null || curTime >= r.time)
        {
            console.debug("pruning entry at " + new Date());
            changes.push(i);
            continue;
        }
        if(r.time - curTime <= config.timeInAdvance)
        {
            for(channelId of config.channels[r.typeName])
            {
                if(config.contentBlacklist[channelId].includes(r.content.toUpperCase()))continue;
                console.debug("Reminder posting at: " + new Date());
                client.channels.fetch(channelId).then(foundChannel =>{
                    if(r.content != "No Study Group")
                    {
                        foundChannel.send(
                            "@everyone Dont forget! There is a " + r.typeName +
                            " study group at " +  new Date(r.time).toLocaleTimeString("en-US",{"timeStyle":"short","timeZone":'America/New_York'}) +
                            "!\n" +
                            "Today's topic: " + r.content + "\n" +
                            "Registration link: " + r.link
                        ).catch(console.error);
                    }else
                    {
                        foundChannel.send(
                            "No " + new Date(r.time).toLocaleTimeString("en-US",{"timeStyle":"short","timeZone":'America/New_York'}) +
                            " Study group today!"
                        ).catch(console.error);
                    }
                }).catch(console.error);
            }
            console.debug("removing posted entry at " + new Date());
            changes.push(i);
        }
    }
    //removes changes without leaving holes
    for(let [i,c] of changes.entries())
    {
        reminders.splice(c-i,1);
    }
    fs.writeFileSync('./schedule.json', JSON.stringify({"reminders":reminders}));
}

//Sets reminders in local array, also writes to file
function setReminders(type,lineArr)
{
    for(line of lineArr)
    {
        let date = Date.parse(line[0]);
        if(!date)continue;
        let date1 = parseTime(date, line[1]);
        let date2 = parseTime(date, line[4]);
        let content1 = line[2];
        let content2 = line[5];
        let link = config.regLinks[type];

        let reminder1 = {
            "typeName":type,
            "link":link,
            "time":date1,
            "content":content1
        }
        let reminder2 = {
            "typeName":type,
            "link":link,
            "time":date2,
            "content":content2
        }

        if(!reminders.find(r=>{return r.time==reminder1.time}))reminders.push(reminder1);  

        if(date2 && date2 != date && !reminders.find(r=>{return r.time==reminder2.time}))reminders.push(reminder2);

    }
    //write to file
    fs.writeFileSync('./schedule.json', JSON.stringify({"reminders":reminders}));
}

//csv parser, outputs a 2d array
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

//TODO: account for potential timezone issue if bot not in EDT/EST
/** 
    Sets hour and minute from a given string

    @returns the date object with set hour and minute, null if invalid time

    @param {Date}date date object to set time of
    @param {string}time string starting with hh:mm PM/AM, minutes are optional, case insensitive
**/
function parseTime(date, time)
{
    if(!time)return null;
    //parses time from string like 1pm
    time = time.split(" ")[0];

    let hhMM = time.replace(/(am)|(pm)+/i,"").split(":");
    let hour = hhMM[0];
    let minute = (hhMM.length > 1)?hhMM[1]:0;
    let builtDate = new Date(date);

    if(time.match(/am/i) && hour == 12) hour = 0;
    if(time.match(/pm/i) && hour != 12) hour = parseInt(hour) + 12;
    builtDate.setHours(hour, minute, 0,0);

    return builtDate.getTime();//epoch time 
}

/**
 * Sends weekly summary to each registered channel with all pertinent reminders
 * 
 * @param {Client}client the client object to send the message with
 * **/
function weeklySummary(client)
{
    let weeklies = {};

    //setting up arrays per channel of reminders due within 7 days, excluding blacklist
    for(let r of reminders)
    {
        //the hard coded number is the number of millis in 7 days
        if(r.time - Date.now() > 604800000)continue;
        for(let channel of config.channels[r.typeName +"Announce"])
        {
            //checking blacklist
            if(config.contentBlacklist[channel].includes(r.content.toUpperCase()))continue;
            (weeklies.hasOwnProperty(channel))? weeklies[channel].push(r) : weeklies[channel] = [r];
        }
    }

    //sets up array of days, then sends schedule
    for(let [s,rs] of Object.entries(weeklies))
    {
        //sorting by time to ensure each day is ordered
        rs.sort((a,b)=>{return(a.time - b.time);})
        
        //message header
        let message = "@everyone All study groups for the week of: " + new Date().toLocaleDateString('en-US',{dateStyle:"full"}) + ": \n";

        let days = [[],[],[],[],[],[],[]];
        for(let day = 1; day < 8;  day++)
        {
            //iterate through array, edit in place to prevent duplicates
            let changes = [];
            for(let [i,r] of rs.entries())
            {
                //temp date to check from last midnight
                let tempDate = new Date();
                tempDate.setHours(0,0,0,0);
                if(r.time-(day*86400000) < tempDate.getTime())
                {
                    days[day-1].push(r);
                    changes.push(i);
                }
            }
            for(let [i,c] of changes.entries())
            {
                rs.splice(c-i,1);
            }

        }

        for(let [dayI, day] of days.entries())
        {
            if(day.length > 0)message += "```fix\n" + new Date(Date.now()+((dayI)*86400000)).toLocaleDateString('en-US',{dateStyle:'full'}) + " ```\n";
            for(let r of day)
            {
                message += new Date(r.time).toLocaleTimeString('en-US',{timeStyle:"short", timeZone:'America/New_York'}) + ": " + r.typeName + " Study Group - " + r.content + "\n";
            }
        }
        
        //sending message
        client.channels.fetch(s).then(channel =>{
            channel.send(message)
        }).catch(console.error);
        

    }
}