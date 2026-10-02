"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarRange, ListPlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/types/project";
import type { Task, TaskDependency } from "@/types/task";
import { GanttChart } from "./gantt-chart";
import { TaskGrid } from "./task-grid";
import { useProjectPlan } from "./use-project-plan";

interface ProjectWorkspaceProps {
  project: Project;
  tasks: Task[];
  dependencies: TaskDependency[];
}

export function ProjectWorkspace(props: ProjectWorkspaceProps) {
  const plan = useProjectPlan(props.project, props.tasks, props.dependencies);
  const [scale, setScale] = useState<"day" | "week" | "month">("day");

  return (
    <main className="flex h-screen flex-col bg-[#f6f7f9] text-[#18212f]">
      <div className="border-b border-[#c8ced8] bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8]" title="Back to projects">
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <input className="w-full bg-transparent text-xl font-semibold outline-none focus:ring-1 focus:ring-[#2563eb]" value={plan.project.name} onChange={(event) => plan.updateProjectFields({ name: event.target.value })} />
              <div className="mt-1 flex items-center gap-3 text-xs text-[#687386]">
                <label className="inline-flex items-center gap-1">
                  <CalendarRange size={14} /> Start
                  <input type="date" className="border border-[#c8ced8] bg-white px-1 py-0.5 text-[#18212f]" value={plan.project.startDate} onChange={(event) => plan.updateProjectFields({ startDate: event.target.value })} />
                </label>
                <span>{plan.saveState === "saving" ? "Saving..." : plan.saveState === "saved" ? "Saved" : plan.saveState === "error" ? "Save failed" : "Ready"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex h-8 items-center gap-2 border border-[#c8ced8] bg-white px-2 text-sm" onClick={plan.addTask}><ListPlus size={16} /> Add task</button>
            <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8] bg-white" onClick={() => plan.moveSelected(-1)} title="Move up"><ArrowUp size={16} /></button>
            <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8] bg-white" onClick={() => plan.moveSelected(1)} title="Move down"><ArrowDown size={16} /></button>
            <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8] bg-white" onClick={plan.indentSelected} title="Indent"><ArrowRight size={16} /></button>
            <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8] bg-white" onClick={plan.outdentSelected} title="Outdent"><ArrowLeft size={16} /></button>
            <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8] bg-white" onClick={plan.deleteSelectedTask} title="Delete task"><Trash2 size={16} /></button>
            <div className="ml-2 inline-flex border border-[#c8ced8] bg-white">
              {(["day", "week", "month"] as const).map((item) => (
                <button key={item} className={`h-8 px-3 text-sm capitalize ${scale === item ? "bg-[#2563eb] text-white" : ""}`} onClick={() => setScale(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        {plan.errors.length ? (
          <div className="mt-2 border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {plan.errors.join(" ")}
          </div>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(560px,48%)_1fr] border-b border-[#c8ced8]">
        <TaskGrid rows={plan.visibleRows} selectedTaskId={plan.selectedTaskId} onSelect={plan.setSelectedTaskId} onUpdateTask={plan.updateTask} onSetPredecessors={plan.setPredecessors} />
        <GanttChart rows={plan.visibleRows} dependencies={plan.dependencies} selectedTaskId={plan.selectedTaskId} scale={scale} onSelect={plan.setSelectedTaskId} />
      </div>
    </main>
  );
}
