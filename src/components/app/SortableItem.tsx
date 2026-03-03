import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const SortableItem = ({ id, children, className }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/sort",
        isDragging && "z-50 opacity-80 scale-[1.02] shadow-lg rounded-lg bg-card",
        className
      )}
      {...attributes}
    >
      <div className="flex items-center">
        <button
          {...listeners}
          className="w-5 h-5 flex items-center justify-center opacity-0 group-hover/sort:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground touch-none"
          tabIndex={-1}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};
