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
