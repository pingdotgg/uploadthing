import { createConsola, LogTypes } from "consola/core";

export const logger = createConsola({
  defaults: {
    tag: "uploadthing",
  },
  types: {
    // Bump up the level of `logger.log` to 4 == a single `-v` flag.
    ...LogTypes,
    log: {
      ...LogTypes.log,
      level: 4,
      type: "info",
    },
    // Bump up the level of `logger.debug` to 5 == `-vv` to show.
    debug: {
      ...LogTypes.debug,
      level: 5,
    },
    // Bump up the level of `logger.debug` to 6 == `-vvv` to show.
    trace: {
      ...LogTypes.trace,

      level: 6,
    },
  },
  formatOptions: {
    colors: true,
    date: true,
    compact: true,
  },
});

const levels = {
  log: 1,
  info: 2,
  trace: 3,
};
export type LogLevel = keyof typeof levels;
export const setLogLevel = (level?: LogLevel) => {
  logger.level = (level ? levels[level] : 0) + 3;
};
