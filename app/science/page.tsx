import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Header from '@/components/astro/header';
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children} <ArrowUpRight size={13} />
  </a>
);
export default function Science() {
  return (
    <main>
      <Header />
      <article className="science-page">
        <p className="eyebrow">BEHIND THE VIEW</p>
        <h1>
          A sense of wonder.
          <br />A foundation in evidence.
        </h1>
        <p className="science-lead">
          AstroGuide is an educational explorer. Here is what is measured, what
          is calculated, and where the visual model makes an approximation.
        </p>
        <section>
          <h2>Planning an observation</h2>
          <p>
            Tonight calculates topocentric planetary positions for your selected
            latitude, longitude, and time. Catalog star and deep-sky directions
            are precessed from J2000 to the equator of date. Standard
            atmospheric refraction is applied; terrain, weather, local
            obstructions, light pollution, and star proper motion are not
            modeled. The sky chart has north up and east left, as when held
            overhead. A target above the horizon is not guaranteed to be
            visible. The displayed collection includes planets, the Moon, stars
            through magnitude 3.5, and the curated optical deep-sky objects.
          </p>
          <p>
            Sunrise and sunset searches cover the next 24 hours after the chosen
            instant. At high latitudes there may be no crossing in that
            interval. Moon phases are geocentric quarter-phase calculations, not
            predictions of local observing quality. All displayed times use the
            device time zone, even for a different selected city. Waco is an
            example location; no location permission or remote geolocation
            lookup is used.
          </p>
          <p>
            Signed-in observation plans, status, dates, and notes are stored in
            an account-specific database. Guest records remain in this browser.
            Marking a target as observed is your own record; an online visit
            does not mark a real observation.
          </p>
          <A href="https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md">
            Astronomy Engine calculation reference
          </A>
        </section>
        <section>
          <h2>Two ways to see space.</h2>
          <p>
            The Sun, planets, Moon, and Pluto use physical radii and distances
            in kilometers. True-scale mode preserves those sizes. The default
            Cinematic view enlarges distant planets for visibility, adds softer
            fill lighting, and rotates surfaces for presentation. It adds 28,000
            artistic background stars and a stylized Milky Way haze; these are
            not catalog objects. Earth-sky glow is illustrative, not a local
            horizon. Light-travel playback always uses physical centers and
            physical planet sizes. Zooming changes the camera distance
            exponentially so you can cross large scales quickly. Name labels and
            stellar light points are enlarged screen markers; their size does
            not describe an object’s radius.
          </p>
          <p>
            Planetary models are spheres using mean radii. Oblateness, terrain
            relief, detailed ring structure, and eclipsing shadows are not
            modeled in this release. Surface maps, surface orientation,
            atmospheric glow, and exposure are illustrative. The landing-page
            globe rotates slowly for presentation; it is not a live Earth
            observation.
          </p>
          <A href="https://ssd.jpl.nasa.gov/planets/phys_par.html">
            JPL planetary physical parameters
          </A>
        </section>
        <section>
          <h2>Planetary positions and time</h2>
          <p>
            Positions are calculated with Astronomy Engine 2.1.19 in the
            heliocentric J2000 equatorial frame. The engine uses compact
            astronomical models and is tested by its author against JPL Horizons
            and NOVAS. The model is intended for education and amateur
            astronomy, not spacecraft navigation.
          </p>
          <p>
            The opening scene uses the time when the page loads. Picking a
            calendar date sets 12:00 UTC. Orbital lines sample each object’s
            predicted motion over one approximate orbital period; the Moon’s
            path is shown relative to Earth. The scene displays geometric
            positions at that time rather than a light-time-corrected telescope
            view. Bodies remain stationary until the selected date changes.
          </p>
          <A href="https://github.com/cosinekitty/astronomy">
            Astronomy Engine documentation and validation
          </A>
        </section>
        <section>
          <h2>Stars and constellation patterns</h2>
          <p>
            Cinematic close-ups show a procedural plasma surface and corona for
            the selected star. Color follows its catalog color index; surface
            patterns, rotation, and representative radii are artistic and must
            not be used for size comparisons. The Andromeda model uses 24,000
            illustrative light points, a warm central bulge, and blue outer
            arms.
          </p>
          <p>
            The Earth sky view contains 5,044 recorded star directions from the
            D3-Celestial catalog. The 3D view uses 10,426 stars from HYG v4.0:
            stars to magnitude 6.5, named stars, and a nearby sample within 20
            parsecs. Missing or dubious distance values flagged by the catalog
            are excluded. This is a selected sample, not every star in the
            galaxy.
          </p>
          <p>
            Star coordinates and distances are held at catalog epoch J2000;
            stellar motion, interstellar extinction from other viewpoints, and
            binary orbital motion are not modeled. Catalog distances are
            estimates and can differ from later studies, particularly for
            distant stars. Point brightness is an approximate display mapping
            from catalog magnitude and observer distance. Color is mapped
            approximately from the B−V index; the visible glow is a rendering
            effect.
          </p>
          <p>
            There are 88 recognized constellations. Serpens has two disconnected
            regions and therefore appears as two records in the supplied
            89-region file. Lines connect conventional patterns and are not
            physical structures or official boundaries. “Earth sky” shows
            celestial directions without a local horizon, observing location,
            refraction, or daylight.
          </p>
          <div className="source-stack">
            <A href="https://github.com/ofrohn/d3-celestial">
              D3-Celestial · Olaf Frohn · BSD 3-Clause
            </A>
            <A href="https://github.com/astronexus/HYG-Database">
              HYG database · David Nash / Astronexus · CC BY-SA 4.0
            </A>
            <A href="/data/stars-3d.json">
              Download the filtered HYG dataset · CC BY-SA 4.0
            </A>
            <A href="https://iauarchive.eso.org/public/themes/constellations/">
              IAU constellation definitions
            </A>
          </div>
        </section>
        <section>
          <h2>Following a beam of light</h2>
          <p>
            The speed of light in vacuum is exactly 299,792.458 kilometers per
            second. The journey timer uses distance ÷ speed, with a Julian year
            of 365.25 days for light-year conversions. One astronomical unit is
            exactly 149,597,870.7 kilometers.
          </p>
          <p>
            At 1×, elapsed time follows real time. Other settings explicitly
            accelerate the playback clock. The path measures center-to-center
            separation with endpoints held at the selected date. It illustrates
            straight-line propagation in vacuum; it does not include travel
            inside a star, motion during the journey, gravity, cosmological
            expansion, or an actual light signal emitted from a black hole.
            Long-distance journeys illustrate the catalog’s approximate
            separation.
          </p>
          <div className="source-stack">
            <A href="https://physics.nist.gov/cgi-bin/cuu/Value?c">
              NIST · Speed of light in vacuum
            </A>
            <A href="https://iauarchive.eso.org/public/themes/measuring/">
              IAU · Measuring the universe
            </A>
          </div>
        </section>
        <section>
          <h2>Deep space: observations and illustrations</h2>
          <p>
            The Orion Nebula is placed at an approximate distance of 1,344
            light-years. Its Hubble image is a flat observation, not a measured
            3D cloud. The Andromeda Galaxy’s distance is approximately 2.5
            million light-years; its spiral disk here is a schematic
            illustration, and the drawn particles are not individual cataloged
            stars.
          </p>
          <p>
            Sagittarius A* is placed approximately 26,000 light-years away. Its
            3D black sphere and accretion disk are illustrative. The scale
            reference is a Schwarzschild radius of about 11.8 million kilometers
            for a non-spinning black hole of four million solar masses. The
            actual horizon depends on spin. The model does not solve
            relativistic light bending, and the disk geometry is not a
            reconstruction of the real object.
          </p>
          <p>
            The orange Sagittarius A* image in its information panel is an Event
            Horizon Telescope reconstruction from 1.3 mm radio observations
            collected in 2017 and released in 2022. Its displayed colors are not
            visible-light colors.
          </p>
          <div className="source-stack">
            <A href="https://nightsky.jpl.nasa.gov/documents/136/PartnerArticle_December2019.pdf">
              NASA/JPL · Orion Nebula
            </A>
            <A href="https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/">
              NASA · Andromeda Galaxy
            </A>
            <A href="https://www.eso.org/public/images/eso2208-eht-mwa/">
              EHT / ESO · Sagittarius A* observation
            </A>
          </div>
        </section>
        <section>
          <h2>Image and texture credits</h2>
          <ul>
            <li>
              <A href="https://science.nasa.gov/earth/earth-observatory/earths-limb-with-a-crescent-moon-150240/">
                Earth’s limb
              </A>{' '}
              — NASA / ISS Expedition 66 crew; ISS Crew Earth Observations
              Facility and Earth Science and Remote Sensing Unit, Johnson Space
              Center. Astronaut photograph, December 6, 2021; cropped for the
              landing page.
            </li>
            <li>
              <A href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/">
                Earth surface
              </A>{' '}
              — NASA Earth Observatory, Blue Marble: Next Generation, July 2004
              composite. Processed map, not a live view.
            </li>
            <li>
              <A href="https://science.nasa.gov/photojournal/cassinis-best-maps-of-jupiter-cylindrical-map/">
                Jupiter map
              </A>{' '}
              — NASA/JPL/Space Science Institute, Cassini global color mosaic.
              Processed historical cloud map.
            </li>
            <li>
              <A href="https://www.solarsystemscope.com/textures/">
                Planetary textures
              </A>{' '}
              — Solar System Scope (INOVE),{' '}
              <A href="https://creativecommons.org/licenses/by/4.0/">
                CC BY 4.0
              </A>
              . Processed equirectangular maps with adjusted colors and
              illustrative content; not live surfaces.
            </li>
            <li>
              <A href="https://science.nasa.gov/resource/pluto-global-color-map/">
                Pluto map
              </A>{' '}
              — NASA/JHUAPL/SwRI, New Horizons 2015 mosaic. Resolution varies;
              dark unmapped areas indicate missing data, not black terrain.
            </li>
            <li>
              <A href="https://esahubble.org/images/heic0601a/">Orion Nebula</A>{' '}
              — NASA, ESA, M. Robberto (Space Telescope Science Institute/ESA)
              and the Hubble Space Telescope Orion Treasury Project Team; CC BY
              4.0. Cropped in cards.
            </li>
            <li>
              <A href="https://www.eso.org/public/images/eso2208-eht-mwa/">
                Sagittarius A*
              </A>{' '}
              — EHT Collaboration; CC BY 4.0.
            </li>
          </ul>
        </section>
        <section>
          <h2>Your discovery catalog</h2>
          <p>
            Demo accounts sync their separate catalogs through the database. The guest catalog
            stores visited objects, bookmarks, and notes in this browser’s local
            storage. Clearing browser data removes that catalog. It is not an
            authenticated private account.
          </p>
        </section>
        <Link href="/explore" className="primary-button">
          Back to exploring <ArrowUpRight size={18} />
        </Link>
      </article>
    </main>
  );
}
