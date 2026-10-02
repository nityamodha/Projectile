"use client";

import { CalendarDays, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Project, ProjectStatus } from "@/types/project";
import { createProject, deleteProject, listProjects, updateProject } from "@/lib/database/project-repository";
import { hasSupabaseConfig } from "@/lib/database/supabase";

const statuses: ProjectStatus[] = ["Planning", "Active", "On Hold", "Completed"];

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "Website Redesign",
    description: "MVP planning schedule",
    startDate: new Date().toISOString().slice(0, 10),
    targetEndDate: "",
    status: "Planning" as ProjectStatus
  });

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    listProjects().then(setProjects).catch((reason) => setError(String(reason.message ?? reason)));
  }, []);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [projects]
  );

  async function handleCreateProject() {
    if (!draft.name.trim()) return;
    try {
      const project = await createProject({
        name: draft.name.trim(),
        description: draft.description,
        startDate: draft.startDate,
        targetEndDate: draft.targetEndDate || null,
        status: draft.status
      });
      setProjects((current) => [project, ...current]);
    } catch (reason) {
      setError(String((reason as Error).message ?? reason));
    }
  }

  async function handleRename(project: Project) {
    const name = window.prompt("Project name", project.name);
    if (!name?.trim()) return;
    const updated = await updateProject({ ...project, name: name.trim() });
    setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete ${project.name}?`)) return;
    await deleteProject(project.id);
    setProjects((current) => current.filter((item) => item.id !== project.id));
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] p-6 text-[#18212f]">
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Projectile</h1>
            <p className="mt-1 text-sm text-[#687386]">Project plans, WBS tasks, dependency scheduling, and Gantt charts.</p>
          </div>
        </div>

        {!hasSupabaseConfig ? (
          <div className="border border-[#d7dce5] bg-white p-4 text-sm">
            Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then run the SQL migration in
            `supabase/migrations` to use the app.
          </div>
        ) : null}

        {error ? <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

        <div className="grid grid-cols-[minmax(280px,360px)_1fr] gap-4">
          <div className="border border-[#d7dce5] bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase text-[#46546a]">Create Project</h2>
            <div className="grid gap-3">
              <input className="border border-[#c8ced8] px-3 py-2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              <textarea className="min-h-20 border border-[#c8ced8] px-3 py-2" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              <label className="grid gap-1 text-xs font-medium text-[#46546a]">
                Start
                <input type="date" className="border border-[#c8ced8] px-3 py-2 text-sm text-[#18212f]" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-medium text-[#46546a]">
                Target Finish
                <input type="date" className="border border-[#c8ced8] px-3 py-2 text-sm text-[#18212f]" value={draft.targetEndDate} onChange={(event) => setDraft({ ...draft, targetEndDate: event.target.value })} />
              </label>
              <select className="border border-[#c8ced8] px-3 py-2" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <button className="inline-flex items-center justify-center gap-2 bg-[#2563eb] px-3 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={!hasSupabaseConfig} onClick={handleCreateProject}>
                <Plus size={16} /> Create project
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-[#d7dce5] bg-white">
            <div className="grid grid-cols-[1.4fr_120px_120px_120px_120px] border-b border-[#d7dce5] bg-[#eef1f5] px-3 py-2 text-xs font-semibold uppercase text-[#46546a]">
              <span>Project</span>
              <span>Status</span>
              <span>Start</span>
              <span>Finish</span>
              <span>Actions</span>
            </div>
            {sortedProjects.map((project) => (
              <div key={project.id} className="grid grid-cols-[1.4fr_120px_120px_120px_120px] items-center border-b border-[#e2e6ed] px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{project.name}</div>
                  <div className="truncate text-xs text-[#687386]">{project.description}</div>
                </div>
                <span>{project.status}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {project.startDate}</span>
                <span>{project.targetEndDate ?? "-"}</span>
                <div className="flex gap-1">
                  <a className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8]" href={`/projects/${project.id}`} title="Open project"><FolderOpen size={16} /></a>
                  <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8]" onClick={() => handleRename(project)} title="Rename project"><Pencil size={16} /></button>
                  <button className="inline-flex h-8 w-8 items-center justify-center border border-[#c8ced8]" onClick={() => handleDelete(project)} title="Delete project"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {sortedProjects.length === 0 ? <div className="p-6 text-sm text-[#687386]">No projects yet.</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
