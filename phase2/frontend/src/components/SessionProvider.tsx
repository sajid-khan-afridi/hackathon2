"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session } from "@/lib/auth-server";

interface SessionContextType {
  session: Session | null;
  isPending: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  isPending: true,
});

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: session, isPending } = useSession();

  return (
    <SessionContext.Provider value={{ session: session as Session | null, isPending }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useContext(SessionContext);
}
