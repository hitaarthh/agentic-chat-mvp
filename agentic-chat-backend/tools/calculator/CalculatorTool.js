const BaseTool = require('../base/BaseTool');
const math = require('mathjs');

class CalculatorTool extends BaseTool {
  constructor() {
    super('calculator', 'Evaluate NUMERIC math expressions (2+2, sqrt(16), 10^5). Use ONLY numbers and operators. For unknown values, search first then calculate with the result. Supports sqrt, pow, sin, cos, log, etc.');
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
            expression: {
              type: 'string',
              description: 'The NUMERIC mathematical expression to evaluate. Use only numbers and math operators. Examples: "2 + 2", "sqrt(16)", "sin(pi/2)", "2^3", "log(10)". For unknown values, search first then use the numeric result.'
            }
          },
          required: ['expression']
        }
      }
    };
  }

  validateArgs(args) {
    if (!args.expression || typeof args.expression !== 'string' || args.expression.trim().length === 0) {
      throw new Error('Invalid expression');
    }
    return true;
  }

  validateToolInput(args) {
    const cleaned = args.expression.trim().replace(/,/g, '');

    const allowedUnits = ['degrees', 'deg', 'radians', 'rad'];
    const allowedConstants = ['pi', 'e', 'PI', 'E'];
    const allAllowed = [...allowedUnits, ...allowedConstants];

    const variablePattern = /\b[a-zA-Z]{2,}\b(?!\()/g;
    const matches = cleaned.match(variablePattern);

    if (matches) {
      const hasInvalidVariable = matches.some(match => {
        const word = match.toLowerCase();
        return !allAllowed.some(allowed => word === allowed.toLowerCase());
      });

      if (hasInvalidVariable) {
        throw new Error('Variables not allowed. Use numeric expressions only. Search for unknown values first.');
      }
    }

    if (cleaned.length > 200) {
      throw new Error('Expression too long. Maximum 200 characters.');
    }

    return cleaned;
  }

  sanitizeToolOutput(result) {
    if (result === Infinity || result === -Infinity) {
      return 'Number too large';
    }
    if (!isFinite(result) || isNaN(result)) {
      return 'Invalid calculation';
    }
    return result.toString();
  }

  async execute(args) {
    this.validateArgs(args);

    try {
      const cleaned = this.validateToolInput(args);
      const result = math.evaluate(cleaned);
      const sanitizedResult = this.sanitizeToolOutput(result);

      if (sanitizedResult === 'Number too large' || sanitizedResult === 'Invalid calculation') {
        throw new Error(sanitizedResult);
      }

      return `Result: ${sanitizedResult}`;
    } catch (error) {
      if (error.message.includes('Variables not allowed') ||
        error.message.includes('Expression too long') ||
        error.message.includes('Number too large') ||
        error.message.includes('Invalid calculation')) {
        throw error;
      }

      if (error.message.includes('Undefined symbol') || error.message.includes('Undefined')) {
        throw new Error('Variables not allowed. Use numeric expressions only. Search for unknown values first.');
      }

      throw new Error(`Calculator error: ${error.message}`);
    }
  }
}

module.exports = CalculatorTool;
