/**
 * Base class for all tools
 * Provides a consistent interface for tool implementation
 */
class BaseTool {
  constructor(name, description) {
    if (this.constructor === BaseTool) {
      throw new Error('BaseTool is an abstract class and cannot be instantiated directly');
    }
    this.name = name;
    this.description = description;
  }

  /**
   * Get OpenAI function schema for this tool
   * Must be implemented by subclasses
   */
  getSchema() {
    throw new Error('getSchema() must be implemented by subclass');
  }

  /**
   * Execute the tool with given arguments
   * Must be implemented by subclasses
   */
  async execute(args) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Validate input arguments
   * Override in subclass for custom validation
   */
  validateArgs(args) {
    return true;
  }
}

module.exports = BaseTool;

