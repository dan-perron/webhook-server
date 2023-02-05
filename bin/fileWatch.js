const {watchFile} = require('node:fs');
const {stat} = require('node:fs/promises');
const {IncomingWebhook} = require('@slack/webhook');
const config = require('config');
const SlackWebhook = new IncomingWebhook(
    config.get('slack.webhookUrls.ootp'),
);

const fileToSlackMap = {
  'team_7.ootp': 'U6BEBDULB',
  'team_11.ootp': 'U6KNBPYLE',
  'team_13.ootp': 'U6CACS3GW',
  'team_20.ootp': 'U6AT12XSM',
};
const perronSlack = 'U6AT12XSM';

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';

for (const file in fileToSlackMap) {
  watchFile(pathToTeamUploads + file, (curr, prev) => {
    checkFiles(curr, prev).then((oldFiles) => {
      let text = `<@${fileToSlackMap[file]}> just submitted their team's upload.`;
      if (!!oldFiles) {
        return text;
      }
      if (oldFiles.length === 0) {
        return text + ` <@${perronSlack}> time to sim.`;
      }
      return text + ' Waiting on ' +
          oldFiles.map((oldFile) => `<@${fileToSlackMap[oldFile]}>`).join(', ');
    }).then((text) => SlackWebhook.send({text}));
  });
}

async function checkFiles(curr, prev) {
  let fileToStatPromises = {};
  for (const file in fileToSlackMap) {
    fileToStatPromises[file] = stat(pathToTeamUploads + file);
  }
  let leagueFileStat = await stat(pathToLeagueFile);
  if (leagueFileStat.mtimeMs < prev.mtimeMs) {
    return;
  }
  let oldFiles = [];
  for (const file in fileToStatPromises) {
    if ((await fileToStatPromises[file]).mtimeMs < leagueFileStat.mtimeMs) {
      oldFiles.push(file);
    }
  }

  return oldFiles;
}