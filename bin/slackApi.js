const {getBotMessage, getCurrentDate, teams, getHighlightsIfMatched, getPowerRankings} = require('./ootpFileManager');
const {app, channelToTeam, channelMap} = require('../clients/slack');
const openai = require('../clients/openai');
const fantasy = require('../clients/fantasy');
const mongo = require('../clients/mongo');

app.message(/.*who.?se? turn is it.*/i, async ({message, say}) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Msg recd! channel ' + message.channel);
  if (message.text.includes('<@UVBBEEC4A>')) {
    return;
  }
  if (message.channel === channelMap.ootpHighlights) {
    await say(await getBotMessage());
  }
});

app.message(/highlights please/i, async ({message, say}) => {
  console.log('⚡️ Highlight msg! channel ' + message.channel);
  let teamFilter;
  let dateFiler;
  let currentDate = await getCurrentDate();
  if (message.channel === channelMap.ootpHighlights) {
    teamFilter = teams;
    dateFiler = currentDate.subtract(1, 'days');
  }
  if (Object.keys(channelToTeam).includes(message.channel)) {
    teamFilter = channelToTeam[message.channel];
    dateFiler = currentDate.subtract(7, 'days');
  }
  let highlights = await getHighlightsIfMatched(teamFilter, dateFiler);
  highlights.map((highlight) => say(highlight));
});

async function getText(channel, input, reminders) {
  switch (channel) {
    case channelMap.cabin:
      return openai.cabinChat({input});
    case channelMap.ootpHighlights:
      let [turnInfo, powerRankings] = await Promise.all([getBotMessage(), getPowerRankings()]);
      return openai.ootpChat({turnInfo, input, powerRankings, reminders});
    case channelMap.specialist:
      return openai.specialistChat({input});
    case channelMap.politics:
      return openai.politicsChat({input});
    case channelMap.sports:
      let data = await fantasy.getLeagueData();
      if (input[0].content.includes('generate power rankings')) {
        return openai.generatePowerRankings({input, data});
      }
      return openai.sportsChat({input, data});
    case channelMap.test:
      // Allow a user in the text channel to specify a different channel to interpret this as.
      let lines = input[0].content.split('\n');
      let channel = lines.shift();
      if (Object.values(channelMap).includes(channel)) {
        // Put the content back without the channel for consistent processing.
        input[0].content = lines.join('\n');
        return getText(channel, input, reminders);
      }
      return openai.testChat({input, reminders});
    default:
      return openai.genericChat({input, reminders});
  }
}

app.event('app_mention', async ({event, say}) => {
  console.log('⚡️ Mention recd! channel ' + event.channel);

  let input = [];
  let {messages} = await app.client.conversations.replies(
      {channel: event.channel, ts: event.thread_ts || event.ts});
  for (let message of messages) {
    input.push({
      role: message.user === 'UVBBEEC4A' ? 'assistant' : 'user',
      name: message.user,
      content: message.text,
    });
  }
  let reminders = await mongo.getReminders({type: event.channel});
  let text = await getText(event.channel, input, reminders);
  if (event.message.text.includes('remind')) {
    // TODO: How can we drop the await here / move it to the end of the function without
    // making the code ugly?
    await mongo.insertReminder(event.channel, {text: event.message.text, user: event.message.user});
  }
  return await say({text, thread_ts: event.thread_ts || event.ts});
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
