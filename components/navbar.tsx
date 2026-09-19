import { Moon, Sun, Database, LogOut, Sparkles, Plug2 } from 'lucide-react';
import { UserResponse } from '@/lib/api';

interface NavbarProps {
  isDark: boolean;
  onThemeToggle: () => void;
  user: UserResponse | null;
  onLogout: () => void;
  onSettingsClick: () => void;
}

export function Navbar({ isDark, onThemeToggle, user, onLogout, onSettingsClick }: NavbarProps) {
  // Extract initials from user email or name
  const getUserInitials = () => {
    if (!user) return '??';
    if (user.name) return user.name.substring(0, 2).toUpperCase();
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-purple-600 p-2 shadow-sm">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>FarmEx SQL</span>
              {user && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  user.subscription === 'paid'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm animate-pulse'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {user.subscription === 'paid' && <Sparkles className="h-3 w-3" />}
                  {user.subscription === 'paid' ? 'PRO' : 'FREE'}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI SQL Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onThemeToggle}
            className="rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={onSettingsClick}
            className="rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Database Connection"
          >
            <Plug2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </button>

          {user && (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-800">
              {/* User Profile Avatar */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-xs font-bold text-white shadow-inner">
                  {getUserInitials()}
                </div>
                <div className="hidden flex-col text-left md:flex">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

