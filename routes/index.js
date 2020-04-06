const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  console.log("Root request.");
  res.send("Ok\n");
});

module.exports = router;
