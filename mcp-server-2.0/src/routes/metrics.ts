import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger.js';
import { errorTracker } from '../utils/errors.js';
import { earthquakeCache } from '../cache/earthquakeCache.js';

const router = Router();

/**
 * Metrics response interface
 */
interface MetricsResponse {
    timestamp: string;
    toolCalls: {
        total: number;
        successful: number;
        failed: number;
        successRate: number;
        averageLatencyMs: number;
        callsByTool: Record<string, number>;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number;
        totalKeys: number;
    };
    errors: {
        total: number;
        byCode: Record<string, number>;
    };
    performance: {
        memory: {
            heapUsedMB: number;
            heapTotalMB: number;
            externalMB: number;
            rss: number;
        };
        cpu: NodeJS.CpuUsage;
    };
}

/**
 * GET /metrics
 * Metrics endpoint for monitoring
 */
router.get('/', (req: Request, res: Response) => {
    try {
        // Get tool call statistics
        const toolCallStats = logger.getToolCallStats();

        // Get cache statistics
        const cacheStats = earthquakeCache.getStats();

        // Get error statistics
        const errorStats = errorTracker.getStats();
        const totalErrors = errorTracker.getTotalErrors();

        // Get memory usage
        const memoryUsage = process.memoryUsage();

        // Get CPU usage
        const cpuUsage = process.cpuUsage();

        // Calculate success rate
        const successRate = toolCallStats.totalCalls > 0
            ? Math.round((toolCallStats.successfulCalls / toolCallStats.totalCalls) * 10000) / 100
            : 100;

        const metrics: MetricsResponse = {
            timestamp: new Date().toISOString(),
            toolCalls: {
                total: toolCallStats.totalCalls,
                successful: toolCallStats.successfulCalls,
                failed: toolCallStats.failedCalls,
                successRate,
                averageLatencyMs: toolCallStats.averageLatencyMs,
                callsByTool: toolCallStats.callsByTool,
            },
            cache: {
                hits: cacheStats.hits,
                misses: cacheStats.misses,
                hitRate: cacheStats.hitRate,
                totalKeys: cacheStats.keys,
            },
            errors: {
                total: totalErrors,
                byCode: errorStats,
            },
            performance: {
                memory: {
                    heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
                    externalMB: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
                    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
                },
                cpu: cpuUsage,
            },
        };

        res.json(metrics);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve metrics',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * POST /metrics/reset
 * Reset metrics (useful for testing)
 */
router.post('/reset', (req: Request, res: Response) => {
    try {
        logger.resetStats();
        errorTracker.reset();
        
        res.json({
            success: true,
            message: 'Metrics reset successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to reset metrics',
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;

