"use client";

import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import type { TaskDependency, TaskRow } from "@/types/task";

interface GanttChartProps {
  rows: TaskRow[];
  dependencies: TaskDependency[];
  selectedTaskId: string | null;
  scale: "day" | "week" | "month";
  onSelect: (id: string) => void;
}

const dayWidthByScale = { day: 34, week: 16, month: 8 };
const rowHeight = 37;

export function GanttChart({ rows, dependencies, selectedTaskId, scale, onSelect }: GanttChartProps) {
  const datedRows = rows.filter((row) => row.startDate && row.finishDate);
  const minDate = datedRows.length
    ? datedRows.map((row) => parseISO(row.startDate as string)).sort((a, b) => a.getTime() - b.getTime())[0]
    : new Date();
  const maxDate = datedRows.length
    ? datedRows.map((row) => parseISO(row.finishDate as string)).sort((a, b) => b.getTime() - a.getTime())[0]
    : addDays(new Date(), 30);
  const start = startOfWeek(addDays(minDate, -3), { weekStartsOn: 1 });
  const totalDays = Math.max(30, differenceInCalendarDays(addDays(maxDate, 10), start));
  const dayWidth = dayWidthByScale[scale];
  const width = totalDays * dayWidth;
  const todayOffset = differenceInCalendarDays(new Date(), start) * dayWidth;
  const taskById = new Map(rows.map((row, index) => [row.id, { row, index }]));

  return (
    <div className="dense-scrollbar relative h-full overflow-auto bg-white">
      <div className="sticky top-0 z-10 border-b border-[#c8ced8] bg-[#e9edf3]" style={{ width }}>
        <div className="relative h-9">
          {Array.from({ length: totalDays }).map((_, index) => {
            const date = addDays(start, index);
            const showLabel =
              scale === "day" || (scale === "week" && date.getDay() === 1) || (scale === "month" && date.getDate() === 1);
            return showLabel ? (
              <div key={date.toISOString()} className="absolute top-0 flex h-9 items-center border-l border-[#c8ced8] px-1 text-xs font-semibold text-[#46546a]" style={{ left: index * dayWidth, width: scale === "day" ? dayWidth : dayWidth * (scale === "week" ? 7 : 30) }}>
                {scale === "month" ? format(startOfMonth(date), "MMM yyyy") : format(date, scale === "day" ? "d MMM" : "d MMM")}
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="relative" style={{ width, height: rows.length * rowHeight }}>
        {rows.map((row, index) => (
          <div key={row.id} className={`absolute left-0 border-b border-[#edf0f4] ${selectedTaskId === row.id ? "bg-[#eff6ff]" : ""}`} style={{ top: index * rowHeight, width, height: rowHeight }} onClick={() => onSelect(row.id)} />
        ))}
        {todayOffset >= 0 && todayOffset <= width ? <div className="absolute top-0 z-20 w-px bg-[#dc2626]" style={{ left: todayOffset, height: rows.length * rowHeight }} /> : null}
        <svg className="pointer-events-none absolute left-0 top-0 z-10" width={width} height={rows.length * rowHeight}>
          {dependencies.map((dependency) => {
            const predecessor = taskById.get(dependency.predecessorTaskId);
            const successor = taskById.get(dependency.successorTaskId);
            if (!predecessor?.row.finishDate || !successor?.row.startDate) return null;
            const x1 = (differenceInCalendarDays(parseISO(predecessor.row.finishDate), start) + 1) * dayWidth;
            const y1 = predecessor.index * rowHeight + rowHeight / 2;
            const x2 = differenceInCalendarDays(parseISO(successor.row.startDate), start) * dayWidth;
            const y2 = successor.index * rowHeight + rowHeight / 2;
            const mid = Math.max(x1 + 10, x2 - 10);
            return <path key={dependency.id} d={`M ${x1} ${y1} L ${mid} ${y1} L ${mid} ${y2} L ${x2} ${y2}`} fill="none" stroke="#64748b" strokeWidth="1.5" />;
          })}
        </svg>
        {rows.map((row, index) => {
          if (!row.startDate || !row.finishDate) return null;
          const left = differenceInCalendarDays(parseISO(row.startDate), start) * dayWidth;
          const span = Math.max(1, differenceInCalendarDays(parseISO(row.finishDate), parseISO(row.startDate)) + 1);
          const barWidth = row.milestone ? 16 : Math.max(14, span * dayWidth - 4);
          const top = index * rowHeight + 9;
          if (row.milestone) {
            return <button key={row.id} className="absolute z-20 h-4 w-4 rotate-45 border border-[#9f1239] bg-[#e11d48]" style={{ left, top }} onClick={() => onSelect(row.id)} title={row.name} />;
          }
          return (
            <button key={row.id} className={`absolute z-20 h-5 overflow-hidden border text-left ${row.hasChildren ? "border-[#334155] bg-[#334155]" : "border-[#1d4ed8] bg-[#3b82f6]"}`} style={{ left, top, width: barWidth }} onClick={() => onSelect(row.id)} title={row.name}>
              <span className="block h-full bg-[#16a34a]" style={{ width: `${row.progress}%` }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
