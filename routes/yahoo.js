const express = require("express");
const router = express.Router();

const fantasy = require("../clients/fantasy")

router.get("/redirect", (req, res) => {
  console.log("Redirect request.");
  fantasy.auth(res);
});

router.get("/callback", (req, res) => {
  fantasy.authCallback(req, (err) => {
    if (err) {
      return res.redirect("/error");
    }

    return res.redirect("/");
  });
});

module.exports = router;
