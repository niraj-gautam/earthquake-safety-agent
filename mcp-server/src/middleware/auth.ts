import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config.js';
import { logger } from './logger.js';

/**
 * API Key authentication middleware
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
    // Skip auth if disabled (for development)
    if (!config.security.enableAuth) {
        return next();
    }

    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
        logger.warn('Authentication failed: No API key provided', {
            ip: req.ip,
            url: req.url,
        });
        
         res.status(401).json({
            jsonrpc: '2.0',
            error: {
                code: -32001,
                message: 'Unauthorized: API key required'
            },
            id: null
        });
        return;
    }

    if (apiKey !== config.security.apiKey) {
        logger.warn('Authentication failed: Invalid API key', {
            ip: req.ip,
            url: req.url,
        });
        
        res.status(401).json({
            jsonrpc: '2.0',
            error: {
                code: -32001,
                message: 'Unauthorized: Invalid API key'
            },
            id: null
        });
        return;
    }

    // Valid API key - proceed
    next();
}

