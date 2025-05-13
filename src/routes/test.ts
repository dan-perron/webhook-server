import express from 'express';
import { sendOotpMessage } from '../utils/slack.js';

const router = express.Router();

router.post('/', async (req, res) => {
  console.log(
    `Sending ${JSON.stringify(req.body, null, 2)} to slack test channel.`
  );
  await sendOotpMessage(req.body.text || JSON.stringify(req.body));
  res.send('Ok\n');
});

export default router;
