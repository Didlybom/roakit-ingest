export const hourBucket = (timestamp: number) => {
  return new Date(timestamp).toISOString().slice(0, 13) + 'Z';
};
