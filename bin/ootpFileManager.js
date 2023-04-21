const cheerio = require('cheerio');
const chokidar = require('chokidar');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/isSameOrAfter'));
const {watchFile} = require('node:fs');
const {readFile, readdir} = require('node:fs/promises');
const {stat} = require('node:fs/promises');
const {IncomingWebhook} = require('@slack/webhook');
const config = require('config');
const SlackWebhook = new IncomingWebhook(config.get('slack.webhookUrls.ootp'));

const {messageHighlights} = require('../clients/slack');

const teamToSlackMap = {
  'team_7': 'U6BEBDULB', 'team_11': 'U6KNBPYLE', 'team_13': 'U6CACS3GW', 'team_20': 'U6AT12XSM',
};

const fileToSlackMap = Object.fromEntries(Object.entries(teamToSlackMap).map(([k, v]) => [`${k}.ootp`, v]));
const perronSlack = 'U6AT12XSM';
const teams = [
  'Cincinnati Reds', 'Kansas City Royals', 'Miami Marlins', 'Oakland Athletics'];
const injuryFileToSlackMap = Object.fromEntries(
    Object.entries(teamToSlackMap).map(([k, v]) => [`/ootp/game/reports/html/teams/${k}_injuries.html`, v]));

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';
const pathToBoxScores = '/ootp/game/reports/html/box_scores/';
const pathToHomePage = '/ootp/game/reports/html/leagues/league_202_home.html';
const pathToPowerRankings = '/ootp/game/reports/html/leagues/league_202_team_power_rankings_page.html';

async function getCurrentDate() {
  const file = await readFile(pathToHomePage);
  const cheer = cheerio.load(file);
  return dayjs(cheer('div[style="text-align:center; color:#FFFFFF; padding-top:4px;"]').text());
}

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

function matchTeamFilter(title, teamFilter) {
  if (!teamFilter) {
    return true;
  }
  if (Array.isArray(teamFilter)) {
    for (let team of teams) {
      if (title.includes(team)) {
        return true;
      }
    }
  }
  return title.includes(teamFilter);
}

function matchDateFilter(date, dateFilter) {
  if (!dateFilter) {
    return true;
  }
  return date.isSameOrAfter(dateFilter);
}

async function getHighlightIfMatched(path, teamFilter, dateFilter) {
  const file = await readFile(path);
  const cheer = cheerio.load(file);
  const title = cheer('title').html();
  if (!matchTeamFilter(title, teamFilter)) {
    return null;
  }
  const date = dayjs(cheer('div[style="text-align:center; color:#FFFFFF; padding-top:4px;"]').text());
  if (!matchDateFilter(date, dateFilter)) {
    return null;
  }
  const heading = cheer('td.boxtitle[style="padding:0px 4px 2px 4px;"]').text().trim();
  const body = cheer('td.databg.datacolor[style="padding:1px 4px 2px 4px;"]').text().trim();
  const url = path.replace('/ootp/game/reports/html', 'https://djperron.com/ootp');
  let message = {text: title, blocks: []};
  if (heading) {
    message.blocks.push({
      'type': 'header', 'text': {
        'type': 'plain_text', 'text': heading,
      },
    });
  }
  message.blocks.push({
    'type': 'section', 'text': {
      'type': 'mrkdwn', 'text': `<${url}|${title}>`,
    },
  });
  if (body) {
    message.blocks.push({
      'type': 'section', 'text': {
        'type': 'plain_text', 'text': body,
      },
    });
  }
  return message;
}

async function sendHighlights(path) {
  console.error('triggered on ' + path);
  const highlight = await getHighlightIfMatched(path, teams);
  console.error(JSON.stringify(highlight, null, 2));
  if (highlight) {
    await messageHighlights(highlight);
  }
}

async function getHighlightsIfMatched(teamFilter, dateFilter) {
  let files = await readdir(pathToBoxScores);
  let highlightPromises = files.map(
      async (f) => await getHighlightIfMatched(pathToBoxScores + f, teamFilter, dateFilter));
  return (await Promise.all(highlightPromises)).filter((h) => h);
}

chokidar.watch(
    pathToBoxScores,
    {
      ignoreInitial: true,
      usePolling: true,
      interval: 1000, // Poll every second rather than 100 ms.
    }).
    on('add', sendHighlights).
    on('change', sendHighlights);

// for (const file in injuryFileToSlackMap) {
//   chokidar.watch(file, {ignoreInitial: true}).on('change', async (path) => {
//     const file = await readFile(path);
//     const cheer = cheerio.load(file);
//     const date = dayjs(cheer('div[style="text-align:center; color:#FFFFFF; padding-top:4px;"]').text());
//     const
//   });
// }

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
    return `<@${perronSlack}> needs to sim.`;
  }
  return 'Waiting on ' + oldFiles.map((oldFile) => `<@${fileToSlackMap[oldFile]}>`).join(', ');
}

async function getBotMessage() {
  let oldFiles = await checkFiles({});
  return getNextStepMessage(oldFiles);
}

async function getPowerRankings() {
  const file = await readFile(pathToPowerRankings);
  const cheer = cheerio.load(file);
  // This is ugly -- replaces the </th>\n with </td> but it seems to work.
  return cheer(cheer('table[class="data sortable"]').html().replace(/<[/]t[dh]>\n/g, '</td>')).text();
}

module.exports = {getBotMessage, getCurrentDate, getHighlightsIfMatched, getPowerRankings, teams};
