import { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up | Todo App",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your details to get started
        </p>
      </div>

      <SignUpForm />

      {/* Divider with decorative elements */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            or
          </span>
        </div>
      </div>

      {/* Sign in prompt with enhanced styling */}
      <div className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
          >
            Sign in
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </p>
      </div>

      {/* Try Demo link */}
      <div className="text-center">
        <Link
          href="/trial"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Or try the demo without signing up
        </Link>
      </div>
    </div>
  );
}
