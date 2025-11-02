const BaseTool = require('../base/BaseTool');
const { TOOL_TIMEOUT } = require('../../utils/constants');

class WebSearchTool extends BaseTool {
  constructor() {
    super('web_search', 'Search the web for current information on any topic');
  }

  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query to look up on the web'
            }
          },
          required: ['query']
        }
      }
    };
  }

  validateArgs(args) {
    if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
      throw new Error('Invalid search query');
    }
    return true;
  }

  async execute(args) {
    this.validateArgs(args);

    const { query } = args;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TOOL_TIMEOUT);

    try {
      const tavilyApiKey = process.env.TAVILY_API_KEY;
      if (!tavilyApiKey) {
        throw new Error('TAVILY_API_KEY not found in environment variables');
      }

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: query.trim(),
          search_depth: 'basic',
          max_results: 5
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Tavily API error: ${error}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const summary = data.results
          .map((r, i) => `${i + 1}. ${r.title}\n   ${r.content}`)
          .join('\n\n');
        return `Search results for "${query}":\n\n${summary}`;
      }

      return `No results found for "${query}"`;
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Web search timed out');
      }
      throw error;
    }
  }
}

module.exports = WebSearchTool;

