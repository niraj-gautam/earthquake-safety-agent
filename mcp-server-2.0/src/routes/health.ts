import { Router, Request, Response } from 'express';
import { earthquakeCache } from '../cache/earthquakeCache.js';
import { config } from '../config/config.js';
import axios from 'axios';

const router = Router();

// Server start time for uptime calculation
const startTime = Date.now();

/**
 * Health check response interface
 */
interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: {
        seconds: number;
        formatted: string;
    };
    server: {
        version: string;
        environment: string;
        port: number;
    };
    cache: {
        enabled: boolean;
        stats: {
            hits: number;
            misses: number;
            hitRate: number;
            keys: number;
        };
    };
    externalServices: {
        usgs: {
            status: 'available' | 'unavailable' | 'checking';
            responseTimeMs?: number;
            lastChecked?: string;
        };
    };
}

/**
 * Format uptime duration
 */
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
}

/**
 * Check USGS API availability
 */
async function checkUSGSAPI(): Promise<{ available: boolean; responseTimeMs?: number }> {
    try {
        const startTime = Date.now();
        
        // Make a minimal request to check API availability
        const response = await axios.get(config.usgs.baseUrl, {
            params: {
                format: 'geojson',
                starttime: new Date(Date.now() - 3600000).toISOString(), // Last hour
                endtime: new Date().toISOString(),
                limit: 1,
            },
            timeout: 5000, // 5 second timeout for health check
        });

        const responseTimeMs = Date.now() - startTime;

        return {
            available: response.status === 200,
            responseTimeMs,
        };
    } catch (error) {
        return {
            available: false,
        };
    }
}

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        // Calculate uptime
        const uptimeSeconds = (Date.now() - startTime) / 1000;

        // Get cache stats
        const cacheStats = earthquakeCache.getStats();

        // Check USGS API (with timeout)
        let usgsStatus: 'available' | 'unavailable' | 'checking' = 'checking';
        let usgsResponseTime: number | undefined;

        const usgsCheck = await Promise.race([
            checkUSGSAPI(),
            new Promise<{ available: boolean; responseTimeMs?: number }>((resolve) =>
                setTimeout(() => resolve({ available: false }), 5000)
            ),
        ]);

        usgsStatus = usgsCheck.available ? 'available' : 'unavailable';
        usgsResponseTime = usgsCheck.responseTimeMs;

        // Determine overall health status
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        
        if (usgsStatus === 'unavailable') {
            overallStatus = 'degraded';
        }

        const healthResponse: HealthCheckResponse = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: Math.floor(uptimeSeconds),
                formatted: formatUptime(uptimeSeconds),
            },
            server: {
                version: '1.0.0',
                environment: config.server.nodeEnv,
                port: config.server.port,
            },
            cache: {
                enabled: true,
                stats: cacheStats,
            },
            externalServices: {
                usgs: {
                    status: usgsStatus,
                    responseTimeMs: usgsResponseTime,
                    lastChecked: new Date().toISOString(),
                },
            },
        };

        // Set appropriate HTTP status code
        const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

        res.status(httpStatus).json(healthResponse);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});

export default router;

