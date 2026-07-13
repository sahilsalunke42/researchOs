import type { Request, Response, NextFunction, CookieOptions } from 'express';
import { authService } from '../services/auth.service.js';
import { CONSTANTS } from '../config/constants.js';
import { env } from '../config/env.js';

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CONSTANTS.JWT_TTL_SECONDS * 1000,
    path: '/'
  };
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.register(req.body);
      res.cookie(CONSTANTS.COOKIE_NAME, token, cookieOptions());
      res.json({ user });
    } catch (err) { next(err); }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.login(req.body);
      res.cookie(CONSTANTS.COOKIE_NAME, token, cookieOptions());
      res.json({ user });
    } catch (err) { next(err); }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie(CONSTANTS.COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.userId!);
      res.json({ user });
    } catch (err) { next(err); }
  }
};
