"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => pathname === href;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-200 bg-[#1a56db] ${
        scrolled ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-[#1a56db]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                <path d="M9 21V12h6v9" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Hotel<span className="text-blue-200">Book</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" active={isActive("/")}>Home</NavLink>
            <NavLink href="/hotels" active={isActive("/hotels")}>Hotels</NavLink>
          </div>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login"
                  className="px-4 py-1.5 text-sm font-medium text-white hover:text-blue-100 transition-colors">
                  Login
                </Link>
                <Link href="/auth/register"
                  className="px-4 py-1.5 text-sm font-medium bg-white text-[#1a56db] rounded-md hover:bg-blue-50 transition-colors shadow-sm">
                  Register
                </Link>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <NavLink href="/admin" active={pathname.startsWith("/admin")}>
                    Admin Panel
                  </NavLink>
                ) : (
                  <NavLink href="/my-bookings" active={isActive("/my-bookings")}>
                    My Bookings
                  </NavLink>
                )}

                {/* User badge */}
                <div className="flex items-center gap-2 ml-1 pl-3 border-l border-blue-400">
                  {/* Avatar — clickable to profile */}
                  <Link href="/profile"
                    className="w-7 h-7 rounded-full overflow-hidden bg-blue-200 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-white transition-all">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover"/>
                    ) : (
                      <span className="text-[#1a56db] text-xs font-bold uppercase">
                        {user?.name?.[0] ?? "U"}
                      </span>
                    )}
                  </Link>

                  <Link href="/profile"
                    className="text-white text-sm font-medium max-w-[120px] truncate hover:text-blue-100 transition-colors">
                    {user?.name}
                  </Link>

                  <button onClick={logout}
                    className="ml-1 px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700 rounded-md transition-colors">
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-700 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-blue-500 py-3 space-y-1 pb-4">
            <MobileNavLink href="/" active={isActive("/")}>Home</MobileNavLink>
            <MobileNavLink href="/hotels" active={isActive("/hotels")}>Hotels</MobileNavLink>

            {!isAuthenticated ? (
              <div className="flex gap-2 pt-2 px-2">
                <Link href="/auth/login"
                  className="flex-1 text-center px-4 py-2 text-sm font-medium text-white border border-blue-300 rounded-md hover:bg-blue-700 transition-colors">
                  Login
                </Link>
                <Link href="/auth/register"
                  className="flex-1 text-center px-4 py-2 text-sm font-medium bg-white text-[#1a56db] rounded-md hover:bg-blue-50 transition-colors">
                  Register
                </Link>
              </div>
            ) : (
              <>
                {isAdmin ? (
                  <MobileNavLink href="/admin" active={pathname.startsWith("/admin")}>
                    Admin Panel
                  </MobileNavLink>
                ) : (
                  <MobileNavLink href="/my-bookings" active={isActive("/my-bookings")}>
                    My Bookings
                  </MobileNavLink>
                )}

                <MobileNavLink href="/profile" active={isActive("/profile")}>
                  Profile
                </MobileNavLink>

                <div className="flex items-center justify-between px-3 pt-2 border-t border-blue-500 mt-2">
                  <Link href="/profile" className="flex items-center gap-2">
                    {/* Mobile avatar */}
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-200 flex items-center justify-center flex-shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-[#1a56db] text-xs font-bold uppercase">
                          {user?.name?.[0] ?? "U"}
                        </span>
                      )}
                    </div>
                    <span className="text-white text-sm font-medium">{user?.name}</span>
                  </Link>
                  <button onClick={logout}
                    className="px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-700 rounded-md transition-colors">
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({ href, active, children }) {
  return (
    <Link href={href}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active ? "bg-blue-700 text-white" : "text-blue-100 hover:text-white hover:bg-blue-700"
      }`}>
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, children }) {
  return (
    <Link href={href}
      className={`block px-3 py-2 text-sm font-medium rounded-md mx-2 transition-colors ${
        active ? "bg-blue-700 text-white" : "text-blue-100 hover:text-white hover:bg-blue-700"
      }`}>
      {children}
    </Link>
  );
}