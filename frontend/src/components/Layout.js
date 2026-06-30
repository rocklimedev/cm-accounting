import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, FilePlus2, TrendingUp, ReceiptText, Files, FileEdit,
  Users, Download, Menu, Search, LogOut, FileUp, FolderCheck,
  Layers, HandCoins, Wallet, Scale, Banknote, ClipboardList,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "accountant"] },
  { to: "/add-report", label: "Add Report", icon: FilePlus2, roles: ["super_admin", "admin", "accountant"] },
  { to: "/sales-reports", label: "Sales Reports", icon: TrendingUp, roles: ["super_admin", "admin", "accountant"] },
  { to: "/debtor-reports", label: "Debtor Reports", icon: Wallet, roles: ["super_admin", "admin", "accountant"] },
  { to: "/expense-reports", label: "Expense Reports", icon: Files, roles: ["super_admin", "admin", "accountant"] },
  { to: "/payment-mode-report", label: "Payment Mode Report", icon: Scale, roles: ["super_admin", "admin", "accountant"] },
  { to: "/cash-management", label: "Cash Management", icon: Banknote, roles: ["super_admin", "admin"] },
  { to: "/all-reports", label: "All Reports", icon: ClipboardList, roles: ["super_admin", "admin"] },
  { to: "/drafts", label: "Drafts", icon: FileEdit, roles: ["super_admin", "admin", "accountant"] },
  { to: "/users", label: "Users & Permissions", icon: Users, roles: ["super_admin"] },
  { to: "/export", label: "Export Reports", icon: Download, roles: ["super_admin", "admin"] },
];

function SidebarNav({ role, onNavigate }) {
  const items = NAV.filter((n) => n.roles.includes(role));
  return (
    <nav className="flex flex-col gap-0.5 py-2" data-testid="app-sidebar">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            data-testid={`sidebar-nav-${item.to.replace(/\//g, "-").replace(/^-/, "")}`}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 text-sm border-l-2 transition-colors ${
                isActive
                  ? "bg-secondary text-foreground font-semibold border-primary"
                  : "text-foreground/75 hover:text-foreground hover:bg-secondary border-transparent"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const role = user?.role || "accountant";

  const doSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-background border-r border-border z-30">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
          <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-sm">
            <span className="text-primary-foreground font-black text-sm">C</span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm">Chhabra Marble</div>
            <div className="text-[11px] text-foreground/60">Accounting Module</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll">
          <SidebarNav role={role} />
        </div>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-foreground/60">Signed in as</div>
          <div className="text-sm font-semibold truncate">{user?.name}</div>
          <div className="text-[11px] text-foreground/60 capitalize">{role.replace(/_/g, " ")}</div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-background border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" data-testid="mobile-menu-button">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
                <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-sm">
                  <span className="text-primary-foreground font-black text-sm">C</span>
                </div>
                <div className="font-bold text-sm">Chhabra Marble</div>
              </div>
              <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1 className="text-lg sm:text-xl font-bold truncate" data-testid="page-title">{title}</h1>

          <form onSubmit={doSearch} className="ml-auto hidden md:flex items-center relative">
            <Search className="h-4 w-4 absolute left-2.5 text-foreground/50" />
            <Input
              data-testid="global-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports, employees..."
              className="pl-8 w-56 lg:w-72 h-9"
            />
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2" data-testid="header-profile-menu">
                <div className="h-6 w-6 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-bold">
                  {(user?.name || "U").charAt(0)}
                </div>
                <span className="hidden sm:inline text-sm">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="font-semibold">{user?.name}</div>
                <div className="text-xs text-foreground/60">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="logout-button">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 sm:p-6 max-w-[1500px]">{children}</main>
      </div>
    </div>
  );
}
