const { App } = require('@slack/bolt');
const config = require('config');
const {getBotMessage} = require('./ootpFileManager');

const app = new App({
  token: config.get('slack.token'),
  signingSecret: config.get('slack.signingSecret'),
  socketMode: true,
  appToken: config.get('slack.appToken'),
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  // port: process.env.PORT || 3000
});

app.message(/.*who[']?s turn is it[?]?.*/i, async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Msg recd! channel ' + message.channel);
  await say(await getBotMessage());
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();

app.event('app_mention', async ({ event, say }) => {
  console.log('⚡️ Mention recd! channel ' + event.channel);
  await say(await getBotMessage());
});
