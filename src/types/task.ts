export type DurationUnit = "day";
export type TaskStatus = "Not Started" | "In Progress" | "Completed";
export type SchedulingMode = "auto" | "manual";
export type DependencyType = "FS" | "SS" | "FF" | "SF";

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  parentTaskId: string | null;
  order: number;
  startDate: string | null;
  finishDate: string | null;
  duration: number;
  durationUnit: DurationUnit;
  progress: number;
  status: TaskStatus;
  milestone: boolean;
  schedulingMode: SchedulingMode;
  collapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: string;
  projectId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: DependencyType;
  lag: number;
  createdAt: string;
}

export interface TaskRow extends Task {
  displayId: string;
  depth: number;
  hasChildren: boolean;
  visible: boolean;
  predecessorDisplayIds: string;
}
