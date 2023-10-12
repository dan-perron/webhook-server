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

const {messageHighlights, messageSummary} = require('../clients/slack');
const {ootpChat} = require('../clients/openai');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

const teamToSlackMap = {
  'team_7': 'U6BEBDULB', 'team_11': 'U6KNBPYLE', 'team_13': 'U6CACS3GW', 'team_20': 'U6AT12XSM', 'team_27': 'U060JASDCMC',
};

const fileToSlackMap = Object.fromEntries(Object.entries(teamToSlackMap).map(([k, v]) => [`${k}.ootp`, v]));
const perronSlack = 'U6AT12XSM';
const teams = [
  'Cincinnati Reds', 'Kansas City Royals', 'Miami Marlins', 'Oakland Athletics'];
const injuryFileToSlackMap = Object.fromEntries(
    Object.entries(teamToSlackMap).map(([k, v]) => [`/ootp/game/reports/html/teams/${k}_injuries.html`, v]));

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';
const pathToReportsArchive = '/ootp/game/reports/reports.tar.gz';
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

let lastMessage = 0;

watchFile(pathToLeagueFile, () => {
  const now = new Date();
  if (now - lastMessage < 60 * 1000) {
    // Don't message if we've had a new file in the last 60 seconds.
    return;
  }
  lastMessage = now;
  let playersString = Object.values(fileToSlackMap).map((s) => `<@${s}>`).join(', ');
  SlackWebhook.send({text: `New league file uploaded ${playersString}`});
});

let archiveFileTimer;
let executing = false;

async function expandArchive(prevStat) {
  let newStat;
  try {
    newStat = await stat(pathToReportsArchive);
  } catch (e) {
    // File probably got deleted.
    console.log('no file');
    return;
  }
  if (newStat.mtimeMs !== prevStat.mtimeMs) {
    console.log('file changed, not executing');
    archiveFileTimer = setTimeout(() => expandArchive(newStat), 60*1000);
    return;
  }
  executing = true;
  try {
    console.log('expanding archive');
    await exec(
        'tar -xf /ootp/game/reports/reports.tar.gz -C /ootp/game/reports/ news/html --strip-components=1 -m --no-overwrite-dir && rm /ootp/game/reports/reports.tar.gz')
  } catch (e) {
    console.log('error while executing ' + e.toString());
  }
  executing = false;
}

watchFile(pathToReportsArchive, (curr) => {
  if (executing) {
    // Ignore file updates while executing.
    return;
  }
  if (archiveFileTimer) {
    console.log('watch fired, cancelling timer');
    clearTimeout(archiveFileTimer);
  }
  archiveFileTimer = setTimeout(() => expandArchive(curr), 60 * 1000);
})

function matchTeamFilter(title, teamFilter) {
  let matchedTeams = [];
  if (!teamFilter) {
    return matchedTeams;
  }
  if (Array.isArray(teamFilter)) {
    for (let team of teams) {
      if (title.includes(team)) {
        matchedTeams.push(team);
      }
    }
  } else {
    if (title.includes(teamFilter)) {
      matchedTeams.push(teamFilter);
    }
  }
  return matchedTeams;
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
  const matchedTeams = matchTeamFilter(title, teamFilter);
  if (!teamFilter || matchedTeams.length === 0) {
    return null;
  }
  const date = dayjs(cheer('div[style="text-align:center; color:#FFFFFF; padding-top:4px;"]').text());
  if (!matchDateFilter(date, dateFilter)) {
    return null;
  }
  const heading = cheer('td.boxtitle[style="padding:0px 4px 2px 4px;"]').text().trim();
  const body = cheer('td.databg.datacolor[style="padding:1px 4px 2px 4px;"]').text().trim();
  const url = path.replace('/ootp/game/reports/html', 'https://djperron.com/ootp');
  return {title, url,heading, body, matchedTeams};
}

let storedMessages = {};

async function summarizeTeam(team) {
  let input = [];
  /*for (let highlight of storedMessages.team) {
    input.push({
      role: 'user',
      name: 'ootp system',
      content: [highlight.heading, highlight.title, highlight.body].join('\n\n'),
    });
  }
  input.push({
    role: 'user'
    name: '',
    content: 'Summarize how this period of games went given these game reports.'
  })*/
  let content = ''
  for (let highlight of storedMessages[team]) {
    content += highlight.heading + '\n';
    content += highlight.title + '\n';
    content += highlight.body + '\n\n';
  }
  storedMessages[team] = null;
  content += 'Summarize these game reports to tell how this series of games went.';
  input.push({
    role: 'user',
    name: 'ootp_system',
    content,
  });
  let [turnInfo, powerRankings] = await Promise.all([getBotMessage(), getPowerRankings()]);
  let summary = await ootpChat({input, turnInfo, powerRankings});

  return messageSummary({content: summary});
}

async function sendHighlights(path, stats) {
  console.error('triggered on ' + path);
  if (Date.now() - stats.ctimeMs > 5 * 60 * 1000) {
    console.error(`${path} is older than 5 min ctime ${stats.ctime} now ${Date.now()}`);
    return;
  }
  const highlight = await getHighlightIfMatched(path, teams);
  console.error(JSON.stringify(highlight, null, 2));
  if (highlight) {
    // await messageHighlights(highlight);
    for (let team of highlight.matchedTeams) {
      if (storedMessages[team]) {
        storedMessages[team].push(highlight);
      } else {
        storedMessages[team] = [highlight];
        setTimeout(() => summarizeTeam(team), 60*1000);
      }
    }
  }
}

async function getHighlightsIfMatched(teamFilter, dateFilter) {
  let files = await readdir(pathToBoxScores);
  let highlightPromises = files.map(
      async (f) => await getHighlightIfMatched(pathToBoxScores + f, teamFilter, dateFilter));
  return (await Promise.all(highlightPromises)).filter((h) => h);
}

// chokidar.watch(
//     pathToBoxScores,
//     {
//       ignoreInitial: true,
//       usePolling: true,
//       interval: 1000, // Poll every second rather than 100 ms.
//     }).
//     on('add', sendHighlights).
//     on('change', sendHighlights);

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
