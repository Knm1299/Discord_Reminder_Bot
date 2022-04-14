const {Client, Collection} = require('discord.js');
const dotenv = require('dotenv');
const https = require('https');
const fs = require('node:fs');
let config = JSON.parse(fs.readFileSync('./config.json'));

dotenv.config();

module.exports = {
    parseMessage,
    checkIn,
    weeklySummary
}

//array to hold active reminders
let reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;

//time in advance to notify, in milliseconds
const millisInAdvance = 900000;

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
    if(!config.remindersActive)return;

    const curTime = Date.now();

    
    //trigger weekly announcement at 10AM Monday
    let nowString = new Date(curTime).toLocaleString('en-US',{dateStyle:'full',timeStyle:'short',timeZone:'America/New_York'}).match(/(Monday)|(10:00 AM)/gi);
    let weeklyFlag = config.weekliesActive && nowString != null && nowString.length == 2;
    if(weeklyFlag) weeklySummary(client);

    //array of changes to prevent mutation issues
    let changes = [];
    
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
                    console.debug("Reminder posting at: " + new Date(curTime));
                    client.channels.fetch(channelId).then(
                        foundChannel =>{
                            if(r.content != "No Study Group")
                            {
                                foundChannel.send(
                                    "@everyone Dont forget! There is a " + r.typeName +
                                    " study group at " +  new Date(r.time).toLocaleTimeString("en-US",{"timeStyle":"short","timeZone":'America/New_York'}) +
                                    "!\n" +
                                    "Today's topic: " + r.content + "\n" +
                                    "Registration link: " + r.link
                                )
                                .catch(console.error);
                            }else
                            {
                                foundChannel.send("No " + new Date(r.time).toLocaleTimeString("en-US",{"timeStyle":"short","timeZone":'America/New_York'}) +
                                " Study group today!").catch(console.error);
                            }
                        }
                    )
                    .catch(console.error);
                }
                console.debug("checkIn removing posted entry at " + new Date(curTime));
                changes.push(i);
            }

        }else
        {
            console.debug("checkIn pruning entry at " + new Date(curTime));
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
        if(!date)continue;//skips line if first entry not valid date
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

        if(date2 != date && content2)reminders.push({
            "typeName":type,
            "link":link,
            "time":date2,
            "content":content2
        })

    }
    //write to file
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
 * @param client the client object to send the message with
 * **/
function weeklySummary(client)
{
    let weeklies = {};

    for(let r of reminders)
    {
        //the hard coded number is the number of millis in 7 days
        if(r.time - Date.now() > 604800000)continue;
        for(let channel of config.channels[r.typeName +"Announce"])
        {
            (weeklies.hasOwnProperty(channel))? weeklies[channel].push(r) : weeklies[channel] = [r];
        }
    }
    console.debug("Registered servers: " + Object.entries(weeklies).length);

    for(let [s,rs] of Object.entries(weeklies))
    {
        rs.sort((a,b)=>{return(a.time - b.time);})
        let message = "@everyone All study groups for the week of: " + new Date().toLocaleDateString('en-US',{dateStyle:"full"}) + ": \n";
        let days = [[],[],[],[],[],[],[]];
        for(let day = 1; day < 8;  day++)
        {
            //iterate through array, edit in place to prevent duplicates
            let changes = [];
            for(let [i,r] of rs.entries())
            {
                if(r.time-(day*86400000) < Date.now())
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
                message += new Date(r.time).toLocaleTimeString('en-US',{timeStyle:"short", timeZone:'America/New_York'}) + ": " + r.typeName + " Study Group on: " + r.content + "\n";
            }
        }
        
        //sending message
        client.channels.fetch(s).then(channel =>{
            channel.send(message)
        }).catch(console.error);
        

    }
}