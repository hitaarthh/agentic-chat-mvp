# Agentic Chat - Fullstack Application

A fullstack agentic AI chat application with tool calling capabilities (web search, calculator).

## Quick Start

Run both frontend and backend together with a single command:

```bash
npm run dev
```

Or simply:

```bash
npm start
```

This will start:
- **Backend** on `http://localhost:8081`
- **Frontend** on `http://localhost:8080`

## Setup (First Time)

### 1. Install All Dependencies

```bash
npm run install:all
```

Or manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd agentic-chat-backend
npm install
cd ..

# Install frontend dependencies
cd agentic-response-frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `agentic-chat-backend` directory:

```bash
cd agentic-chat-backend
touch .env
```

Add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
PORT=8081
```

Get your keys:
- **OpenAI API Key**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Tavily API Key**: [Tavily](https://tavily.com/) (free tier available)

### 3. Run the Application

```bash
npm run dev
```

The frontend will automatically connect to the backend running on port 8081.

## Individual Commands

If you need to run them separately:

```bash
# Backend only
npm run backend

# Frontend only
npm run frontend
```

## Project Structure

```
.
├── agentic-chat-backend/     # Express.js backend with OpenAI integration
├── agentic-response-frontend/ # React + TypeScript frontend
└── package.json              # Root package with dev scripts
```

## Features

- 🤖 **Agentic AI**: Automatically uses tools (web_search, calculator) when needed
- 💬 **Streaming Responses**: Real-time SSE streaming for better UX
- 📊 **Live Logs**: Terminal-style logs showing tool calls and execution
- 🔧 **Tool Calling**: LLM decides when to use tools based on queries
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- ✅ **Error Handling**: User-friendly error messages with fallbacks

## What Works

✅ **Calculator**: Basic math, functions (`sqrt`, `sin`, `cos`, etc.), exponentiation (`^`), constants (`pi`, `e`)  
✅ **Web Search**: Current information lookup via Tavily API  
✅ **Sequential Usage**: Search for data, then calculate with results  
✅ **Streaming**: Real-time updates as tools execute and LLM responds  
✅ **Error Recovery**: Clear messages when things go wrong

## Known Limitations

⚠️ **Calculator**: Requires numeric expressions only - use search first for unknown values  
⚠️ **Max Iterations**: Agent loop limited to 10 iterations  
⚠️ **Tool Timeout**: 5 seconds per tool execution  
⚠️ **Model Support**: Use `gpt-4o-mini` or similar for tool calling (reasoning models like o1/o3 don't support tools)

## Troubleshooting

- **Port conflicts**: Make sure ports 8080 (frontend) and 8081 (backend) are available
- **CORS errors**: Backend has CORS enabled, but ensure both servers are running
- **API errors**: Check your `.env` file has valid API keys

