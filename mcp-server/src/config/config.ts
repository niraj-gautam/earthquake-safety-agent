import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration interface
 */
export interface Config {
    server: {
        port: number;
        nodeEnv: string;
    };
    security: {
        enableAuth: boolean;
        apiKey: string;
        enableCors: boolean;
        allowedOrigins: string[];
    };
    cache: {
        defaultTTL: number;
        historicalTTL: number;
        checkPeriod: number;
    };
    usgs: {
        apiTimeout: number;
        maxRetries: number;
        baseUrl: string;
    };
    logging: {
        level: string;
        logRequests: boolean;
    };
}

/**
 * Parse environment variable as number with fallback
 */
function getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as boolean with fallback
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
}

/**
 * Application configuration
 */
export const config: Config = {
    server: {
        port: getEnvNumber('PORT', 3000),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    security: {
        enableAuth: getEnvBoolean('ENABLE_AUTH', true),
        apiKey: process.env.API_KEY || '',
        enableCors: getEnvBoolean('ENABLE_CORS', true),
        allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(','),
    },
    cache: {
        // TTL in seconds for recent/current data (default 5 minutes)
        defaultTTL: getEnvNumber('CACHE_DEFAULT_TTL', 300),
        // TTL in seconds for historical data (default 1 hour)
        historicalTTL: getEnvNumber('CACHE_HISTORICAL_TTL', 3600),
        // Cache check period in seconds
        checkPeriod: getEnvNumber('CACHE_CHECK_PERIOD', 120),
    },
    usgs: {
        // API timeout in milliseconds
        apiTimeout: getEnvNumber('USGS_API_TIMEOUT', 10000),
        // Maximum number of retries for failed requests
        maxRetries: getEnvNumber('USGS_MAX_RETRIES', 3),
        // USGS API base URL
        baseUrl: process.env.USGS_API_BASE_URL || '',
    },
    logging: {
        // Log level: debug, info, warn, error
        level: process.env.LOG_LEVEL || 'info',
        // Whether to log all HTTP requests
        logRequests: getEnvBoolean('LOG_REQUESTS', true),
    },
};

export default config;

