/*
 * This file handles actually posting reminders
 */


const {Client} = require('discord.js');
const fs = require('node:fs');
let configMan = require('../services/configManager');
let config = configMan.config;


module.exports = {
    weeklySummary,
    dailySummary,
    checkIn
}

//array to hold active reminders TODO: move this literally anywhere but top level nvm it's *fine*
let reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;

/**
 * meant to be run periodically, sends announcement if a reminder is due within specified time
 * 
 * @param {Client} client the active client to send the message with
 */
function checkIn(client){
    //loading reminders to account for more ways to add them
    reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;
    //checking if reminders are active before continuing
    if(!config.remindersActive)return;

    //reload config to ensure channel add/remove is respected
    config = configMan.readConfig();

    const curTime = Date.now();

    
    //trigger weekly announcement at 6:01 PM Eastern Friday
    let nowString = new Date(curTime).toLocaleString('en-US',{dateStyle:'full',timeStyle:'short',timeZone:'America/New_York'});
    let weeklyFlag =  nowString.match(/(Friday)|(6:01 PM)/gi) != null && nowString.match(/(Friday)|(6:01 PM)/gi).length == 2;
    if(weeklyFlag) {
        weeklySummary(client);
        //TODO: sparkSurvey(client);
        //TODO: checkProgress(client);
    }

    //trigger daily announcement in the same way, uses the same date object
    let dailyFlag =  nowString.match(/(10:00 AM)/gi) != null && nowString.match(/(10:00 AM)/gi).length == 1;
    if(dailyFlag) dailySummary(client);

    //array of changes to prevent mutation issues
    let changes = [];
    
    //iterate through array, if reminder is due, post reminder and remove from array
    //if past due, remove from array and log
    //TODO: cleanup, you can't really leave this mess for others to have to look at
    for(const [i,r] of reminders.entries())
    {
        if (r.time == null || curTime >= r.time)
        {
            console.debug("pruning entry at " + new Date());
            changes.push(i);
            continue;
        }
        if(r.time - curTime <= r.advance)
        {
            for(const [channelId, channelObj] of Object.entries(config.channels))
            {
                if(!channelObj[r.typeName].individuals){
                    if(!channelObj[r.typeName].orientation || !r.content.includes("today's RevUp orientation"))continue;
                    else{
                        client.channels.fetch(channelId).then(foundChannel =>{
                            foundChannel.send(r.content).catch(console.error);
                        }).catch(console.error);
                        continue;
                    }
                }
                if(r.content.includes("today's RevUp orientation")){
                    if(!channelObj[r.typeName].orientation)continue;
                    else{
                        client.channels.fetch(channelId).then(foundChannel =>{
                            foundChannel.send(r.content).catch(console.error);
                        }).catch(console.error);
                        continue;
                    }
                }
                if(channelObj.blacklist.includes(r.content.toUpperCase()))continue;
                console.debug("Reminder posting at: " + new Date());
                client.channels.fetch(channelId).then(foundChannel =>{
                    if(r.link)
                    {
                        foundChannel.send(
                            "@everyone Dont forget! There is a " + r.typeName +
                            " study group at " +  new Date(r.time).toLocaleTimeString("en-US",{"timeStyle":"short","timeZone":'America/New_York'}) +
                            "!\n" +
                            "Today's topic: " + r.content + "\n" +
                            "Registration link: " + r.link
                        ).catch(console.error);
                    }else{
                        foundChannel.send(r.content).catch(console.error);
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


/**
 * Sends weekly summary to each registered channel with all pertinent reminders
 * 
 * @param {Client}client the client object to send the message with
 * @param {Boolean}[includeToday] whether or not to include reminders from earlier today, switches before/after work posting, true being before
 * **/
 function weeklySummary(client, includeToday){
    //reload config
    config = configMan.config;
    let weeklies = {};

    //setting up arrays per channel of reminders due within 7 days, excluding blacklist
    for(let r of reminders)
    {
        //the hard coded number is the number of millis in 7 days
        if(r.time - Date.now() > 604800000)continue;
        for(const [channelId, channelObj] of Object.entries(config.channels))
        {
            if(!channelObj[r.typeName].weeklies)continue;
            if(channelObj.blacklist.includes(r.content.toUpperCase()))continue;
            if(!r.link)continue;
            (weeklies.hasOwnProperty(channelId))? weeklies[channelId].push(r) : weeklies[channelId] = [r];
        }
    }

    //sets up array of days, then sends schedule
    for(let [s,rs] of Object.entries(weeklies))
    {
        //sorting by time to ensure each day is ordered
        rs.sort((a,b)=>{return(a.time - b.time);})
        
        //message header
        let message = "@everyone All study groups for the week following " + new Date().toLocaleDateString('en-US',{dateStyle:"full"}) + ": \n";

        //temp date to check from last midnight, includes ones earlier today, excludes 7 days from now
        let tempDate = new Date();
        includeToday?tempDate.setHours(0,0,0,0):null;

        let days = [[],[],[],[],[],[],[]];
        for(let day = 1; day < 8;  day++)
        {
            //iterate through array, edit in place to prevent duplicates
            let changes = [];
            for(let [i,r] of rs.entries())
            {
                
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
            if(day.length > 0)message += "```fix\n" + new Date(tempDate.getTime()+((dayI + (includeToday?0:1))*86400000)).toLocaleDateString('en-US',{dateStyle:'full'}) + " ```\n";
            for(let r of day)
            {//TODO: timezone management
                message += new Date(r.time).toLocaleTimeString('en-US',{timeStyle:"short", timeZone:'America/New_York'}) + " EDT: " + r.typeName + " Study Group - " + r.content + "\n";
            }
        }
        
        //sending message
        client.channels.fetch(s).then(channel =>{
            channel.send(message)
        }).catch(console.error);
        

    }
}

/**
 * Sends daily summary to each registered channel with all pertinent reminders
 * 
 * @param {Client} client the client object to send the message with
 */
function dailySummary(client){
    //reload config
    config = configMan.config;
    let dailies = {};

    //setting up arrays per channel of reminders due within a day, excluding blacklist
    for(let r of reminders)
    {
        //the hard coded number is the number of millis in a day
        if(r.time - Date.now() > 86_400_000)continue;
        for(const [channelId, channelObj] of Object.entries(config.channels))
        {
            if(!channelObj[r.typeName].dailies)continue;
            if(channelObj.blacklist.includes(r.content.toUpperCase()))continue;
            if(!r.link)continue;
            (dailies.hasOwnProperty(channelId))? dailies[channelId].push(r) : dailies[channelId] = [r];
        }
    }

    //sends schedule to each registered channel
    for(let [s,rs] of Object.entries(dailies))
    {
        //sorting by time to ensure each day is ordered
        rs.sort((a,b)=>{return(a.time - b.time);})
        
        //message header
        let message = "@everyone The topics that will be covered in today's study groups are: \n\n";

        for(let r of rs)
        {
            message += new Date(r.time).toLocaleTimeString('en-US',{timeStyle:"short", timeZone:'America/New_York'}) + " EDT: " + r.typeName + " Study Group - " + r.content + "\n";
        }
        
        message += "\nCheck out the 📖-study-group-links channel to register or to view older study group videos.";

        //sending message
        client.channels.fetch(s).then(channel =>{
            channel.send(message)
        }).catch(console.error);
        

    }
}