"use client";

import { ChevronDown, ChevronRight, Milestone } from "lucide-react";
import type { Task, TaskRow } from "@/types/task";

interface TaskGridProps {
  rows: TaskRow[];
  selectedTaskId: string | null;
  onSelect: (id: string) => void;
  onUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  onSetPredecessors: (taskId: string, value: string) => void;
}

export function TaskGrid({ rows, selectedTaskId, onSelect, onUpdateTask, onSetPredecessors }: TaskGridProps) {
  return (
    <div className="dense-scrollbar h-full overflow-auto border-r border-[#c8ced8] bg-white">
      <div className="grid min-w-[860px] grid-cols-[70px_260px_100px_120px_120px_140px_110px] border-b border-[#c8ced8] bg-[#e9edf3] text-xs font-semibold uppercase text-[#46546a]">
        {["ID", "Task Name", "Duration", "Start", "Finish", "Predecessors", "% Complete"].map((header) => (
          <div key={header} className="border-r border-[#c8ced8] px-2 py-2">{header}</div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className={`grid min-w-[860px] grid-cols-[70px_260px_100px_120px_120px_140px_110px] border-b border-[#e3e7ee] text-sm ${selectedTaskId === row.id ? "bg-[#dbeafe]" : "bg-white"}`}
          onClick={() => onSelect(row.id)}
        >
          <Cell>{row.displayId}</Cell>
          <Cell>
            <div className="flex items-center gap-1" style={{ paddingLeft: row.depth * 18 }}>
              {row.hasChildren ? (
                <button className="flex h-5 w-5 items-center justify-center" onClick={(event) => { event.stopPropagation(); onUpdateTask(row.id, { collapsed: !row.collapsed }); }} title={row.collapsed ? "Expand" : "Collapse"}>
                  {row.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
              ) : <span className="h-5 w-5" />}
              {row.milestone ? <Milestone size={14} className="text-[#be123c]" /> : null}
              <input className="w-full bg-transparent px-1 py-1 outline-none focus:bg-white focus:ring-1 focus:ring-[#2563eb]" value={row.name} onChange={(event) => onUpdateTask(row.id, { name: event.target.value })} />
            </div>
          </Cell>
          <Cell>
            <input type="number" min={0} className="w-full bg-transparent px-1 py-1 outline-none focus:bg-white focus:ring-1 focus:ring-[#2563eb]" value={row.duration} onChange={(event) => onUpdateTask(row.id, { duration: Number(event.target.value), milestone: Number(event.target.value) === 0 })} />
          </Cell>
          <Cell>
            <input type="date" className="w-full bg-transparent px-1 py-1 outline-none focus:bg-white focus:ring-1 focus:ring-[#2563eb]" value={row.startDate ?? ""} onChange={(event) => onUpdateTask(row.id, { startDate: event.target.value || null })} />
          </Cell>
          <Cell>{row.finishDate ?? ""}</Cell>
          <Cell>
            <input className="w-full bg-transparent px-1 py-1 outline-none focus:bg-white focus:ring-1 focus:ring-[#2563eb]" value={row.predecessorDisplayIds} onChange={(event) => onSetPredecessors(row.id, event.target.value)} />
          </Cell>
          <Cell>
            <input type="number" min={0} max={100} className="w-full bg-transparent px-1 py-1 outline-none focus:bg-white focus:ring-1 focus:ring-[#2563eb]" value={row.progress} onChange={(event) => onUpdateTask(row.id, { progress: Number(event.target.value) })} />
          </Cell>
        </div>
      ))}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-9 items-center border-r border-[#e3e7ee] px-2">{children}</div>;
}
