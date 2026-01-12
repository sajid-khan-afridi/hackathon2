"use client";

export function EmptyState() {
  return (
    <div className="text-center py-16 px-6 opacity-0 animate-fade-in">
      {/* Decorative illustration */}
      <div className="relative inline-block mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />

        {/* Icon container */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 shadow-soft animate-float">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
      </div>

      {/* Text content */}
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        Your task list is empty
      </h3>
      <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Start by adding your first task above. Stay organized and accomplish your goals!
      </p>

      {/* Decorative arrow */}
      <div className="mt-6 flex justify-center">
        <svg
          className="w-6 h-6 text-primary/50 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </div>
    </div>
  );
}
