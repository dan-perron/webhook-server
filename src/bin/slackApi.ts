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
      await sendOotpMessage('🔄 Starting manual simulation...');
      const result = await callSimulateEndpoint(false);
      if (result.success) {
        await client.chat.postMessage({
          channel: body.channel_id,
          text: `<@${userId}> Simulation started successfully.`,
        });
      } else {
        await sendOotpMessage(`❌ Error during simulation: ${result.error.message}`);
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
        text: `<@${userId}> Unknown command. Use \`/supercluster help\`