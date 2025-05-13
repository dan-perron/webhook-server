import createError from 'http-errors';
import express from 'express';

import civilizationRouter from './routes/civilization.js';
import slackRouter from './routes/slack.js';
import testRouter from './routes/test.js';
import indexRouter from './routes/index.js';
import yahooRouter from './routes/yahoo.js';
import './bin/ootpFileManager.js';
import './bin/slackApi.js';
import './bin/simulationScheduler.js';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/civilization', civilizationRouter);
app.use('/slack', slackRouter);
app.use('/test', testRouter);
app.use('/yahoo', yahooRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error\n');
  next();
});
process.on('unhandledRejection', (error: Error) => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
});
