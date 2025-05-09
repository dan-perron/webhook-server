import { app, channelMap } from '../clients/slack.js';

/**
 * Sends a message to a Slack channel
 * @param channel The channel to send the message to
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendSlackMessage(channel: string, text: string, options: Record<string, any> = {}) {
  try {
    await app.client.chat.postMessage({
      channel,
      text,
      ...options
    });
  } catch (error) {
    console.error('Error sending Slack message:', error);
  }
}

/**
 * Sends a message to the OOTP Highlights channel
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendOotpMessage(text: string, options: Record<string, any> = {}) {
  await sendSlackMessage(channelMap.ootpHighlights, text, options);
}

/**
 * Sends a message to the OOTP Debug channel
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendOotpDebugMessage(text: string, options: Record<string, any> = {}) {
  await sendSlackMessage(channelMap.ootpDebug, text, options);
} 