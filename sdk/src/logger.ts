type LogLevel = 'silent' | 'error' | 'warn' | 'info';

const RANK: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
};

const PREFIX = '[tracker]';

let currentLevel: LogLevel = 'warn';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function enabled(level: LogLevel): boolean {
  return RANK[level] <= RANK[currentLevel];
}

export const log = {
  error: (...a: unknown[]) => {
    if (enabled('error')) console.error(PREFIX, ...a);
  },
  warn: (...a: unknown[]) => {
    if (enabled('warn')) console.warn(PREFIX, ...a);
  },
  info: (...a: unknown[]) => {
    if (enabled('info')) console.info(PREFIX, ...a);
  },
};
