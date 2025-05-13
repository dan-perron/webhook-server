import express from 'express';
import hash from 'object-hash';
import { channelMap } from '../clients/slack.js';
import { sendSlackMessage } from '../utils/slack.js';

const router = express.Router();

const receivedWebhooks = {};
const playerMap = {
  Alchemy: 'U6DCHN9K2',
  AndreTheTirant: 'U8K4LBSBZ',
  Anvil: 'U6BHKHAUD',
  flaherty0077: 'U6CACS3GW',
  'Michael Flaherty': 'U011B7Y728P',
  RustdNails: 'U6AT12XSM',
  Troycar: 'U011M4KTW7J',
};

const getSlackUser = (civUser) => {
  if (!playerMap[civUser]) {
    return civUser;
  }
  return `<@${playerMap[civUser]}>`;
};

const isOurGame = (gameName) => {
  return gameName.includes('burger');
};

const civWebhookHandler = async ({ value1, value2, value3 }) => {
  if (!isOurGame(value1)) {
    return;
  }
  const argumentHash = hash({ value1, value2, value3 });
  if (receivedWebhooks[argumentHash] != null) {
    return;
  }
  receivedWebhooks[argumentHash] = { value1, value2, value3 };
  const playerName = getSlackUser(value2) || value2;
  const message = `${playerName} new turn! Game ${value1}. Turn number ${value3}.`;
  console.log(message);
  await sendSlackMessage(channelMap.cabin, message);
};

router.get('/', async (req, res) => {
  await civWebhookHandler(
    req.query as { value1: string; value2: string; value3: string }
  );
  res.send('Ok\n');
});

router.post('/', async (req, res) => {
  await civWebhookHandler(req.body);
  res.send('Ok\n');
});
