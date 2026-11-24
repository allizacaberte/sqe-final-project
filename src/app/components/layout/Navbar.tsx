
"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({
  isLoggedIn = false,
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

        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search..."
            aria-label="Search movies"
          />
          <Search size={16} />
        </div>

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
            <>

              <button className="btn-primary">
                Logout
              </button>
            </>
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
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                My Reviews
              </Link>
              <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                Profile
              </Link>
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
