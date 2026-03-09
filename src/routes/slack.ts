import express from 'express';
import { app } from '../clients/slack.js';
import { slackLogger } from '../utils/logging/index.js';

const router = express.Router();

// Handle all Slack events and interactions
router.post('/', async (req, res) => {
  slackLogger.debug('Received event from Slack', { body: req.body });

  // Handle URL verification for Slack app setup
  if (req.body.type === 'url_verification') {
    res.send(req.body.challenge);
    return;
  }

  // Handle slash commands
  if (req.body.command) {
    try {
      // Process the command using Bolt's built-in handler
      await app.processEvent({
        body: req.body,
        ack: () => {
          res.send('');
          return Promise.resolve();
        },
      });
    } catch (error) {
      slackLogger.error('Error processing slash command', {
        error: error.message,
      });
      res.status(500).send('Error processing command');
    }
    return;
  }

  // For other events, just acknowledge receipt
  res.send('Ok\n');
});

export default router;
