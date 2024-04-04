export const ONE_HOUR = 60 * 60 * 1000;
export const ONE_DAY = 24 * ONE_HOUR;

export const hourBucket = (timestamp: number | Date) => {
  return (
    (timestamp instanceof Date ? timestamp : new Date(timestamp)).toISOString().slice(0, 13) + 'Z'
  );
};

const toFullISO = (hourBucket: string) => hourBucket.replace('Z', ':00:00.000Z');

export const getHourBuckets = (startDate: string, endDate: string) => {
  const start = new Date(toFullISO(startDate)).getTime();
  const end = new Date(toFullISO(endDate)).getTime();
  const buckets = [];
  for (let date = start; date <= end; date += ONE_HOUR) {
    buckets.push(hourBucket(date));
  }
  return buckets;
};

export const toTimestamp = (str: string | undefined) => (str ? new Date(str).getTime() : undefined);
