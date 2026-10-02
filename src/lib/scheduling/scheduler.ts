import type { Task, TaskDependency } from "@/types/task";
import {
  addWorkingDays,
  compareIsoDates,
  maxIsoDate,
  minIsoDate,
  nextWorkingDay,
  normalizeToWorkingDay
} from "./date-utils";

export interface ScheduleInput {
  projectStartDate: string;
  tasks: Task[];
  dependencies: TaskDependency[];
}

export interface ScheduleResult {
  tasks: Task[];
  errors: string[];
}

interface MutableTask extends Task {
  childIds: string[];
}

export function scheduleProject(input: ScheduleInput): ScheduleResult {
  const errors: string[] = [];
  const taskMap = new Map<string, MutableTask>(
    input.tasks.map((task) => [task.id, { ...task, childIds: [] }])
  );

  for (const task of taskMap.values()) {
    if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
      taskMap.get(task.parentTaskId)?.childIds.push(task.id);
    }
  }

  const dependencyMap = new Map<string, TaskDependency[]>();
  const supportedDependencies = input.dependencies.filter((dependency) => {
    if (!taskMap.has(dependency.predecessorTaskId) || !taskMap.has(dependency.successorTaskId)) {
      errors.push("A dependency references a missing task and was ignored.");
      return false;
    }
    if (dependency.type !== "FS") {
      errors.push(`${dependency.type} dependencies are stored but not scheduled in the MVP.`);
      return false;
    }
    if (dependency.predecessorTaskId === dependency.successorTaskId) {
      errors.push("A task cannot depend on itself.");
      return false;
    }
    const list = dependencyMap.get(dependency.successorTaskId) ?? [];
    list.push(dependency);
    dependencyMap.set(dependency.successorTaskId, list);
    return true;
  });

  const cycle = detectCycle([...taskMap.keys()], supportedDependencies);
  if (cycle.length > 0) {
    return { tasks: input.tasks, errors: [`Circular dependency detected: ${cycle.join(" -> ")}`] };
  }

  const order = topologicalSort([...taskMap.keys()], supportedDependencies);

  for (const taskId of order) {
    const task = taskMap.get(taskId);
    if (!task || task.childIds.length > 0) {
      continue;
    }

    const predecessorFinishes = (dependencyMap.get(task.id) ?? [])
      .map((dependency) => taskMap.get(dependency.predecessorTaskId)?.finishDate)
      .filter((value): value is string => Boolean(value));

    const dependencyStart = predecessorFinishes.length
      ? nextWorkingDay(maxIsoDate(predecessorFinishes) as string)
      : null;
    const taskRequestedStart = task.startDate ? normalizeToWorkingDay(task.startDate) : null;
    const startDate = maxIsoDate(
      [dependencyStart, taskRequestedStart, normalizeToWorkingDay(input.projectStartDate)].filter(
        (value): value is string => Boolean(value)
      )
    );

    if (!startDate) {
      continue;
    }

    task.startDate = startDate;
    task.finishDate = task.milestone ? startDate : addWorkingDays(startDate, Math.max(1, task.duration));
  }

  applySummaryDates(taskMap, errors);

  return {
    tasks: input.tasks
      .map((task) => taskMap.get(task.id))
      .filter((task): task is MutableTask => Boolean(task))
      .map((task) => {
        const scheduledTask: Task = {
          id: task.id,
          projectId: task.projectId,
          name: task.name,
          description: task.description,
          parentTaskId: task.parentTaskId,
          order: task.order,
          startDate: task.startDate,
          finishDate: task.finishDate,
          duration: task.duration,
          durationUnit: task.durationUnit,
          progress: task.progress,
          status: task.status,
          milestone: task.milestone,
          schedulingMode: task.schedulingMode,
          collapsed: task.collapsed,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        };
        return scheduledTask;
      }),
    errors
  };
}

function applySummaryDates(taskMap: Map<string, MutableTask>, errors: string[]) {
  const visitState = new Map<string, "visiting" | "visited">();

  const visit = (task: MutableTask) => {
    if (visitState.get(task.id) === "visited") {
      return;
    }
    if (visitState.get(task.id) === "visiting") {
      errors.push("Circular task hierarchy detected.");
      return;
    }

    visitState.set(task.id, "visiting");
    const children = task.childIds.map((id) => taskMap.get(id)).filter((value): value is MutableTask => Boolean(value));
    children.forEach(visit);

    if (children.length > 0) {
      const starts = children.map((child) => child.startDate).filter((value): value is string => Boolean(value));
      const finishes = children.map((child) => child.finishDate).filter((value): value is string => Boolean(value));
      task.startDate = minIsoDate(starts);
      task.finishDate = maxIsoDate(finishes);
      task.duration = countSummaryWorkingDays(task.startDate, task.finishDate);
      task.milestone = false;
    }

    visitState.set(task.id, "visited");
  };

  [...taskMap.values()].forEach(visit);
}

function countSummaryWorkingDays(startDate: string | null, finishDate: string | null) {
  if (!startDate || !finishDate) {
    return 0;
  }
  let count = 1;
  let cursor = startDate;
  while (compareIsoDates(cursor, finishDate) < 0) {
    cursor = nextWorkingDay(cursor);
    count += 1;
  }
  return count;
}

function topologicalSort(taskIds: string[], dependencies: TaskDependency[]) {
  const incoming = new Map(taskIds.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const dependency of dependencies) {
    incoming.set(dependency.successorTaskId, (incoming.get(dependency.successorTaskId) ?? 0) + 1);
    outgoing.set(dependency.predecessorTaskId, [
      ...(outgoing.get(dependency.predecessorTaskId) ?? []),
      dependency.successorTaskId
    ]);
  }

  const queue = taskIds.filter((id) => incoming.get(id) === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    order.push(id);
    for (const successor of outgoing.get(id) ?? []) {
      incoming.set(successor, (incoming.get(successor) ?? 0) - 1);
      if (incoming.get(successor) === 0) {
        queue.push(successor);
      }
    }
  }

  return order.length === taskIds.length ? order : taskIds;
}

function detectCycle(taskIds: string[], dependencies: TaskDependency[]) {
  const outgoing = new Map<string, string[]>();
  dependencies.forEach((dependency) => {
    outgoing.set(dependency.predecessorTaskId, [
      ...(outgoing.get(dependency.predecessorTaskId) ?? []),
      dependency.successorTaskId
    ]);
  });

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  const visit = (id: string): string[] => {
    if (stack.has(id)) {
      return [...path.slice(path.indexOf(id)), id];
    }
    if (visited.has(id)) {
      return [];
    }
    visited.add(id);
    stack.add(id);
    path.push(id);
    for (const next of outgoing.get(id) ?? []) {
      const cycle = visit(next);
      if (cycle.length) {
        return cycle;
      }
    }
    stack.delete(id);
    path.pop();
    return [];
  };

  for (const id of taskIds) {
    const cycle = visit(id);
    if (cycle.length) {
      return cycle;
    }
  }

  return [];
}
