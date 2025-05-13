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

// Add basic event handling
app.event('message', async ({ event }) => {
  try {
    // Handle message events
    console.log('Received message event:', event);
  } catch (error) {
    console.error('Error handling message event:', error);
  }
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
