from pathlib import Path
p=Path('lib/astro/data.ts');s=p.read_text(encoding='utf-8-sig');s=s.replace("return{stars,sky:sky.features,constellations:cons.features,lines:lines.features};", "if(!Array.isArray(stars))throw new Error('Invalid star catalog');return{stars:stars as Star[],sky:(sky as {features:SkyFeature[]}).features,constellations:(cons as {features:Constellation[]}).features,lines:(lines as {features:ConstellationLine[]}).features};")
p.write_text(s,encoding='utf8')
p=Path('components/astro/space-viewport.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace("let lastCmd=-1", "scene.traverse(obj=>{if('material' in obj){const m=obj.material;if(m instanceof T.ShaderMaterial){m.vertexShader='#include <logdepthbuf_pars_vertex>\\n'+m.vertexShader.replace(/}\\s*$/, '\\n#include <logdepthbuf_vertex>\\n}');m.fragmentShader='#include <logdepthbuf_pars_fragment>\\n'+m.fragmentShader.replace(/}\\s*$/, '\\n#include <logdepthbuf_fragment>\\n}');}}});\n  let lastCmd=-1")
s=s.replace("const a=i*2.399963,r=Math.sqrt((i+.5)/n);const spiral=a+Math.log(r+.02)*3", "const r=Math.sqrt((i*.61803398875)%1);const spiral=(i%2)*Math.PI+Math.log(r+.02)*3+Math.sin(i*17)*.3")
s=s.replace("Math.max(0,Math.min(30,2+16*Math.pow(10,-.17*(mag+1.4))))", "(mag>9?0:Math.max(0,Math.min(30,2+16*Math.pow(10,-.17*(mag+1.4)))))")
p.write_text(s,encoding='utf8')
