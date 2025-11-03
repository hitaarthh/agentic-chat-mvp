const LLMService = require('../llm/LLMService');
const StreamHandler = require('../llm/streamHandler');
const { MAX_ITERATIONS } = require('../../utils/constants');
const { getErrorMessage } = require('../../utils/errorMessages');

class AgentOrchestrator {
  constructor(llmService, toolRegistry) {
    this.llmService = llmService;
    this.toolRegistry = toolRegistry;
  }

  sendServerLog(res, message, logCallback) {
    if (res?.headersSent && res.getHeader('Content-Type') === 'text/event-stream') {
      res.write(`data: ${JSON.stringify({ type: 'server_log', message })}\n\n`);
    }
    // Also collect logs if callback provided (non-streaming mode)
    if (logCallback) {
      logCallback(message);
    }
  }

  async execute(initialMessages, options = {}) {
    const { stream = false, res = null, logCallback = null, aiEventCallback = null } = options;
    const maxIterations = MAX_ITERATIONS;
    let iteration = 0;
    let currentMessages = [...initialMessages];

    console.log(`\nStarting agentic chat loop...\nUser message: ${currentMessages[0].content}\n`);
    if (stream && res) {
      this.sendServerLog(res, 'Starting agentic chat loop...', logCallback);
      this.sendServerLog(res, `User message: ${currentMessages[0].content}`, logCallback);
    } else if (logCallback) {
      logCallback('Starting agentic chat loop...');
      logCallback(`User message: ${currentMessages[0].content}`);
    }

    while (iteration < maxIterations) {
      iteration++;
      console.log(`\nIteration ${iteration}/${maxIterations}\nCalling LLM...`);
      if (stream && res) {
        this.sendServerLog(res, `Iteration ${iteration}/${maxIterations}`, logCallback);
        this.sendServerLog(res, 'Calling LLM...', logCallback);
      } else if (logCallback) {
        logCallback(`Iteration ${iteration}/${maxIterations}`);
        logCallback('Calling LLM...');
      }

      try {
        const tools = this.toolRegistry.getSchemas();

        if (stream && res !== null) {
          const response = await this.llmService.createStreamingCompletion(currentMessages, tools);
          
          const streamHandler = new StreamHandler(this.llmService, (event) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          });

          const { toolCalls, fullResponse } = await streamHandler.processStream(response);

          if (toolCalls.size > 0) {
            await this.executeToolsInParallel(toolCalls, streamHandler, res, currentMessages);
            continue;
          } else {
            console.log('Stream completed successfully\n');
            this.sendServerLog(res, 'Stream completed successfully');
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            return;
          }
        } else {
          const response = await this.llmService.createCompletion(currentMessages, tools);
          
          const reasoning = this.llmService.extractReasoning(response);
          if (reasoning) {
            console.log(`Reasoning: ${reasoning}`);
            if (aiEventCallback) {
              aiEventCallback({ type: 'reasoning', content: reasoning });
            }
            if (logCallback) {
              logCallback(`Reasoning: ${reasoning}`);
            }
          }

          const message = this.llmService.extractMessage(response);

          if (this.llmService.hasToolCalls(message)) {
            if (logCallback) {
              logCallback('LLM requested tool calls');
            }
            // Emit tool calls for AI Response panel
            if (aiEventCallback && message.tool_calls) {
              message.tool_calls.forEach(toolCall => {
                const toolName = toolCall.function?.name;
                if (toolName) {
                  aiEventCallback({ type: 'tool_call', tool: toolName });
                }
              });
            }
            await this.executeToolsFromMessage(message, currentMessages, logCallback, aiEventCallback);
            continue;
          } else {
            console.log('LLM provided direct response (no tools needed)');
            const finalContent = message.content || message.text || '';
            console.log(`Final response: ${finalContent}\n`);
            if (aiEventCallback && finalContent) {
              // Emit content chunks for AI response panel
              aiEventCallback({ type: 'content', content: finalContent });
            }
            if (logCallback) {
              logCallback('LLM provided direct response (no tools needed)');
            }
            return finalContent;
          }
        }
      } catch (error) {
        console.error(`Error in iteration ${iteration}:`, error.message);
        if (stream && res) {
          this.sendServerLog(res, `Error in iteration ${iteration}: ${error.message}`, logCallback);
        } else if (logCallback) {
          logCallback(`Error in iteration ${iteration}: ${error.message}`);
        }
        
        const userErrorMessage = getErrorMessage(error, 'iteration');
        
        if (stream && res !== null) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: userErrorMessage })}\n\n`);
        }
        throw new Error(userErrorMessage);
      }
    }

    const userErrorMessage = 'The request took too long to process. Please try breaking it into smaller questions or rephrasing your query.';
    console.error(`Max iterations reached`);
    if (stream && res !== null) {
      this.sendServerLog(res, 'Max iterations reached', logCallback);
      res.write(`data: ${JSON.stringify({ type: 'error', error: userErrorMessage })}\n\n`);
    } else {
      if (logCallback) {
        logCallback('Max iterations reached');
      }
      throw new Error(userErrorMessage);
    }
  }

  async executeToolsInParallel(toolCalls, streamHandler, res, currentMessages) {
    try {
      const toolCallPromises = Array.from(toolCalls.entries()).map(async ([index, toolCallData]) => {
        const args = streamHandler.parseToolArgs(toolCallData.args, toolCallData.name);

        this.sendServerLog(res, `Executing ${toolCallData.name} with args: ${JSON.stringify(args)}`);
        res.write(`data: ${JSON.stringify({ type: 'tool_executing', tool: toolCallData.name, args: args })}\n\n`);

        const toolResult = await this.toolRegistry.executeTool(toolCallData.name, args);
        this.sendServerLog(res, `${toolCallData.name} executed successfully`);
        this.sendServerLog(res, `Result: ${toolResult.substring(0, 200)}${toolResult.length > 200 ? '...' : ''}`);

        const toolCallId = toolCallData.id || `call_${index}_${Date.now()}`;

        res.write(`data: ${JSON.stringify({ type: 'tool_result', tool: toolCallData.name, result: toolResult, id: toolCallId })}\n\n`);

        return {
          id: toolCallId,
          name: toolCallData.name,
          args: toolCallData.args,
          result: toolResult
        };
      });

      const toolResults = await Promise.all(toolCallPromises);

      const toolCallsArray = toolResults.map(tr => ({
        id: tr.id,
        type: 'function',
        function: { name: tr.name, arguments: tr.args }
      }));

      currentMessages.push({
        role: 'assistant',
        content: null,
        tool_calls: toolCallsArray
      });

      toolResults.forEach(tr => {
        currentMessages.push({
          role: 'tool',
          tool_call_id: tr.id,
          content: tr.result
        });
      });
    } catch (toolError) {
      console.error(`Tool execution error:`, toolError.message);
      
      const userErrorMessage = getErrorMessage(toolError, 'tool');
      
      res.write(`data: ${JSON.stringify({ type: 'error', error: userErrorMessage })}\n\n`);
      throw new Error(userErrorMessage);
    }
  }

  async executeToolsFromMessage(message, currentMessages, logCallback = null, aiEventCallback = null) {
    try {
      const toolCalls = message.tool_calls || [];

      const toolPromises = toolCalls.map(async (toolCall) => {
        const toolName = toolCall.function.name;
        let toolArgs;
        
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error(`JSON Parse Error for ${toolName}:`, parseError.message);
          throw new Error(`Invalid parameters for ${toolName}. Please try rephrasing your question.`);
        }

        console.log(`Tool requested: ${toolName}`);
        console.log(`Tool arguments:`, toolArgs);
        console.log('Executing tool...');
        
        // Emit tool execution event for AI Response panel
        if (aiEventCallback) {
          aiEventCallback({ type: 'tool_executing', tool: toolName, args: toolArgs });
        }
        
        if (logCallback) {
          logCallback(`Tool requested: ${toolName}`);
          logCallback(`Tool arguments: ${JSON.stringify(toolArgs)}`);
          logCallback('Executing tool...');
        }

        const toolResult = await this.toolRegistry.executeTool(toolName, toolArgs);

        console.log(`Tool executed successfully`);
        console.log(`Tool result:`, toolResult.substring(0, 200) + (toolResult.length > 200 ? '...' : ''));
        
        // Emit tool result for AI Response panel
        if (aiEventCallback) {
          aiEventCallback({ type: 'tool_result', tool: toolName, result: toolResult });
        }
        
        if (logCallback) {
          logCallback(`Tool executed successfully`);
          logCallback(`Tool result: ${toolResult.substring(0, 200)}${toolResult.length > 200 ? '...' : ''}`);
        }

        return { toolCall, toolResult };
      });

      const results = await Promise.all(toolPromises);

      currentMessages.push({
        role: 'assistant',
        content: null,
        tool_calls: toolCalls
      });

      results.forEach(({ toolCall, toolResult }) => {
        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult
        });
      });

      console.log('Continuing loop with tool result...');
      if (logCallback) {
        logCallback('Continuing loop with tool result...');
      }
    } catch (toolError) {
      console.error(`Tool execution error:`, toolError.message);
      const userErrorMessage = getErrorMessage(toolError, 'tool');
      throw new Error(userErrorMessage);
    }
  }
}

module.exports = AgentOrchestrator;
