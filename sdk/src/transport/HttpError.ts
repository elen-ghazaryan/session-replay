export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// 5xx and 429 are transient. A network failure isn't an HttpError, so it has
// no status — retry those too. Other 4xx mean the payload is bad: resending the
// same bytes can't fix it.
export function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) {
    return err.status >= 500 || err.status === 429;
  }
  return true;
}
