import type { Database } from "@/types/database";
import type { Project, ProjectSummary } from "@/types/project";
import type { Task, TaskDependency } from "@/types/task";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type DependencyRow = Database["public"]["Tables"]["task_dependencies"]["Row"];

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    targetEndDate: row.target_end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapProjectSummary(project: Project, tasks: Task[]): ProjectSummary {
  const completedTasks = tasks.filter((task) => task.progress === 100).length;
  const inProgressTasks = tasks.filter((task) => task.progress > 0 && task.progress < 100).length;
  const progress = tasks.length
    ? Math.round(tasks.reduce((total, task) => total + task.progress, 0) / tasks.length)
    : 0;

  return {
    ...project,
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks: 0,
    progress
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    parentTaskId: row.parent_task_id,
    order: row.sort_order,
    startDate: row.start_date,
    finishDate: row.finish_date,
    duration: row.duration,
    durationUnit: row.duration_unit,
    progress: row.progress,
    status: row.status,
    milestone: row.milestone,
    schedulingMode: row.scheduling_mode,
    collapsed: row.collapsed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapDependency(row: DependencyRow): TaskDependency {
  return {
    id: row.id,
    projectId: row.project_id,
    predecessorTaskId: row.predecessor_task_id,
    successorTaskId: row.successor_task_id,
    type: row.type,
    lag: row.lag,
    createdAt: row.created_at
  };
}

export function toTaskUpdate(task: Task) {
  return {
    id: task.id,
    project_id: task.projectId,
    name: task.name,
    description: task.description,
    parent_task_id: task.parentTaskId,
    sort_order: task.order,
    start_date: task.startDate,
    finish_date: task.finishDate,
    duration: task.duration,
    duration_unit: task.durationUnit,
    progress: task.progress,
    status: task.status,
    milestone: task.milestone,
    scheduling_mode: task.schedulingMode,
    collapsed: task.collapsed
  };
}
