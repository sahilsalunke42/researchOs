import type { Request, Response, NextFunction } from 'express';
import { researchService } from '../services/research.service.js';

export const researchController = {
  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await researchService.runForUser(req.userId!, req.body);
      res.json({ research: result });
    } catch (err) {
      next(err);
    }
  }
};
