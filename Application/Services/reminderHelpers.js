/*
 *  This file contains helper functions including the schedule parser and reminder generation functions 
 */

const https = require('https');
const fs = require('node:fs');
let configMan = require('./configManager');
let config = configMan.config;

module.exports = {
    parseMessage,
    addReminder
}

//array to hold active reminders TODO: move this literally anywhere but top level nvm it's *fine*
let reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;


/**
 * Parses a message that consists of a command phrase and a csv with the schedule to set
 * 
 * @param {Message} message the message object to parse
 */
 function parseMessage(message){
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
                setRevUpReminders(csvArr);
            }
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.end()
}

/**
 * Parses a 2d array generated from the schedule CSV to set RevUp's 1PM and 6PM reminders, as well as orientation reminders
 * @param {String[]} lineArr the 2d array of lines to be parsed into reminders. <br>
 * Each data line should follow the form: <br>
 * Date , ignored , 1PM topic , ignored , 2PM topic , ignored , Orientation time
 */
 function setRevUpReminders(lineArr){
    reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;
    for(line of lineArr)
    {
        let date = Date.parse(line[0]);
        if(!date)continue;
        let date1 = parseTime(date, "1pm");
        let date2 = parseTime(date, "6pm");
        let date3 = parseTime(date, line[7]);//Orientation
        let content1 = line[2];
        let content2 = line[4];

        let content3 = "Hi @everyone! As a reminder, today's RevUp orientation will be starting at " +  line[7] + " Eastern Time. " +
        "\n\n" + 
        "For new members, you should have received a link to register in your email, but if not, click this link to sign up for the webinar: https://revatu.re/revup-orientation";

        let revUpLink = config.regLinks.RevUP;
        let advance1 = config.timeInAdvance;//default advance for revUp reminders
        let advance2 = 1000*60*60;//1HR for orientation reminders

        let reminder1 = {
            "typeName":"RevUP",
            "link":revUpLink,
            "time":date1,
            "content":content1,
            "advance":advance1
        }
        let reminder2 = {
            "typeName":"RevUP",
            "link":revUpLink,
            "time":date2,
            "content":content2,
            "advance":advance1
        }
        let orientation = {
            "typeName":"RevUP",
            "time":date3,
            "content":content3,
            "advance":advance2
        }

        if(content1 && !reminders.find(r=>{return r.time==reminder1.time}))reminders.push(reminder1);

        if(content2 && !reminders.find(r=>{return r.time==reminder2.time}))reminders.push(reminder2);

        if(content2 && !reminders.find(r=>{return r.time==date3}))reminders.push(orientation);
    }
    //write to file
    fs.writeFileSync('./schedule.json', JSON.stringify({"reminders":reminders}));
}

/**
 * Schedules a reminder with custom content, doesn't use regular "Dont forget!" format
 * @param {String} type The groupname for sending the reminder out
 * @param {String} date The dateTime as an ISO string ex. YYYY-MM-DDTHH:MM
 * @param {Number} advance The time in advance to send the reminder, relative to date
 * @param {String} content The message to send
 */
function addReminder(type, date, advance, content){
    config = configMan.readConfig();
    reminders = JSON.parse(fs.readFileSync('./schedule.json')).reminders;
    let dateNumber = Date.parse(date);
    let reminder = {
        "typeName":type,
        "time":dateNumber,
        "content":content,
        "advance":advance
    }

    //add to 
    if(!reminders.find(r=>{return (r.time==reminder.time&&r.content==reminder.content)}))reminders.push(reminder);
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


/** 
    Sets hour and minute from a given string

    @returns the date object with set hour and minute, null if invalid time

    @param {Date}date date object to set time of
    @param {string}time string starting with hh:mm PM/AM, minutes are optional, case insensitive
**/
function parseTime(date, time){
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
