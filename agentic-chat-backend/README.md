lea## Setup

Create a `.env` file in the project root and add:

```bash
OPENAI_API_KEY=<OPENAI_API_KEY>
TAVILY_API_KEY=<TAVILY_API_KEY>
OPENAI_MODEL=gpt-4o-mini
```

Replace `<OPENAI_API_KEY>` and `<TAVILY_API_KEY>` with your actual keys:

**Model Options:**
- Default: `gpt-4o-mini` (recommended - supports tool calling)
- Other options: `gpt-4o`, `gpt-4-turbo`, etc.

**Note on Reasoning:**
- The system will automatically detect and display reasoning/thinking tokens if your model exposes them
- Currently optimized for tool calling models like `gpt-4o-mini`
- Reasoning detection is generalized and will show reasoning tokens when available
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Tavily API Key**: Get from [Tavily](https://tavily.com/) (free tier available)

Do not quote the values.

### Install Dependencies

```bash
npm install
```

### Run Server

```bash
npm start
```

Server runs on `http://localhost:8081` (or port specified in `PORT` env var).

## Usage

### Non-Streaming Request

```bash
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 15 * 23? Then search for the latest news about AI"}'
```

### Streaming Request (SSE)

```bash
curl -X POST http://localhost:8081/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Search for Python tutorials", "stream": true}'
```

Streaming responses include events:
- `{"type":"tool_call","tool":"web_search"}` - When a tool is called
- `{"type":"content","content":"..."}` - LLM response chunks
- `{"type":"tool_result","tool":"web_search","result":"..."}` - Tool execution results
- `{"type":"done"}` - Final response complete

## Features

- **Agentic AI**: Automatically uses `web_search` and `calculator` tools when needed
- **Function Calling**: LLM decides when to use tools based on the query
- **Streaming Support**: Real-time SSE responses for better UX
- **Tool Safety**: Input validation, timeouts (5s), and error handling
- **Multi-turn Agent Loop**: Handles multiple tool calls in sequence until final answer
- **Error Handling**: User-friendly error messages with fallbacks

## What Works

✅ **Calculator Tool**:
- Basic arithmetic: `2 + 2`, `10 * 5`, `100 / 4`
- Exponentiation: `10^5`, `2^10`
- Math functions: `sqrt(16)`, `sin(pi/2)`, `log(10)`, `pow(2, 3)`
- Complex expressions: `10000 * (1 + 0.07)^5`
- Constants: `pi`, `e`

✅ **Web Search Tool**:
- Current information lookup
- Returns relevant results with titles and snippets
- Works for any searchable topic

✅ **Sequential Tool Usage**:
- Agent can search for data, then calculate with results
- Example: "What's the current S&P 500 return? Calculate $10,000 investment after 5 years."

## Limitations

⚠️ **Calculator**:
- Cannot evaluate expressions with variables or unknown values
- For dynamic data, use `web_search` first to get numeric values, then calculate
- Example: Don't use `"price * 5"` - search for price first, then use `"150 * 5"`

⚠️ **Agent Behavior**:
- May require multiple iterations if tool results are unclear
- Max iterations: 10 (prevents infinite loops)
- Tool timeout: 5 seconds

⚠️ **Reasoning Models**:
- Reasoning models (o1, o3) don't support tool calling
- Use `gpt-4o-mini` or similar for tool calling functionality

## Available Tools

1. **web_search**: Search the web for current information (requires Tavily API)
   - Returns up to 5 search results with titles and content snippets
   - Timeout: 5 seconds
   - Requires `TAVILY_API_KEY` in `.env`

2. **calculator**: Perform mathematical calculations
   - **Numeric expressions only**: Accepts numbers, operators, and math functions
   - **Supported operations**: `+`, `-`, `*`, `/`, `^` (exponentiation), parentheses
   - **Supported functions**: `sqrt()`, `sin()`, `cos()`, `tan()`, `log()`, `ln()`, `pow()`, `abs()`, `floor()`, `ceil()`, `round()`
   - **Supported constants**: `pi`, `e`
   - **Supported units**: `degrees`, `deg`, `radians`, `rad` (basic angle units)
   - **Limitation**: Cannot handle variables or unknown values - use `web_search` first to get numeric values, then calculate
   - **Example valid expressions**: `"2 + 2"`, `"sqrt(16)"`, `"10^5"`, `"sin(pi/2)"`, `"sin(90 degrees)"`, `"log(10)"`
   - **Example invalid**: `"price * quantity"` (use search first, then `"150 * 5"`)


