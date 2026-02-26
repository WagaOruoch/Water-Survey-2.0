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
    <aside className="w-60 bg-white py-6 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
      <nav className="flex flex-col">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-l-[3px] px-6 py-3 text-sm transition ${
                isActive
                  ? "border-blue-600 bg-blue-50 font-semibold text-blue-600"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-blue-600"
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
