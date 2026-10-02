import type { Task, TaskDependency, TaskRow } from "@/types/task";

export function buildTaskRows(tasks: Task[], dependencies: TaskDependency[]): TaskRow[] {
  const byParent = new Map<string | null, Task[]>();
  tasks.forEach((task) => {
    byParent.set(task.parentTaskId, [...(byParent.get(task.parentTaskId) ?? []), task]);
  });
  byParent.forEach((items) => items.sort((a, b) => a.order - b.order));

  const rows: TaskRow[] = [];
  const displayById = new Map<string, string>();

  const walk = (parentId: string | null, depth: number, prefix: number[], ancestorsCollapsed: boolean) => {
    const children = byParent.get(parentId) ?? [];
    children.forEach((task, index) => {
      const displayParts = [...prefix, index + 1];
      const displayId = displayParts.join(".");
      displayById.set(task.id, displayId);
      const hasChildren = (byParent.get(task.id) ?? []).length > 0;
      const row: TaskRow = {
        ...task,
        displayId,
        depth,
        hasChildren,
        visible: !ancestorsCollapsed,
        predecessorDisplayIds: ""
      };
      rows.push(row);
      walk(task.id, depth + 1, displayParts, ancestorsCollapsed || task.collapsed);
    });
  };

  walk(null, 0, [], false);

  return rows.map((row) => ({
    ...row,
    predecessorDisplayIds: dependencies
      .filter((dependency) => dependency.successorTaskId === row.id)
      .map((dependency) => displayById.get(dependency.predecessorTaskId))
      .filter((value): value is string => Boolean(value))
      .join(", ")
  }));
}

export function findTaskIdByDisplayId(rows: TaskRow[], displayId: string) {
  return rows.find((row) => row.displayId === displayId.trim())?.id ?? null;
}

export function descendantsOf(tasks: Task[], taskId: string) {
  const result = new Set<string>();
  const visit = (id: string) => {
    tasks.filter((task) => task.parentTaskId === id).forEach((task) => {
      result.add(task.id);
      visit(task.id);
    });
  };
  visit(taskId);
  return result;
}

export function reorderTasks(tasks: Task[]) {
  return tasks.map((task, index) => ({ ...task, order: index + 1 }));
}
