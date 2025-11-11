/**
 * Unit tests for MCP Server
 * Tests configuration loading and cache functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { EarthquakeCache, CacheParams } from '../mcp-server/src/cache/earthquakeCache.js';

describe('MCP Server - Configuration', () => {
    test('should load configuration with default values', () => {
        // Test that config can be imported without errors
        const { config } = require('../mcp-server/src/config/config.ts');
        expect(config).toBeDefined();
        expect(config.server).toBeDefined();
        expect(config.usgs).toBeDefined();
        expect(config.cache).toBeDefined();
    });
});

describe('MCP Server - Earthquake Cache', () => {
    let cache: EarthquakeCache;

    beforeEach(() => {
        cache = new EarthquakeCache();
        cache.clear();
    });

    test('should generate consistent cache keys for same parameters', () => {
        const params1: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
            min_magnitude: 4.5,
        };

        const params2: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
            min_magnitude: 4.5,
        };

        const key1 = cache.generateKey(params1);
        const key2 = cache.generateKey(params2);

        expect(key1).toBe(key2);
    });

    test('should generate different keys for different parameters', () => {
        const params1: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
            min_magnitude: 4.5,
        };

        const params2: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
            min_magnitude: 5.0,
        };

        const key1 = cache.generateKey(params1);
        const key2 = cache.generateKey(params2);

        expect(key1).not.toBe(key2);
    });

    test('should store and retrieve data from cache', () => {
        const params: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
        };

        const testData = {
            earthquakes: [
                {
                    id: 'test1',
                    time: '2024-01-01T12:00:00Z',
                    mag: 5.5,
                    depth_km: 10,
                    place: 'Test Location',
                    lat: 27.7172,
                    lon: 85.3240,
                },
            ],
        };

        // Initially should not be in cache
        const cachedBefore = cache.get(params);
        expect(cachedBefore).toBeNull();

        // Store data
        cache.set(params, testData);

        // Should now be in cache
        const cachedAfter = cache.get(params);
        expect(cachedAfter).toEqual(testData);
    });

    test('should track cache statistics', () => {
        const params: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
        };

        const testData = { test: 'data' };

        // Miss
        cache.get(params);
        
        // Set and Hit
        cache.set(params, testData);
        cache.get(params);
        cache.get(params);

        const stats = cache.getStats();
        expect(stats.hits).toBe(2);
        expect(stats.misses).toBe(1);
        expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    test('should clear all cache entries', () => {
        const params1: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
        };

        const params2: CacheParams = {
            from: '2024-02-01T00:00:00Z',
            to: '2024-02-02T00:00:00Z',
        };

        cache.set(params1, { test: 'data1' });
        cache.set(params2, { test: 'data2' });

        const stats = cache.getStats();
        expect(stats.keys).toBe(2);

        cache.clear();

        const statsAfter = cache.getStats();
        expect(statsAfter.keys).toBe(0);
    });

    test('should delete specific cache entry', () => {
        const params: CacheParams = {
            from: '2024-01-01T00:00:00Z',
            to: '2024-01-02T00:00:00Z',
        };

        cache.set(params, { test: 'data' });
        expect(cache.get(params)).toBeDefined();

        const deleted = cache.delete(params);
        expect(deleted).toBe(true);
        expect(cache.get(params)).toBeNull();
    });

    test('should calculate appropriate TTL for historical vs current data', () => {
        const historicalParams: CacheParams = {
            from: '2020-01-01T00:00:00Z',
            to: '2020-01-02T00:00:00Z',
        };

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const currentParams: CacheParams = {
            from: new Date().toISOString(),
            to: futureDate.toISOString(),
        };

        const historicalTTL = cache.calculateTTL(historicalParams);
        const currentTTL = cache.calculateTTL(currentParams);

        // Historical data should have longer TTL
        expect(historicalTTL).toBeGreaterThan(currentTTL);
    });
});

