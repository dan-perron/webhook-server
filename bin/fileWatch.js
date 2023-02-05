const {watchFile} = require('node:fs');
const { IncomingWebhook } = require("@slack/webhook");
const config = require("config");
const SlackWebhook = new IncomingWebhook(
  config.get("slack.webhookUrls.ootp")
);

const fileToSlackMap = {
  'team_7.ootp': "U6BEBDULB",
  'team_11.ootp': "U6KNBPYLE",
  'team_13.ootp': "U6CACS3GW",
  'team_20.ootp': "U6AT12XSM",
};

const pathToTeamUploads = '/ootp/game/team_uploads/'

for (const file in fileToSlackMap) {
  watchFile(pathToTeamUploads + file, () => {
    SlackWebhook.send({text: `<@${fileToSlackMap[file]}> just submitted their team's upload.`})
  });
}