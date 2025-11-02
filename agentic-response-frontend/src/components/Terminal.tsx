import { useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { TerminalLog, LogEntry } from "./TerminalLog";

interface TerminalProps {
  logs: LogEntry[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isStreaming?: boolean;
}

export const Terminal = ({ logs, isCollapsed, onToggleCollapse, isStreaming = false }: TerminalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  return (
    <div className={`terminal-bg flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? "min-h-10" : ""
    }`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold terminal-text">Server Logs</span>
          {isStreaming && (
            <Badge variant="outline">
              Streaming
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-muted"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Terminal Content */}
      {!isCollapsed && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 terminal-scroll"
        >
          {logs.length === 0 ? (
            <p className="terminal-text text-muted-foreground">
              Waiting for server events...
            </p>
          ) : (
            <TerminalLog logs={logs} />
          )}
        </div>
      )}
    </div>
  );
};
