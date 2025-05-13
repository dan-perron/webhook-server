import bolt from '@slack/bolt';
import config from 'config';
const App = bolt.App;

export const app = new App({
  token: config.get('slack.token'),
  signingSecret: config.get('slack.signingSecret'),
  socketMode: true,
  appToken: config.get('slack.appToken'),
  // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
  // you still need to listen on some port!
  // port: process.env.PORT || 3000
});

// Add error handling
app.error(async (error) => {
  console.error('Slack app error:', error);
});

// Start the app
(async () => {
  try {
    await app.start();
    console.log('⚡️ Bolt app is running!');
  } catch (error) {
    console.error('Error starting Slack app:', error);
    process.exit(1);
  }
})();

export const channelMap = {
  cabin: 'C6BB7U95Z',
  ootpHighlights: 'C04J9TWRNJ3',
  ootpLog: 'C04K33NVCC9',
  ootpDebug: 'C08RNBK56LB',
  politics: 'CPXA5CBHP',
  specialist: 'C6APJ5KG8',
  sports: 'C6ATH6LBB',
  test: 'CUYGZ6LLU',
};

interface MessageOptions {
  thread_ts?: string;
  [key: string]: unknown;
}

/**
 * Sends a message to a Slack channel
 * @param channel The channel ID to send the message to
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendMessage(
  channel: string,
  text: string,
  options: MessageOptions = {}
): Promise<void> {
  try {
    await app.client.chat.postMessage({
      channel,
      text,
      ...options,
    });
  } catch (error) {
    console.error(`Error sending message to channel ${channel}:`, error);
  }
}

/**
 * Sends an ephemeral message to a Slack channel (only visible to the specified user)
 * @param channel The channel ID to send the message to
 * @param user The user ID to send the message to
 * @param text The message text to send
 * @param options Additional options for the message (e.g., thread_ts)
 */
export async function sendEphemeralMessage(
  channel: string,
  user: string,
  text: string,
  options: MessageOptions = {}
): Promise<void> {
  try {
    await app.client.chat.postEphemeral({
      channel,
      user,
      text,
      ...options,
    });
  } catch (error) {
    console.error(
      `Error sending ephemeral message to channel ${channel} for user ${user}:`,
      error
    );
  }
}
