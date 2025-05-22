import type { GenericMessageEvent, SlashCommand } from '@slack/bolt';
import { subtype } from '@slack/bolt';
import axios from 'axios';
import config from 'config';
import type { AIClient } from '../clients/ai/AIClient.js';
import { GoogleAI } from '../clients/ai/googleAI.js';
import { OpenAI } from '../clients/ai/openai.js';
import * as fantasy from '../clients/fantasy.js';
import {
  getRemindersAsText,
  insertReminder,
  getSimulationState,
  getActiveSimulation,
  getSimulationHistory,
  updateSimulationRunState,
} from '../clients/mongo/index.js';
import {
  app,
  channelMap,
  sendMessage,
  sendEphemeralMessage,
} from '../clients/slack.js';
import { isAuthorizedUser } from '../consts/slack.js';
import { getBotMessage, getPowerRankings, teams } from './ootpFileManager.js';
import {
  resumeSimulationPause,
  resumeAllSimulationPauses,
  formatSimulationHistoryEntry,
} from '../utils/simulation.js';
import { addSimulationPause } from '../clients/mongo/index.js';
import dayjs from 'dayjs';
import {
  callSimulateEndpoint,
  checkFacilitatorHealth,
} from '../clients/windows-facilitator.js';
import type { SimulationOptions } from '../clients/mongo/types.js';

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

function parseSimulationOptions(
  args: string[],
  existingOptions?: SimulationOptions
): SimulationOptions {
  const options: SimulationOptions = {
    backupLeagueFolder: !args.includes('--no-backup'),
    manualImportTeams: args.includes('--manual-import'),
    dryRun: args.includes('--dry-run'),
    commishCheckboxes: {
      ...(existingOptions?.commishCheckboxes ?? {
        backup_league_files: true,
        retrieve_team_exports_from_server: true,
        retrieve_team_exports_from_your_pc: false,
        break_if_team_files_are_missing: true,
        break_if_trades_are_pending: true,
        demote_release_players_with_dfa_time_left_of_x_days_or_less: false,
        auto_play_days: true,
        create_and_upload_league_file: true,
        create_and_upload_html_reports: true,
        create_sql_dump_for_ms_access: false,
        create_sql_dump_for_mysql: false,
        export_data_to_csv_files: false,
        upload_status_report_to_server: true,
        create_and_send_result_emails: true,
      }),
    } as CommishCheckboxConfig,
  };

  // Parse numeric values
  const numericArgs = ['--days', '--dfa-days'];
  for (const arg of numericArgs) {
    if (args.includes(arg)) {
      const index = args.indexOf(arg);
      if (index < args.length - 1) {
        const value = parseInt(args[index + 1], 10);
        if (!isNaN(value)) {
          switch (arg) {
            case '--days':
              options.commishCheckboxes.auto_play_days_value = value;
              break;
            case '--dfa-days':
              options.commishCheckboxes.dfa_days_value = value;
              break;
          }
        }
      }
    }
  }

  // Parse boolean flags for commish checkboxes
  const checkboxFlags = {
    '--no-backup-files': 'backup_league_files',
    '--no-server-export': 'retrieve_team_exports_from_server',
    '--pc-export': 'retrieve_team_exports_from_your_pc',
    '--no-break-missing': 'break_if_team_files_are_missing',
    '--no-break-trades': 'break_if_trades_are_pending',
    '--demote-dfa':
      'demote_release_players_with_dfa_time_left_of_x_days_or_less',
    '--no-auto-play': 'auto_play_days',
    '--no-upload-league': 'create_and_upload_league_file',
    '--no-upload-reports': 'create_and_upload_html_reports',
    '--ms-access': 'create_sql_dump_for_ms_access',
    '--mysql': 'create_sql_dump_for_mysql',
    '--csv': 'export_data_to_csv_files',
    '--no-upload-status': 'upload_status_report_to_server',
    '--no-send-emails': 'create_and_send_result_emails',
  };

  for (const [flag, setting] of Object.entries(checkboxFlags)) {
    if (args.includes(flag)) {
      options.commishCheckboxes[setting] = flag.startsWith('--no-')
        ? false
        : true;
    }
  }

  return options;
}

function mergeOptions(
  savedOptions: SimulationOptions | undefined,
  newOptions: SimulationOptions
): SimulationOptions {
  return {
    ...savedOptions,
    ...newOptions,
    commishCheckboxes: {
      ...(savedOptions?.commishCheckboxes ?? {}),
      ...newOptions.commishCheckboxes,
    },
  };
}

async function handleSimulateCommand(body: SlashCommand, args: string[]) {
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
    const runState = await getActiveSimulation();
    if (runState && runState.status === 'scheduled') {
      await sendMessage(
        body.channel_id,
        '❌ A simulation is already in progress.'
      );
      return;
    }

    // Parse command line options and merge with any saved options
    const commandOptions = parseSimulationOptions(args);
    const options = mergeOptions(runState?.options, commandOptions);

    await sendMessage(
      body.channel_id,
      `🔄 Starting simulation... ${args.join(', ')}`
    );

    await callSimulateEndpoint({ options, triggerType: 'manual' });

    await sendMessage(body.channel_id, '✅ Simulation started successfully!');
  } catch (error) {
    console.error('Error in simulation command:', error);
    await sendMessage(
      body.channel_id,
      `❌ Error starting simulation: ${error.message}`
    );
  }
}

async function handlePauseCommand(body: SlashCommand) {
  console.log(`[Supercluster] User ${body.user_id} pausing simulation`);
  await addSimulationPause(body.user_id);
  await sendMessage(
    body.channel_id,
    `<@${body.user_id}> Simulation paused. It will remain paused until you resume it.`
  );
}

async function handleResumeCommand(body: SlashCommand, args: string[]) {
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
}

async function handleStatusCommand(body: SlashCommand) {
  console.log(`[Supercluster] User ${body.user_id} checking simulation status`);
  const state = await getSimulationState();
  const botStatus = await getBotMessage();
  const runState = await getActiveSimulation();
  const history = await getSimulationHistory(5);
  const facilitatorHealth = await checkFacilitatorHealth();

  let message = '';
  if (runState?.scheduledFor) {
    const now = new Date();
    const hoursUntilNext =
      (runState.scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilNext > 0) {
      const days = Math.floor(hoursUntilNext / 24);
      const hours = Math.floor(hoursUntilNext % 24);
      const minutes = Math.floor((hoursUntilNext * 60) % 60);
      const seconds = Math.floor((hoursUntilNext * 3600) % 60);

      if (days > 0) {
        message = `Next simulation in: ${days}d ${hours}h\n\n`;
      } else if (hours > 0) {
        message = `Next simulation in: ${hours}h ${minutes}m\n\n`;
      } else {
        message = `Next simulation in: ${minutes}m ${seconds}s\n\n`;
      }
    } else {
      message = 'Next simulation is due now\n\n';
    }
  }
  message += `${botStatus}\n\n`;

  // Add facilitator health status
  message += `PATRIOT Status: ${facilitatorHealth.healthy ? '✅' : '❌'} ${facilitatorHealth.message}\n\n`;

  if (state.length === 0) {
    console.log('[Supercluster] No active pauses found');
    message += `Simulation is not paused.\n\n`;
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
      message += `Simulation is currently paused by:\n${pauseList}\n\n`;
    } else {
      message += "Simulation is currently running, we're waiting for:\n";
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
      message += formatSimulationHistoryEntry(sim) + '\n';
    });
  }

  await sendMessage(body.channel_id, `<@${body.user_id}>\n\n${message}`);
}

async function handleHelpCommand(body: SlashCommand) {
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
}

function formatOptions(options: SimulationOptions): string {
  const defaultOptions: SimulationOptions = {
    backupLeagueFolder: true,
    manualImportTeams: false,
    dryRun: false,
    commishCheckboxes: {
      backup_league_files: true,
      retrieve_team_exports_from_server: true,
      retrieve_team_exports_from_your_pc: false,
      break_if_team_files_are_missing: true,
      break_if_trades_are_pending: true,
      demote_release_players_with_dfa_time_left_of_x_days_or_less: false,
      auto_play_days: true,
      create_and_upload_league_file: true,
      create_and_upload_html_reports: true,
      create_sql_dump_for_ms_access: false,
      create_sql_dump_for_mysql: false,
      export_data_to_csv_files: false,
      upload_status_report_to_server: true,
      create_and_send_result_emails: true,
    },
  };

  const lines: string[] = [];

  // Check basic options
  if (options.backupLeagueFolder !== defaultOptions.backupLeagueFolder) {
    lines.push(
      `• Backup league folder: ${options.backupLeagueFolder ? 'Yes' : 'No'}`
    );
  }
  if (options.manualImportTeams !== defaultOptions.manualImportTeams) {
    lines.push(
      `• Manual import teams: ${options.manualImportTeams ? 'Yes' : 'No'}`
    );
  }
  if (options.dryRun !== defaultOptions.dryRun) {
    lines.push(`• Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
  }

  // Check commish checkboxes
  const defaultCheckboxes = defaultOptions.commishCheckboxes;
  const checkboxes = options.commishCheckboxes;

  for (const [key, value] of Object.entries(checkboxes)) {
    if (value !== defaultCheckboxes[key]) {
      const settingName = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      lines.push(`• ${settingName}: ${value ? 'Yes' : 'No'}`);
    }
  }

  // Check numeric values
  if (checkboxes.auto_play_days_value !== undefined) {
    lines.push(`• Auto-play days: ${checkboxes.auto_play_days_value}`);
  }
  if (checkboxes.dfa_days_value !== undefined) {
    lines.push(`• DFA days: ${checkboxes.dfa_days_value}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'Using default settings';
}

async function handleScheduleConfigCommand(body: SlashCommand, args: string[]) {
  try {
    const runState = await getActiveSimulation();
    if (!runState) {
      await sendEphemeralMessage(
        body.channel_id,
        body.user_id,
        '❌ No scheduled simulation found.'
      );
      return;
    }

    if (args.length === 0 || args.includes('--help')) {
      const options = runState.options ?? {};
      let message = `📅 Current Simulation Configuration:\n${formatOptions(options)}\n\n`;
      if (args.includes('--help')) {
        message +=
          `To update settings, use the following flags:\n` +
          `• \`--no-backup\` - Disable backup\n` +
          `• \`--manual-import\` - Enable manual import\n` +
          `• \`--dry-run\` - Enable dry run mode\n` +
          `• \`--days N\` - Set auto-play days (e.g. \`--days 3\`)\n` +
          `• \`--dfa-days N\` - Set DFA days threshold\n` +
          `• \`--no-backup-files\` - Disable league file backup\n` +
          `• \`--no-server-export\` - Disable server export\n` +
          `• \`--pc-export\` - Enable PC export\n` +
          `• \`--no-break-missing\` - Don't break on missing files\n` +
          `• \`--no-break-trades\` - Don't break on pending trades\n` +
          `• \`--demote-dfa\` - Enable DFA demotion\n` +
          `• \`--no-auto-play\` - Disable auto-play\n` +
          `• \`--no-upload-league\` - Don't upload league file\n` +
          `• \`--no-upload-reports\` - Don't upload HTML reports\n` +
          `• \`--ms-access\` - Create MS Access dump\n` +
          `• \`--mysql\` - Create MySQL dump\n` +
          `• \`--csv\` - Export to CSV files\n` +
          `• \`--no-upload-status\` - Don't upload status report\n` +
          `• \`--no-send-emails\` - Don't send result emails`;
      }

      await sendEphemeralMessage(body.channel_id, body.user_id, message);
      return;
    }

    const commandOptions = parseSimulationOptions(args);
    const newOptions = mergeOptions(runState.options, commandOptions);
    await updateSimulationRunState({ options: newOptions });

    const message = `✅ Simulation configuration updated:\n${formatOptions(newOptions)}`;
    await sendEphemeralMessage(body.channel_id, body.user_id, message);
  } catch (error) {
    console.error('Error in schedule config command:', error);
    await sendMessage(
      body.channel_id,
      `❌ Error updating simulation configuration: ${error.message}`
    );
  }
}

// Add slash command to control simulation
app.command('/supercluster', async ({ ack, body }) => {
  await ack();
  const args = body.text.split(' ').filter(Boolean);
  const command = args[0];

  console.log(`[Supercluster] Command received: ${command}`);

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

  console.log(
    `[Supercluster] Parsed command: command=${command}, args=${args.join(' ')}`
  );

  switch (command) {
    case 'simulate':
      await handleSimulateCommand(body, args.slice(1));
      break;
    case 'pause':
      await handlePauseCommand(body);
      break;
    case 'resume':
      await handleResumeCommand(body, args.slice(1));
      break;
    case 'status':
      await handleStatusCommand(body);
      break;
    case 'help':
      await handleHelpCommand(body);
      break;
    case 'schedule-config':
      await handleScheduleConfigCommand(body, args.slice(1));
      break;
    default:
      console.log(
        `[Supercluster] Unknown command from user ${body.user_id}: ${command}`
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
  return await getSimulationState();
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
      await insertReminder(channel, data.message);
      say("I'll remember that");
      break;
    case 'list_reminders':
      say(
        getRemindersAsText({
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
    await insertReminder(event.channel, event);
    await say({
      text: "I'll remember that.",
      thread_ts: event.thread_ts || event.ts,
    });
    return;
  }
  const reminders = await getRemindersAsText({ type: event.channel });
  const text = await getText(event.channel, input, reminders);
  console.log(text);
  await say({ text, thread_ts: event.thread_ts || event.ts });
  return;
});
