import type { GenericMessageEvent } from '@slack/bolt';
import axios from 'axios';
import config from 'config';
import type { AIClient } from '../clients/ai/AIClient.js';
import { GoogleAI } from '../clients/ai/googleAI.js';
import { OpenAI } from '../clients/ai/openai.js';
import * as fantasy from '../clients/fantasy.js';
import * as mongo from '../clients/mongo.js';
import { app, channelMap } from '../clients/slack.js';
import { getBotMessage, getPowerRankings } from './ootpFileManager.js';

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
      return aiClient.sportsChat({ input });
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
  const response = await axios.post(
    'https://ootp.bedaire.com/chat',
    {
      context: {
        bot: SUPER_CLUSTER_USER_STRING,
      },
      messages,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const data = response.data;
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
      const reminders = mongo.getRemindersAsText({
        type: channel,
      });
      say(reminders);
      break;
    default:
      console.error('unknown action:', data.kind);
      break;
  }
}

app.event('app_mention', async ({ event, say }) => {
  console.log(
    `⚡️ Mention recd! channel "${event.channel}" user "${event.user}" message "${event.text}"`
  );
  if (event.user === SUPER_CLUSTER_USER_STRING) {
    console.log('⚡️ Discarding message from bot ' + event.text);
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
(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
