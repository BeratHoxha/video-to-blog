import { useState, useRef, useEffect } from "react";
import { PenLine, Clock, Zap, User, LogOut } from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    plan: string;
    words_used_this_month: number;
    words_remaining: number | null;
    ai_bot_calls_remaining: number | null;
  };
  currentView: "new" | "history";
  onViewChange: (view: "new" | "history") => void;
}

export function Sidebar({ user, currentView, onViewChange }: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    const csrf = (window as any).__RAILS_ENV__?.csrfToken ?? "";
    fetch("/users/sign_out", {
      method: "DELETE",
      headers: { "X-CSRF-Token": csrf },
    }).then(() => {
      window.location.href = "/";
    });
  }

  const isFree = user.plan === "free";
  const wordsUsed = user.words_used_this_month;
  const wordsRemaining = user.words_remaining;
  const aiRewritesUsed =
    user.ai_bot_calls_remaining !== null ? 10 - user.ai_bot_calls_remaining : null;
  const wordTotal = isFree ? 2000 : null;
  const wordPercent = wordTotal ? Math.min((wordsUsed / wordTotal) * 100, 100) : 0;

  return (
    <aside className="w-60 shrink-0 flex flex-col h-screen border-r border-gray-800 bg-gray-900">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <a href="/" className="flex items-center gap-1 font-bold text-lg tracking-tight">
          <span className="text-white">Video</span>
          <span className="text-emerald-500">·</span>
          <span className="text-white">Blog</span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem
          icon={PenLine}
          label="New Article"
          active={currentView === "new"}
          onClick={() => onViewChange("new")}
        />
        <NavItem
          icon={Clock}
          label="History"
          active={currentView === "history"}
          onClick={() => onViewChange("history")}
        />
      </nav>

      {/* Usage stats */}
      <div className="px-4 py-4 border-t border-gray-800 space-y-4">
        {isFree && wordTotal && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Words used</span>
              <span>{wordsUsed.toLocaleString()} / {wordTotal.toLocaleString()}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${wordPercent}%` }}
              />
            </div>
          </div>
        )}

        {isFree && user.ai_bot_calls_remaining !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">AI rewrites used</span>
            <span className="text-xs font-medium text-gray-300">
              {aiRewritesUsed} / 10
            </span>
          </div>
        )}

        {isFree && (
          <a
            href="#pricing"
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg
                       bg-emerald-500/10 border border-emerald-500/20 text-xs
                       text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Zap size={12} />
            Unlock unlimited words
          </a>
        )}

        {/* User info */}
        <div className="relative pt-2" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 w-full rounded-lg hover:bg-gray-800/60 transition-colors px-1 py-1 -mx-1"
          >
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-600 capitalize">{user.plan} plan</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-44 rounded-lg border border-gray-800 bg-gray-900 shadow-lg py-1 z-50">
              <button
                disabled
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
              >
                <User size={13} />
                Profile
              </button>
              <div className="my-1 border-t border-gray-800" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors"
              >
                <LogOut size={13} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors text-left
        ${active
          ? "bg-gray-800 text-white"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
