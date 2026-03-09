export { logger, createLogger } from './logger.js';

// Pre-configured loggers for major components
import { createLogger } from './logger.js';

export const httpLogger = createLogger('http');
export const slackLogger = createLogger('slack');
export const ootpLogger = createLogger('ootp');
export const simulationLogger = createLogger('simulation');
export const s3Logger = createLogger('s3');
export const aiLogger = createLogger('ai');
