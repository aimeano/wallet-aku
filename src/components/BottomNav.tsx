import { NavLink } from "react-router-dom";
import { Home, History, PieChart, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/history", icon: History, label: "History" },
  { to: "/budgets", icon: PieChart, label: "Budgets" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

export const BottomNav = () => {
  const { signOut } = useAuth();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-smooth ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={signOut}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium text-muted-foreground transition-smooth hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </nav>
  );
};
