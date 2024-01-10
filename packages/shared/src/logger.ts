/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { ConsolaOptions, ConsolaReporter, LogObject } from "consola/core";
import { createConsola, LogTypes } from "consola/core";

class Reporter implements ConsolaReporter {
  private formatStack(stack: string) {
    return (
      "  " +
      stack
        .split("\n")
        .splice(1)
        .map((l) =>
          l
            .trim()
            .replace("file://", "")
            .replace(process.cwd() + "/", ""),
        )
        .join("\n  ")
    );
  }

  private formatArgs(args: any[]) {
    const fmtArgs = args.map((arg) => {
      if (arg && typeof arg.stack === "string") {
        return arg.message + "\n" + this.formatStack(arg.stack);
      }
      return arg;
    });

    return fmtArgs.map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }
      return JSON.stringify(arg, null, 2);
    });
  }

  private formatLogObj(logObj: LogObject) {
    const message = this.formatArgs(logObj.args);
    const bracket = (x: string) => (x ? `[${x}]` : "");

    return [bracket(logObj.type), bracket(logObj.tag), message]
      .filter(Boolean)
      .join(" ");
  }

  log(logObj: LogObject, _ctx: { options: ConsolaOptions }) {
    const line = this.formatLogObj(logObj);
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = createConsola({
  reporters: [new Reporter()],
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
});

const levels = {
  log: 1,
  info: 2,
  trace: 3,
};
export type LogLevel = keyof typeof levels;
export const setLogLevel = (level?: LogLevel) => {
  logger.level = (level ? levels[level] : 0) + 3;
  logger.info("Set log level", { level: logger.level });
};
