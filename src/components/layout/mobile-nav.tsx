"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { BookOpen, LayoutDashboard, Trophy, User, Upload } from "lucide-react";

const learnerNav = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/leaderboard", label: "Rank", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/upload", label: "Create", icon: Upload },
  { href: "/leaderboard", label: "Rank", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const nav = session?.user?.role === "ADMIN" ? adminNav : learnerNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex items-center justify-around h-16">
        {nav.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 min-w-[64px]",
                isActive ? "text-indigo-600" : "text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
