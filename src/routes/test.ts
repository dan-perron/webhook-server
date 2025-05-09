import express from 'express';
import config from 'config';
import { channelMap } from '../clients/slack.js';
import { sendSlackMessage } from '../utils/slack.js';

export const router = express.Router();

router.post('/', async (req, res) => {
  console.log(
    `Sending ${JSON.stringify(req.body, null, 2)} to slack test channel.`
  );
  await sendSlackMessage(channelMap.test, req.body.text || JSON.stringify(req.body));
  res.send('Ok\n');
});
