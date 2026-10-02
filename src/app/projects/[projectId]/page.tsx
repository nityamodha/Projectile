import { notFound } from "next/navigation";
import { loadProjectPlan } from "@/lib/database/project-repository";
import { hasSupabaseConfig } from "@/lib/database/supabase";
import { ProjectWorkspace } from "@/features/tasks/project-workspace";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  if (!hasSupabaseConfig) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] p-6 text-sm text-[#18212f]">
        Configure Supabase environment variables from `.env.example`, run the migration, then reload this page.
      </main>
    );
  }

  try {
    const plan = await loadProjectPlan(projectId);
    return <ProjectWorkspace project={plan.project} tasks={plan.tasks} dependencies={plan.dependencies} />;
  } catch {
    notFound();
  }
}
