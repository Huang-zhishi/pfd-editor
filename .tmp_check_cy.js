const fs = require('fs');
global.TEMPLATES = {};
eval(fs.readFileSync('templates/cyclone.js', 'utf8'));
const T = TEMPLATES.cyclone;
const sizes = [[46,68],[65,95],[93,136],[130,190],[195,285],[290,425],[460,670],[760,1100]];
let ok = true;
const counts = [];
for (const [w,h] of sizes) {
  const s = T.render(w,h,{});
  const nan = s.includes('NaN') || s.includes('undefined') || s.includes('null');
  const neg = /(?:width|height|r|cx|cy|x|y)="-\d/.test(s);
  const a = (s.match(/<animate /g)||[]).length;
  const at = (s.match(/<animateTransform /g)||[]).length;
  counts.push(`${w}x${h}:animate=${a},transform=${at}`);
  if (nan || neg) { ok = false; console.log('BAD', w+'x'+h, 'nan='+nan, 'neg='+neg); }
}
console.log(counts.join('\n'));
console.log(ok ? 'CYCLONE_CHECK_OK' : 'CYCLONE_CHECK_FAIL');
