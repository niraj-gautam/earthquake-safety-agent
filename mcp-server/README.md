# Earthquake MCP Server 2.0

A Model Context Protocol (MCP) server that provides earthquake data from the USGS API with robust caching, observability, and error handling.

## Features

### ✅ Core Functionality
- **MCP Tool**: `get_quakes` - Fetch earthquake data with filters (time range, magnitude, location, radius)
- **USGS API Integration**: Real-time earthquake data from official USGS API
- **Distance Calculation**: Calculate distance from earthquakes to user location using Haversine formula
- **Sorting**: Results sorted by time (most recent first)

### ✅ Performance & Caching
- **Intelligent Caching**: In-memory cache with TTL-based expiration
  - Historical data: cached for 1 hour (default)
  - Recent data: cached for 5 minutes (default)
- **Cache Statistics**: Track hits, misses, and hit rate

### ✅ Observability
- **Health Endpoint**: `/health` - Server status, uptime, cache stats, USGS API availability
- **Metrics Endpoint**: `/metrics` - Tool call statistics, performance metrics, error tracking
- **Structured Logging**: Request/response logging with configurable log levels
- **Tool Call Tracking**: Log inputs, outputs, latency, and errors for each tool call

### ✅ Robustness
- **Retry Logic**: Exponential backoff for failed API requests (3 retries default)
- **Rate Limit Handling**: Automatic retry with backoff on 429 errors
- **Timeout Protection**: Configurable API timeouts (10s default)
- **Error Tracking**: Custom error classes with proper status codes
- **Input Validation**: Validate date ranges, lat/lon pairs, and other parameters

### ✅ Configuration
- **Environment Variables**: All settings configurable via `.env` file
- **TypeScript**: Full type safety throughout the codebase
- **Modular Architecture**: Clear separation of concerns (routes, middleware, helpers, utils)

## Installation

```bash
# Install dependencies
npm install

# Copy example environment file
cp .env.example .env

# Build TypeScript
npm run build
```

## Configuration

Edit `.env` file to customize settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration (in seconds)
CACHE_DEFAULT_TTL=300          # 5 minutes for recent data
CACHE_HISTORICAL_TTL=3600      # 1 hour for historical data
CACHE_CHECK_PERIOD=120         # Cache cleanup check period

# USGS API Configuration
USGS_API_TIMEOUT=10000         # API timeout in milliseconds
USGS_MAX_RETRIES=3             # Maximum retries for failed requests
USGS_API_BASE_URL=https://earthquake.usgs.gov/fdsnws/event/1/query

# Logging Configuration
LOG_LEVEL=info                 # debug, info, warn, error
LOG_REQUESTS=true              # Log all HTTP requests
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### MCP Tool: `get_quakes`

**Endpoint**: `POST /mcp`

**Parameters**:
- `from` (string, required): Start date/time in ISO 8601 format
- `to` (string, required): End date/time in ISO 8601 format
- `min_magnitude` (number, optional): Minimum earthquake magnitude
- `region` (string, optional): Filter by region name
- `lat` (number, optional): Latitude for distance calculation
- `lon` (number, optional): Longitude for distance calculation
- `radius_km` (number, optional): Radius in kilometers (requires lat/lon)

**Response**:
```json
{
  "earthquakes": [
    {
      "id": "us7000m...",
      "time": "2024-11-06T12:34:56.789Z",
      "mag": 5.2,
      "depth_km": 12.5,
      "place": "62 km NW of Kathmandu, Nepal",
      "lat": 28.1234,
      "lon": 85.5678,
      "distance_km": 62.34
    }
  ],
  "metadata": {
    "source": "USGS Earthquake API",
    "dataTimestamp": "2024-11-06T12:35:00.000Z",
    "count": 3,
    "apiVersion": "1.0.0"
  }
}
```

### Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-06T12:00:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "server": {
    "version": "1.0.0",
    "environment": "development",
    "port": 3000
  },
  "cache": {
    "enabled": true,
    "stats": {
      "hits": 45,
      "misses": 12,
      "hitRate": 78.95,
      "keys": 8
    }
  },
  "externalServices": {
    "usgs": {
      "status": "available",
      "responseTimeMs": 234,
      "lastChecked": "2024-11-06T12:00:00.000Z"
    }
  }
}
```

### Metrics

**Endpoint**: `GET /metrics`

**Response**:
```json
{
  "timestamp": "2024-11-06T12:00:00.000Z",
  "toolCalls": {
    "total": 57,
    "successful": 54,
    "failed": 3,
    "successRate": 94.74,
    "averageLatencyMs": 342,
    "callsByTool": {
      "get_quakes": 57
    }
  },
  "cache": {
    "hits": 45,
    "misses": 12,
    "hitRate": 78.95,
    "totalKeys": 8
  },
  "errors": {
    "total": 3,
    "byCode": {
      "API_RATE_LIMIT": 2,
      "INVALID_TIME_RANGE": 1
    }
  },
  "performance": {
    "memory": {
      "heapUsedMB": 45.23,
      "heapTotalMB": 64.00,
      "externalMB": 1.23,
      "rss": 89.45
    }
  }
}
```

**Reset Metrics**: `POST /metrics/reset`

## Error Codes

- `INVALID_TIME_RANGE` (400): Invalid or malformed date range
- `INVALID_PARAMETERS` (400): Invalid parameter combination (e.g., lat without lon)
- `API_RATE_LIMIT` (429): USGS API rate limit exceeded
- `API_UNAVAILABLE` (503): USGS API temporarily unavailable
- `API_TIMEOUT` (504): Request to USGS API timed out
- `API_ERROR` (500): Generic API error

## Project Structure

```
mcp-server-2.0/
├── src/
│   ├── cache/
│   │   └── earthquakeCache.ts       # Caching logic with TTL
│   ├── config/
│   │   └── config.ts                # Environment configuration
│   ├── helpers/
│   │   └── getEarthquakesData.ts    # USGS API client
│   ├── middleware/
│   │   └── logger.ts                # Logging and error handling
│   ├── routes/
│   │   ├── health.ts                # Health check endpoint
│   │   └── metrics.ts               # Metrics endpoint
│   ├── utils/
│   │   └── errors.ts                # Custom error classes
│   └── server.ts                    # Main server entry point
├── build/                           # Compiled JavaScript
├── .env.example                     # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Checklist Progress

Based on `project-03-earthquake-alert-safety-brief.md`:

- ✅ **MCP Integration** - Tool schema with arg validation
- ✅ **API Client** - Retry/backoff with sensible timeouts
- ✅ **Rate Limit Handling** - 429 errors with exponential backoff
- ✅ **Input Validation** - Date parsing, location validation
- ✅ **Caching Layer** - In-memory TTL cache keyed by args
- ✅ **Response Formatter** - Units, timestamps, and sources included
- ✅ **Observability** - Health endpoint with status checks
- ✅ **Logging** - Tool call logging with latency tracking
- ⏳ **Testing** - Unit/integration tests (pending)

## Next Steps

1. **Testing**: Implement unit and integration tests
2. **Agent Integration**: Connect with LLM-based chat agent
3. **Documentation**: Add API usage examples and transcripts
4. **Deployment**: Configure production environment

## Development

### Adding New Tools

1. Create tool handler in `server.ts`:
```typescript
server.registerTool('tool_name', {
  title: 'Tool Title',
  description: 'Tool description',
  inputSchema: { /* zod schema */ },
  outputSchema: { /* zod schema */ },
}, async (params) => {
  // Implementation
});
```

2. Add logging:
```typescript
const startTime = Date.now();
try {
  const result = await yourFunction(params);
  logger.logToolCall('tool_name', params, result, Date.now() - startTime);
  return result;
} catch (error) {
  logger.logToolCall('tool_name', params, null, Date.now() - startTime, error);
  throw error;
}
```

## License

ISC

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

