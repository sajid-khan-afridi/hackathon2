import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already authenticated, redirect to dashboard
  const session = await getServerSession();
  if (session) {
    redirect("/tasks");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-soft">
            <svg
              className="w-5 h-5 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="font-display text-2xl font-bold text-foreground">
            Todo App
          </span>
        </Link>

        {/* Auth card */}
        <div className="rounded-2xl bg-card border border-border shadow-soft-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
