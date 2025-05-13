import type { GenericMessageEvent } from '@slack/bolt';
import { subtype } from '@slack/bolt';
import axios from 'axios';
import config from 'config';
import type { AIClient } from '../clients/ai/AIClient.js';
import { GoogleAI } from '../clients/ai/googleAI.js';
import { OpenAI } from '../clients/ai/openai.js';
import * as fantasy from '../clients/fantasy.js';
import * as mongo from '../clients/mongo.js';
import {
  app,
  channelMap,
  sendMessage,
  sendEphemeralMessage,
} from '../clients/slack.js';
import { isAuthorizedUser } from '../consts/slack.js';
import { getBotMessage, getPowerRankings, teams } from './ootpFileManager.js';
import {
  addSimulationPause,
  resumeSimulationPause,
  resumeAllSimulationPauses,
  getSimulationState,
  getSimulationRunState,
} from '../utils/simulation.js';
import dayjs from 'dayjs';
import { callSimulateEndpoint } from '../clients/windows-facilitator.js';

// Define the checkbox config interface
interface CommishCheckboxConfig {
  [key: string]: boolean | number | undefined;
  backup_league_files: boolean;
  retrieve_team_exports_from_server: boolean;
  retrieve_team_exports_from_your_pc: boolean;
  break_if_team_files_are_missing: boolean;
  break_if_trades_are_pending: boolean;
  demote_release_players_with_dfa_time_left_of_x_days_or_less: boolean;
  auto_play_days: boolean;
  create_and_upload_league_file: boolean;
  create_and_upload_html_reports: boolean;
  create_sql_dump_for_ms_access: boolean;
  create_sql_dump_for_mysql: boolean;
  export_data_to_csv_files: boolean;
  upload_status_report_to_server: boolean;
  create_and_send_result_emails: boolean;
  dfa_days_value?: number;
  auto_play_days_value?: number;
}

// Add slash command to control simulation
app.command('/supercluster', async ({ ack, body }) => {
  await ack();
  const text = body.text.trim().toLowerCase();

  console.log(`[Supercluster] Command received: ${text}`);

  if (!isAuthorizedUser(body.user_id)) {
    console.log(
      `[Supercluster] Unauthorized access attempt from user ${body.user_id}`
    );
    await sendEphemeralMessage(
      body.channel_id,
      body.user_id,
      "You don't have permission to control the simulation."
    );
    return;
  }

  const [action, ...args] = text.split(' ');
  console.log(
    `[Supercluster] Parsed command: action=${action}, args=${args.join(' ')}`
  );

  const options = {
    backupLeagueFolder: true,
    manualImportTeams: false,
    commishCheckboxes: {} as CommishCheckboxConfig,
    dryRun: false,
  };

  switch (action) {
    case 'simulate': {
      try {
        // Check if simulation is already paused
        const state = await getSimulationState();
        if (state.length > 0) {
          await sendMessage(
            body.channel_id,
            '❌ Simulation is already paused. Please resume it first.'
          );
          return;
        }

        // Check if there's already a simulation in progress
        const runState = await getSimulationRunState();
        if (runState && runState.status === 'scheduled') {
          await sendMessage(
            body.channel_id,
            '❌ A simulation is already in progress.'
          );
          return;
        }

        // Parse command arguments
        options.backupLeagueFolder = !args.includes('--no-backup');
        options.manualImportTeams = args.includes('--manual-import');
        options.dryRun = args.includes('--dry-run');

        // Add any additional commish checkbox options
        if (args.includes('--days')) {
          const daysIndex = args.indexOf('--days');
          if (daysIndex < args.length - 1) {
            const days = parseInt(args[daysIndex + 1], 10);
            if (!isNaN(days)) {
              options.commishCheckboxes.auto_play_days = true;
              options.commishCheckboxes.auto_play_days_value = days;
            }
          }
        }

        await sendMessage(body.channel_id, '🔄 Starting simulation...');

        await callSimulateEndpoint(options, false);

        await sendMessage(
          body.channel_id,
          '✅ Simulation started successfully!'
        );
      } catch (error) {
        console.error('Error in simulation command:', error);
        await sendMessage(
          body.channel_id,
          `❌ Error starting simulation: ${error.message}`
        );
      }
      break;
    }
    case 'pause':
      console.log(`[Supercluster] User ${body.user_id} pausing simulation`);
      await addSimulationPause(body.user_id);
      await sendMessage(
        body.channel_id,
        `<@${body.user_id}> Simulation paused. It will remain paused until you resume it.`
      );
      break;

    case 'resume': {
      const subAction = args[0];
      if (subAction === 'all') {
        console.log(
          `[Supercluster] User ${body.user_id} resuming all simulation pauses`
        );
        const count = await resumeAllSimulationPauses();
        await sendMessage(
          body.channel_id,
          `<@${body.user_id}> Resumed all simulation pauses (${count} total).`
        );
      } else {
        console.log(
          `[Supercluster] User ${body.user_id} attempting to resume their pause`
        );
        const resumed = await resumeSimulationPause(body.user_id);
        if (resumed) {
          console.log(
            `[Supercluster] Successfully resumed pause for user ${body.user_id}`
          );
          await sendMessage(
            body.channel_id,
            `<@${body.user_id}> Your simulation pause has been removed.`
          );
        } else {
          console.log(
            `[Supercluster] No active pause found for user ${body.user_id}`
          );
          await sendMessage(
            body.channel_id,
            `<@${body.user_id}> You don't have an active simulation pause.`
          );
        }
      }
      break;
    }
    case 'status': {
      console.log(
        `[Supercluster] User ${body.user_id} checking simulation status`
      );
      const state = await getSimulationState();
      const botStatus = await getBotMessage();
      const runState = await getSimulationRunState();
      const history = await mongo.getSimulationHistory(5);

      let nextSimMessage = '';
      if (runState.lastScheduledRun) {
        const nextSimTime = new Date(
          runState.lastScheduledRun.getTime() + 48 * 60 * 60 * 1000
        );
        const now = new Date();
        const hoursUntilNext =
          (nextSimTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilNext > 0) {
          const days = Math.floor(hoursUntilNext / 24);
          const hours = Math.floor(hoursUntilNext % 24);
          nextSimMessage = `\nNext simulation in: ${days}d ${hours}h`;
        } else {
          nextSimMessage = '\nNext simulation is due now';
        }
      }

      let message = '';
      if (state.length === 0) {
        console.log('[Supercluster] No active pauses found');
        message = `Simulation is not paused.${nextSimMessage}\n\n`;
      } else {
        const systemPauses = state.filter((pause) =>
          pause.userId.startsWith('system_')
        );
        const userPauses = state.filter(
          (pause) => !pause.userId.startsWith('system_')
        );
        console.log(
          `[Supercluster] Found ${systemPauses.length} system pauses and ${userPauses.length} user pauses`
        );

        if (userPauses.length > 0) {
          const pauseList = userPauses
            .map((pause) => {
              const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
              return `• <@${pause.userId}> (${timeAgo} minutes ago)`;
            })
            .join('\n');
          message = `Simulation is currently paused by:\n${pauseList}\n\n`;
        } else {
          message = "Simulation is currently running, we're waiting for:\n";
          const systemPauseList = systemPauses
            .map((pause) => {
              const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
              return `• ${pause.userId.replace('system_', '')} file (${timeAgo} minutes ago)`;
            })
            .join('\n');
          message += `${systemPauseList}\n\n`;
        }
      }

      // Add simulation history
      if (history.length > 0) {
        message += 'Recent simulation history:\n';
        history.forEach((sim) => {
          const timeAgo = dayjs().diff(dayjs(sim.createdAt), 'minute');
          const status =
            sim.status === 'failed'
              ? '❌'
              : sim.status === 'skipped'
                ? '⏸️'
                : sim.status === 'completed'
                  ? '✅'
                  : '🔄';
          message += `${status} ${timeAgo}m ago: ${sim.status}`;
          if (sim.reason) {
            message += ` (${sim.reason})`;
          }
          if (sim.triggeredBy) {
            message += ` by ${sim.triggeredBy}`;
          }
          message += '\n';
        });
      }

      await sendMessage(
        body.channel_id,
        `<@${body.user_id}> ${message}${nextSimMessage}\n\n${botStatus}`
      );
      break;
    }

    case 'help':
      console.log(`[Supercluster] User ${body.user_id} requested help`);
      await sendEphemeralMessage(
        body.channel_id,
        body.user_id,
        `*Supercluster Simulation Control*

*Commands:*
• \`/supercluster pause\` - Pause the simulation
• \`/supercluster resume\` - Resume your pause
• \`/supercluster resume all\` - Resume all pauses
• \`/supercluster status\` - Check current pause state
• \`/supercluster simulate\` - Force a simulation to run (admin only)

*Simulation Flags:*
• \`--no-backup\` - Run without backup
• \`--import-teams\` - Run with team imports
• \`--dry-run\` - Run simulation in dry-run mode

*Numeric Settings:*
• \`--days N\` - Set auto-play days value (e.g. \`--days 3\`)

*How it works:*
• Multiple users can pause the simulation simultaneously
• Each user can only resume their own pause
• The simulation will not run while any pause is active
• System pauses are automatically added after each simulation
• System pauses are removed when files are updated`
      );
      break;

    default:
      console.log(
        `[Supercluster] Unknown command from user ${body.user_id}: ${action}`
      );
      await sendEphemeralMessage(
        body.channel_id,
        body.user_id,
        'Unknown command. Use `/supercluster help` to see available commands.'
      );
  }
});

// Export the pause state for the scheduler to use
export async function isSimulationPaused() {
  return await mongo.getSimulationState();
}

app.message(/.*who.?se? turn is it.*/i, async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('⚡️ Msg recd! channel ' + message.channel);
  if ((message as GenericMessageEvent).text.includes('<@UVBBEEC4A>')) {
    return;
  }
  if (message.channel === channelMap.ootpHighlights) {
    await say(await getBotMessage());
  }
});

export async function getText(channel, input, reminders) {
  if (config.get('ai.client') === 'openai') {
    const openai = new OpenAI();
    return getTextInternal(openai, channel, input, reminders);
  } else if (config.get('ai.client') === 'google') {
    const googleai = new GoogleAI();
    return getTextInternal(googleai, channel, input, reminders);
  }
  throw new Error('no ai client configured: ' + config.get('ai.client'));
}

async function getTextInternal(aiClient: AIClient, channel, input, reminders) {
  switch (channel) {
    case channelMap.cabin:
      return aiClient.cabinChat({ input });
    case channelMap.ootpHighlights: {
      const [turnInfo, powerRankings] = await Promise.all([
        getBotMessage(),
        getPowerRankings(),
      ]);
      return aiClient.ootpChat({ turnInfo, input, powerRankings, reminders });
    }
    case channelMap.specialist:
      return aiClient.specialistChat({ input });
    case channelMap.politics:
      return aiClient.politicsChat({ input });
    case channelMap.sports: {
      const data = await fantasy.getLeagueData();
      if (input[0].content.includes('generate power rankings')) {
        return aiClient.generatePowerRankings({ input, data });
      }
      return aiClient.sportsChat({ input, data });
    }
    case channelMap.test: {
      // Allow a user in the text channel to specify a different channel to interpret this as.
      const lines = input[0].content.split('\n');
      const channel = lines.shift();
      if (Object.values(channelMap).includes(channel)) {
        // Put the content back without the channel for consistent processing.
        input[0].content = lines.join('\n');
        return getText(channel, input, reminders);
      }
      return aiClient.testChat({ input });
    }
    default:
      return aiClient.genericChat({ input, reminders });
  }
}

const SUPER_CLUSTER_USER_STRING = 'UVBBEEC4A';

async function sendOotpChat(messages, channel, say) {
  const response = await axios.post('https://ootp.bedaire.com/chat', {
    context: {
      bot: SUPER_CLUSTER_USER_STRING,
    },
    messages,
  });
  const { data } = response;
  switch (data.kind) {
    case 'conversation':
    case 'query':
      say(data.message);
      break;
    case 'add_reminder':
      await mongo.insertReminder(channel, data.message);
      say("I'll remember that");
      break;
    case 'list_reminders':
      say(
        mongo.getRemindersAsText({
          type: channel,
        })
      );
      break;
    case '':
      // Intentional no response.
      break;
    default:
      console.error('unknown action:', data.kind);
      break;
  }
}

app.message(subtype('file_share'), async ({ event, message, say, client }) => {
  if (message.subtype !== 'file_share' || event.subtype !== 'file_share') {
    return;
  }
  if (event.channel === channelMap.ootpHighlights) {
    for (const file of message.files) {
      const response = await axios.get(file.url_private, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${client.token}` },
      });
      if (response.status == 200) {
        const messages = [
          {
            user: message.user,
            text: message.text,
            file: {
              mimetype: file.mimetype,
              data: Buffer.from(response.data).toString('base64'),
            },
          },
        ];
        await sendOotpChat(messages, event.channel, (text) =>
          say({
            text,
            thread_ts: event.thread_ts || event.ts,
          })
        );
      }
    }
  }
});

app.event('app_mention', async ({ event, say }) => {
  console.log(
    `⚡️ Mention recd! channel "${event.channel}" user "${event.user}" message "${event.text}"`
  );
  if (event.user === SUPER_CLUSTER_USER_STRING) {
    console.log('⚡️ Discarding message from bot ' + event.text);
    return;
  }
  if (event.text === `<@${SUPER_CLUSTER_USER_STRING}> shuffle teams`) {
    const shuffled = [];
    const teamsCopy = [...teams];
    while (teamsCopy.length > 0) {
      const i = Math.floor(Math.random() * teamsCopy.length);
      shuffled.push(...teamsCopy.splice(i, 1));
    }
    await say({
      text: shuffled.join('\n'),
      thread_ts: event.thread_ts || event.ts,
    });
    return;
  }

  const input = [];
  const { messages } = await app.client.conversations.replies({
    channel: event.channel,
    ts: event.thread_ts || event.ts,
  });
  for (const message of messages) {
    input.push({
      role: message.user === SUPER_CLUSTER_USER_STRING ? 'assistant' : 'user',
      name: message.user,
      content: message.text,
    });
  }

  if (event.channel === channelMap.ootpHighlights) {
    await sendOotpChat(messages, event.channel, (text) =>
      say({
        text,
        thread_ts: event.thread_ts || event.ts,
      })
    );
    return;
  }

  // TODO: Can we clean up this logic?
  if (
    event.text.toLowerCase().includes('remind') &&
    !event.text.toLowerCase().includes('what are my reminders')
  ) {
    // TODO: How can we drop the await here / move it to the end of the function without
    // making the code ugly?
    await mongo.insertReminder(event.channel, event);
    await say({
      text: "I'll remember that.",
      thread_ts: event.thread_ts || event.ts,
    });
    return;
  }
  const reminders = await mongo.getRemindersAsText({ type: event.channel });
  const text = await getText(event.channel, input, reminders);
  console.log(text);
  await say({ text, thread_ts: event.thread_ts || event.ts });
  return;
});
