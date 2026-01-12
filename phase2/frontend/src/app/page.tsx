import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gradient-mesh">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-4s' }} />

      {/* Main content */}
      <div className="relative z-10 max-w-2xl text-center px-6 opacity-0 animate-fade-in">
        {/* Logo/Icon */}
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 opacity-0 animate-scale-in" style={{ animationDelay: '0.1s' }}>
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Todo<span className="text-primary">.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Organize your thoughts, accomplish your goals. A beautifully crafted task manager that keeps you focused.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/signin"
            className="group inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Sign In
            <svg
              className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center rounded-xl border-2 border-border bg-card/50 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground shadow-soft transition-all duration-300 hover:border-primary hover:bg-card hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Create Account
            <svg
              className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

        {/* Try Demo Button - Prominent CTA */}
        <div className="mt-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.45s' }}>
          <Link
            href="/trial"
            className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-warning/10 via-warning/5 to-accent/10 border-2 border-warning/30 px-6 py-3 text-base font-semibold text-foreground shadow-soft transition-all duration-300 hover:border-warning hover:shadow-[0_0_20px_rgba(212,168,67,0.3)] hover:-translate-y-0.5 hover:bg-warning/15 focus:outline-none focus:ring-2 focus:ring-warning/50 focus:ring-offset-2"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/20 group-hover:bg-warning/30 transition-colors">
              <svg
                className="w-4 h-4 text-warning"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="flex flex-col items-start">
              <span className="text-sm font-bold tracking-wide">Try Demo</span>
              <span className="text-xs text-muted-foreground font-normal">No signup required</span>
            </span>
            <svg
              className="w-4 h-4 text-warning transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 mb-3">
              <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Secure</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-3">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Fast</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Simple</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-sm text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <span className="px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50">
          Phase II: Full-Stack Web Application
        </span>
      </footer>

      {/* Subtle texture overlay */}
      <div className="texture-overlay" />
    </main>
  );
}
