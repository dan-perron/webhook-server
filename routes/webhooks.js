const express = require("express");
const router = express.Router();

let receivedWebhooks = {};

let civWebhookHandler = ({ value1, value2, value3 }) => {
  console.log(
    `Game ${value1} has a new turn for ${value2}. Turn number ${value3}.`
  );
};

router.get("/", (req, res) => {
  civWebhookHandler(req.query);
  res.send("Ok");
});

router.post("/", (req, res) => {
  civWebhookHandler(req.body);
  res.send("Ok\n");
});

module.exports = router;
