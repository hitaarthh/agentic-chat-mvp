const CalculatorTool = require('./calculator/CalculatorTool');
const WebSearchTool = require('./web_search/WebSearchTool');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    this.register(new CalculatorTool());
    this.register(new WebSearchTool());
  }

  register(tool) {
    if (!tool.name || !tool.execute) {
      throw new Error('Tool must have name and execute method');
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  getSchemas() {
    return Array.from(this.tools.values()).map(tool => tool.getSchema());
  }

  async executeTool(toolName, args) {
    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log(`Executing ${toolName} with args:`, args);
    const result = await tool.execute(args);
    console.log(`${toolName} executed successfully`);
    console.log(`Result:`, result.substring(0, 200) + (result.length > 200 ? '...' : ''));

    return result;
  }

  getToolNames() {
    return Array.from(this.tools.keys());
  }
}

module.exports = ToolRegistry;
