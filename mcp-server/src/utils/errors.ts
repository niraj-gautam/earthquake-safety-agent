/**
 * Base custom error class for all application errors
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, code: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;

        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Invalid time range error (400)
 */
export class InvalidTimeRangeError extends AppError {
    constructor(message: string) {
        super(message, 400, 'INVALID_TIME_RANGE');
        Object.setPrototypeOf(this, InvalidTimeRangeError.prototype);
    }
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends AppError {
    public readonly retryAfter?: number;

    constructor(message: string, retryAfter?: number) {
        super(message, 429, 'API_RATE_LIMIT');
        this.retryAfter = retryAfter;
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

/**
 * API unavailable error (503)
 */
export class APIUnavailableError extends AppError {
    constructor(message: string) {
        super(message, 503, 'API_UNAVAILABLE');
        Object.setPrototypeOf(this, APIUnavailableError.prototype);
    }
}

/**
 * API timeout error (504)
 */
export class APITimeoutError extends AppError {
    constructor(message: string) {
        super(message, 504, 'API_TIMEOUT');
        Object.setPrototypeOf(this, APITimeoutError.prototype);
    }
}

/**
 * Generic API error (500)
 */
export class APIError extends AppError {
    constructor(message: string) {
        super(message, 500, 'API_ERROR');
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

/**
 * Error response interface for consistent formatting
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        timestamp: string;
        details?: any;
    };
}

/**
 * Track error occurrences for metrics
 */
export class ErrorTracker {
    private errors: Map<string, number>;

    constructor() {
        this.errors = new Map();
    }

    /**
     * Track an error occurrence
     */
    track(errorCode: string): void {
        const current = this.errors.get(errorCode) || 0;
        this.errors.set(errorCode, current + 1);
    }

    /**
     * Get error statistics
     */
    getStats(): Record<string, number> {
        const stats: Record<string, number> = {};
        this.errors.forEach((count, code) => {
            stats[code] = count;
        });
        return stats;
    }

    /**
     * Get total error count
     */
    getTotalErrors(): number {
        let total = 0;
        this.errors.forEach(count => {
            total += count;
        });
        return total;
    }

    /**
     * Reset all error counts
     */
    reset(): void {
        this.errors.clear();
    }
}

/**
 * Format error for consistent client response
 */
export function formatErrorResponse(error: Error | AppError): ErrorResponse {
    const timestamp = new Date().toISOString();

    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                statusCode: error.statusCode,
                timestamp,
            },
        };
    }

    // Handle unknown errors
    return {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            statusCode: 500,
            timestamp,
        },
    };
}

/**
 * Determine if error should be logged as error (vs warning)
 */
export function shouldLogAsError(error: Error | AppError): boolean {
    if (error instanceof AppError) {
        return !error.isOperational || error.statusCode >= 500;
    }
    return true;
}

// Export singleton error tracker
export const errorTracker = new ErrorTracker();

