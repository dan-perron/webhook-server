import cheerio from 'cheerio';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
dayjs.extend(isSameOrAfter);
import {watchFile} from 'node:fs';
import {readFile, readdir, stat} from 'node:fs/promises';
import {IncomingWebhook} from '@slack/webhook';
import config from 'config';
const SlackWebhook = new IncomingWebhook(config.get('slack.webhookUrls.ootp'));

import {messageSummary, channelMap} from '../clients/slack.js';
import * as mongo from '../clients/mongo.js';
import {ootpChat} from '../clients/openai.js';
import util from 'node:util';
import child_process from "child_process";
import * as openai from "../clients/openai.js";
const exec = util.promisify(child_process.exec);

const teamToSlackMap = {
  'team_7': 'U6BEBDULB',
  'team_9': 'U6DCHN9K2',
  'team_11': 'U6KNBPYLE',
  'team_13': 'U6CACS3GW',
  'team_20': 'U6AT12XSM',
  'team_27': 'U060JASDCMC',
};

const fileToSlackMap = Object.fromEntries(Object.entries(teamToSlackMap).map(([k, v]) => [`${k}.ootp`, v]));
const perronSlack = 'U6AT12XSM';
export const teams = [
  'Cincinnati Reds', 'Kansas City Royals', 'Miami Marlins', 'Oakland Athletics'];

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';
const pathToReportsArchive = '/ootp/game/reports/reports.tar.gz';
const pathToBoxScores = '/ootp/game/reports/html/box_scores/';
const pathToHomePage = '/ootp/game/reports/html/leagues/league_202_home.html';
const pathToPowerRankings = '/ootp/game/reports/html/leagues/league_202_team_power_rankings_page.html';

export async function getCurrentDate() {
  const file = await readFile(pathToHomePage);
  const cheer = cheerio.load(file);
  return dayjs(cheer('div[style="text-align:center; color:#FFFFFF; padding-top:4px;"]').text());
}

for (const file in fileToSlackMap) {
  watchFile(pathToTeamUploads + file, async (curr, prev) => {
    let oldFiles = await checkFiles({prev});
    let text = `<@${fileToSlackMap[file]}> just submitted their team's upload.`;
    let nextStepText = await getNextStepMessage(oldFiles);
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
  mongo.markRemindersDone({type: channelMap.ootpHighlights})
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
    return;
  }
  if (newStat.mtimeMs !== prevStat.mtimeMs) {
    console.log('file changed, not executing');
    archiveFileTimer = setTimeout(() => expandArchive(newStat), 60 * 1000);
    return;
  }
  executing = true;
  try {
    console.log('expanding archive');
    await exec(
        'tar -xf /ootp/game/reports/reports.tar.gz -C /ootp/game/reports/ news/html --strip-components=1 -m --no-overwrite-dir && rm /ootp/game/reports/reports.tar.gz');
    await SlackWebhook.send({text: `Reports are updated.`});
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
});

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
  return {title, url, heading, body, matchedTeams};
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
  let content = '';
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

export async function getHighlightsIfMatched(teamFilter, dateFilter) {
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
    try {
      if ((await fileToStatPromises[file]).mtimeMs < leagueFileStat.mtimeMs) {
        oldFiles.push(file);
      }
    } catch {
      // If stat failed it's probably because the file doesn't exist, and we should consider it 'old'
      oldFiles.push(file);
    }
  }

  return oldFiles;
}

async function getNextStepMessage(oldFiles) {
  if (!oldFiles) {
    return;
  }
  if (oldFiles.length === 0) {
    let message = `<@${perronSlack}> needs to sim.`;
    let reminders = await mongo.getRemindersAsText({type: channelMap.ootpHighlights});
    if (reminders !== '') {
      let input = [{
        role: 'assistant',
        content: 'What are my reminders?',
      }];
      let text = await openai.ootpChat({input, reminders});
      message += `

Raw reminders: 
${JSON.stringify(reminders, null, 2)}

GPT'd reminders: 
${text}`;
    }
    return message;
  }
  return 'Waiting on ' + oldFiles.map((oldFile) => `<@${fileToSlackMap[oldFile]}>`).join(', ');
}

export async function getBotMessage() {
  let oldFiles = await checkFiles({});
  return await getNextStepMessage(oldFiles);
}

export async function getPowerRankings() {
  const file = await readFile(pathToPowerRankings);
  const cheer = cheerio.load(file);
  // This is ugly -- replaces the </th>\n with </td> but it seems to work.
  return cheer(cheer('table[class="data sortable"]').html().replace(/<[/]t[dh]>\n/g, '</td>')).text();
}
