import { User, MessageSquare, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { useAuth } from "@/hooks/useAuth";

export function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden z-40">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link key={path} href={path}>
            <Button
              variant={location === path ? "default" : "ghost"}
              size="sm"
              className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}