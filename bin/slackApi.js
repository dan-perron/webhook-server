const {getBotMessage, getCurrentDate, teams, getHighlightsIfMatched} = require('./ootpFileManager');
const {app, channelToTeam, highlightsChannel} = require('../clients/slack');
const {chat} = require('../clients/openai');

app.message(/.*who.?se? turn is it.*/i, async ({message, say}) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Msg recd! channel ' + message.channel);
  if (message.text.includes('<@UVBBEEC4A>')) {
    return;
  }
  if (message.channel === highlightsChannel) {
    await say(await getBotMessage());
  }
});

app.message(/highlights please/i, async ({message, say}) => {
  console.log('⚡️ Highlight msg! channel ' + message.channel);
  let teamFilter;
  let dateFiler;
  let currentDate = await getCurrentDate();
  if (message.channel === highlightsChannel) {
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
  if (event.channel === highlightsChannel) {
    let turnInfo = await getBotMessage();
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

    // TODO: Should we get rid of this?
    //let message = event.text.replace('<@UVBBEEC4A>', '');
    //input.push({role: 'user', name: event.user, content: message});
    let text = await chat({turnInfo, input});
    await say({text, thread_ts: event.thread_ts || event.ts});
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
