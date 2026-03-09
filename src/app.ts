import createError from 'http-errors';
import express from 'express';
import morgan from 'morgan';

import civilizationRouter from './routes/civilization.js';
import slackRouter from './routes/slack.js';
import testRouter from './routes/test.js';
import indexRouter from './routes/index.js';
import yahooRouter from './routes/yahoo.js';
import './bin/ootpFileManager.js';
import './bin/slackApi.js';
import './bin/simulationScheduler.js';
import { httpLogger } from './utils/logging/index.js';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom Morgan stream that writes to Winston
const morganStream = {
  write: (message: string) => {
    httpLogger.info(message.trim());
  },
};

// Add Morgan HTTP logging
app.use(morgan('combined', { stream: morganStream }));

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
  httpLogger.error('Unhandled rejection', {
    error: error.message,
    stack: error.stack,
  });
});
