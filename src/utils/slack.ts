import { WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';
import config from 'config';
import { app } from '../clients/slack.js';

interface SlackMessage {
  text: string;
  ts?: string;
  user?: string;
  [key: string]: unknown;
}

interface SlackResponse {
  ok: boolean;
  error?: string;
  has_more?: boolean;
  messages?: SlackMessage[];
  response_metadata?: {
    next_cursor?: string;
  };
  [key: string]: unknown;
}

/**
 * Sends a message to a Slack channel
 * @param channel The channel to send the message to
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendSlackMessage(
  channel: string,
  text: string,
  options: Record<string, unknown> = {}
): Promise<void> {
  try {
    await app.client.chat.postMessage({
      channel,
      text,
      ...options,
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
export async function sendOotpMessage(text: string): Promise<void> {
  const webhook = new IncomingWebhook(config.get('slack.webhookUrl'));
  await webhook.send({ text });
}

/**
 * Sends a message to the OOTP Debug channel
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendOotpDebugMessage(text: string): Promise<void> {
  const webhook = new IncomingWebhook(config.get('slack.debugWebhookUrl'));
  await webhook.send({ text });
}

export async function postSummary(
  client: WebClient,
  lastMessage: string
): Promise<void> {
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;

  let hasMore = true;
  while (hasMore) {
    const result = (await client.conversations.history({
      channel: config.get('slack.channels.ootpLog'),
      oldest: lastMessage,
      latest: Date.now().toString(),
      limit: 200,
      cursor,
    })) as SlackResponse;

    if (!result.ok) {
      console.log('error', result);
      break;
    }

    if (result.messages) {
      const newMessages = result.messages.map((message) => ({
        ts: message.ts,
        user: message.user,
        text: message.text?.slice(0, 4 * 1024), // truncate large messages
      }));
      messages.push(...newMessages);
    }

    hasMore = result.has_more ?? false;
    cursor = result.response_metadata?.next_cursor;
  }

  // ... rest of the function ...
}
