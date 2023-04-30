const {App} = require('@slack/bolt');
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

const channelMap = {
  ootpHighlights: 'C04J9TWRNJ3',
  politics: 'CPXA5CBHP',
  specialist: 'C6APJ5KG8',
  test: 'CUYGZ6LLU',
}

const channelToTeam = {
  'C04NS45UKEX': 'Cincinnati Reds',
  'C04NS44S6QK': 'Kansas City Royals',
  'C04P4SB6LSD': 'Miami Marlins',
  'C04NKK6CAKY': 'Oakland Athletics',
};

function messageHighlights(object) {
  object.channel = channelMap.ootpHighlights;
  return app.client.chat.postMessage(object);
}

module.exports = {app, channelToTeam, messageHighlights, channelMap};
