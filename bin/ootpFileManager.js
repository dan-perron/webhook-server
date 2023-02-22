const cheerio = require('cheerio');
const chokidar = require('chokidar');
const {watchFile} = require('node:fs');
const {readFile} = require('node:fs/promises');
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
const teams = ['Cincinnati Reds', 'Kansas City Royals', 'Miami Marlins', 'Oakland Athletics'];

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';
const pathToBoxScores = '/ootp/game/reports/html/box_scores/';

for (const file in fileToSlackMap) {
  watchFile(pathToTeamUploads + file, async (curr, prev) => {
    let oldFiles = await checkFiles({prev});
    let text = `<@${fileToSlackMap[file]}> just submitted their team's upload.`;
    let nextStepText = getNextStepMessage(oldFiles);
    if (nextStepText) {
      text += ' ' + nextStepText;
    }
    await SlackWebhook.send({text});
  });
}

watchFile(pathToLeagueFile, () => {
  let playersString = Object.values(fileToSlackMap).map((s) => `<@${s}>`).join(', ');
  SlackWebhook.send({text: `New league file uploaded ${playersString}`});
});

chokidar.watch(pathToBoxScores, {ignoreInitial: true}).on('add', async (path) => {
  const file = await readFile(path);
  const cheer = cheerio.load(file);
  const title = cheer('title').html();
  for (let team of teams) {
    if (title.includes(team)) {
      const heading = cheer('td.boxtitle[style="padding:0px 4px 2px 4px;"]').text().trim();
      const body = cheer('td.databg.datacolor[style="padding:1px 4px 2px 4px;"]').text().trim();
      const url = path.replace('/ootp/game/reports/html', 'djperron.com/ootp');
      SlackWebhook.send({
        blocks: [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": heading
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `<${url}|${title}>`
            }
          },
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": body
            }
          }
        ]
      });
      return;
    }
  }
});

async function checkFiles({prev}) {
  let fileToStatPromises = {};
  for (const file in fileToSlackMap) {
    fileToStatPromises[file] = stat(pathToTeamUploads + file);
  }
  let leagueFileStat = await stat(pathToLeagueFile);
  if (prev && leagueFileStat.mtimeMs < prev.mtimeMs) {
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

function getNextStepMessage(oldFiles) {
  if (!oldFiles) {
    return;
  }
  if (oldFiles.length === 0) {
    return `<@${perronSlack}> time to sim.`;
  }
  return 'Waiting on ' +
      oldFiles.map((oldFile) => `<@${fileToSlackMap[oldFile]}>`).join(', ');
}

async function getBotMessage() {
  let oldFiles = await checkFiles({});
  return getNextStepMessage(oldFiles);
}

module.exports = {getBotMessage};
