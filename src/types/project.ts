export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  targetEndDate: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  progress: number;
}
