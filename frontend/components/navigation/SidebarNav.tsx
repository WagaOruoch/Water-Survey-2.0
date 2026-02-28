"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/surveys", label: "Surveys" },
  { href: "/app/responses", label: "Responses" },
  { href: "/app/analytics", label: "Analytics" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-white/10 bg-slate-900/30 py-6 backdrop-blur-sm">
      <nav className="flex flex-col">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-l-[3px] px-6 py-3 text-sm transition ${
                isActive
                  ? "border-cyan-300 bg-cyan-400/15 font-semibold text-cyan-100"
                  : "border-transparent text-blue-100/85 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
