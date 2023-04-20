const {App} = require('@slack/bolt');
const config = require('config');
const {getBotMessage, getCurrentDate, teams, getHighlightsIfMatched} = require('./ootpFileManager');

const app = new App({
  token: config.get('slack.token'),
  signingSecret: config.get('slack.signingSecret'),
  socketMode: true,
  appToken: config.get('slack.appToken'),
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  // port: process.env.PORT || 3000
});

const highlightsChannel = 'C04J9TWRNJ3';

app.message(/.*who.?se? turn is it.*/i, async ({message, say}) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Msg recd! channel ' + message.channel);
  if (message.channel === highlightsChannel) {
    await say(await getBotMessage());
  }
});

const channelToTeam = {
  'C04NS45UKEX': 'Cincinnati Reds',
  'C04NS44S6QK': 'Kansas City Royals',
  'C04P4SB6LSD': 'Miami Marlins',
  'C04NKK6CAKY': 'Oakland Athletics',
};

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
  if (event.channel === 'C04J9TWRNJ3') {
    await say(await getBotMessage());
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();

// testChannel - CUYGZ6LLU
// ootp highlights - C04J9TWRNJ3
