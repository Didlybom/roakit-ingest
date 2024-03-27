export const ONE_HOUR = 60 * 60 * 1000;
export const ONE_DAY = 24 * ONE_HOUR;

export const hourBucket = (timestamp: number) => {
  return new Date(timestamp).toISOString().slice(0, 13) + 'Z';
};

export const toTimestamp = (str: string | undefined) => (str ? new Date(str).getTime() : undefined);
