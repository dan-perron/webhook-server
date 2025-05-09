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
import { addSimulationPause, resumeSimulationPause, resumeAllSimulationPauses, getSimulationState } from '../utils/simulation.js';
import { sendOotpMessage, sendOotpDebugMessage } from '../utils/slack.js';
import dayjs from 'dayjs';

// Function to call the simulate endpoint
async function callSimulateEndpoint(isResumedSimulation = false) {
  try {
    // Notify that simulation is starting
    await sendOotpMessage(
      isResumedSimulation ? '🔄 Resuming previously skipped simulation...' : '🔄 Starting scheduled simulation...'
    );

    const simulateEndpoint = `http://${config.get('simulation.hostname')}/simulate`;
    const response = await axios.post(simulateEndpoint, {}, {
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
    // Notify about the error
    await sendOotpMessage(`❌ Error during simulation: ${error.message}`);
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

  if (!isAuthorizedUser(userId)) {
    await client.chat.postEphemeral({
      channel: body.channel_id,
      user: userId,
      text: "You don't have permission to control the simulation.",
    });
    return;
  }

  const [action, subAction] = text.split(' ');

  switch (action) {
    case 'simulate':
      if (userId !== 'U6AT12XSM') {
        await client.chat.postEphemeral({
          channel: body.channel_id,
          user: userId,
          text: "Only <@U6AT12XSM> can force a simulation to run.",
        });
        return;
      }
      const pauseState = await getSimulationState();
      if (pauseState.length > 0) {
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Cannot start simulation while it is paused. Use \`/supercluster status\` to see who has paused it.`,
        });
        return;
      }
      const result = await callSimulateEndpoint(false);
      if (result.success) {
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Simulation started successfully.`,
        });
      } else {
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Failed to start simulation: ${result.error.message}`,
        });
      }
      break;

    case 'pause':
      await addSimulationPause(userId);
      await client.chat.postMessage({
        channel: body.channel_id,
        text: `<@${userId}> Simulation paused. It will remain paused until you resume it.`,
      });
      break;

    case 'resume':
      if (subAction === 'all') {
        const count = await resumeAllSimulationPauses();
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Resumed all simulation pauses (${count} total).`,
        });
      } else {
        const resumed = await resumeSimulationPause(userId);
        if (resumed) {
          await client.chat.postMessage({
            channel: body.channel_id,
            text: `<@${userId}> Your simulation pause has been removed.`,
          });
        } else {
          await client.chat.postMessage({
            channel: body.channel_id,
            text: `<@${userId}> You don't have an active simulation pause.`,
          });
        }
      }
      break;

    case 'status':
      const state = await getSimulationState();
      const botStatus = await getBotMessage();
      
      if (state.length === 0) {
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Simulation is not paused.\n\n${botStatus}`,
        });
      } else {
        const systemPauses = state.filter(pause => pause.userId.startsWith('system_'));
        const userPauses = state.filter(pause => !pause.userId.startsWith('system_'));
        
        let message = '';
        if (userPauses.length > 0) {
          const pauseList = userPauses.map(pause => {
            const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
            return `• <@${pause.userId}> (${timeAgo} minutes ago)`;
          }).join('\n');
          message = `Simulation is currently paused by:\n${pauseList}`;
        } else {
          message = 'Simulation is currently running, we\'re waiting for:';
          const systemPauseList = systemPauses.map(pause => {
            const timeAgo = dayjs().diff(dayjs(pause.pausedAt), 'minute');
            return `• ${pause.userId.replace('system_', '')} file (${timeAgo} minutes ago)`;
          }).join('\n');
          message += `\n${systemPauseList}`;
        }
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> ${message}\n\n${botStatus}`,
        });
      }
      break;

    case 'help':
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
• \`/supercluster help\` - Show this help message

*How it works:*
• Multiple users can pause the simulation simultaneously
• Each user can only resume their own pause
• The simulation will not run while any pause is active
• System pauses are automatically added after each simulation
• System pauses are removed when files are updated`,
      });
      break;

    default:
      await client.chat.postMessage({
        channel: body.channel_id,
        text: `<@${userId}> Unknown command. Use \`/supercluster help\` to see available commands.`,
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
