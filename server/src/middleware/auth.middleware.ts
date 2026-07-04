import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';
import { httpErrors } from '../errors/httpErrors.js';

interface JwtPayload { sub: string; }

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[CONSTANTS.COOKIE_NAME];
  if (!token || typeof token !== 'string') {
    return next(httpErrors.unauthorized('Not authenticated', 'NOT_AUTHENTICATED'));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded.sub) throw new Error('Missing sub');
    req.userId = decoded.sub;
    next();
  } catch {
    next(httpErrors.unauthorized('Invalid session', 'INVALID_SESSION'));
  }
};
