import express from 'express';
import { sendOotpMessage } from '../utils/slack.js';
import { httpLogger } from '../utils/logging/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  httpLogger.debug('Sending message to Slack test channel', { body: req.body });
  await sendOotpMessage(req.body.text || JSON.stringify(req.body));
  res.send('Ok\n');
});

export default router;
