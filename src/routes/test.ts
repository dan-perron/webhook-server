import express from 'express';
import config from 'config';
export const router = express.Router();

import { IncomingWebhook } from '@slack/webhook';
const SlackWebhook = new IncomingWebhook(config.get('slack.webhookUrls.test'));

router.post('/', async (req, res) => {
  console.log(
    `Sending ${JSON.stringify(req.body, null, 2)} to slack test channel.`
  );
  await SlackWebhook.send(req.body);
  res.send('Ok\n');
});
