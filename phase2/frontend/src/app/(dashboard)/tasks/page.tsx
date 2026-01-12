import { Metadata } from "next";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TasksContainer } from "@/components/tasks";

export const metadata: Metadata = {
  title: "Tasks | Todo App",
  description: "Manage your tasks",
};

export default async function TasksPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Your Tasks</h1>
      <TasksContainer userId={session.user.id} />
    </div>
  );
}
