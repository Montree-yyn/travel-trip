import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { CURRENT_DAY_INDEX } from "@/data/app-state";
import { motionEasing } from "@/design-system/tokens";
import { tapScaleSubtle } from "@/design-system/motion";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { TripDay } from "@/types/trip";

export interface DaySelectorProps {
  days: TripDay[];
  selected: number;
  dragTargetDay?: number | null;
  dayDragTarget?: number | null;
  onDayDragTargetChange?: (dayNumber: number | null) => void;
  onDropDay?: (sourceDayNumber: number, targetDayNumber: number) => boolean;
  onSelect: (dayNumber: number) => void;
}

interface PendingDayDrag {
  day: TripDay;
  pointerId: number;
  startX: number;
  startY: number;
  rect: DOMRect;
  timer: number;
}

interface DayDragState {
  day: TripDay;
  pointerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  targetDayNumber: number;
}

export function DaySelector({
  days,
  selected,
  dragTargetDay = null,
  dayDragTarget = null,
  onDayDragTargetChange,
  onDropDay,
  onSelect,
}: DaySelectorProps) {
  const { t } = useTranslation();
  const pendingDragRef = useRef<PendingDayDrag | null>(null);
  const dragStateRef = useRef<DayDragState | null>(null);
  const suppressClickRef = useRef(false);
  const [dragState, setDragState] = useState<DayDragState | null>(null);

  function setNextDragState(nextState: DayDragState | null) {
    dragStateRef.current = nextState;
    setDragState(nextState);
    onDayDragTargetChange?.(nextState?.targetDayNumber ?? null);
  }

  function getDayDropTarget(clientX: number, clientY: number, fallbackDayNumber: number) {
    const element = document.elementFromPoint(clientX, clientY);
    const target = element?.closest<HTMLElement>("[data-day-drop-target]");
    const dayValue = target?.dataset.dayDropTarget;
    const targetDayNumber = dayValue ? Number(dayValue) : fallbackDayNumber;
    return Number.isFinite(targetDayNumber) ? targetDayNumber : fallbackDayNumber;
  }

  function autoScroll(clientY: number) {
    const edgeSize = 86;
    const maxSpeed = 18;
    if (clientY < edgeSize) {
      window.scrollBy({ top: -maxSpeed, behavior: "auto" });
      return;
    }
    if (window.innerHeight - clientY < edgeSize) {
      window.scrollBy({ top: maxSpeed, behavior: "auto" });
    }
  }

  function startDrag(pending: PendingDayDrag) {
    suppressClickRef.current = true;
    document.body.style.userSelect = "none";
    setNextDragState({
      day: pending.day,
      pointerId: pending.pointerId,
      x: pending.startX,
      y: pending.startY,
      width: pending.rect.width,
      height: pending.rect.height,
      targetDayNumber: pending.day.dayNumber,
    });
  }

  function clearPendingDrag() {
    if (pendingDragRef.current) window.clearTimeout(pendingDragRef.current.timer);
    pendingDragRef.current = null;
  }

  function finishDrag() {
    const state = dragStateRef.current;
    clearPendingDrag();
    document.body.style.userSelect = "";
    setNextDragState(null);
    if (!state) return;

    if (state.targetDayNumber !== state.day.dayNumber) {
      onDropDay?.(state.day.dayNumber, state.targetDayNumber);
    }
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  function handlePointerDown(event: ReactPointerEvent, day: TripDay) {
    if (event.button !== 0 || (event.pointerType === "mouse" && event.buttons !== 1)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    clearPendingDrag();
    pendingDragRef.current = {
      day,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect,
      timer: window.setTimeout(() => {
        const pending = pendingDragRef.current;
        if (pending) startDrag(pending);
      }, 280),
    };
  }

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const pending = pendingDragRef.current;
      const state = dragStateRef.current;
      if (pending && pending.pointerId === event.pointerId && !state) {
        const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (distance > 12) clearPendingDrag();
        return;
      }
      if (!state || state.pointerId !== event.pointerId) return;
      event.preventDefault();
      autoScroll(event.clientY);
      setNextDragState({
        ...state,
        x: event.clientX,
        y: event.clientY,
        targetDayNumber: getDayDropTarget(event.clientX, event.clientY, state.day.dayNumber),
      });
    }

    function handlePointerUp(event: PointerEvent) {
      const pending = pendingDragRef.current;
      const state = dragStateRef.current;
      if (pending && pending.pointerId === event.pointerId) clearPendingDrag();
      if (state && state.pointerId === event.pointerId) finishDrag();
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      clearPendingDrag();
      document.body.style.userSelect = "";
    };
  });

  return (
    <>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
        {days.map((day) => {
          const isActive = day.dayNumber === selected;
          const isToday = day.dayNumber === CURRENT_DAY_INDEX;
          const isDragging = dragState?.day.dayNumber === day.dayNumber;
          const isDragTarget = day.dayNumber === dragTargetDay || day.dayNumber === dayDragTarget;
          return (
            <motion.button
              key={day.dayNumber}
              type="button"
              data-day-drop-target={day.dayNumber}
              onPointerDown={(event) => handlePointerDown(event, day)}
              onClick={() => {
                if (suppressClickRef.current) return;
                onSelect(day.dayNumber);
              }}
              whileTap={tapScaleSubtle}
              transition={motionEasing.snappySpring}
              className={cn(
                "relative shrink-0 touch-manipulation rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                isActive ? "text-accent-contrast" : "glass-surface glass-shadow text-ink-muted",
                isDragTarget && "ring-2 ring-accent/45 ring-offset-2 ring-offset-bg",
                isDragging && "opacity-35",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="day-selector-active"
                  className="pill-glow absolute inset-0 rounded-2xl bg-gradient-to-b from-accent to-accent-strong"
                  transition={motionEasing.snappySpring}
                />
              )}
              {isDragTarget && !isDragging && (
                <motion.span
                  layoutId="day-drop-indicator"
                  className="absolute -bottom-1 left-3 right-3 h-1 rounded-full bg-accent-strong"
                  transition={motionEasing.snappySpring}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {t("common.day", { day: day.dayNumber })}
                {isToday && (
                  <span className={cn("size-1.5 rounded-full", isActive ? "bg-white" : "bg-accent-strong")} />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {dragState && (
          <motion.div
            key="day-drag-ghost"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 0.96, scale: 1.03 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={motionEasing.snappySpring}
            className="pointer-events-none fixed z-[80] rounded-2xl border border-white/70 bg-white/90 px-4 py-2.5 text-sm font-bold text-ink shadow-2xl backdrop-blur-xl"
            style={{
              left: dragState.x - dragState.width / 2,
              top: dragState.y - dragState.height / 2,
              width: dragState.width,
            }}
          >
            <span className="flex items-center justify-between gap-2">
              <span>{t("common.day", { day: dragState.day.dayNumber })}</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-strong">
                {dragState.day.timeline.length}
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
