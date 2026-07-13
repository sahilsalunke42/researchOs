export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const httpErrors = {
  badRequest: (message = 'Bad request', code = 'BAD_REQUEST') => new HttpError(400, code, message),
  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') => new HttpError(401, code, message),
  forbidden: (message = 'Forbidden', code = 'FORBIDDEN') => new HttpError(403, code, message),
  notFound: (message = 'Not found', code = 'NOT_FOUND') => new HttpError(404, code, message),
  conflict: (message = 'Conflict', code = 'CONFLICT') => new HttpError(409, code, message),
  internal: (message = 'Internal server error', code = 'INTERNAL') => new HttpError(500, code, message)
};
