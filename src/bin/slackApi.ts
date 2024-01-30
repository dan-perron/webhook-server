import {getBotMessage, getPowerRankings} from './ootpFileManager.js';
import {app, channelMap} from '../clients/slack.js';
import * as openai from '../clients/openai.js';
import * as fantasy from '../clients/fantasy.js';
import * as mongo from '../clients/mongo.js';
import type {AppMentionEvent, GenericMessageEvent, SayFn} from "@slack/bolt";

app.message(/.*who.?se? turn is it.*/i, async ({message, say}) => {
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
  switch (channel) {
    case channelMap.cabin:
      return openai.cabinChat({input});
    case channelMap.ootpHighlights:
      let [turnInfo, powerRankings] = await Promise.all([getBotMessage(), getPowerRankings()]);
      return openai.ootpChat({turnInfo, input, powerRankings, reminders});
    case channelMap.specialist:
      return openai.specialistChat({input});
    case channelMap.politics:
      return openai.politicsChat({input});
    case channelMap.sports:
      let data = await fantasy.getLeagueData();
      if (input[0].content.includes('generate power rankings')) {
        return openai.generatePowerRankings({input, data});
      }
      return openai.sportsChat({input, data});
    case channelMap.test:
      // Allow a user in the text channel to specify a different channel to interpret this as.
      let lines = input[0].content.split('\n');
      let channel = lines.shift();
      if (Object.values(channelMap).includes(channel)) {
        // Put the content back without the channel for consistent processing.
        input[0].content = lines.join('\n');
        return getText(channel, input, reminders);
      }
      return openai.testChat({input, reminders});
    default:
      return openai.genericChat({input, reminders});
  }
}

const SUPER_CLUSTER_USER_STRING = 'UVBBEEC4A';

app.event('app_mention', async ({event, say}) => {
  console.log('⚡️ Mention recd! channel ' + event.channel);
  if (event.user === SUPER_CLUSTER_USER_STRING) {
    console.log('⚡️ Discarding message from bot ' + event.text);
    return;
  }

  let input = [];
  let {messages} = await app.client.conversations.replies(
      {channel: event.channel, ts: event.thread_ts || event.ts});
  for (let message of messages) {
    input.push({
      role: message.user === SUPER_CLUSTER_USER_STRING ? 'assistant' : 'user',
      name: message.user,
      content: message.text,
    });
  }
  // TODO: Can we clean up this logic?
  if (event.text.toLowerCase().includes('remind') &&
      !event.text.toLowerCase().includes('what are my reminders')) {
    // TODO: How can we drop the await here / move it to the end of the function without
    // making the code ugly?
    await mongo.insertReminder(event.channel, event);
    await say({text: "I'll remember that.", thread_ts: event.thread_ts || event.ts})
    return;
  }
  let reminders = await mongo.getRemindersAsText({type: event.channel});
  let text = await getText(event.channel, input, reminders);
  await say({text, thread_ts: event.thread_ts || event.ts});
  return;
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();