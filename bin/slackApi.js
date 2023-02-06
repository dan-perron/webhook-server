const { App } = require('@slack/bolt');
const config = require('config');

const app = new App({
  token: config.get('slack.token'),
  signingSecret: config.get('slack.signingSecret'),
  socketMode: true,
  appToken: config.get('slack.appToken'),
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  // port: process.env.PORT || 3000
});

app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say(`Hey there <@${message.user}>!`);
});