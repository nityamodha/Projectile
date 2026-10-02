export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function compareIsoDates(a: string, b: string) {
  return parseIsoDate(a).getTime() - parseIsoDate(b).getTime();
}

export function isWorkingDay(date: Date) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

export function nextWorkingDay(value: string) {
  const date = parseIsoDate(value);
  do {
    date.setUTCDate(date.getUTCDate() + 1);
  } while (!isWorkingDay(date));
  return isoDate(date);
}

export function normalizeToWorkingDay(value: string) {
  const date = parseIsoDate(value);
  while (!isWorkingDay(date)) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return isoDate(date);
}

export function addWorkingDays(startDate: string, duration: number) {
  if (duration <= 0) {
    return normalizeToWorkingDay(startDate);
  }

  const date = parseIsoDate(normalizeToWorkingDay(startDate));
  let counted = 1;

  while (counted < duration) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (isWorkingDay(date)) {
      counted += 1;
    }
  }

  return isoDate(date);
}

export function minIsoDate(values: string[]) {
  return values.toSorted(compareIsoDates)[0] ?? null;
}

export function maxIsoDate(values: string[]) {
  return values.toSorted(compareIsoDates).at(-1) ?? null;
}
