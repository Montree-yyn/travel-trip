export interface DataLoadStatus {
  ready: boolean;
  errorKey?: string;
}

export function createArrayStatus<T>(value: unknown, errorKey: string): { data: T[]; status: DataLoadStatus } {
  if (!Array.isArray(value)) {
    return { data: [], status: { ready: false, errorKey } };
  }
  return { data: value as T[], status: { ready: true } };
}

export function createObjectStatus<T extends object>(
  value: unknown,
  errorKey: string,
  fallback: T,
): { data: T; status: DataLoadStatus } {
  if (!value || typeof value !== "object") {
    return { data: fallback, status: { ready: false, errorKey } };
  }
  return { data: value as T, status: { ready: true } };
}
