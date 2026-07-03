export const CONSTANTS = Object.freeze({
  JWT_TTL_SECONDS: 60 * 60 * 24 * 7,
  COOKIE_NAME: 'ros_session',
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT_AUTH: { windowMs: 60_000, max: 10 },
  RATE_LIMIT_DEFAULT: { windowMs: 60_000, max: 100 }
});
