import { supabase } from "./supabase";
import { mapDependency, mapProject, mapTask, toTaskUpdate } from "./mappers";
import type { Project, ProjectStatus } from "@/types/project";
import type { Task, TaskDependency } from "@/types/task";

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export async function listProjects() {
  const client = requireSupabase();
  const { data, error } = await client.from("projects").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map(mapProject);
}

export async function getProject(projectId: string) {
  const client = requireSupabase();
  const { data, error } = await client.from("projects").select("*").eq("id", projectId).single();
  if (error) throw error;
  return mapProject(data);
}

export async function createProject(input: {
  name: string;
  description: string;
  startDate: string;
  targetEndDate: string | null;
  status: ProjectStatus;
}) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("projects")
    .insert({
      name: input.name,
      description: input.description,
      start_date: input.startDate,
      target_end_date: input.targetEndDate,
      status: input.status
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapProject(data);
}

export async function updateProject(project: Project) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("projects")
    .update({
      name: project.name,
      description: project.description,
      start_date: project.startDate,
      target_end_date: project.targetEndDate,
      status: project.status
    })
    .eq("id", project.id)
    .select("*")
    .single();
  if (error) throw error;
  return mapProject(data);
}

export async function deleteProject(projectId: string) {
  const client = requireSupabase();
  const { error } = await client.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function loadProjectPlan(projectId: string) {
  const client = requireSupabase();
  const [projectResult, taskResult, dependencyResult] = await Promise.all([
    client.from("projects").select("*").eq("id", projectId).single(),
    client.from("tasks").select("*").eq("project_id", projectId).order("sort_order", { ascending: true }),
    client.from("task_dependencies").select("*").eq("project_id", projectId)
  ]);

  if (projectResult.error) throw projectResult.error;
  if (taskResult.error) throw taskResult.error;
  if (dependencyResult.error) throw dependencyResult.error;

  return {
    project: mapProject(projectResult.data),
    tasks: taskResult.data.map(mapTask),
    dependencies: dependencyResult.data.map(mapDependency)
  };
}

export async function saveProjectPlan(project: Project, tasks: Task[], dependencies: TaskDependency[]) {
  const client = requireSupabase();
  await updateProject(project);

  const { error: taskError } = await client.from("tasks").upsert(tasks.map(toTaskUpdate), { onConflict: "id" });
  if (taskError) throw taskError;

  const { error: deleteDependencyError } = await client
    .from("task_dependencies")
    .delete()
    .eq("project_id", project.id);
  if (deleteDependencyError) throw deleteDependencyError;

  if (dependencies.length) {
    const { error: dependencyError } = await client.from("task_dependencies").insert(
      dependencies.map((dependency) => ({
        id: dependency.id,
        project_id: dependency.projectId,
        predecessor_task_id: dependency.predecessorTaskId,
        successor_task_id: dependency.successorTaskId,
        type: dependency.type,
        lag: dependency.lag
      }))
    );
    if (dependencyError) throw dependencyError;
  }
}

export async function deleteTask(taskId: string) {
  const client = requireSupabase();
  const { error } = await client.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}
