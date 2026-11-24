
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { logout } from "@/lib/auth";
import SearchBox from "@/app/components/layout/SearchBox";

interface NavbarProps {
  isLoggedIn?: boolean;
  searchQuery?: string; // pre-fills the search box on the /search page
}

export default function Navbar({
  isLoggedIn = false,
  searchQuery = "",
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
<header className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand" aria-label="Critic's Frame home">
          <Image
            src="/images/cf_assets_sqe/logo/CF Logo Ver 2 Beige.png"
            alt="Critic's Frame"
            width={112}
            height={58}
            className="navbar-brand-image"
          />
        </Link>

        {/* key resets the box when the page's search query changes (e.g. after a new search) */}
        <SearchBox key={searchQuery} initialQuery={searchQuery} className="navbar-search-desktop" />

        <div className="navbar-right">
        <nav className="navbar-links">
          <Link href="/" className="navbar-link">
            Home
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="navbar-actions">
          {isLoggedIn ? (
            <form action={logout}>
              <button type="submit" className="btn-primary">
                Logout
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="navbar-link">
                Login
              </Link>

              <Link href="/register" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="navbar-menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="navbar-mobile">
          <SearchBox
            key={searchQuery}
            initialQuery={searchQuery}
            className="navbar-mobile-search"
            onNavigate={() => setIsMenuOpen(false)}
          />

          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                My Reviews
              </Link>
              <form action={logout}>
                <button type="submit" className="navbar-mobile-logout">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
