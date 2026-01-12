import { Metadata } from "next";
import { getServerSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TaskDetail } from "@/components/tasks/TaskDetail";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Task Details | Todo App",
  description: "View task details",
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin");
  }

  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TaskDetail userId={session.user.id} taskId={taskId} />
    </div>
  );
}
