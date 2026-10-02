import { describe, expect, it } from "vitest";
import type { Task, TaskDependency } from "@/types/task";
import { addWorkingDays } from "./date-utils";
import { scheduleProject } from "./scheduler";

const task = (id: string, duration = 1, overrides: Partial<Task> = {}): Task => ({
  id,
  projectId: "project-1",
  name: id,
  description: "",
  parentTaskId: null,
  order: Number(id.replace(/\D/g, "")) || 0,
  startDate: null,
  finishDate: null,
  duration,
  durationUnit: "day",
  progress: 0,
  status: "Not Started",
  milestone: false,
  schedulingMode: "auto",
  collapsed: false,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
  ...overrides
});

const fs = (predecessorTaskId: string, successorTaskId: string): TaskDependency => ({
  id: `${predecessorTaskId}-${successorTaskId}`,
  projectId: "project-1",
  predecessorTaskId,
  successorTaskId,
  type: "FS",
  lag: 0,
  createdAt: "2026-10-02T00:00:00.000Z"
});

describe("working-day date utilities", () => {
  it("calculates inclusive working-day finishes", () => {
    expect(addWorkingDays("2026-10-05", 1)).toBe("2026-10-05");
    expect(addWorkingDays("2026-10-05", 3)).toBe("2026-10-07");
  });

  it("skips weekends", () => {
    expect(addWorkingDays("2026-10-09", 2)).toBe("2026-10-12");
    expect(addWorkingDays("2026-10-10", 1)).toBe("2026-10-12");
  });
});

describe("scheduleProject", () => {
  it("schedules a basic Finish-to-Start dependency", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a", 3), task("b", 2)],
      dependencies: [fs("a", "b")]
    });

    expect(result.errors).toEqual([]);
    expect(result.tasks.find((item) => item.id === "a")?.finishDate).toBe("2026-10-07");
    expect(result.tasks.find((item) => item.id === "b")?.startDate).toBe("2026-10-08");
  });

  it("uses the latest predecessor when multiple FS dependencies exist", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a", 2), task("b", 5), task("c", 1)],
      dependencies: [fs("a", "c"), fs("b", "c")]
    });

    expect(result.tasks.find((item) => item.id === "c")?.startDate).toBe("2026-10-12");
  });

  it("propagates chained dependencies", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a", 3), task("b", 2), task("c", 5)],
      dependencies: [fs("a", "b"), fs("b", "c")]
    });

    expect(result.tasks.find((item) => item.id === "c")?.startDate).toBe("2026-10-12");
    expect(result.tasks.find((item) => item.id === "c")?.finishDate).toBe("2026-10-16");
  });

  it("propagates after a predecessor duration changes", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a", 5), task("b", 2), task("c", 1)],
      dependencies: [fs("a", "b"), fs("b", "c")]
    });

    expect(result.tasks.find((item) => item.id === "b")?.startDate).toBe("2026-10-12");
    expect(result.tasks.find((item) => item.id === "c")?.startDate).toBe("2026-10-14");
  });

  it("schedules milestones on a single date", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a", 3), task("m", 0, { milestone: true })],
      dependencies: [fs("a", "m")]
    });

    const milestone = result.tasks.find((item) => item.id === "m");
    expect(milestone?.startDate).toBe("2026-10-08");
    expect(milestone?.finishDate).toBe("2026-10-08");
  });

  it("derives summary-task dates from descendants", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [
        task("summary", 1),
        task("a", 3, { parentTaskId: "summary" }),
        task("b", 2, { parentTaskId: "summary" })
      ],
      dependencies: [fs("a", "b")]
    });

    const summary = result.tasks.find((item) => item.id === "summary");
    expect(summary?.startDate).toBe("2026-10-05");
    expect(summary?.finishDate).toBe("2026-10-09");
  });

  it("rejects circular dependencies", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a"), task("b")],
      dependencies: [fs("a", "b"), fs("b", "a")]
    });

    expect(result.errors[0]).toContain("Circular dependency detected");
  });

  it("reports and ignores invalid dependencies", () => {
    const result = scheduleProject({
      projectStartDate: "2026-10-05",
      tasks: [task("a")],
      dependencies: [fs("missing", "a")]
    });

    expect(result.errors).toContain("A dependency references a missing task and was ignored.");
    expect(result.tasks[0].startDate).toBe("2026-10-05");
  });
});
