const isDev = Boolean(
  (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
);

export const devLog = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const devWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};

export const devError = (...args: unknown[]): void => {
  if (isDev) console.error(...args);
};
