import { Request, Response, NextFunction } from 'express';
import type { RuntimeConfig } from './types.js';

export interface AuthenticatedRequest extends Request {
  auth?: {
    token?: string;
  };
}

export function createAuthMiddleware(config: RuntimeConfig) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip auth for health checks or non-protected routes
    if (req.path === '/health' || !req.path.startsWith('/new-note')) {
      return next();
    }

    // If no token is configured, auth is effectively disabled.
    if (!config.authToken) {
      return next();
    }

    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: 'failed',
        errorCode: 'AUTH_MISSING',
        reason: 'Authorization header is required'
      });
    }

    // Parse Bearer token
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    if (!match) {
      return res.status(401).json({
        status: 'failed',
        errorCode: 'AUTH_INVALID_FORMAT',
        reason: 'Authorization header must be in format: Bearer <token>'
      });
    }

    const token = match[1];
    
    // Validate token against config
    if (config.authToken && token !== config.authToken) {
      return res.status(401).json({
        status: 'failed',
        errorCode: 'AUTH_INVALID_TOKEN',
        reason: 'Invalid authorization token'
      });
    }

    // Attach auth info to request
    req.auth = {
      token
    };

    next();
  };
}

export function validateAuthConfig(config: RuntimeConfig): void {
  // For HTTP mode, auth token is optional.
  if (!config.authToken) {
    console.warn('Warning: EDGES_AUTH_TOKEN is not set. HTTP auth is disabled for /new-note.');
  }
}
