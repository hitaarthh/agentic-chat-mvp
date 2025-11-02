import { GripVertical } from "lucide-react";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  orientation?: "horizontal" | "vertical";
}

export const ResizeHandle = ({ onMouseDown, orientation = "vertical" }: ResizeHandleProps) => {
  if (orientation === "vertical") {
    return (
      <div
        className="resize-handle w-2 flex items-center justify-center group cursor-col-resize hover:bg-border transition-colors"
        onMouseDown={onMouseDown}
      >
        <div className="h-12 w-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
        <GripVertical className="absolute w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className="resize-handle h-2 flex items-center justify-center group cursor-row-resize"
      onMouseDown={onMouseDown}
    >
      <div className="w-12 h-1 rounded-full bg-border group-hover:bg-accent transition-colors" />
    </div>
  );
};
