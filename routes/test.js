const express = require("express");
const config = require("config");
const router = express.Router();

const { IncomingWebhook } = require("@slack/webhook");
const SlackWebhook = new IncomingWebhook(config.get("slackWebhookUrls.test"));

router.post("/", async (req, res) => {
  console.log(`Sending ${req.body} to slack test channel.`);
  await SlackWebhook.send(req.body);
  res.send("Ok\n");
});

module.exports = router;
