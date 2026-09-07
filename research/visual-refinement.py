from pathlib import Path
p=Path('app/page.tsx');s=p.read_text(encoding='utf-8-sig');s="import HeroEarth from '@/components/astro/hero-earth';\nimport OrionDiagram from '@/components/astro/orion-diagram';\n"+s
s=s.replace('<div className="hero-image" role="img" aria-label="Earth’s blue atmospheric limb photographed from the International Space Station"/>','<HeroEarth/>')
s=s.replace('NASA / JSC · EARTH FROM THE ISS','NASA BLUE MARBLE · RENDERED EARTH')
s=s.replace('<span>Our home in the cosmos</span>','<span>6,371 km radius · One extraordinary home</span>')
s=s.replace('<Sparkles size={30}/><div><span className="eyebrow">CONNECT THE DOTS</span>','<OrionDiagram/><div><span className="eyebrow">CONNECT THE DOTS</span>')
s=s.replace('<Orbit size={30}/><div><span className="eyebrow">299,792.458 KM / S</span>','<div className="light-card-metric"><strong>8<span>m</span> 19<span>s</span></strong><span>LIGHT TRAVEL ACROSS 1 AU</span></div><div><span className="eyebrow">299,792.458 KM / S</span>')
s=s.replace('<footer className="site-footer">','<div className="landing-credits">Orion image: <a href="https://esahubble.org/images/heic0601a/" target="_blank" rel="noreferrer">NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope Orion Treasury Project Team</a></div><footer className="site-footer">')
p.write_text(s,encoding='utf8')
p=Path('app/science/page.tsx');s=p.read_text(encoding='utf-8-sig');s=s.replace('Surface maps, surface orientation, atmospheric glow, and exposure are illustrative.','Surface maps, surface orientation, atmospheric glow, and exposure are illustrative. The landing-page globe rotates slowly for presentation; it is not a live Earth observation.');p.write_text(s,encoding='utf8')
p=Path('components/astro/explorer.tsx');s=p.read_text(encoding='utf-8-sig');s=s.replace('FIND YOUR NEXT DISCOVERY','YOUR NEXT DISCOVERY').replace('OBJECT FIELD NOTES','FIELD NOTES');p.write_text(s,encoding='utf8')
