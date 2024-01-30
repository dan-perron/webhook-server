import createError from "http-errors";
import express from "express";

import * as civilizationRouter from "./routes/civilization.js";
import * as slackRouter from "./routes/slack.js";
import * as testRouter from "./routes/test.js";
import * as indexRouter from "./routes/index.js";
import * as yahooRouter from "./routes/yahoo.js";
import "./bin/ootpFileManager.js";
import "./bin/slackApi.js";

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/civilization", civilizationRouter.router);
app.use("/slack", slackRouter.router);
app.use("/test", testRouter.router);
app.use("/yahoo", yahooRouter.router);
app.use("/", indexRouter.router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error\n");
  next();
});
process.on("unhandledRejection", (error: Error) => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection", error.message);
});
