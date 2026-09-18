const fs = require('fs');
global.TEMPLATES = {};
eval(fs.readFileSync('templates/cyclone.js', 'utf8'));
const T = TEMPLATES.cyclone;
const { Resvg } = require('/tmp/node_modules/@resvg/resvg-js');
const cases = [['cy_default',130,190],['cy_large',290,425],['cy_small',65,95]];
for (const [name,w,h] of cases) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0b0e1a"/>${T.render(w,h,{})}</svg>`;
  const r = new Resvg(svg, { fitTo: { mode: 'zoom', value: 2 } });
  fs.writeFileSync(`.tmp_${name}.png`, r.render().asPng());
  console.log('wrote', name);
}
