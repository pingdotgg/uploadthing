/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { inspect } from "node:util";
import type { ConsolaReporter, LogObject } from "consola/core";
import { createConsola, LogLevels } from "consola/core";

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
      return inspect(arg, { depth: 4 });
    });
  }

  log(logObj: LogObject) {
    const { type, tag, date, args } = logObj;

    const logPrefix = `[${tag} ${type.toUpperCase()} ${date.toLocaleTimeString()}]`;
    const lines = this.formatArgs(args)
      .join(" ") // concat all arguments to one space-separated string (like console does)
      .split("\n") // split all the newlines (e.g. from logged JSON.stringified objects)
      .map((l) => logPrefix + " " + l) // prepend the log prefix to each line
      .join("\n"); // join all the lines back together
    // eslint-disable-next-line no-console
    console.log(lines);
  }
}

export const logger = createConsola({
  reporters: [new Reporter()],
  defaults: {
    tag: "UPLOADTHING",
  },
});

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";
export const setLogLevel = (level: LogLevel = "info") => {
  logger.level = LogLevels[level];
  logger.info("Set log level", { level: logger.level });
};
