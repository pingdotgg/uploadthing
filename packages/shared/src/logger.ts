import { DANGEROUS__checkEnvironmentVariable } from "./utils";

const logLevels = {
  debug: 0,
  info: 1,
  silent: 999,
};

type LogLevel = keyof typeof logLevels;

const getLogLevel = () => {
  const level = DANGEROUS__checkEnvironmentVariable("UT_LOG_LEVEL") as LogLevel;

  // TODO: remove this log
  console.log(`[UT] Log level: ${level}`);

  return logLevels[level];
};

export const log = (message: string, tag?: string, buffer?: boolean) => {
  if (getLogLevel() <= logLevels.info) {
    const logTemplate = tag ? `(${tag}): ${message}` : message;
    const logStyle = "";

    if (buffer) {
      logBuffer.push({ message, tag, level: "info" });
      return;
    }

    console.log(`[UT] ${logTemplate}`, logStyle);
  }
};

export const debug = (message: string, tag?: string, buffer?: boolean) => {
  if (getLogLevel() <= logLevels.debug) {
    const logTemplate = tag ? `(${tag}): ${message}` : message;
    const logStyle = "color: #2196f3";

    if (buffer) {
      logBuffer.push({ message, tag, level: "debug" });
      return;
    }

    console.log(`%c[UT][DEBUG] ${logTemplate}`, logStyle);
  }
};

// ----------------------------------------------------------------------------
// I'd really like to be able to buffer logs and then flush them all at once,
// but it needs to be resilient to crashes. In node, we could probably use
// process.on("beforeExit") to flush the logs, but in other environments I am
// less sure how to do this.

type LogMessage = {
  message: string;
  tag?: string;
  level: LogLevel;
};

const logBuffer: LogMessage[] = [];

export const flush = (prefix?: string) => {
  const level = logBuffer.every((log) => log.level === logBuffer[0].level);
  const tag = logBuffer.every((log) => log.tag === logBuffer[0].tag);

  const logHeader = `%c[UT]${
    level ? `[${logBuffer[0].level.toUpperCase()}]` : ""
  }${tag ? `(${logBuffer[0].tag})` : ""}${prefix ? `: ${prefix}\n` : ":\n"}`;

  const logBody = logBuffer.map((log) => {
    const logTemplate = log.tag ? `(${log.tag}): ${log.message}` : log.message;
    return log.tag ? `%c${logTemplate}` : logTemplate;
  });

  const logStyles = logBuffer.map((log) => {
    if (log.level === "debug") return "color: #2196f3";
    return undefined;
  });

  const allDebug = level && logBuffer[0].level === "debug";

  console.log(
    `${allDebug ? `%c${logHeader}` : logHeader}`,
    allDebug ? "color: #2196f3" : undefined,
  );
  logBody.forEach((log, i) => {
    console.log(`\t${log}\n`, logStyles[i]);
  });

  // empty the buffer
  logBuffer.length = 0;
};

export const indentObject = (obj: Record<string, unknown>) => {
  const objString = JSON.stringify(obj, null, 2);

  if (typeof objString === "string") return objString.replace(/\n/g, "\n\t");
  return objString;
};
