import { Wrench, CheckCircle, MessageSquare, Check, Brain, Loader2, AlertCircle } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  type: "tool_call" | "tool_executing" | "tool_result" | "content" | "done" | "reasoning" | "error";
  message: string;
}

interface TerminalLogProps {
  logs: LogEntry[];
}

const getLogIcon = (type: LogEntry["type"]) => {
  switch (type) {
    case "tool_call":
      return <Wrench className="w-3 h-3" style={{ color: "hsl(var(--terminal-cyan))" }} />;
    case "tool_executing":
      return <Loader2 className="w-3 h-3 animate-spin" style={{ color: "hsl(var(--terminal-cyan))" }} />;
    case "tool_result":
      return <CheckCircle className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />;
    case "content":
      return <MessageSquare className="w-3 h-3" style={{ color: "hsl(var(--terminal-amber))" }} />;
    case "reasoning":
      return <Brain className="w-3 h-3" style={{ color: "hsl(var(--terminal-cyan))" }} />;
    case "error":
      return <AlertCircle className="w-3 h-3" style={{ color: "hsl(var(--destructive))" }} />;
    case "done":
      return <Check className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />;
  }
};

const getLogLabel = (type: LogEntry["type"]) => {
  switch (type) {
    case "tool_call":
      return "🔧 TOOL";
    case "tool_executing":
      return "⚙️ EXECUTING";
    case "tool_result":
      return "✅ RESULT";
    case "content":
      return "💬 CONTENT";
    case "reasoning":
      return "🧠 REASONING";
    case "error":
      return "❌ ERROR";
    case "done":
      return "✓ DONE";
  }
};

export const TerminalLog = ({ logs }: TerminalLogProps) => {
  return (
    <div className="space-y-1">
      {logs.map((log, index) => (
        <div key={index} className="flex items-start gap-2 terminal-text">
          <span className="text-muted-foreground flex-shrink-0">[{log.timestamp}]</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {getLogIcon(log.type)}
            <span className="font-semibold">{getLogLabel(log.type)}:</span>
          </span>
          <span className="flex-1 break-all">{log.message}</span>
        </div>
      ))}
    </div>
  );
};
