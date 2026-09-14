import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';

export function agentAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-agent-token'] || req.query.token;
  if (!token || token !== env.AGENT_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Agent Token' });
  }
  next();
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Can be extended for session/bearer token, for now accepts optional header or defaults in local mode
  next();
}
