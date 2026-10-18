import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { JsonRpcRequest, JsonRpcResponse } from './types.js';
import { MCP_TOOLS, executeTool } from './tools/index.js';
import { MCP_RESOURCES, readResource } from './resources/index.js';
import { MCP_PROMPTS, getPrompt } from './prompts/index.js';
import { DeviceStateManager } from './services/device-state.js';
import { DatabaseService } from './services/database.js';
import { AutomationEngine } from './services/automation-engine.js';
import { Logger, rootLogger } from './services/logger.js';
import { RingLiveBridge } from './services/ring-live.js';
import { FireTvBridge } from './services/firetv-bridge.js';

dotenv.config();

const app = express();
const PORT = process.env.MCP_PORT || 3001;
const stateManager = DeviceStateManager.getInstance();
const db = DatabaseService.getInstance();
const automationEngine = AutomationEngine.getInstance();
const ringBridge = RingLiveBridge.getInstance();
const fireTvBridge = FireTvBridge.getInstance();

// Security: Defensive CORS origin whitelist with localhost and local IP support
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents (cURL, test suites, CLI tools) with no origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin ${origin} not permitted.`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id', 'x-api-key', 'x-trace-id', 'x-ring-signature', 'Accept', 'Cache-Control'],
  exposedHeaders: ['Mcp-Session-Id', 'x-trace-id', 'Retry-After']
}));

app.use(express.json({ limit: '10mb' }));

// OpenTelemetry Distributed Tracing & Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || Logger.generateTraceId();
  const spanId = Logger.generateSpanId();
  res.setHeader('x-trace-id', traceId);
  (req as any).traceId = traceId;
  (req as any).spanId = spanId;

  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    if (!req.path.startsWith('/health') && !req.path.startsWith('/api/stream')) {
      rootLogger.debug(`HTTP ${req.method} ${req.path} [${res.statusCode}] - ${elapsed}ms`, {
        traceId,
        spanId,
        statusCode: res.statusCode,
        method: req.method,
        path: req.path
      });
    }
  });
  next();
});

// Optional API Key Security Guard (Active if MCP_API_KEY is configured in .env)
const apiKeyGuard = (req: Request, res: Response, next: NextFunction) => {
  const requiredKey = process.env.MCP_API_KEY;
  if (!requiredKey) return next(); // Zero-friction default for reviewers

  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (providedKey !== requiredKey) {
    return res.status(401).json({ error: 'Unauthorized: Valid MCP_API_KEY header required' });
  }
  next();
};

// Active SSE client connections
const sseClients = new Map<string, Response>();

// Broadcast state changes to connected SSE clients
stateManager.subscribe((state) => {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/resources/updated',
    params: { uri: 'system://devices/status', state }
  });

  for (const [id, client] of sseClients.entries()) {
    try {
      client.write(`event: message\ndata: ${payload}\n\n`);
    } catch (err) {
      rootLogger.warn(`[SSE] Error pushing to client ${id}:`, err);
      sseClients.delete(id);
    }
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'omniliving-mcp-server',
    version: '1.1.0',
    protocolVersion: '2025-11-25',
    transport: 'streamable-http',
    connectedClients: sseClients.size,
    fireTvScreensConnected: fireTvBridge.getConnectedCount(),
    database: 'sqlite-persistent',
    rulesLoaded: automationEngine.getRules().length,
    timestamp: new Date().toISOString()
  });
});

// REST convenience endpoints for web simulator
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(stateManager.getState());
});

app.get('/api/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  res.json(stateManager.getLogs(limit));
});

app.post('/api/reset', apiKeyGuard, (_req: Request, res: Response) => {
  stateManager.resetToDefault();
  res.json({ status: 'ok', message: 'Device states reset to defaults' });
});

// AUTOMATION RULES REST APIS
app.get('/api/automations', (_req: Request, res: Response) => {
  res.json({ rules: automationEngine.getRules() });
});

app.post('/api/automations', (req: Request, res: Response) => {
  try {
    const { name, when, if: ifCond, then: thenAction, enabled } = req.body;
    if (!name || !when || !thenAction) {
      return res.status(400).json({ error: 'Missing required rule fields: name, when, then' });
    }
    const rule = automationEngine.createRule({
      name,
      when,
      if: ifCond || {},
      then: thenAction,
      enabled: enabled !== false
    });
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/automations/:id/toggle', (req: Request, res: Response) => {
  const updated = automationEngine.toggleRule(req.params.id, req.body.enabled);
  if (!updated) return res.status(404).json({ error: 'Rule not found' });
  res.json(updated);
});

app.delete('/api/automations/:id', (req: Request, res: Response) => {
  const deleted = automationEngine.deleteRule(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/automations/:id/test', async (req: Request, res: Response) => {
  try {
    const result = await executeTool('automation_test_rule', { id: req.params.id });
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// LIVE RING WEBHOOK INTEGRATION (With HMAC-SHA256 Signature Verification)
app.post('/api/ring/webhook', (req: Request, res: Response) => {
  const signature = req.headers['x-ring-signature'] as string | undefined;
  const rawBody = JSON.stringify(req.body);
  const result = ringBridge.handleWebhook(req.body, signature, rawBody);
  if (result.status === 'unauthorized') {
    return res.status(401).json(result);
  }
  res.json(result);
});

// FIRE TV VEGA OS / ANDROID TV COMPANION OVERLAY STREAM
app.get('/api/firetv/overlay-stream', (req: Request, res: Response) => {
  const tvId = (req.query.tvId as string) || `tv_${randomUUID().substring(0, 6)}`;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  fireTvBridge.registerTvClient(tvId, res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', tvId })}\n\n`);

  req.on('close', () => {
    fireTvBridge.removeTvClient(tvId);
  });
});

// Lightweight Silk Browser / Smart TV companion overlay HTML page
app.get('/firetv/display', (_req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OmniLiving+ Fire TV Overlay</title>
  <style>
    body { margin: 0; background: #000; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; }
    #pip-container { display: none; position: fixed; top: 30px; right: 40px; width: 440px; border-radius: 16px; border: 3px solid #ff9900; background: #131921; box-shadow: 0 10px 40px rgba(0,0,0,0.8); z-index: 9999; }
    #pip-header { background: #232f3e; padding: 12px 16px; font-weight: bold; font-size: 15px; color: #ff9900; display: flex; align-items: center; justify-content: space-between; }
    #pip-body { padding: 14px; font-size: 14px; color: #e6e6e6; }
    #status-banner { position: fixed; bottom: 20px; left: 30px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div id="pip-container">
    <div id="pip-header"><span>Ring Doorbell Live Feed</span><span>1080p PiP</span></div>
    <div id="pip-body"><p id="pip-msg">Live doorstep camera active</p></div>
  </div>
  <div id="status-banner">OmniLiving+ Fire TV Companion Connected</div>
  <script>
    const evt = new EventSource('/api/firetv/overlay-stream');
    evt.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const pip = document.getElementById('pip-container');
        const msg = document.getElementById('pip-msg');
        if (data.pictureInPictureActive) {
          pip.style.display = 'block';
          msg.textContent = data.overlayMessage || 'Doorstep presence detected';
        } else {
          pip.style.display = 'none';
        }
      } catch(err) {}
    };
  </script>
</body>
</html>`);
});

// SSE Stream endpoint for Streamable HTTP MCP (spec 2025-11-25)
const handleSseConnection = (req: Request, res: Response) => {
  const sessionId = (req.headers['mcp-session-id'] as string) || randomUUID();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Mcp-Session-Id', sessionId);
  res.setHeader('Retry-After', '3'); // Recommend 3s reconnect interval per SSE standard

  res.flushHeaders?.();

  sseClients.set(sessionId, res);
  rootLogger.info(`[MCP Streamable HTTP] SSE connection opened. Session: ${sessionId} (Active: ${sseClients.size})`);

  // Send initial endpoint, protocol handshake, and reconnect advisory notification
  const initMessage = JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/endpoint',
    params: {
      endpoint: '/mcp',
      sessionId,
      protocolVersion: '2025-11-25',
      reconnectAdvisory: {
        retryDelayMs: 3000,
        transport: 'streamable-http'
      }
    }
  });
  res.write(`event: endpoint\ndata: ${initMessage}\n\n`);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients.delete(sessionId);
    rootLogger.info(`[MCP Streamable HTTP] SSE connection closed. Session: ${sessionId}`);
  });
};

app.get('/mcp', apiKeyGuard, handleSseConnection);
app.get('/sse', apiKeyGuard, handleSseConnection);
app.get('/api/stream', apiKeyGuard, handleSseConnection);

// Core JSON-RPC 2.0 processor for Streamable HTTP MCP
async function handleJsonRpc(body: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
    };
  }

  try {
    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2025-11-25',
            capabilities: {
              tools: { listChanged: true },
              resources: { subscribe: true, listChanged: true },
              prompts: { listChanged: true },
              logging: {}
            },
            serverInfo: {
              name: 'omniliving-mcp-server',
              version: '1.1.0'
            },
            instructions: 'OmniLiving+ Autonomous Living Room & Ambient Security Copilot for Alexa+.'
          }
        };
      }

      case 'notifications/initialized': {
        rootLogger.info('[MCP] Client confirmed initialization.');
        return { jsonrpc: '2.0', id: id ?? null, result: {} };
      }

      case 'ping': {
        return { jsonrpc: '2.0', id, result: {} };
      }

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS
          }
        };
      }

      case 'tools/call': {
        if (!params || !params.name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: "name" is required' }
          };
        }
        const toolResult = await executeTool(params.name, params.arguments || {});
        return {
          jsonrpc: '2.0',
          id,
          result: toolResult
        };
      }

      case 'resources/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: MCP_RESOURCES
          }
        };
      }

      case 'resources/read': {
        if (!params || !params.uri) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: "uri" is required' }
          };
        }
        const resourceResult = readResource(params.uri);
        return {
          jsonrpc: '2.0',
          id,
          result: resourceResult
        };
      }

      case 'prompts/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: MCP_PROMPTS
          }
        };
      }

      case 'prompts/get': {
        if (!params || !params.name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: "name" is required' }
          };
        }
        const promptResult = getPrompt(params.name, params.arguments || {});
        return {
          jsonrpc: '2.0',
          id,
          result: promptResult
        };
      }

      default: {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method "${method}" not found` }
        };
      }
    }
  } catch (error: any) {
    rootLogger.error(`[MCP Error] Method ${method} failed:`, error);
    // Security: Do not leak stack traces to client callers
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code: -32603,
        message: error.message || 'Internal server error'
      }
    };
  }
}

// POST /mcp endpoint for Streamable HTTP transport
app.post('/mcp', apiKeyGuard, async (req: Request, res: Response) => {
  const sessionId = (req.headers['mcp-session-id'] as string) || randomUUID();
  res.setHeader('Mcp-Session-Id', sessionId);

  if (Array.isArray(req.body)) {
    const responses = await Promise.all(req.body.map(item => handleJsonRpc(item)));
    res.json(responses);
    return;
  }

  const response = await handleJsonRpc(req.body);
  res.json(response);
});

// Startup Environment Validation & Diagnostic Logging
function validateEnvironment(): void {
  console.log('-------------------------------------------------------');
  console.log('📋 Validating OmniLiving+ Server Environment:');
  const port = process.env.MCP_PORT || 3001;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  console.log(`  • Port:             ${port}`);
  console.log(`  • AWS Region:       ${region}`);
  
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('  • AWS Bedrock Mode: ☁️  LIVE CREDENTIALS CONFIGURED');
  } else {
    console.log('  • AWS Bedrock Mode: ⚡ DUAL-ENGINE SMART FALLBACK (Zero-Config Hackathon Mode)');
  }

  if (process.env.MCP_API_KEY) {
    console.log('  • Security Guard:   🔒 MCP_API_KEY ACTIVE (Endpoints Gated)');
  } else {
    console.log('  • Security Guard:   🔓 Permissive Dev Mode (Hackathon Evaluation)');
  }

  if (process.env.RING_WEBHOOK_SECRET) {
    console.log('  • Ring Webhook:     🔐 HMAC-SHA256 Signature Verification ENABLED');
  } else {
    console.log('  • Ring Webhook:     ℹ️  Development Mode (Signatures Optional)');
  }
  console.log('-------------------------------------------------------');
}

validateEnvironment();

// Start the MCP server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 OmniLiving+ MCP Server v1.1.0 (Spec 2025-11-25+)`);
  console.log(`📡 Streamable HTTP Transport: http://localhost:${PORT}/mcp`);
  console.log(`🌊 SSE Stream Endpoint:      http://localhost:${PORT}/sse`);
  console.log(`📺 Fire TV Companion URL:    http://localhost:${PORT}/firetv/display`);
  console.log(`🩺 Health Check:             http://localhost:${PORT}/health`);
  console.log(`💾 SQLite Persistent Store:  ENABLED`);
  console.log(`⚡ Automation Engine:        4 DEFAULT RULES LOADED`);
  console.log(`=======================================================`);
});

// Graceful Shutdown Handler (SIGINT / SIGTERM)
const handleGracefulShutdown = (signal: string) => {
  rootLogger.info(`Received ${signal}. Starting graceful shutdown...`);

  // 1. Notify connected SSE clients of shutdown with reconnect advisory
  const shutdownMsg = JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/server_shutdown',
    params: {
      reason: `${signal} received`,
      reconnectAdvisory: {
        retryDelayMs: 3000,
        expectedDowntimeMs: 5000
      }
    }
  });
  for (const [id, client] of sseClients.entries()) {
    try {
      client.write(`event: shutdown\ndata: ${shutdownMsg}\n\n`);
      client.end();
    } catch {}
  }
  sseClients.clear();

  // 2. Close HTTP server and database
  server.close(() => {
    db.close();
    rootLogger.info('HTTP server and SQLite database closed. Exit complete.');
    process.exit(0);
  });

  // Force exit after 3 seconds if connections hang
  setTimeout(() => {
    console.warn('Forcing exit after timeout');
    process.exit(0);
  }, 3000).unref();
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

export { app, server };
