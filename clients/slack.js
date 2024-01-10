import {App} from '@slack/bolt';
import config from 'config';

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
  politics: 'CPXA5CBHP',
  specialist: 'C6APJ5KG8',
  sports: 'C6ATH6LBB',
  test: 'CUYGZ6LLU',
}

export const channelToTeam = {
  'C04NS45UKEX': 'Cincinnati Reds',
  'C04NS44S6QK': 'Kansas City Royals',
  'C04P4SB6LSD': 'Miami Marlins',
  'C04NKK6CAKY': 'Oakland Athletics',
};

function messageHighlights({title, url,heading, body}) {
  let message = {channel: channelMap.ootpHighlights, text: title, blocks: []};
  if (heading) {
    message.blocks.push({
      'type': 'header', 'text': {
        'type': 'plain_text', 'text': heading,
      },
    });
  }
  message.blocks.push({
    'type': 'section', 'text': {
      'type': 'mrkdwn', 'text': `<${url}|${title}>`,
    },
  });
  if (body) {
    message.blocks.push({
      'type': 'section', 'text': {
        'type': 'plain_text', 'text': body,
      },
    });
  }
  return app.client.chat.postMessage(message);
}

export function messageSummary({content}) {
  let message = {channel: channelMap.ootpHighlights, blocks: []};
  message.blocks.push({
    'type': 'section', 'text': {
      'type': 'plain_text', 'text': content,
    },
  });
  return app.client.chat.postMessage(message);
}
