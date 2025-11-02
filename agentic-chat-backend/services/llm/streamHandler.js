class StreamHandler {
  constructor(llmService, onEvent) {
    this.llmService = llmService;
    this.onEvent = onEvent;
    this.toolCalls = new Map();
    this.fullResponse = '';
  }

  async processStream(stream) {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const choice = chunk.choices[0];

      if (delta?.reasoning_content) {
        const reasoning = delta.reasoning_content;
        this.onEvent({ type: 'reasoning', content: reasoning });
        console.log(`Reasoning: ${reasoning}`);
      }

      if (choice?.reasoning_content) {
        const reasoning = choice.reasoning_content;
        this.onEvent({ type: 'reasoning', content: reasoning });
        console.log(`Reasoning: ${reasoning}`);
      }

      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          const index = toolCall.index;
          
          if (index !== undefined) {
            if (!this.toolCalls.has(index)) {
              this.toolCalls.set(index, { id: '', name: '', args: '' });
            }

            const toolCallData = this.toolCalls.get(index);

            if (toolCall.id) {
              toolCallData.id = toolCall.id;
            }

            if (toolCall.function) {
              if (toolCall.function.name && !toolCallData.name) {
                toolCallData.name = toolCall.function.name;
                this.onEvent({ type: 'tool_call', tool: toolCallData.name, id: toolCallData.id || `call_${index}` });
              }

              if (toolCall.function.arguments) {
                toolCallData.args += toolCall.function.arguments;
              }
            }
          }
        }
      }

      if (delta?.content) {
        this.fullResponse += delta.content;
        this.onEvent({ type: 'content', content: delta.content });
      }
    }

    return {
      toolCalls: this.toolCalls,
      fullResponse: this.fullResponse
    };
  }

  parseToolArgs(argsString, toolName) {
    try {
      return JSON.parse(argsString);
    } catch (parseError) {
      console.error(`JSON Parse Error for ${toolName}: ${parseError.message}`);
      console.error(`Invalid JSON: ${argsString}`);
      throw new Error(`Failed to parse tool arguments for ${toolName}: ${parseError.message}`);
    }
  }
}

module.exports = StreamHandler;
