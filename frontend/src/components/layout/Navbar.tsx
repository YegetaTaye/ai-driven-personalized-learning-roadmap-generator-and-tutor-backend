import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { BrandMark } from "./BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/api/client";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import { NotificationBell } from "@/features/notifications/components/NotificationDropdown";

export function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useMenuHandlers(menuRef, () => setMenuOpen(false));
  const breadcrumbs = useBreadcrumbStore((s) => s.breadcrumbs);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header
      className="shrink-0 h-14.5 flex items-center gap-2 px-6 z-40"
      style={{
        background: "color-mix(in srgb, #f3efe7 92%, transparent)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #d6cfbf",
      }}
    >
      {/* Brand */}
      <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <BrandMark />
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 20,
            letterSpacing: "-0.01em",
          }}
        >
          Yeneta
          <em style={{ fontStyle: "italic", color: "#6e645a" }}>.learn</em>
        </span>
      </Link>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          className="flex items-center gap-1.5 text-[13px]"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#6e645a" }}
        >
          <span style={{ color: "#c2b9a6", margin: "0 2px" }}>/</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-accent transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: "#1a1614", fontWeight: 600 }}>
                  {crumb.label}
                </span>
              )}
              {i < breadcrumbs.length - 1 && (
                <span style={{ color: "#c2b9a6" }}>/</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex-1" />

      {/* Notification bell with live unread count */}
      <NotificationBell />

      {/* Avatar */}
      <div className="relative" ref={menuRef}>
        <button
          aria-label="Profile menu"
          onClick={() => setMenuOpen((s) => !s)}
          className="w-8 h-8 rounded-full grid place-items-center cursor-pointer shrink-0 transition-opacity hover:opacity-80"
          style={{
            background: "#1a1614",
            color: "#f3efe7",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 15,
          }}
          title="Profile"
        >
          {initials}
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 mt-2 w-40 bg-white rounded shadow-md text-sm z-50"
            style={{ color: "#1a1614" }}
          >
            <Link to="/profile" className="block px-3 py-2 hover:bg-gray-50">
              Profile
            </Link>
            <Link to="/settings" className="block px-3 py-2 hover:bg-gray-50">
              Settings
            </Link>
            <button
              onClick={() => void handleLogout()}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

async function handleLogout() {
  // call server to revoke refresh token if present, then clear local auth
  try {
    const rt = useAuthStore.getState().refreshToken;
    if (rt) await apiClient.post("/auth/logout", { refreshToken: rt });
  } catch (e) {
    // ignore network errors
  } finally {
    useAuthStore.getState().logout();
  }
}

function useMenuHandlers(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [ref, onClose]);
}
