"use client";

import { useCallback, useMemo, useState } from "react";
import type { Project } from "@/types/project";
import type { Task, TaskDependency } from "@/types/task";
import { saveProjectPlan } from "@/lib/database/project-repository";
import { scheduleProject } from "@/lib/scheduling/scheduler";
import { buildTaskRows, descendantsOf, findTaskIdByDisplayId, reorderTasks } from "./task-tree";

const now = () => new Date().toISOString();

export function useProjectPlan(initialProject: Project, initialTasks: Task[], initialDependencies: TaskDependency[]) {
  const [project, setProject] = useState(initialProject);
  const [tasks, setTasks] = useState(initialTasks);
  const [dependencies, setDependencies] = useState(initialDependencies);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTasks[0]?.id ?? null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const rows = useMemo(() => buildTaskRows(tasks, dependencies), [tasks, dependencies]);

  const reschedule = useCallback(
    (nextTasks: Task[], nextDependencies = dependencies) => {
      const result = scheduleProject({
        projectStartDate: project.startDate,
        tasks: nextTasks,
        dependencies: nextDependencies
      });
      setErrors(result.errors);
      return result.tasks;
    },
    [dependencies, project.startDate]
  );

  const persist = useCallback(
    async (nextProject: Project, nextTasks: Task[], nextDependencies: TaskDependency[]) => {
      setSaveState("saving");
      try {
        await saveProjectPlan(nextProject, nextTasks, nextDependencies);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    []
  );

  const commit = useCallback(
    (nextTasks: Task[], nextDependencies = dependencies, nextProject = project) => {
      const scheduled = scheduleProject({
        projectStartDate: nextProject.startDate,
        tasks: nextTasks,
        dependencies: nextDependencies
      });
      setProject(nextProject);
      setTasks(scheduled.tasks);
      setDependencies(nextDependencies);
      setErrors(scheduled.errors);
      void persist(nextProject, scheduled.tasks, nextDependencies);
    },
    [dependencies, persist, project]
  );

  function addTask() {
    const id = crypto.randomUUID();
    const next: Task = {
      id,
      projectId: project.id,
      name: "New Task",
      description: "",
      parentTaskId: null,
      order: tasks.length + 1,
      startDate: null,
      finishDate: null,
      duration: 1,
      durationUnit: "day",
      progress: 0,
      status: "Not Started",
      milestone: false,
      schedulingMode: "auto",
      collapsed: false,
      createdAt: now(),
      updatedAt: now()
    };
    setSelectedTaskId(id);
    commit([...tasks, next]);
  }

  function updateTask(taskId: string, patch: Partial<Task>) {
    commit(tasks.map((task) => (task.id === taskId ? { ...task, ...patch, updatedAt: now() } : task)));
  }

  function deleteSelectedTask() {
    if (!selectedTaskId) return;
    const descendants = descendantsOf(tasks, selectedTaskId);
    const removed = new Set([selectedTaskId, ...descendants]);
    commit(
      reorderTasks(tasks.filter((task) => !removed.has(task.id))),
      dependencies.filter(
        (dependency) => !removed.has(dependency.predecessorTaskId) && !removed.has(dependency.successorTaskId)
      )
    );
    setSelectedTaskId(null);
  }

  function moveSelected(direction: -1 | 1) {
    if (!selectedTaskId) return;
    const index = tasks.findIndex((task) => task.id === selectedTaskId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= tasks.length) return;
    const next = [...tasks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(reorderTasks(next));
  }

  function indentSelected() {
    if (!selectedTaskId) return;
    const index = tasks.findIndex((task) => task.id === selectedTaskId);
    const previous = tasks[index - 1];
    if (!previous) return;
    updateTask(selectedTaskId, { parentTaskId: previous.id });
  }

  function outdentSelected() {
    if (!selectedTaskId) return;
    const selected = tasks.find((task) => task.id === selectedTaskId);
    if (!selected?.parentTaskId) return;
    const parent = tasks.find((task) => task.id === selected.parentTaskId);
    updateTask(selectedTaskId, { parentTaskId: parent?.parentTaskId ?? null });
  }

  function setPredecessors(taskId: string, value: string) {
    const requestedIds = value
      .split(",")
      .map((item) => findTaskIdByDisplayId(rows, item))
      .filter((id): id is string => Boolean(id));
    const preserved = dependencies.filter((dependency) => dependency.successorTaskId !== taskId);
    const nextDependencies: TaskDependency[] = [
      ...preserved,
      ...requestedIds.map((predecessorTaskId) => ({
        id: crypto.randomUUID(),
        projectId: project.id,
        predecessorTaskId,
        successorTaskId: taskId,
        type: "FS" as const,
        lag: 0,
        createdAt: now()
      }))
    ];
    commit(tasks, nextDependencies);
  }

  function updateProjectFields(patch: Partial<Project>) {
    const nextProject = { ...project, ...patch, updatedAt: now() };
    commit(tasks, dependencies, nextProject);
  }

  return {
    project,
    tasks,
    dependencies,
    rows,
    visibleRows: rows.filter((row) => row.visible),
    selectedTaskId,
    errors,
    saveState,
    setSelectedTaskId,
    addTask,
    updateTask,
    deleteSelectedTask,
    moveSelected,
    indentSelected,
    outdentSelected,
    setPredecessors,
    updateProjectFields,
    reschedule
  };
}
