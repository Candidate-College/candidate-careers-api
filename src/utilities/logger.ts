const logEnabled = (process.env.ENABLE_LOG || 'false') === 'true';

const string = require('./string');

/**
 * Utility on top of `console` function.
 * Sends log to terminal.
 * 
 * @param level 
 * @param args 
 */
const log = (level: keyof Console, ...args: any[]): void => {
  if (logEnabled) {
    // Get the current timestamp in Y-m-d H:i:s format
    const timestamp = new Date().toISOString();

    // Prepend timestamp and log level
    args.unshift(`[${timestamp}] ${string.ucfirst(level)}:`);

    // Output the log to the console
    (console[level] as (...args: any[]) => void)(...args);
  }
};

exports.log = (...args: any[]): void => log('log', ...args);
exports.info = (...args: any[]): void => log('info', ...args);
exports.error = (...args: any[]): void => log('error', ...args);
