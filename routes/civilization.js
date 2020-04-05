const express = require("express");
const config = require("config");
const router = express.Router();

const hash = require("object-hash");
const { IncomingWebhook } = require("@slack/webhook");
const SlackWebhook = new IncomingWebhook(config.get("webhookUrl"));

let receivedWebhooks = {};
let playerMap = {
  Alchemy: "U6DCHN9K2",
  AndreTheTirant: "U8K4LBSBZ",
  Anvil: "U6BHKHAUD",
  flaherty0077: "U6CACS3GW",
  RustdNails: "U6AT12XSM",
  "Michael Flaherty": "U011B7Y728P",
};

let getSlackUser = civUser => {
  if (!playerMap[civUser]) {
    return civUser;
  }
  return `<@${playerMap[civUser]}>`;
};

let civWebhookHandler = async ({ value1, value2, value3 }) => {
  let argumentHash = hash({ value1, value2, value3 });
  if (receivedWebhooks[argumentHash] != null) {
    return;
  }
  receivedWebhooks[argumentHash] = { value1, value2, value3 };
  let playerName = getSlackUser(value2) || value2;
  let message = `Game ${value1} has a new turn for ${playerName}. Turn number ${value3}.`;
  console.log(message);
  await SlackWebhook.send({ text: message });
};

router.get("/", async (req, res) => {
  await civWebhookHandler(req.query);
  res.send("Ok\n");
});

router.post("/", async (req, res) => {
  await civWebhookHandler(req.body);
  res.send("Ok\n");
});

router.post("/test", async (req, res) => {
  await SlackWebhook.send(req.body);
  res.send("Ok\n");
});

module.exports = router;
