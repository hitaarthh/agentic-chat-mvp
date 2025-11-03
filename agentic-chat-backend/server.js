const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const ToolRegistry = require('./tools/index');
const LLMService = require('./services/llm/LLMService');
const AgentOrchestrator = require('./services/orchestration/AgentOrchestrator');
const { DEFAULT_MODEL, DEFAULT_PORT } = require('./utils/constants');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || DEFAULT_MODEL;

const toolRegistry = new ToolRegistry();
const llmService = new LLMService(openai, MODEL);
const orchestrator = new AgentOrchestrator(llmService, toolRegistry);

const sendServerLog = (res, message) => {
  if (res?.headersSent && res.getHeader('Content-Type') === 'text/event-stream') {
    res.write(`data: ${JSON.stringify({ type: 'server_log', message })}\n\n`);
  }
};

app.post('/chat', async (req, res) => {
  const { query, message, stream } = req.body || {};
  const userQuery = query || message;

  if (!userQuery || typeof userQuery !== 'string') {
    return res.status(400).json({ error: 'Invalid "query" or "message" in request body' });
  }

  console.log(`\n${'='.repeat(60)}\nNew chat request received\n${'='.repeat(60)}`);
  if (stream) {
    sendServerLog(res, 'New chat request received');
  }

  try {
    const messages = [{ role: 'user', content: userQuery }];

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      await orchestrator.execute(messages, { stream: true, res });
      sendServerLog(res, 'Request completed successfully');
      res.end();
    } else {
      const logs = [];
      const aiEvents = [];
      
      // Add initial log
      logs.push('New chat request received');
      
      const logCallback = (message) => {
        logs.push(message);
      };
      
      const aiEventCallback = (event) => {
        aiEvents.push(event);
      };
      
      const response = await orchestrator.execute(messages, { 
        stream: false,
        logCallback: logCallback,
        aiEventCallback: aiEventCallback
      });
      
      console.log('\nRequest completed successfully\n');
      logs.push('Request completed successfully');
      aiEvents.push({ type: 'done' });
      
      // Ensure response is always a string
      const responseText = response || "Sorry, I didn't receive a response. Please try again.";
      
      res.json({ 
        response: responseText,
        logs,
        aiEvents
      });
    }
  } catch (err) {
    console.error(`\nRequest failed: ${err.message}\n`);
    if (stream) {
      sendServerLog(res, `Request failed: ${err.message}`);
    }
    if (!res.headersSent) {
      res.status(err?.status || 500).json({ 
        error: err?.message || 'Unexpected error',
        logs: stream ? undefined : [`Request failed: ${err.message}`]
      });
    }
  }
});

const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`\nServer listening on http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Tool calling: Enabled (${toolRegistry.getToolNames().join(', ')})`);
  console.log(`Reasoning detection: Enabled (will show if model exposes it)\n`);
});
