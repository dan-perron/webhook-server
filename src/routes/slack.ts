import express from 'express';
import { app } from '../clients/slack.js';

export const router = express.Router();

// Handle all Slack events and interactions
router.post('/', async (req, res) => {
  console.log(`Received ${JSON.stringify(req.body, null, 2)} from slack.`);
  
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
        }
      });
    } catch (error) {
      console.error('Error processing slash command:', error);
      res.status(500).send('Error processing command');
    }
    return;
  }

  // For other events, just acknowledge receipt
  res.send('Ok\n');
});
