class LLMService {
  constructor(openaiClient, model) {
    this.openai = openaiClient;
    this.model = model;
  }

  async createCompletion(messages, tools) {
    const requestConfig = {
      model: this.model,
      messages: messages,
      tools: tools,
      tool_choice: 'auto'
    };

    return await this.openai.chat.completions.create(requestConfig);
  }

  async createStreamingCompletion(messages, tools) {
    const requestConfig = {
      model: this.model,
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      stream: true
    };

    return await this.openai.chat.completions.create(requestConfig);
  }

  extractMessage(response) {
    return response.choices[0].message;
  }

  extractReasoning(response) {
    const choice = response.choices[0];
    return choice?.reasoning_content || null;
  }

  hasToolCalls(message) {
    return message.tool_calls && message.tool_calls.length > 0;
  }
}

module.exports = LLMService;

