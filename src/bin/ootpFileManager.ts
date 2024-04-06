import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';

dayjs.extend(isSameOrAfter);
import { watchFile } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { IncomingWebhook } from '@slack/webhook';
import config from 'config';

const SlackWebhook = new IncomingWebhook(config.get('slack.webhookUrls.ootp'));

import { channelMap } from '../clients/slack.js';
import * as mongo from '../clients/mongo.js';
import util from 'node:util';
import child_process from 'child_process';
import * as openai from '../clients/ai/openai.js';

const exec = util.promisify(child_process.exec);

const teamToSlackMap = {
  team_7: 'U6BEBDULB',
  team_9: 'U6DCHN9K2',
  team_11: 'U6KNBPYLE',
  team_13: 'U6CACS3GW',
  team_20: 'U6AT12XSM',
  team_27: 'U060JASDCMC',
};

const fileToSlackMap = Object.fromEntries(
  Object.entries(teamToSlackMap).map(([k, v]) => [`${k}.ootp`, v]),
);
const perronSlack = 'U6AT12XSM';
export const teams = [
  'Cincinnati Reds',
  'Kansas City Royals',
  'Miami Marlins',
  'Oakland Athletics',
];

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';
const pathToReportsArchive = '/ootp/game/reports/reports.tar.gz';
const pathToPowerRankings =
  '/ootp/game/reports/html/leagues/league_202_team_power_rankings_page.html';

for (const file in fileToSlackMap) {
  watchFile(pathToTeamUploads + file, async (curr, prev) => {
    const oldFiles = await checkFiles(prev);
    let text = `<@${fileToSlackMap[file]}> just submitted their team's upload.`;
    const nextStepText = await getNextStepMessage(oldFiles);
    if (nextStepText) {
      text += ' ' + nextStepText;
    }
    await SlackWebhook.send({ text });
  });
}

let lastMessage = new Date(0);

function humanFileSize(size: number): string {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return Number((size / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

watchFile(pathToLeagueFile, async () => {
  const now = new Date();
  if (now.valueOf() - lastMessage.valueOf() < 60 * 1000) {
    // Don't message if we've had a new file in the last 60 seconds.
    return;
  }
  lastMessage = now;
  const playersString = Object.values(fileToSlackMap)
    .map((s) => `<@${s}>`)
    .join(', ');
  await mongo.markRemindersDone({ type: channelMap.ootpHighlights });
  const leagueFileStat = await stat(pathToLeagueFile);
  await SlackWebhook.send({ text: `New ${humanFileSize(leagueFileStat.size)} league file uploaded ${playersString}` });
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
      'nice tar -xf /ootp/game/reports/reports.tar.gz -C /ootp/game/reports/ news/html --strip-components=1 -m --no-overwrite-dir && rm /ootp/game/reports/reports.tar.gz',
    );
    await SlackWebhook.send({ text: 'Reports are updated.' });
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

async function checkFiles(prev = null) {
  const fileToStatPromises = {};
  for (const file in fileToSlackMap) {
    fileToStatPromises[file] = stat(pathToTeamUploads + file);
  }
  const leagueFileStat = await stat(pathToLeagueFile);
  if (prev && leagueFileStat.mtimeMs < prev.mtimeMs) {
    return;
  }
  const oldFiles = [];
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
    const reminders = await mongo.getRemindersAsText({
      type: channelMap.ootpHighlights,
    });
    if (reminders !== '') {
      message += `

Reminders: 
${JSON.stringify(reminders, null, 2)}`;
    }
    return message;
  }
  return (
    'Waiting on ' +
    oldFiles.map((oldFile) => `<@${fileToSlackMap[oldFile]}>`).join(', ')
  );
}

export async function getBotMessage() {
  const oldFiles = await checkFiles();
  return await getNextStepMessage(oldFiles);
}

export async function getPowerRankings() {
  const file = await readFile(pathToPowerRankings);
  const cheer = cheerio.load(file);
  // This is ugly -- replaces the </th>\n with </td> but it seems to work.
  return cheer(
    cheer('table[class="data sortable"]')
      .html()
      .replace(/<[/]t[dh]>\n/g, '</td>'),
  ).text();
}
