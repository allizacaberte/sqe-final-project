
import Link from "next/link";
import Image from "next/image";
import { ChevronUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link href="/" aria-label="Critic's Frame home">
          <Image
            src="/images/cf_assets_sqe/logo/CF Logo Ver 2 Beige.png"
            alt="Critic's Frame"
            width={110}
            height={58}
            className="footer-logo"
          />
        </Link>
        <div className="footer-divider" />
        <p>
          © {new Date().getFullYear()} Critic&apos;s Frame. All rights reserved.
          <br />
          <span className="footer-credit">
            Movie data from{" "}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </span>
        </p>
        <a href="#top" className="back-to-top" aria-label="Back to top">
          <ChevronUp size={22} />
        </a>
      </div>
    </footer>
  );
}
