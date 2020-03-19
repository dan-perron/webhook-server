const express = require("express");
const config = require("config");
const router = express.Router();

const hash = require("object-hash");
const { IncomingWebhook } = require("@slack/webhook");
const SlackWebhook = new IncomingWebhook(config.get("webhookUrl"));

let receivedWebhooks = {};

let civWebhookHandler = async ({ value1, value2, value3 }) => {
  let argumentHash = hash({ value1, value2, value3 });
  if (receivedWebhooks[argumentHash] != null) {
    return;
  }
  receivedWebhooks[argumentHash] = { value1, value2, value3 };
  let message = `Game ${value1} has a new turn for ${value2}. Turn number ${value3}.`;
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
