import { inspect } from "node:util";
import type { LogObject, LogType } from "consola/core";
import { createConsola, LogLevels } from "consola/core";

import { isObject } from "@uploadthing/shared";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

const colorize = (str: string, level: LogType) => {
  // TODO: Maybe check is shell supports colors

  switch (level) {
    case "error":
    case "fatal":
      return `\x1b[41m\x1b[30m${str}\x1b[0m`;
    case "warn":
      return `\x1b[43m\x1b[30m${str}\x1b[0m`;
    case "info":
    case "log":
      return `\x1b[44m\x1b[30m${str}\x1b[0m`;
    case "debug":
      return `\x1b[47m\x1b[30m${str}\x1b[0m`;
    case "trace":
      return `\x1b[47m\x1b[30m${str}\x1b[0m`;
    case "success":
      return `\x1b[42m\x1b[30m${str}\x1b[0m`;
    default:
      return str;
  }
};

const icons: { [t in LogType]?: string } = {
  fatal: "⨯",
  error: "⨯",
  warn: "⚠️",
  info: "ℹ",
  log: "ℹ",
  debug: "⚙",
  trace: "→",
  success: "✓",
};

function formatStack(stack: string) {
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

function formatArgs(args: any[]) {
  const fmtArgs = args.map((arg) => {
    if (isObject(arg) && typeof arg.stack === "string") {
      return (arg.message as string) + "\n" + formatStack(arg.stack);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return arg;
  });

  return fmtArgs.map((arg) => {
    if (typeof arg === "string") {
      return arg;
    }
    try {
      // prefer inspect over JSON.stringify because it handles circular references, prints classes etc
      return inspect(arg, { depth: 4 });
    } catch {
      // fallback to JSON.stringify if inspect fails e.g. if runtime doesn't have util module
      return JSON.stringify(arg, null, 4);
    }
  });
}

export const logger = createConsola({
  reporters: [
    {
      log: (logObj: LogObject) => {
        const { type, tag, date, args } = logObj;
        const icon = icons[type as LogLevel];

        const logPrefix = colorize(
          ` ${icon} ${tag} ${date.toLocaleTimeString()} `,
          type as LogLevel,
        );
        const lines = formatArgs(args)
          .join(" ") // concat all arguments to one space-separated string (like console does)
          .split("\n") // split all the newlines (e.g. from logged JSON.stringified objects)
          .map((l) => logPrefix + " " + l) // prepend the log prefix to each line
          .join("\n"); // join all the lines back together

        // eslint-disable-next-line no-console
        console.log(lines);
      },
    },
  ],
  defaults: {
    tag: "UPLOADTHING",
  },
});

export const initLogger = (level: LogLevel | undefined) => {
  // logger.wrapConsole();
  logger.level = LogLevels[level ?? "info"];
  logger.info("Set log level", { level: logger.level });
};
