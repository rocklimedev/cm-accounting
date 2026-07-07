import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/use-auth";
import { useLazySearchReportsQuery } from "../api/search.api";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FilePlus2,
  TrendingUp,
  ReceiptText,
  Files,
  FileEdit,
  Users,
  Download,
  Menu,
  Search,
  LogOut,
  FileUp,
  FolderCheck,
  Layers,
  HandCoins,
  Wallet,
  Scale,
  Banknote,
  ClipboardList,
  Loader2,
  KeyRound,
} from "lucide-react";

const NAV = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/add-report",
    label: "Add Report",
    icon: FilePlus2,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/sales-reports",
    label: "Sales Reports",
    icon: TrendingUp,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/debtor-reports",
    label: "Debtor Reports",
    icon: Wallet,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/expense-reports",
    label: "Expense Reports",
    icon: Files,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/payment-mode-report",
    label: "Payment Mode Report",
    icon: Scale,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/cash-management",
    label: "Cash Management",
    icon: Banknote,
    roles: ["super_admin", "admin"],
  },
  {
    to: "/all-reports",
    label: "All Reports",
    icon: ClipboardList,
    roles: ["super_admin", "admin"],
  },
  {
    to: "/drafts",
    label: "Drafts",
    icon: FileEdit,
    roles: ["super_admin", "admin", "accountant"],
  },
  {
    to: "/users",
    label: "Users & Permissions",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    to: "/encryption-keys",
    label: "Encryption Keys",
    icon: KeyRound,
    roles: ["super_admin", "admin"],
  },
  {
    to: "/export",
    label: "Export Reports",
    icon: Download,
    roles: ["super_admin", "admin"],
  },
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

/**
 * Live search dropdown used in the header. Debounces input, queries the
 * existing `/search` endpoint, and renders results in a floating panel
 * instead of navigating to a dedicated results page. Falls back to a
 * "view all results" link that still routes to /search?q=... for people
 * who want the full list.
 */
function HeaderSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [triggerSearch, { data, isFetching, isError }] =
    useLazySearchReportsQuery();

  const results = data?.results || [];
  const loading = isFetching;
  const error = isError;

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Debounced live search — RTK Query caches/dedupes per arg and always
  // reflects the most recently triggered call, so no manual stale-response
  // guarding is needed here.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = query.trim();
    if (!term) return;

    debounceRef.current = setTimeout(() => {
      triggerSearch({ q: term, page: 1, limit: 20 });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, triggerSearch]);

  const goToReport = (reportId) => {
    setOpen(false);
    setQuery("");
    navigate(`/reports/${reportId}`);
  };

  const viewAll = () => {
    const term = query.trim();
    if (!term) return;
    setOpen(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    viewAll();
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative ml-auto hidden md:block">
      <form onSubmit={onSubmit} className="flex items-center relative">
        <Search className="h-4 w-4 absolute left-2.5 text-foreground/50" />
        <Input
          data-testid="global-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search reports, employees..."
          className="pl-8 w-56 lg:w-72 h-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="h-4 w-4 absolute right-2.5 text-foreground/40 animate-spin" />
        )}
      </form>

      {showPanel && (
        <div
          className="absolute right-0 mt-2 w-[26rem] max-w-[90vw] bg-card border border-border rounded-md shadow-lg z-30 overflow-hidden"
          data-testid="global-search-dropdown"
        >
          <div className="max-h-96 overflow-y-auto thin-scroll">
            {loading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center text-sm text-foreground/50">
                Something went wrong. Try again.
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-sm text-foreground/50">
                No results for &ldquo;{query.trim()}&rdquo;
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {results.map((r) => (
                  <li key={r.report_id}>
                    <button
                      type="button"
                      onClick={() => goToReport(r.report_id)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/70 transition-colors flex items-center justify-between gap-3"
                      data-testid={`search-result-${r.report_id}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium truncate">
                          <span className="truncate">{r.report_id}</span>
                          <span className="text-xs font-normal text-foreground/50 capitalize shrink-0">
                            {r.report_type}
                          </span>
                        </div>
                        <div className="text-xs text-foreground/60 truncate">
                          {r.submitted_by_name} &middot;{" "}
                          {formatDate(r.report_date)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm tabular-nums font-medium">
                          {formatMoney(r.main_amount)}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!loading && !error && (
            <button
              type="button"
              onClick={viewAll}
              disabled={!query.trim()}
              className="w-full text-center text-sm font-medium text-primary hover:bg-secondary/70 transition-colors py-2.5 border-t border-border disabled:opacity-50"
              data-testid="search-view-all"
            >
              View all results for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role?.name?.toLowerCase().replace(/\s+/g, "_") ?? "";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-background border-r border-border z-30">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
          <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-sm">
            <span className="text-primary-foreground font-black text-sm">
              C
            </span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm">Chhabra Marble</div>
            <div className="text-[11px] text-foreground/60">
              Accounting Module
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll">
          <SidebarNav role={role} />
        </div>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-foreground/60">Signed in as</div>
          <div className="text-sm font-semibold truncate">{user?.name}</div>
          <div className="text-[11px] text-foreground/60 capitalize">
            {role.replace(/_/g, " ")}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-background border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                data-testid="mobile-menu-button"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
                <div className="h-8 w-8 bg-primary flex items-center justify-center rounded-sm">
                  <span className="text-primary-foreground font-black text-sm">
                    C
                  </span>
                </div>
                <div className="font-bold text-sm">Chhabra Marble</div>
              </div>
              <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <h1
            className="text-lg sm:text-xl font-bold truncate"
            data-testid="page-title"
          >
            {title}
          </h1>

          <HeaderSearch />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2"
                data-testid="header-profile-menu"
              >
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
