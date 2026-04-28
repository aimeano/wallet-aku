import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen pb-24">
    <div className="mx-auto max-w-md px-4 pt-6">{children}</div>
    <BottomNav />
  </div>
);
