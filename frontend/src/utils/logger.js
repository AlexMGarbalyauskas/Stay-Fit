//logger.js - A simple logging utility for the Stay Fit frontend application. 
// Provides log, warn, and error functions that only output messages 
// in development mode when the REACT_APP_DEBUG_LOGS environment variable is set to 'true'. 
// This helps keep production console clean while allowing detailed logs during development.



// The log, warn, and error functions check the 
// environment before logging messages.
const isProd = process.env.NODE_ENV === 'production';
const allowDebug = process.env.REACT_APP_DEBUG_LOGS === 'true';



// Log a message to the console if in development 
// mode and debug logs are allowed
export const log = (...args) => {
  if (!isProd && allowDebug) console.log(...args);
};


// Log a warning message to the console if in development
export const warn = (...args) => {
  if (!isProd && allowDebug) console.warn(...args);
};


// Log an error message to the console if in development
export const error = (...args) => {
  if (!isProd && allowDebug) console.error(...args);
};
