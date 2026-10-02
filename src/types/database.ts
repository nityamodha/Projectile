import type { ProjectStatus } from "./project";
import type { DependencyType, DurationUnit, SchedulingMode, TaskStatus } from "./task";

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          start_date: string;
          target_end_date: string | null;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          start_date: string;
          target_end_date?: string | null;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string;
          parent_task_id: string | null;
          sort_order: number;
          start_date: string | null;
          finish_date: string | null;
          duration: number;
          duration_unit: DurationUnit;
          progress: number;
          status: TaskStatus;
          milestone: boolean;
          scheduling_mode: SchedulingMode;
          collapsed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string;
          parent_task_id?: string | null;
          sort_order: number;
          start_date?: string | null;
          finish_date?: string | null;
          duration?: number;
          duration_unit?: DurationUnit;
          progress?: number;
          status?: TaskStatus;
          milestone?: boolean;
          scheduling_mode?: SchedulingMode;
          collapsed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      task_dependencies: {
        Row: {
          id: string;
          project_id: string;
          predecessor_task_id: string;
          successor_task_id: string;
          type: DependencyType;
          lag: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          predecessor_task_id: string;
          successor_task_id: string;
          type?: DependencyType;
          lag?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_dependencies"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
      task_status: TaskStatus;
      scheduling_mode: SchedulingMode;
      duration_unit: DurationUnit;
      dependency_type: DependencyType;
    };
    CompositeTypes: Record<string, never>;
  };
}
