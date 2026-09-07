import Link from 'next/link';
import { Orbit, ArrowUpRight } from 'lucide-react';
export default function Header({ active }: { active?: string }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <Orbit size={27} />
        <span>
          astroguide<span className="brand-dot">.</span>
        </span>
      </Link>
      <nav>
        <Link href="/" className={active === 'home' ? 'active' : ''}>
          Home
        </Link>
        <Link href="/explore" className={active === 'explore' ? 'active' : ''}>
          Explore
        </Link>
        <Link href="/catalog" className={active === 'catalog' ? 'active' : ''}>
          My catalog
        </Link>
      </nav>
      <Link href="/login" className="login-link">
        Log in <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
