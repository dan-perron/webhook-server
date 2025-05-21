import { watchFile } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import util from 'node:util';
import * as cheerio from 'cheerio';
import child_process from 'child_process';
import { checkAndRunSimulation } from './simulationScheduler.js';
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
    const allTeamsSubmitted = await haveAllTeamsSubmitted(oldFiles);
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

watchFile(pathToLeagueFile, async () => {
  const lastSim = await mongo.getLastOOTPSim();
  let sim = new mongo.OOTPSim(new Date());
  console.log(`league file changed new date ${sim.date}`);
  if (lastSim && sim.date.valueOf() - lastSim.date.valueOf() < 60 * 1000) {
    // Don't message if we've had a new file in the last 60 seconds.
    return;
  }
  sim = await mongo.recordOOTPSim(sim);

  // Remove the league file pause immediately
  await resumeSimulationPause('system_league_file');

  const playersString = Object.values(fileToSlackMap)
    .map((s) => `<@${s}>`)
    .join(', ');
  await mongo.markRemindersDone({ type: channelMap.ootpHighlights });
  try {
    const leagueFileStat = await stat(pathToLeagueFile);
    await sendOotpMessage(
      `New ${humanFileSize(leagueFileStat.size)} league file uploaded <@${perronSlack}>`
    );
    sim.fileSize = leagueFileStat.size;
    await mongo.updateOOTPSim(sim);
  } catch (e) {
    console.log('watchLeague - Error occurred in stat file');
    console.log(e);
    sim.error = e.toString();
    await mongo.updateOOTPSim(sim);
    return;
  }
  console.log('watchLeague - Uploading league file to s3');
  let retry = 0;
  while (retry < 2) {
    try {
      await s3.putFile(pathToLeagueFile);
      await sendOotpMessage(`League file uploaded to S3 ${playersString}`);
      return;
    } catch (e) {
      console.log('watchLeague - Error occurred in sending to s3');
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
    const systemPauses = state.filter((pause) =>
      pause.userId.startsWith('system_')
    );
    if (systemPauses.length === 0) {
      await mongo.updateSimulationRunState({
        status: 'completed',
        completedAt: new Date(),
      });
      await mongo.createScheduledSimulationRunState({
        scheduledFor: new Date(new Date().getTime() + 48 * 60 * 60 * 1000),
      });
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

async function checkFiles(prev = null): Promise<string[]> {
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

export async function getWaitingTeamsMessage(): Promise<string> {
  const oldFiles = await checkFiles();
  if (await haveAllTeamsSubmitted(oldFiles)) {
    return '';
  }
  return oldFiles.map((oldFile) => `<@${fileToSlackMap[oldFile]}>`).join(', ');
}

async function getNextStepMessage(oldFiles) {
  if (await haveAllTeamsSubmitted(oldFiles)) {
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
  return `Waiting on ${await getWaitingTeamsMessage()}`;
}

export async function getBotMessage(): Promise<string> {
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

export async function haveAllTeamsSubmitted(
  oldFiles: string[]
): Promise<boolean> {
  if (!oldFiles) {
    oldFiles = await checkFiles();
  }
  return oldFiles.length === 0;
}
