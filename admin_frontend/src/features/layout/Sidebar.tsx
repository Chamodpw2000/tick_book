"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from './../../../public/logo.png'
import Image from "next/image";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Ticket, 
  MapPin, 
  Music, 
  CreditCard,
  Settings,
  LogOut,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const navigationGrouped = [
  {
    label: "Core Operations",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Events", href: "/events", icon: Calendar },
      { name: "Bookings", href: "/bookings", icon: Ticket },
    ]
  },
  {
    label: "Resources",
    items: [
      { name: "Artists", href: "/artists", icon: Music },
      { name: "Venues", href: "/venues", icon: MapPin },
    ]
  },
  {
    label: "Security & Finance",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Payments", href: "/payments", icon: CreditCard },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "A";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white shadow-sm transition-all duration-300">
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter text-slate-900 group">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white transition-transform group-hover:scale-105">
<Image src={logo} alt="Tickety Logo" width={120} height={40} className="h-8 w-auto object-contain" priority />
          </div>
          <span>TICKETY<span className="text-blue-600 font-extrabold italic">_</span></span>
        </Link>
      </div>

      <nav className="flex-1 space-y-8 px-4 py-6 overflow-y-auto scrollbar-hide">
        {navigationGrouped.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400/80 mb-3">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-300",
                      isActive 
                        ? "bg-slate-900 text-white shadow-indigo-200" 
                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-600"
                      )} />
                      {item.name}
                    </div>
                    {isActive && <div className="h-1 w-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {user?.email ?? "Admin User"}
            </span>
            <span className="text-xs text-slate-500">Admin</span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="ml-auto p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

