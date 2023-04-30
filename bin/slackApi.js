const {getBotMessage, getCurrentDate, teams, getHighlightsIfMatched, getPowerRankings} = require('./ootpFileManager');
const {app, channelToTeam, channelMap} = require('../clients/slack');
const {genericChat, ootpChat, specialistChat, politicsChat, testChat} = require('../clients/openai');

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
  let text;
  if (event.channel === channelMap.ootpHighlights) {
    let [turnInfo, powerRankings] = await Promise.all([getBotMessage(), getPowerRankings()]);
    text = await ootpChat({turnInfo, input, powerRankings});
  } if (event.channel === channelMap.specialist) {
    text = await specialistChat({input});
  } if (event.channel === channelMap.politics) {
    text = await politicsChat({input});
  } if (event.channel === channelMap.test) {
    text = await testChat({input});
  } else {
    text = await genericChat({input});
  }
  return await say({text, thread_ts: event.thread_ts || event.ts});
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
