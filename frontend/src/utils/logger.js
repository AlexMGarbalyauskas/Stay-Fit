const isProd = process.env.NODE_ENV === 'production';
const allowDebug = process.env.REACT_APP_DEBUG_LOGS === 'true';

export const log = (...args) => {
  if (!isProd && allowDebug) console.log(...args);
};

export const warn = (...args) => {
  if (!isProd && allowDebug) console.warn(...args);
};

export const error = (...args) => {
  if (!isProd && allowDebug) console.error(...args);
};
