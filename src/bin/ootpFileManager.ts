import { IncomingWebhook } from '@slack/webhook';
import axios from 'axios';
import * as cheerio from 'cheerio';
import child_process from 'child_process';
import config from 'config';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import { watchFile } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import util from 'node:util';
import { checkPausesRemoved, checkAndRunSimulation } from './simulationScheduler.js';
import { resumeSimulationPause } from '../utils/simulation.js';
import * as mongo from '../clients/mongo.js';
import * as s3 from '../clients/s3.js';
import { channelMap } from '../clients/slack.js';
import { teamToSlackMap } from '../consts/slack.js';
import { sendOotpMessage } from '../utils/slack.js';

const exec = util.promisify(child_process.exec);

const fileToSlackMap = Object.fromEntries(
  Object.entries(teamToSlackMap).map(([k, v]) => [`${k}.ootp`, v])
);
const perronSlack = 'U6AT12XSM';
export const teams = [
  'Cincinnati Reds',
  'Kansas City Royals',
  'Miami Marlins',
  'Oakland Athletics',
  'Colorado Rockies',
  'Tampa Bay Rays',
  'Milwaukee Brewers',
];

const pathToTeamUploads = '/ootp/game/team_uploads/';
const pathToLeagueFile = '/ootp/game/league_file/cheeseburger_2023.zip';
const pathToReportsArchive = '/ootp/game/reports/reports.tar.gz';
const pathToPowerRankings =
  '/ootp/game/reports/html/leagues/league_202_team_power_rankings_page.html';
const pathToTeamReports = '/ootp/game/reports/html/teams/';

let lastLeagueFileUpdate: Date | null = null;
let lastArchiveUpdate: Date | null = null;

async function checkAndResumeSystemPause() {
  if (lastLeagueFileUpdate && lastArchiveUpdate) {
    // If both files were updated within 5 minutes of each other, resume the system pause
    const timeDiff = Math.abs(lastLeagueFileUpdate.getTime() - lastArchiveUpdate.getTime());
    if (timeDiff < 5 * 60 * 1000) { // 5 minutes in milliseconds
      await mongo.resumeSimulationPause('system');
      console.log('System pause resumed after files were updated');
    }
  }
}

for (const file in fileToSlackMap) {
  watchFile(pathToTeamUploads + file, async (curr, prev) => {
    const oldFiles = await checkFiles(prev);
    let text = `<@${fileToSlackMap[file]}> just submitted their team's upload.`;
    
    // Reset the user's pause if they have one
    const resumed = await mongo.resumeSimulationPause(fileToSlackMap[file]);
    if (resumed) {
      text += ' Their simulation pause has been automatically removed.';
    }
    
    const nextStepText = await getNextStepMessage(oldFiles);
    if (nextStepText) {
      text += ' ' + nextStepText;
    }
    await sendOotpMessage(text);

    // Check if all teams have submitted and run simulation if they have
    const allTeamsSubmitted = await haveAllTeamsSubmitted();
    if (allTeamsSubmitted) {
      await checkAndRunSimulation();
    }
  });
}
for (const team in teamToSlackMap) {
  watchFile(pathToTeamReports + team + '_roster_page.html', async () => {
    const buffer = await readFile(
      pathToTeamReports + team + '_roster_page.html'
    );
    if (buffer.includes('DESIGNATED FOR ASSIGNMENT')) {
      const text = `<@${teamToSlackMap[team]}> has players on DFA.`;
      await sendOotpMessage(text);
    }
  });
}

function humanFileSize(size: number): string {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (
    Number((size / Math.pow(1024, i)).toFixed(2)) +
    ' ' +
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  );
}

async function postSummary(client, lastMessage) {
  let messages = [];
  let cursor = undefined;

  while (true) {
    const result = await client.conversations.history({
      channel: channelMap.ootpLog,
      oldest: lastMessage,
      latest: Date.now(),
      limit: 200,
      cursor: cursor
    });
    if (!result.ok) {
      console.log('error', result);
      break;
    }
    messages = messages.concat(result.messages.map((message) => {
      return {
        ts: message.ts,
        user: message.user,
        text: message.text.slice(0, 4*1024) // truncate large messages
      };
    }));
    if (!result.has_more) {
      break;
    }
    cursor = result.response_metadata.next_cursor;
  }
  const summary = await axios.post('https://ootp.bedaire.com/summary', {
    messages,
  });
  await sendOotpMessage(summary.data.text);
}

watchFile(pathToLeagueFile, async () => {
  const lastSim = await mongo.getLastOOTPSim();
  let sim = new mongo.OOTPSim(new Date());
  console.log(`league file changed new date ${sim.date}`);
  if (lastSim && sim.date.valueOf() - lastSim.date.valueOf() < 60 * 1000) {
    // Don't message if we've had a new file in the last 60 seconds.
    return;
  }
  sim = await mongo.recordOOTPSim(sim);
  // Truncate history to last 24 hours at the most.
  const lastTimestamp = lastSim?.date?.valueOf() ?? sim.date.valueOf() - 24*60*60*1000;
  
  // Remove the league file pause immediately
  await resumeSimulationPause('system_league_file');

  const playersString = Object.values(fileToSlackMap)
    .map((s) => `<@${s}>`)
    .join(', ');
  await mongo.markRemindersDone({ type: channelMap.ootpHighlights });
  try {
    const leagueFileStat = await stat(pathToLeagueFile);
    await sendOotpMessage(`New ${humanFileSize(leagueFileStat.size)} league file uploaded <@${perronSlack}>`);
    sim.fileSize = leagueFileStat.size;
    await mongo.updateOOTPSim(sim);
  } catch (e) {
    console.log("watchLeague - Error occurred in stat file")
    console.log(e);
    sim.error = e.toString();
    await mongo.updateOOTPSim(sim);
    return;
  }
  console.log("watchLeague - Uploading league file to s3")
  let retry = 0;
  while (retry < 2) {
    try {
      await s3.putFile(pathToLeagueFile);
      await sendOotpMessage(`League file uploaded to S3 ${playersString}`);
      return;
    } catch (e) {
      console.log("watchLeague - Error occurred in sending to s3");
      console.log(e);
    }
    retry++;
  }
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
    // Remove the archive file pause immediately
    await resumeSimulationPause('system_archive_file');

    console.log('expanding archive');
    await exec(
      'nice tar -xf /ootp/game/reports/reports.tar.gz -C /ootp/game/reports/ news/html --strip-components=1 -m --no-overwrite-dir && rm /ootp/game/reports/reports.tar.gz'
    );
    await sendOotpMessage('Reports are updated.');

    // Check if both system pauses are removed and mark simulation as completed
    const state = await mongo.getSimulationState();
    const systemPauses = state.filter(pause => pause.userId.startsWith('system_'));
    if (systemPauses.length === 0) {
      const runState = await mongo.getSimulationRunState();
      if (runState && runState.status === 'scheduled') {
        await mongo.updateSimulationRunState({
          ...runState,
          status: 'completed',
          completedAt: new Date()
        });
      }
    }
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
      .replace(/<[/]t[dh]>\n/g, '</td>')
  ).text();
}

export async function haveAllTeamsSubmitted(): Promise<boolean> {
  try {
    const fileToStatPromises = {};
    for (const team of teams) {
      fileToStatPromises[team] = stat(pathToTeamUploads + team + '.ootp');
    }
    
    // Wait for all stats to complete
    await Promise.all(Object.values(fileToStatPromises));
    return true;
  } catch (error) {
    // If any file is missing, return false
    return false;
  }
}
