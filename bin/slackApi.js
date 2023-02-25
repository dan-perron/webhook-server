const { App } = require('@slack/bolt');
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

app.message(/.*who.?s turn is it.*/i, async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Msg recd! channel ' + message.channel);
  if (message.channel === highlightsChannel) {
    await say(await getBotMessage());
  }
});

const channelToTeam = {
  'Cincinnati Reds':'C04NS45UKEX',
  'Kansas City Royals':'C04NS44S6QK',
  'Miami Marlins':'C04P4SB6LSD',
  'Oakland Athletics':'C04NKK6CAKY',
}

app.message(/highlights please/i, async ({message, say}) => {
  let teamFilter;
  let dateFiler;
  if (message.channel === highlightsChannel) {
    teamFilter = teams;
    dateFiler = getCurrentDate().subtract(1, 'days');
  }
  getHighlightsIfMatched(teamFilter, dateFiler).map((highlight) => say(highlight));
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();

app.event('app_mention', async ({ event, say }) => {
  console.log('⚡️ Mention recd! channel ' + event.channel);
  if (event.channel === 'C04J9TWRNJ3') {
    await say(await getBotMessage());
  }
});

// testChannel - CUYGZ6LLU
// ootp highlights - C04J9TWRNJ3
