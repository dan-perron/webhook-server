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

app.message('The Super Cluster', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Bolt recd!');
  await say(`Hey there <@${message.user}>!`);
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();

app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    await say({"blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Thanks for the mention <@${event.user}>! Here's a button`
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Button",
              "emoji": true
            },
            "value": "click_me_123",
            "action_id": "first_button"
          }
        }
      ]});
  }
  catch (error) {
    console.error(error);
  }
});
