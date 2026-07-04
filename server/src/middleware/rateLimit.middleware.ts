import rateLimit from 'express-rate-limit';
import { CONSTANTS } from '../config/constants.js';

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } }
};

export const authLimiter = rateLimit({
  ...shared,
  windowMs: CONSTANTS.RATE_LIMIT_AUTH.windowMs,
  max: CONSTANTS.RATE_LIMIT_AUTH.max
});

export const defaultLimiter = rateLimit({
  ...shared,
  windowMs: CONSTANTS.RATE_LIMIT_DEFAULT.windowMs,
  max: CONSTANTS.RATE_LIMIT_DEFAULT.max
});
