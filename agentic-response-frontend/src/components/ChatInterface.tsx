import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { ChatMessage } from "./ChatMessage";
import { Terminal } from "./Terminal";
import { ResizeHandle } from "./ResizeHandle";
import { TerminalLog, LogEntry } from "./TerminalLog";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PANEL_MIN_WIDTH = 300;
const PANEL_MIN_HEIGHT = 150;
const DEFAULT_PANEL_WIDTH_RATIO = 0.5;
const DEFAULT_RIGHT_PANEL_HEIGHT_RATIO = 0.5;
const STORAGE_KEY = "panel-width-ratio";
const RIGHT_PANEL_HEIGHT_KEY = "right-panel-height-ratio";
const STREAMING_MODE_KEY = "streaming-mode";
const API_URL = "http://localhost:8081/chat";

const getTimestamp = () => {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [aiResponseLogs, setAiResponseLogs] = useState<LogEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(() => {
    const stored = localStorage.getItem(STREAMING_MODE_KEY);
    return stored !== null ? stored === "true" : true;
  });
  const [panelWidthRatio, setPanelWidthRatio] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseFloat(stored) : DEFAULT_PANEL_WIDTH_RATIO;
  });
  const [rightPanelHeightRatio, setRightPanelHeightRatio] = useState(() => {
    const stored = localStorage.getItem(RIGHT_PANEL_HEIGHT_KEY);
    return stored ? parseFloat(stored) : DEFAULT_RIGHT_PANEL_HEIGHT_RATIO;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const isResizingRightPanelRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, panelWidthRatio.toString());
  }, [panelWidthRatio]);

  useEffect(() => {
    localStorage.setItem(RIGHT_PANEL_HEIGHT_KEY, rightPanelHeightRatio.toString());
  }, [rightPanelHeightRatio]);

  useEffect(() => {
    localStorage.setItem(STREAMING_MODE_KEY, streamingEnabled.toString());
  }, [streamingEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleRightPanelMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRightPanelRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;

        const minLeftPanelWidth = PANEL_MIN_WIDTH;
        const minRightPanelWidth = PANEL_MIN_WIDTH;
        const maxLeftPanelWidth = containerWidth - minRightPanelWidth;

        const clampedMouseX = Math.max(minLeftPanelWidth, Math.min(mouseX, maxLeftPanelWidth));
        const newRatio = clampedMouseX / containerWidth;

        setPanelWidthRatio(newRatio);
      }

      if (isResizingRightPanelRef.current && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const panelHeight = panelRect.height;
        const mouseY = e.clientY - panelRect.top;

        const minTopHeight = PANEL_MIN_HEIGHT;
        const minBottomHeight = PANEL_MIN_HEIGHT;
        const maxTopHeight = panelHeight - minBottomHeight;

        const clampedMouseY = Math.max(minTopHeight, Math.min(mouseY, maxTopHeight));
        const newRatio = clampedMouseY / panelHeight;

        setRightPanelHeightRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
      }
      if (isResizingRightPanelRef.current) {
        isResizingRightPanelRef.current = false;
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const addLog = (type: LogEntry["type"], message: string) => {
    const logEntry: LogEntry = { timestamp: getTimestamp(), type, message };

    const toolEventTypes = ["tool_call", "tool_executing", "tool_result", "reasoning", "content", "done"];
    if (toolEventTypes.includes(type)) {
      setAiResponseLogs((prev) => [...prev, logEntry]);
    }

    if (type === "error" || type === "done") {
      setLogs((prev) => [...prev, logEntry]);
    }
  };

  const addServerLog = (message: string) => {
    const logEntry: LogEntry = { timestamp: getTimestamp(), type: "content", message };
    setLogs((prev) => [...prev, logEntry]);
  };

  const updateAssistantMessage = (content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
        newMessages[lastIndex] = { ...newMessages[lastIndex], content };
      } else {
        newMessages.push({ role: "assistant", content });
      }
      return newMessages;
    });
  };

  const showError = (errorMessage: string) => {
    updateAssistantMessage(`Sorry, something went wrong: ${errorMessage}. Please try again or rephrase your question.`);
    addLog("error", errorMessage);
  };

  interface SSEEvent {
    type: string;
    message?: string;
    tool?: string;
    args?: unknown;
    result?: unknown;
    content?: string;
    error?: string;
  }

  const processSSEEvent = (parsed: SSEEvent, assistantMessage: string) => {
    switch (parsed.type) {
      case "server_log": {
        addServerLog(parsed.message || "");
        return { assistantMessage, shouldBreak: false };
      }

      case "tool_call": {
        addLog("tool_call", parsed.tool || "unknown");
        return { assistantMessage, shouldBreak: false };
      }

      case "tool_executing": {
        const argsStr = parsed.args ? JSON.stringify(parsed.args) : "";
        addLog("tool_executing", `${parsed.tool || "unknown"}(${argsStr.substring(0, 80)}...)`);
        return { assistantMessage, shouldBreak: false };
      }

      case "tool_result": {
        const truncated = typeof parsed.result === "string"
          ? parsed.result.substring(0, 100)
          : JSON.stringify(parsed.result).substring(0, 100);
        addLog("tool_result", truncated + (truncated.length >= 100 ? "..." : ""));
        return { assistantMessage, shouldBreak: false };
      }

      case "reasoning": {
        addLog("reasoning", parsed.content || "");
        return { assistantMessage, shouldBreak: false };
      }

      case "content": {
        const newContent = assistantMessage + (parsed.content || "");
        addLog("content", parsed.content || "");
        updateAssistantMessage(newContent);
        return { assistantMessage: newContent, shouldBreak: false };
      }

      case "error": {
        const errorMsg = parsed.error || "Something went wrong";
        addLog("error", errorMsg);
        showError(errorMsg);
        return { assistantMessage, shouldBreak: true };
      }

      case "done": {
        addLog("done", "Stream completed");
        return { assistantMessage, shouldBreak: true };
      }

      default:
        return { assistantMessage, shouldBreak: false };
    }
  };

  const handleStreamingResponse = async (response: Response) => {
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let assistantMessage = "";
    let streamError = false;

    try {
      while (true) {
        let readResult;
        try {
          readResult = await reader.read();
        } catch (readError) {
          console.error("Error reading stream:", readError);
          streamError = true;
          break;
        }

        const { done, value } = readResult;
        if (done) break;

        let chunk;
        try {
          chunk = decoder.decode(value, { stream: true });
        } catch (decodeError) {
          console.error("Error decoding stream chunk:", decodeError);
          continue;
        }

        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;

          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            addLog("done", "Stream completed");
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const result = processSSEEvent(parsed, assistantMessage);
            assistantMessage = result.assistantMessage;

            if (result.shouldBreak) {
              if (parsed.type === "error") {
                streamError = true;
              }
              break;
            }
          } catch (parseError) {
            console.error("Failed to parse SSE data:", parseError, "Raw data:", data);
          }
        }

        if (streamError) break;
      }
    } catch (streamError) {
      console.error("Stream processing error:", streamError);
      showError("There was an error processing the stream. Please try again.");
    } finally {
      try {
        reader.releaseLock();
      } catch (cleanupError) {
        console.error("Error releasing reader lock:", cleanupError);
      }
    }

    setIsStreaming(false);

    if (assistantMessage === "" && !streamError) {
      updateAssistantMessage("Sorry, I didn't receive a response. Please try again.");
    }
  };

  const handleNonStreamingResponse = async (response: Response) => {
    const data = await response.json();

    if (data.error) {
      showError(data.error || "Something went wrong");
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive",
      });
    } else {
      const responseText = data.response || "Sorry, I didn't receive a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    }
  };

  const getErrorMessage = (error: unknown): { title: string; description: string } => {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        title: "Connection Error",
        description: "Failed to connect to server. Make sure the API is running on localhost:8081",
      };
    }

    if (error instanceof Error) {
      return {
        title: error.message,
        description: error.message,
      };
    }

    return {
      title: "Something went wrong. Please try again.",
      description: "An unexpected error occurred.",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setLogs([]);
    setAiResponseLogs([]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          stream: streamingEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (streamingEnabled) {
        await handleStreamingResponse(response);
      } else {
        await handleNonStreamingResponse(response);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const { title, description } = getErrorMessage(error);

      const hasAssistantMessage = messages.some(
        (msg, idx) => idx > 0 && msg.role === "assistant"
      );

      if (!hasAssistantMessage) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, ${description}. Please try again.` }]);
      } else {
        updateAssistantMessage(`Sorry, ${description}. Please try again.`);
      }

      toast({
        title,
        description,
        variant: "destructive",
      });
      addLog("error", description);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-bold terminal-text">Agent Response</h2>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className="flex flex-col border-r border-border"
          style={{ width: `${panelWidthRatio * 100}%`, minWidth: `${PANEL_MIN_WIDTH}px` }}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="h-full">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-center">
                    Your conversation will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {messages.map((message, index) => (
                    <ChatMessage key={index} role={message.role} content={message.content} />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-border p-4 bg-card">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {isStreaming && <Badge variant="outline">Streaming</Badge>}
                {isLoading && !isStreaming && <Badge variant="outline">Processing...</Badge>}
                {!isLoading && !isStreaming && (
                  <Badge variant="outline" className={streamingEnabled ? "" : "opacity-50"}>
                    Stream Mode: {streamingEnabled ? "ON" : "OFF"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="streaming-mode"
                  checked={streamingEnabled}
                  onCheckedChange={setStreamingEnabled}
                  disabled={isLoading}
                />
                <Label htmlFor="streaming-mode" className="text-sm font-medium cursor-pointer">
                  Enable Streaming
                </Label>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-input border-border"
              />
              <Button type="submit" disabled={isLoading} className="flex-shrink-0">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </div>

        <ResizeHandle onMouseDown={handleMouseDown} orientation="vertical" />

        <div
          ref={rightPanelRef}
          className="flex flex-col"
          style={{ width: `${(1 - panelWidthRatio) * 100}%`, minWidth: `${PANEL_MIN_WIDTH}px` }}
        >
          <div
            className="flex flex-col border-b border-border"
            style={{ height: `${rightPanelHeightRatio * 100}%`, minHeight: `${PANEL_MIN_HEIGHT}px` }}
          >
            <div className="border-b border-border bg-card px-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold terminal-text">AI Response</h3>
                {isStreaming && <Badge variant="outline">Streaming</Badge>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto terminal-bg p-4">
              {aiResponseLogs.length === 0 ? (
                <p className="terminal-text text-muted-foreground">
                  Waiting for AI response events...
                </p>
              ) : (
                <TerminalLog logs={aiResponseLogs} />
              )}
            </div>
          </div>

          <ResizeHandle onMouseDown={handleRightPanelMouseDown} orientation="horizontal" />

          <div
            className="flex flex-col"
            style={{ height: `${(1 - rightPanelHeightRatio) * 100}%`, minHeight: `${PANEL_MIN_HEIGHT}px` }}
          >
            <Terminal
              logs={logs}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
