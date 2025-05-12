import type { GenericMessageEvent } from '@slack/bolt';
import { subtype } from '@slack/bolt';
import axios from 'axios';
import config from 'config';
import type { AIClient } from '../clients/ai/AIClient.js';
import { GoogleAI } from '../clients/ai/googleAI.js';
import { OpenAI } from '../clients/ai/openai.js';
import * as fantasy from '../clients/fantasy.js';
import * as mongo from '../clients/mongo.js';
import { app, channelMap } from '../clients/slack.js';
import { isAuthorizedUser } from '../consts/slack.js';
import { getBotMessage, getPowerRankings, teams } from './ootpFileManager.js';
import { addSimulationPause, resumeSimulationPause, resumeAllSimulationPauses, getSimulationState, getSimulationRunState } from '../utils/simulation.js';
import { sendOotpMessage, sendOotpDebugMessage } from '../utils/slack.js';
import dayjs from 'dayjs';

// Define the checkbox config interface
interface CommishCheckboxConfig {
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

// Function to call the simulate endpoint
async function callSimulateEndpoint(isResumedSimulation = false, options = { 
  backupLeagueFolder: true,
  manualImportTeams: false,
  commishCheckboxes: {} as CommishCheckboxConfig
}) {
  try {
    const simulateEndpoint = `http://${config.get('simulation.hostname')}/simulate`;
    const response = await axios.post(simulateEndpoint, {
      backup_league_folder: options.backupLeagueFolder,
      manual_import_teams: options.manualImportTeams,
      commish_checkboxes: options.commishCheckboxes
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Simulate endpoint response:', response.data);
    
    // Send response to debug channel
    await sendOotpDebugMessage(`Simulate endpoint response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Add system pauses for both files
    await addSimulationPause('system_league_file');
    await addSimulationPause('system_archive_file');
    console.log('Simulation automatically paused until both files are updated');
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error calling simulate endpoint:', error);
    // Send error details to debug channel
    await sendOotpDebugMessage(`Simulate endpoint error: ${JSON.stringify(error, null, 2)}`);
    return { success: false, error };
  }
}

// Add slash command to control simulation
app.command('/supercluster', async ({ ack, body, client }) => {
  await ack();
  const userId = body.user_id;
  const text = body.text.trim().toLowerCase();
  
  console.log(`[Supercluster] Command received from user ${userId}: ${text}`);

  if (!isAuthorizedUser(userId)) {
    console.log(`[Supercluster] Unauthorized access attempt from user ${userId}`);
    await client.chat.postEphemeral({
      channel: body.channel_id,
      user: userId,
      text: "You don't have permission to control the simulation.",
    });
    return;
  }

  const [action, subAction, ...args] = text.split(' ');
  console.log(`[Supercluster] Parsed command: action=${action}, subAction=${subAction}, args=${args.join(' ')}`);

  switch (action) {
    case 'simulate':
      if (userId !== 'U6AT12XSM') {
        console.log(`[Supercluster] Unauthorized simulation attempt from user ${userId}`);
        await client.chat.postEphemeral({
          channel: body.channel_id,
          user: userId,
          text: "Only <@U6AT12XSM> can force a simulation to run.",
        });
        return;
      }
      const pauseState = await getSimulationState();
      if (pauseState.length > 0) {
        console.log(`[Supercluster] Simulation blocked due to active pauses: ${JSON.stringify(pauseState)}`);
        await client.chat.postEphemeral({
          channel: body.channel_id,
          user: userId,
          text: `Cannot start simulation while it is paused. Use \`/supercluster status\` to see who has paused it.`,
        });
        return;
      }

      // Parse flags
      const backupFlag = args.find(arg => arg === '--no-backup' || arg === 'backup:false');
      const importFlag = args.find(arg => arg === '--import-teams' || arg === 'import:true');
      console.log(`[Supercluster] Parsed simulation flags: backup=${!backupFlag}, import=${!!importFlag}`);
      
      // Parse checkbox flags
      const checkboxFlags: CommishCheckboxConfig = {
        backup_league_files: !args.find(arg => arg === '--no-backup-files' || arg === 'backup_files:false'),
        retrieve_team_exports_from_server: !args.find(arg => arg === '--no-server-exports' || arg === 'server_exports:false'),
        retrieve_team_exports_from_your_pc: !!args.find(arg => arg === '--pc-exports' || arg === 'pc_exports:true'),
        break_if_team_files_are_missing: !!args.find(arg => arg === '--break-missing-files' || arg === 'break_missing_files:true'),
        break_if_trades_are_pending: !!args.find(arg => arg === '--break-pending-trades' || arg === 'break_pending_trades:true'),
        demote_release_players_with_dfa_time_left_of_x_days_or_less: !!args.find(arg => arg === '--demote-dfa' || arg === 'demote_dfa:true'),
        auto_play_days: !args.find(arg => arg === '--no-auto-play' || arg === 'auto_play:false'),
        create_and_upload_league_file: !args.find(arg => arg === '--no-upload-league' || arg === 'upload_league:false'),
        create_and_upload_html_reports: !args.find(arg => arg === '--no-upload-reports' || arg === 'upload_reports:false'),
        create_sql_dump_for_ms_access: !!args.find(arg => arg === '--ms-access' || arg === 'ms_access:true'),
        create_sql_dump_for_mysql: !!args.find(arg => arg === '--mysql' || arg === 'mysql:true'),
        export_data_to_csv_files: !!args.find(arg => arg === '--csv' || arg === 'csv:true'),
        upload_status_report_to_server: !args.find(arg => arg === '--no-status-report' || arg === 'status_report:false'),
        create_and_send_result_emails: !args.find(arg => arg === '--no-emails' || arg === 'emails:false')
      };
      console.log(`[Supercluster] Parsed checkbox flags: ${JSON.stringify(checkboxFlags)}`);

      // Parse numeric values
      const dfaDaysMatch = args.find(arg => arg.startsWith('dfa_days:'));
      if (dfaDaysMatch) {
        const dfaDays = parseInt(dfaDaysMatch.split(':')[1]);
        if (!isNaN(dfaDays)) {
          checkboxFlags.dfa_days_value = dfaDays;
          console.log(`[Supercluster] Set DFA days value: ${dfaDays}`);
        }
      }

      const autoPlayDaysMatch = args.find(arg => arg.startsWith('auto_play_days:'));
      if (autoPlayDaysMatch) {
        const autoPlayDays = parseInt(autoPlayDaysMatch.split(':')[1]);
        if (!isNaN(autoPlayDays)) {
          checkboxFlags.auto_play_days_value = autoPlayDays;
          console.log(`[Supercluster] Set auto-play days value: ${autoPlayDays}`);
        }
      }

      const options = {
        backupLeagueFolder: !backupFlag,
        manualImportTeams: !!importFlag,
        commishCheckboxes: checkboxFlags
      };
      
      // Build status message
      let statusMsg = '🔄 Starting manual simulation...';
      if (backupFlag) statusMsg += ' (without backup)';
      if (importFlag) statusMsg += ' (with team imports)';
      
      // Add any non-default checkbox states to status
      const nonDefaultFlags = Object.entries(checkboxFlags)
        .filter(([key, value]) => {
          // Default values based on CommishHomeCheckboxConfig
          const defaultValues: CommishCheckboxConfig = {
            backup_league_files: true,
            retrieve_team_exports_from_server: true,
            retrieve_team_exports_from_your_pc: false,
            break_if_team_files_are_missing: false,
            break_if_trades_are_pending: false,
            demote_release_players_with_dfa_time_left_of_x_days_or_less: false,
            auto_play_days: true,
            create_and_upload_league_file: true,
            create_and_upload_html_reports: true,
            create_sql_dump_for_ms_access: false,
            create_sql_dump_for_mysql: false,
            export_data_to_csv_files: false,
            upload_status_report_to_server: true,
            create_and_send_result_emails: true
          };
          return value !== defaultValues[key as keyof CommishCheckboxConfig];
        })
        .map(([key]) => key.replace(/_/g, ' '));
      
      if (nonDefaultFlags.length > 0) {
        statusMsg += ` (with custom settings: ${nonDefaultFlags.join(', ')})`;
      }
      
      console.log(`[Supercluster] Starting simulation with options: ${JSON.stringify(options)}`);
      await sendOotpMessage(statusMsg);
      const result = await callSimulateEndpoint(false, options);
      if (!result.success) {
        console.error(`[Supercluster] Simulation failed: ${result.error.message}`);
        await sendOotpMessage(`❌ Error during simulation: ${result.error.message}`);
      } else {
        console.log(`[Supercluster] Simulation started successfully`);
      }
      break;

    case 'pause':
      console.log(`[Supercluster] User ${userId} pausing simulation`);
      await addSimulationPause(userId);
      await client.chat.postMessage({
        channel: body.channel_id,
        text: `<@${userId}> Simulation paused. It will remain paused until you resume it.`,
      });
      break;

    case 'resume':
      if (subAction === 'all') {
        console.log(`[Supercluster] User ${userId} resuming all simulation pauses`);
        const count = await resumeAllSimulationPauses();
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Resumed all simulation pauses (${count} total).`,
        });
      } else {
        console.log(`[Supercluster] User ${userId} attempting to resume their pause`);
        const resumed = await resumeSimulationPause(userId);
        if (resumed) {
          console.log(`[Supercluster] Successfully resumed pause for user ${userId}`);
          await client.chat.postMessage({
            channel: body.channel_id,
            text: `<@${userId}> Your simulation pause has been removed.`,
          });
        } else {
          console.log(`[Supercluster] No active pause found for user ${userId}`);
          await client.chat.postMessage({
            channel: body.channel_id,
            text: `<@${userId}> You don't have an active simulation pause.`,
          });
        }
      }
      break;

    case 'status':
      console.log(`[Supercluster] User ${userId} checking simulation status`);
      const state = await getSimulationState();
      const botStatus = await getBotMessage();
      const runState = await getSimulationRunState();
      const history = await mongo.getSimulationHistory(5);
      
      let nextSimMessage = '';
      if (runState.lastScheduledRun) {
        const nextSimTime = new Date(runState.lastScheduledRun.getTime() + (48 * 60 * 60 * 1000));
        const now = new Date();
        const hoursUntilNext = (nextSimTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
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
        console.log(`[Supercluster] No active pauses found`);
        message = `Simulation is not paused.${nextSimMessage}\n\n`;
      } else {
        const systemPauses = state.filter(pause => pause.userId.startsWith('system_'));
        const userPauses = state.filter(pause => !pause.userId.startsWith('system_'));
        console.log(`[Supercluster] Found ${systemPauses.length} system pauses and ${userPauses.length} user pauses`);
        
        if (userPauses.length > 0) {
          const pauseList = userPauses.map(pause => {
            const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
            return `• <@${pause.userId}> (${timeAgo} minutes ago)`;
          }).join('\n');
          message = `Simulation is currently paused by:\n${pauseList}\n\n`;
        } else {
          message = 'Simulation is currently running, we\'re waiting for:\n';
          const systemPauseList = systemPauses.map(pause => {
            const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
            return `• ${pause.userId.replace('system_', '')} file (${timeAgo} minutes ago)`;
          }).join('\n');
          message += `${systemPauseList}\n\n`;
        }
      }

      // Add simulation history
      if (history.length > 0) {
        message += 'Recent simulation history:\n';
        history.forEach(sim => {
          const timeAgo = dayjs().diff(dayjs(sim.createdAt), 'minute');
          const status = sim.status === 'failed' ? '❌' : 
                        sim.status === 'skipped' ? '⏸️' : 
                        sim.status === 'completed' ? '✅' : '🔄';
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
      
      await client.chat.postMessage({
        channel: body.channel_id,
        text: `<@${userId}> ${message}${nextSimMessage}\n\n${botStatus}`,
      });
      break;

    case 'help':
      console.log(`[Supercluster] User ${userId} requested help`);
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: userId,
        text: `*Supercluster Simulation Control*

*Commands:*
• \`/supercluster pause\` - Pause the simulation
• \`/supercluster resume\` - Resume your pause
• \`/supercluster resume all\` - Resume all pauses
• \`/supercluster status\` - Check current pause state
• \`/supercluster simulate\` - Force a simulation to run (admin only)

*Simulation Flags:*
• \`--no-backup\` or \`backup:false\` - Run without backup
• \`--import-teams\` or \`import:true\` - Run with team imports

*Checkbox Settings:*
• \`--no-backup-files\` or \`backup_files:false\` - Disable league file backup
• \`--no-server-exports\` or \`server_exports:false\` - Disable server exports
• \`--pc-exports\` or \`pc_exports:true\` - Enable PC exports
• \`--break-missing-files\` or \`break_missing_files:true\` - Break on missing files
• \`--break-pending-trades\` or \`break_pending_trades:true\` - Break on pending trades
• \`--demote-dfa\` or \`demote_dfa:true\` - Enable DFA demotion
• \`--no-auto-play\` or \`auto_play:false\` - Disable auto-play
• \`--no-upload-league\` or \`upload_league:false\` - Disable league upload
• \`--no-upload-reports\` or \`upload_reports:false\` - Disable report upload
• \`--ms-access\` or \`ms_access:true\` - Enable MS Access dump
• \`--mysql\` or \`mysql:true\` - Enable MySQL dump
• \`--csv\` or \`csv:true\` - Enable CSV export
• \`--no-status-report\` or \`status_report:false\` - Disable status report
• \`--no-emails\` or \`emails:false\` - Disable result emails

*Numeric Settings:*
• \`dfa_days:N\` - Set DFA days value (e.g. \`dfa_days:7\`)
• \`auto_play_days:N\` - Set auto-play days value (e.g. \`auto_play_days:3\`)

*How it works:*
• Multiple users can pause the simulation simultaneously
• Each user can only resume their own pause
• The simulation will not run while any pause is active
• System pauses are automatically added after each simulation
• System pauses are removed when files are updated`,
      });
      break;

    default:
      console.log(`[Supercluster] Unknown command from user ${userId}: ${action}`);
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: userId,
        text: `Unknown command. Use \`/supercluster help\` to see available commands.`,
      });
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
      say('I\'ll remember that');
      break;
    case 'list_reminders':
      say(mongo.getRemindersAsText({
        type: channel,
      }));
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
        headers: {'Authorization': `Bearer ${client.token}`}
      });
      if (response.status == 200) {
        const messages = [{
          user: message.user,
          text: message.text,
          file: {
            mimetype: file.mimetype,
            data: Buffer.from(response.data).toString('base64')
          }
        }];
        await sendOotpChat(messages, event.channel, (text) =>
          say({
            text,
            thread_ts: event.thread_ts || event.ts,
          })
        )
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
      const i = Math.floor(Math.random()*teamsCopy.length);
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
      text: 'I\'ll remember that.',
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

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();