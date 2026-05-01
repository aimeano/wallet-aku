import { useRef, useState, ReactNode, PointerEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
  onSwipeLeft?: () => void;  // delete
  onSwipeRight?: () => void; // edit
  threshold?: number;
}

/**
 * A lightweight swipeable row.
 * - Drag left reveals a red Delete affordance; release past threshold triggers onSwipeLeft.
 * - Drag right reveals a primary Edit affordance; release past threshold triggers onSwipeRight.
 * Works for touch + mouse via Pointer Events.
 */
export const SwipeableRow = ({ children, onSwipeLeft, onSwipeRight, threshold = 80 }: Props) => {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"h" | "v" | null>(null);
  const swiped = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => { setDx(0); setDragging(false); locked.current = null; };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    locked.current = null;
    swiped.current = false;
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dxRaw = e.clientX - startX.current;
    const dyRaw = e.clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dxRaw) < 8 && Math.abs(dyRaw) < 8) return;
      locked.current = Math.abs(dxRaw) > Math.abs(dyRaw) ? "h" : "v";
    }
    if (locked.current === "v") return;

    // Capture pointer once we're horizontal so the row keeps receiving moves.
    try { ref.current?.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
    // Restrict by available action only
    const limited = Math.max(
      onSwipeRight ? -9999 : 0,
      Math.min(onSwipeLeft ? 9999 : 0, dxRaw),
    );
    setDx(limited);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    if (dx <= -threshold && onSwipeLeft) { swiped.current = true; onSwipeLeft(); }
    else if (dx >= threshold && onSwipeRight) { swiped.current = true; onSwipeRight(); }
    else if (locked.current === "h" && Math.abs(dx) > 8) swiped.current = true;
    reset();
  };

  // Suppress the click that follows a horizontal drag so inner buttons don't double-fire.
  const onClickCapture = (e: React.MouseEvent) => {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
      swiped.current = false;
    }
  };

  const showDelete = dx < 0 && onSwipeLeft;
  const showEdit = dx > 0 && onSwipeRight;
  const intensity = Math.min(1, Math.abs(dx) / threshold);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Backgrounds */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-between rounded-2xl px-5"
        aria-hidden
      >
        <div
          className="flex items-center gap-2 text-primary-foreground transition-opacity"
          style={{ opacity: showEdit ? intensity : 0 }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Pencil className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-primary">Edit</span>
        </div>
        <div
          className="ml-auto flex items-center gap-2 transition-opacity"
          style={{ opacity: showDelete ? intensity : 0 }}
        >
          <span className="text-sm font-semibold text-expense">Delete</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-expense text-expense-foreground">
            <Trash2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Colored full-bleed background tint */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-colors"
        style={{
          backgroundColor: showDelete
            ? `color-mix(in hsl, hsl(var(--expense)) ${Math.round(intensity * 22)}%, transparent)`
            : showEdit
              ? `color-mix(in hsl, hsl(var(--primary)) ${Math.round(intensity * 22)}%, transparent)`
              : "transparent",
        }}
      />

      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        onClickCapture={onClickCapture}
        style={{
          transform: `translate3d(${dx}px,0,0)`,
          transition: dragging ? "none" : "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          touchAction: "pan-y",
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
};
