# Discord_Reminder_Bot
Bot for use with Revature pre-training discord servers
# Installation/setup
1. Use Discord dev portal, make a bot
2. Create .env in /Application with DISCORD_TOKEN="your bot's private token here"
3. Create schedule.json in /Application - add array named "reminders" to it, bot will populate later
4. invite bot to server, for now give all permissions(TODO: get accurate permission count)
# Functionality
## Add/remove channel
In the desired channel, use /addchannel or /remchannel, with the study group classification(currently RevUP/RAP) as the group argument
## Set reminders
PM the bot the phrase "rb set schedule <groupType>" and attach a csv with the rows in the format:
  `"date(long form if using excel),time(like 1pm, 2:30am, etc), subject, (optional)second time,(optional)second content`
