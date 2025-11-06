import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config.js';
import { errorTracker, shouldLogAsError, AppError } from '../utils/errors.js';

/**
 * Log levels
 */
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

/**
 * Tool call log entry
 */
export interface ToolCallLog {
    toolName: string;
    inputs: any;
    outputs?: any;
    error?: string;
    latencyMs: number;
    timestamp: string;
}

/**
 * Tool call statistics
 */
export interface ToolCallStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageLatencyMs: number;
    callsByTool: Record<string, number>;
}

/**
 * Logger class for structured logging
 */
export class Logger {
    private toolCallLogs: ToolCallLog[];
    private toolCallStats: {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        totalLatency: number;
        callsByTool: Map<string, number>;
    };

    constructor() {
        this.toolCallLogs = [];
        this.toolCallStats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalLatency: 0,
            callsByTool: new Map(),
        };
    }

    /**
     * Format log message with timestamp and level
     */
    private formatMessage(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    /**
     * Check if log level should be printed
     */
    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const configLevel = config.logging.level as LogLevel;
        const configLevelIndex = levels.indexOf(configLevel);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex >= configLevelIndex;
    }

    /**
     * Log debug message
     */
    debug(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }

    /**
     * Log info message
     */
    info(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(this.formatMessage(LogLevel.INFO, message, meta));
        }
    }

    /**
     * Log warning message
     */
    warn(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, meta));
        }
    }

    /**
     * Log error message
     */
    error(message: string, error?: Error | AppError, meta?: any): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const errorInfo = error ? {
                message: error.message,
                stack: error.stack,
                ...(error instanceof AppError ? { code: error.code, statusCode: error.statusCode } : {}),
            } : undefined;
            
            console.error(this.formatMessage(LogLevel.ERROR, message, { ...meta, error: errorInfo }));
        }
    }

    /**
     * Log tool call with inputs, outputs, and latency
     */
    logToolCall(toolName: string, inputs: any, outputs: any, latencyMs: number, error?: Error): void {
        const timestamp = new Date().toISOString();
        
        const log: ToolCallLog = {
            toolName,
            inputs,
            outputs: error ? undefined : outputs,
            error: error ? error.message : undefined,
            latencyMs,
            timestamp,
        };

        // Store log
        this.toolCallLogs.push(log);
        
        // Limit log storage to last 1000 entries
        if (this.toolCallLogs.length > 1000) {
            this.toolCallLogs.shift();
        }

        // Update statistics
        this.toolCallStats.totalCalls++;
        this.toolCallStats.totalLatency += latencyMs;
        
        if (error) {
            this.toolCallStats.failedCalls++;
        } else {
            this.toolCallStats.successfulCalls++;
        }

        const currentCount = this.toolCallStats.callsByTool.get(toolName) || 0;
        this.toolCallStats.callsByTool.set(toolName, currentCount + 1);

        // Log to console
        if (error) {
            this.error(`Tool call failed: ${toolName}`, error, { inputs, latencyMs });
        } else {
            this.info(`Tool call succeeded: ${toolName}`, { latencyMs });
        }
    }

    /**
     * Get tool call statistics
     */
    getToolCallStats(): ToolCallStats {
        const callsByTool: Record<string, number> = {};
        this.toolCallStats.callsByTool.forEach((count, tool) => {
            callsByTool[tool] = count;
        });

        return {
            totalCalls: this.toolCallStats.totalCalls,
            successfulCalls: this.toolCallStats.successfulCalls,
            failedCalls: this.toolCallStats.failedCalls,
            averageLatencyMs: this.toolCallStats.totalCalls > 0 
                ? Math.round(this.toolCallStats.totalLatency / this.toolCallStats.totalCalls)
                : 0,
            callsByTool,
        };
    }

    /**
     * Get recent tool call logs
     */
    getRecentToolCallLogs(limit: number = 100): ToolCallLog[] {
        return this.toolCallLogs.slice(-limit);
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.toolCallStats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalLatency: 0,
            callsByTool: new Map(),
        };
        this.toolCallLogs = [];
    }
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    if (!config.logging.logRequests) {
        return next();
    }

    const startTime = Date.now();
    const { method, url, ip } = req;

    // Log request
    logger.debug(`Incoming ${method} ${url}`, { ip, body: req.body });

    // Log response when finished
    res.on('finish', () => {
        const latency = Date.now() - startTime;
        const { statusCode } = res;
        
        if (statusCode >= 400) {
            logger.warn(`${method} ${url} - ${statusCode}`, { latency, ip });
        } else {
            logger.info(`${method} ${url} - ${statusCode}`, { latency });
        }
    });

    next();
}

/**
 * Error handling middleware
 */
export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction): void {
    // Track error
    if (err instanceof AppError) {
        errorTracker.track(err.code);
    } else {
        errorTracker.track('INTERNAL_ERROR');
    }

    // Log error
    if (shouldLogAsError(err)) {
        logger.error('Request error occurred', err, {
            method: req.method,
            url: req.url,
            ip: req.ip,
        });
    } else {
        logger.warn(`Operational error: ${err.message}`, {
            method: req.method,
            url: req.url,
        });
    }

    // Send error response
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
    
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message: err.message,
            timestamp: new Date().toISOString(),
        },
    });
}

// Export singleton logger instance
export const logger = new Logger();

