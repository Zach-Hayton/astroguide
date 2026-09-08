import Header from '@/components/astro/header';
import HeroEarth from '@/components/astro/hero-earth';
import OrionDiagram from '@/components/astro/orion-diagram';
import Link from '@/components/astro/site-link';
import {
  ArrowUpRight,
  ArrowRight,
  Orbit,
  Sparkles,
  MoveUpRight,
} from 'lucide-react';
export default function Home() {
  return (
    <main className="landing">
      <Header active="home" />
      <section className="hero">
        <HeroEarth />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> A FIELD GUIDE TO THE UNIVERSE
          </p>
          <h1>
            Start here.
            <br />
            Go <em>everywhere.</em>
          </h1>
          <p className="hero-description">
            From our pale blue dot to the stars that shape our sky. Follow your
            curiosity into the cosmos.
          </p>
          <Link href="/explore" className="primary-button">
            Enter the explorer <ArrowUpRight size={20} />
          </Link>
          <span className="hero-note">No account needed. Just curiosity.</span>
        </div>
        <div className="earth-caption">
          <span className="crosshair">+</span>
          <div>
            <span className="eyebrow">YOUR POINT OF DEPARTURE</span>
            <strong>Earth</strong>
            <span>6,371 km radius · One extraordinary home</span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>01 / THE JOURNEY BEGINS</span>
          <span>NASA BLUE MARBLE · RENDERED EARTH</span>
          <a href="#destinations">
            A little further <MoveUpRight size={14} />
          </a>
        </div>
      </section>
      <section className="destinations" id="destinations">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THERE’S MORE OUT THERE</p>
            <h2>Where will curiosity take you?</h2>
          </div>
          <Link href="/explore">
            Explore the universe <ArrowRight size={17} />
          </Link>
        </div>
        <div className="destination-grid">
          <Link href="/explore?view=sky" className="destination-card sky-card">
            <OrionDiagram />
            <div>
              <span className="eyebrow">CONNECT THE DOTS</span>
              <h3>A sky full of stories</h3>
              <p>Find constellations and the stars behind them.</p>
            </div>
            <ArrowUpRight className="card-arrow" />
          </Link>
          <Link
            href="/explore?object=orion-nebula"
            className="destination-card nebula-card"
          >
            <div>
              <span className="eyebrow">LOOK A LITTLE DEEPER</span>
              <h3>Beyond the familiar</h3>
              <p>Nebulae, galaxies, and the edge of a black hole.</p>
            </div>
            <ArrowUpRight className="card-arrow" />
          </Link>
          <Link href="/explore?light=1" className="destination-card light-card">
            <div className="light-card-metric">
              <strong>
                8<span>m</span> 19<span>s</span>
              </strong>
              <span>LIGHT TRAVEL ACROSS 1 AU</span>
            </div>
            <div>
              <span className="eyebrow">299,792.458 KM / S</span>
              <h3>Chase a beam of light</h3>
              <p>Experience the distance between worlds.</p>
            </div>
            <ArrowUpRight className="card-arrow" />
          </Link>
        </div>
      </section>
      <div className="landing-credits">
        Orion image:{' '}
        <a
          href="https://esahubble.org/images/heic0601a/"
          target="_blank"
          rel="noreferrer"
        >
          NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope
          Orion Treasury Project Team
        </a>
      </div>
      <footer className="site-footer">
        <span>ASTROGUIDE · FIVE FISH</span>
        <Link href="/science">
          The science behind the view <ArrowUpRight size={14} />
        </Link>
        <span>Made for curious minds.</span>
      </footer>
    </main>
  );
}
