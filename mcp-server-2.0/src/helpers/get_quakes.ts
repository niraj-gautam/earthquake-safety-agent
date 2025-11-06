import axios from 'axios';
import { earthquakeCache } from '../cache/earthquakeCache.js';
import { config } from '../config/config.js';

/**
 * Earthquake data structure returned by the function
 */
export interface EarthquakeData {
    id: string;
    time: string;
    mag: number;
    depth_km: number;
    place: string;
    lat: number;
    lon: number;
    distance_km?: number;
}

/**
 * USGS API response structure (GeoJSON format)
 */
interface USGSFeature {
    id: string;
    properties: {
        mag: number;
        place: string;
        time: number;
        updated: number;
        tz: number;
        url: string;
        detail: string;
        felt: number | null;
        cdi: number | null;
        mmi: number | null;
        alert: string | null;
        status: string;
        tsunami: number;
        sig: number;
        net: string;
        code: string;
        ids: string;
        sources: string;
        types: string;
        nst: number | null;
        dmin: number | null;
        rms: number;
        gap: number | null;
        magType: string;
        type: string;
        title: string;
    };
    geometry: {
        type: string;
        coordinates: [number, number, number]; // [longitude, latitude, depth]
    };
}

interface USGSResponse {
    type: string;
    metadata: {
        generated: number;
        url: string;
        title: string;
        status: number;
        api: string;
        count: number;
    };
    features: USGSFeature[];
}

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Validate ISO 8601 date string and convert to Date object
 */
function parseAndValidateDate(dateString: string, paramName: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`INVALID_TIME_RANGE: ${paramName} must be a valid ISO 8601 date string`);
    }
    return date;
}

/**
 * Fetches earthquake data from the USGS API
 * 
 * @param from - Start date/time in ISO 8601 format
 * @param to - End date/time in ISO 8601 format
 * @param min_magnitude - Minimum magnitude (optional)
 * @param lat - Latitude for distance calculation (optional)
 * @param lon - Longitude for distance calculation (optional)
 * @param radius_km - Radius in kilometers for geographic filtering (optional, requires lat/lon)
 * @returns Array of earthquake data sorted by time (most recent first)
 */
export async function getQuakes(
    from: string,
    to: string,
    min_magnitude?: number,
    lat?: number,
    lon?: number,
    radius_km?: number
): Promise<{ earthquakes: EarthquakeData[] }> {
    try {
        // Check cache first
        const cacheParams = { from, to, min_magnitude, lat, lon, radius_km };
        const cachedData = earthquakeCache.get<{ earthquakes: EarthquakeData[] }>(cacheParams);
        
        if (cachedData !== null) {
            return cachedData;
        }

        // Validate date inputs
        const startDate = parseAndValidateDate(from, 'from');
        const endDate = parseAndValidateDate(to, 'to');
        
        // Validate time range
        if (startDate >= endDate) {
            throw new Error('INVALID_TIME_RANGE: "from" date must be before "to" date');
        }
        
        // Validate lat/lon pair
        if ((lat !== undefined && lon === undefined) || (lat === undefined && lon !== undefined)) {
            throw new Error('INVALID_PARAMETERS: Both lat and lon must be provided together');
        }
        
        // Build USGS API URL
        const baseUrl = config.usgs.baseUrl;
        const params = new URLSearchParams({
            format: 'geojson',
            starttime: from,
            endtime: to,
            orderby: 'time-asc', 
        });
        
        // Add optional parameters
        if (min_magnitude !== undefined) {
            params.append('minmagnitude', min_magnitude.toString());
        }
        
        // If lat/lon provided, use circular geographic search
        if (lat !== undefined && lon !== undefined) {
            params.append('latitude', lat.toString());
            params.append('longitude', lon.toString());
            
            // Use radius if provided, otherwise use a large default (20000 km)
            const maxRadius = radius_km !== undefined ? radius_km : 20000;
            params.append('maxradiuskm', maxRadius.toString());
        }
        
        const url = `${baseUrl}?${params.toString()}`;
        
        // Make API request with timeout and retry logic
        let response;
        let retryCount = 0;
        const maxRetries = config.usgs.maxRetries;
        
        while (retryCount < maxRetries) {
            try {
                response = await axios.get<USGSResponse>(url, {
                    timeout: config.usgs.apiTimeout,
                    headers: {
                        'User-Agent': 'Earthquake-MCP-Server/1.0.0',
                        "Accept": "application/geo+json",
                    }
                });
                break; 
            } catch (error: any) {
                if (error.response?.status === 429) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        throw new Error('API_RATE_LIMIT: USGS API rate limit exceeded. Please try again later.');
                    }
                    // Exponential backoff
                    const delay = Math.pow(2, retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else if (error.response?.status === 503) {
                    throw new Error('API_UNAVAILABLE: USGS API is temporarily unavailable. Please try again later.');
                } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                    throw new Error('API_TIMEOUT: Request to USGS API timed out. Please try again.');
                } else {
                    throw error;
                }
            }
        }
        
        if (!response) {
            throw new Error('API_ERROR: Failed to fetch data from USGS API after retries');
        }
        
        // Parse and transform the response
        let earthquakes: EarthquakeData[] = response.data.features.map((feature: USGSFeature) => {
            const [longitude, latitude, depth] = feature.geometry.coordinates;
            
            const earthquake: EarthquakeData = {
                id: feature.id,
                time: new Date(feature.properties.time).toISOString(),
                mag: feature.properties.mag,
                depth_km: Math.round(depth * 100) / 100,
                place: feature.properties.place,
                lat: Math.round(latitude * 1000000) / 1000000, // 6 decimal places
                lon: Math.round(longitude * 1000000) / 1000000, // 6 decimal places
            };
            
            if (lat !== undefined && lon !== undefined) {
                earthquake.distance_km = calculateDistance(lat, lon, latitude, longitude);
            }
            
            return earthquake;
        });
        
        // Sort by time descending (most recent first)
        earthquakes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
        const result = {
            earthquakes
        };

        // Cache the result before returning
        earthquakeCache.set(cacheParams, result);
        
        return result;
        
    } catch (error: any) {
        if (error.message?.startsWith('INVALID_TIME_RANGE') || 
            error.message?.startsWith('INVALID_PARAMETERS') ||
            error.message?.startsWith('API_RATE_LIMIT') ||
            error.message?.startsWith('API_UNAVAILABLE') ||
            error.message?.startsWith('API_TIMEOUT') ||
            error.message?.startsWith('API_ERROR')) {
            throw error;
        }
        
        console.error('Error fetching earthquake data:', error);
        throw new Error(`API_ERROR: Failed to fetch earthquake data - ${error.message}`);
    }
}

