# Discord_Reminder_Bot
Bot for use with Revature pre-training discord servers
# Installation/setup
1. Use Discord dev portal, make a bot
2. Create .env in /Application with DISCORD_TOKEN="your bot's private token here"
3. Create schedule.json in /Application - add array named "reminders" to it, bot will populate later
4. invite bot to server, generally safe to give admin permissions, but permissions for slash commands and messaging are absolutely necessary
# Functionality
### Add/remove channel
In the desired channel, use /addchannel or /remchannel, with the study group classification(currently RevUP/RAP) as the group argument
use /addtoblacklist and /remfromblacklist to add or remove topic names that reminders won't be posted for
### Config features for each channel
In the desired channel, use /configchannel to configure which reminders to send(orientations, weekly schedules, reminder to check progress, etc.)

## Set reminders
PM the bot the phrase "rb set schedule csv" and attach a csv file to the same message.
Each data line should follow the form: 

<table>
  <tbody>  
    <tr>
      <td> Date </td>
      <td> ignored </td>
      <td> 1PM topic </td>
      <td> ignored </td>
      <td> 2PM topic </td>
      <td> ignored </td>
      <td> Orientation time </td>
    </tr>
  </tbody>
</table>
