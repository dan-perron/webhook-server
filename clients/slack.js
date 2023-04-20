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

const highlightsChannel = 'C04J9TWRNJ3';

const channelToTeam = {
  'C04NS45UKEX': 'Cincinnati Reds',
  'C04NS44S6QK': 'Kansas City Royals',
  'C04P4SB6LSD': 'Miami Marlins',
  'C04NKK6CAKY': 'Oakland Athletics',
};

// testChannel - CUYGZ6LLU
// ootp highlights - C04J9TWRNJ3

function messageHighlights(object) {
  object.channel = highlightsChannel;
  return app.client.chat.postMessage(object);
}

module.exports = {app, channelToTeam, messageHighlights, highlightsChannel};
