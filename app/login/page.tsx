import LoginForm from '@/components/astro/login-form';
import Link from 'next/link';
import { ArrowUpRight, Bookmark, Orbit } from 'lucide-react';
import Header from '@/components/astro/header';
export default function Login() {
  return (
    <main className="login-page">
      <Header />
      <div className="login-layout">
        <div className="login-art">
          <img
            src="/assets/orion.jpg"
            alt="The Orion Nebula photographed by Hubble"
          />
          <div>
            <p className="eyebrow">M42 · ORION NEBULA</p>
            <h2>
              There’s a whole
              <br />
              universe to remember.
            </h2>
            <a
              href="https://esahubble.org/images/heic0601a/"
              target="_blank"
              rel="noreferrer"
            >
              NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope
              Orion Treasury Project Team
            </a>
          </div>
        </div>
        <section className="login-copy">
          <Orbit size={36} />
          <p className="eyebrow">MAKE SPACE FOR DISCOVERY</p>
          <h1>
            Your journey.
            <br />
            Your catalog.
          </h1>
          <LoginForm />
          <Link href="/explore" className="quiet-link">
            Or head straight into the explorer <ArrowUpRight size={15} />
          </Link>
        </section>
      </div>
    </main>
  );
}
