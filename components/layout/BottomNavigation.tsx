 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationIconProps = {
  children: React.ReactNode;
};

function NavigationIcon({ children }: NavigationIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

const navigationItems = [
  {
    href: "/pos",
    label: "Cashier",
    icon: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0" />
      </>
    ),
  },
  {
    href: "/menu",
    label: "Menu",
    icon: (
      <>
        <path d="M4 5h16M4 12h16M4 19h16" />
        <path d="M8 5v14" />
      </>
    ),
  },
  {
    href: "/history",
    label: "History",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5M12 7v5l3 2" />
      </>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 3-4 3 2 5-6" />
      </>
    ),
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return null;
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-4">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-semibold transition ${
                isActive
                  ? "text-slate-950"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`rounded-lg p-1 ${
                  isActive                   ? "bg-slate-100" : ""
                }`}
              >
                <NavigationIcon>{item.icon}</NavigationIcon>
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}