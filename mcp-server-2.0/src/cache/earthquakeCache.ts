import NodeCache from 'node-cache';
import { config } from '../config/config.js';

/**
 * Cache parameters interface
 */
export interface CacheParams {
    from: string;
    to: string;
    min_magnitude?: number;
    region?: string;
    lat?: number;
    lon?: number;
    radius_km?: number;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    keys: number;
}

/**
 * Earthquake cache class for caching API responses
 */
export class EarthquakeCache {
    private cache: NodeCache;
    private stats: {
        hits: number;
        misses: number;
    };

    constructor() {
        this.cache = new NodeCache({
            stdTTL: config.cache.defaultTTL,
            checkperiod: config.cache.checkPeriod,
            useClones: false,
        });

        this.stats = {
            hits: 0,
            misses: 0,
        };
    }

    /**
     * Generate a cache key from parameters
     * Normalizes parameters to ensure consistent keys
     */
    generateKey(params: CacheParams): string {
        const normalized = {
            from: params.from || null,
            to: params.to || null,
            min_magnitude: params.min_magnitude || null,
            region: params.region?.toLowerCase() || null,
            lat: params.lat ? parseFloat(params.lat.toString()).toFixed(4) : null,
            lon: params.lon ? parseFloat(params.lon.toString()).toFixed(4) : null,
            radius_km: params.radius_km || null,
        };

        // Sort keys to ensure consistent ordering
        const sortedKeys = Object.keys(normalized).sort();
        const sortedNormalized: Record<string, any> = {};
        sortedKeys.forEach(key => {
            sortedNormalized[key] = normalized[key as keyof typeof normalized];
        });

        return JSON.stringify(sortedNormalized);
    }

    /**
     * Get cached data for given parameters
     */
    get<T>(params: CacheParams): T | null {
        const key = this.generateKey(params);
        const value = this.cache.get<T>(key);

        if (value !== undefined) {
            this.stats.hits++;
            if (config.logging.level === 'debug') {
                console.log(`[Cache] HIT: ${key.substring(0, 80)}...`);
            }
            return value;
        }

        this.stats.misses++;
        if (config.logging.level === 'debug') {
            console.log(`[Cache] MISS: ${key.substring(0, 80)}...`);
        }
        return null;
    }

    /**
     * Set cached data for given parameters
     */
    set<T>(params: CacheParams, data: T): void {
        const key = this.generateKey(params);
        const ttl = this.calculateTTL(params);

        this.cache.set(key, data, ttl);
        
        if (config.logging.level === 'debug') {
            console.log(`[Cache] SET: Cached for ${ttl}s - ${key.substring(0, 80)}...`);
        }
    }

    /**
     * Calculate TTL based on whether data is historical or current
     * Historical data (in the past) is cached longer
     */
    calculateTTL(params: CacheParams): number {
        const now = new Date();
        const toDate = new Date(params.to);

        // Historical data: cache longer
        if (toDate < now) {
            return config.cache.historicalTTL;
        }

        // Current data: cache shorter
        return config.cache.defaultTTL;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? Math.round((this.stats.hits / total) * 10000) / 100 : 0,
            keys: this.cache.keys().length,
        };
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.flushAll();
        console.log('[Cache] All cache cleared');
    }

    /**
     * Delete a specific cached entry
     */
    delete(params: CacheParams): boolean {
        const key = this.generateKey(params);
        return this.cache.del(key) > 0;
    }
}

// Export singleton instance
export const earthquakeCache = new EarthquakeCache();

