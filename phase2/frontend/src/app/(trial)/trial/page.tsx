import { Metadata } from "next";
import { TrialTasksContainer } from "@/components/tasks";

export const metadata: Metadata = {
  title: "Try Demo | Todo App",
  description: "Try the Todo App without signing up - limited to 5 tasks",
};

export default function TrialPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Try Todo App</h1>
        <p className="text-muted-foreground mt-1">
          Experience the app before signing up. Your tasks are stored locally.
        </p>
      </div>
      <TrialTasksContainer />
    </div>
  );
}
