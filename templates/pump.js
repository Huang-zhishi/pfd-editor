/* ============================================================
 * PFD Editor · 组件模板：pump
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.pump。
 * ============================================================ */

TEMPLATES.pump = {
    name: '工业抽水泵', category: '阀门管件',
    defaultSize: { w: 120, h: 90 },
    ports: [{id:'in',x:0,y:.5,dir:'left'},{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const c = p.color;
      const bolt = (bx,by,r=1.8)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/><circle cx="${bx}" cy="${by}" r="${r*0.4}" fill="${c}" opacity="0.5"/>`;
      const cx = w/2, cy = h*0.5;
      const R = h*0.38;
      const gaugeCx = cx, gaugeR = 4.5, gaugeCy = cy - R - gaugeR - 1;
      const flangeW = 9;
      // 叶轮片
      const blades = Array.from({length:6}).map((_,i)=>{ const a=i*60*Math.PI/180; return `<line x1="${cx+Math.cos(a)*R*0.34}" y1="${cy+Math.sin(a)*R*0.34}" x2="${cx+Math.cos(a)*R*0.62}" y2="${cy+Math.sin(a)*R*0.62}" stroke="${c}" stroke-width="1.2" opacity="0.5"/>`; }).join('');
      return `
        <!-- 蜗壳（居中对称） -->
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1a1835" stroke="${c}" stroke-width="1.6"/>
        <circle cx="${cx}" cy="${cy}" r="${R*0.78}" fill="none" stroke="${c}" stroke-width="1" opacity="0.4"/>
        <circle cx="${cx}" cy="${cy}" r="${R*0.3}" fill="#252545" stroke="${c}" stroke-width="1"/>
        <!-- 叶轮（旋转） -->
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="3s" repeatCount="indefinite"/>
          ${blades}
          <circle cx="${cx}" cy="${cy}" r="${R*0.12}" fill="${c}" opacity="0.7"/>
        </g>
        <!-- 顶部压力表（居中，无文字） -->
        <rect x="${gaugeCx-3}" y="${gaugeCy+gaugeR}" width="6" height="3" fill="#151330" stroke="${c}" stroke-width="0.5"/>
        <circle cx="${gaugeCx}" cy="${gaugeCy}" r="${gaugeR}" fill="#0d0b20" stroke="${c}" stroke-width="1.2"/>
        <circle cx="${gaugeCx}" cy="${gaugeCy}" r="${gaugeR*0.8}" fill="#151330" stroke="${c}" stroke-width="0.7"/>
        <line x1="${gaugeCx}" y1="${gaugeCy}" x2="${gaugeCx+Math.cos(0.6)*gaugeR*0.6}" y2="${gaugeCy+Math.sin(0.6)*gaugeR*0.6}" stroke="${c}" stroke-width="1.2"/>
        <circle cx="${gaugeCx}" cy="${gaugeCy}" r="1.4" fill="${c}"/>
        <!-- 吸入管 in（左，贯穿蜗壳直通泵内，直连泵体） -->
        <rect x="0" y="${cy-3}" width="${cx-R*0.4}" height="6" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="0" y="${cy-5}" width="${flangeW}" height="10" rx="1" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        <rect x="0" y="${cy-5}" width="${flangeW}" height="2" fill="rgba(255,255,255,0.06)"/>
        ${bolt(2,cy-3,1)}${bolt(2,cy+3,1)}
        <!-- 排出管 out（右，贯穿蜗壳直通泵内，直连泵体） -->
        <rect x="${cx+R*0.4}" y="${cy-3}" width="${w-(cx+R*0.4)}" height="6" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="${w-flangeW}" y="${cy-5}" width="${flangeW}" height="10" rx="1" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        <rect x="${w-flangeW}" y="${cy-5}" width="${flangeW}" height="2" fill="rgba(255,255,255,0.06)"/>
        ${bolt(w-2,cy-3,1)}${bolt(w-2,cy+3,1)}
        <!-- 水流粒子：进口 4 颗流入泵内 -->
        ${[0,0.25,0.5,0.75].map((ph)=>{
          const travel = cx - R*0.5 - 3;
          return `<g><circle cx="3" cy="${cy}" r="1.8" fill="#6ecbf5" opacity="0.85">
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0 0;${travel} 0;${travel} 0" keyTimes="0;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
          </circle></g>`;
        }).join('')}
        <!-- 水流粒子：出口 4 颗从泵内流出 -->
        ${[0,0.25,0.5,0.75].map((ph)=>{
          const start = cx + R*0.5;
          const travel = (w-3) - start;
          return `<g><circle cx="${start}" cy="${cy}" r="1.8" fill="#6ecbf5" opacity="0.85">
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0 0;${travel} 0;${travel} 0" keyTimes="0;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
          </circle></g>`;
        }).join('')}
      `;
    }
};
