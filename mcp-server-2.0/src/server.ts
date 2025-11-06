import { McpServer, } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import { z } from "zod";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getQuakes } from "./helpers/get_quakes.js";
import { config } from "./config/config.js";
import { logger, requestLogger, errorHandler } from "./middleware/logger.js";
import healthRouter from "./routes/health.js";
import metricsRouter from "./routes/metrics.js";

// create the MCP server
const server = new McpServer({
    name: "Earthquake MCP Server",
    version: "1.0.0",
});

server.registerTool('get_quakes',
     {
    title: 'Get Earthquakes',
    description: 'Get earthquake data from the USGS API within a time range. Returns recent earthquakes with magnitude, depth, location, and distance from a user location.',
    inputSchema: {
            from: z.string().describe('Start date/time in ISO 8601 format'),
            to: z.string().describe('End date/time in ISO 8601 format'),
            min_magnitude: z.number().describe('Minimum magnitude').optional(),
            lat: z.number().describe('Latitude').optional(),
            lon: z.number().describe('Longitude').optional(),
            radius_km: z.number().describe('Radius in kilometers').optional(),
        },
    outputSchema: {
        earthquakes: z.array(z.object({
            id: z.string(),
            time: z.string(),
            mag: z.number(),
            depth_km: z.number(),
            place: z.string(),
            lat: z.number(),
            lon: z.number(),
            distance_km: z.number().optional(),
        })),
        metadata: z.object({
            source: z.string(),
            dataTimestamp: z.string(),
            count: z.number(),
            apiVersion: z.string(),
        }),
    },
},
async ({ from, to, min_magnitude, lat, lon, radius_km }) => {
    const startTime = Date.now();
    let error: Error | undefined;
    
    try {
        const earthquakesData = await getQuakes(from, to, min_magnitude, lat, lon, radius_km);
        
        // Add metadata to response
        const responseWithMetadata = {
            ...earthquakesData,
            metadata: {
                source: 'USGS Earthquake API',
                dataTimestamp: new Date().toISOString(),
                count: earthquakesData.earthquakes.length,
                apiVersion: '1.0.0',
            },
        };

        const latency = Date.now() - startTime;
        logger.logToolCall('get_quakes', { from, to, min_magnitude, lat, lon, radius_km }, responseWithMetadata, latency);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(responseWithMetadata, null, 2),
                },
            ],
            structuredContent: responseWithMetadata,
        };
    } catch (err) {
        error = err as Error;
        const latency = Date.now() - startTime;
        logger.logToolCall('get_quakes', { from, to, min_magnitude, lat, lon, radius_km }, null, latency, error);
        throw error;
    }

});


const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Health and metrics routes
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);

// MCP endpoint
app.post('/mcp', async (req, res) => {
    // Create a new transport for each request to prevent request ID collisions
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    res.on('close', () => {
        transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const port = config.server.port;
app.listen(port, () => {
    logger.info(`Earthquake MCP Server running on http://localhost:${port}`, {
        version: '1.0.0',
        environment: config.server.nodeEnv,
        endpoints: {
            mcp: `/mcp`,
            health: `/health`,
            metrics: `/metrics`,
        },
    });
}).on('error', error => {
    logger.error('Server startup error', error);
    process.exit(1);
});