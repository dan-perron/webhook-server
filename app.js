const createError = require("http-errors");
const express = require("express");

const civilizationRouter = require("./routes/civilization");
const slackRouter = require("./routes/slack");
const testRouter = require("./routes/test");
const indexRouter = require("./routes/index");
require("./bin/fileWatch");
require("./bin/slackApi");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/civilization", civilizationRouter);
app.use("/slack", slackRouter);
app.use("/test", testRouter);
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error\n");
});
process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection", error.message);
});

module.exports = app;
