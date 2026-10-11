/* ============================================================
 * PFD Editor · 组件模板：hopper（漏斗 / 受料斗）
 *   上口进料、下口出料的锥形受料斗：金属斗壁 + 深腔 + 上口法兰 + 支腿 + 出料口法兰，
 *   斗内物料连续下落示意。
 *   配色与画法对齐 silo / storageSilo / screwConveyor：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例冲突）：
 *       #7d849e → #d9dded → #767d97（斗壁 / 出料口）
 *       #12162b（深腔）  #6a7192（深腔描边）  #2a2f45 / #3f445c（法兰 / 支腿 / 地脚）
 *       #9aa2bc / #5b6280（亮件）  #8e96b6（螺栓头）  #0c1020（地脚）
 *   端口：top=上口（进料）  bottom=下口（出料）
 * ============================================================ */

TEMPLATES.hopper = {
    name: '漏斗', category: '储存与反应',
    defaultSize: { w: 90, h: 90 },
    ports: [{ id:'top', x:.5, y:0, dir:'up' }, { id:'bottom', x:.5, y:1, dir:'down' }],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      const F = v => (+v).toFixed(2);
      const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
      const lerp = (a,b,t)=>a+(b-a)*t;
      const K = clamp(Math.min(w/90, h/90), 0.3, 2.4);
      const uid = Math.random().toString(36).slice(2,7);
      const metalId = 'hp_'+uid, metalVId = 'hpv_'+uid, clipId = 'hpc_'+uid;
      const metalDef  = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;

      const topY = h*0.07, outY = h*0.80, baseY = h*0.97;
      const topL = w*0.05, topR = w*0.95;
      const outL = w*0.40, outR = w*0.60;
      const wallT = clamp(K*2.6, 1.5, 4);
      const pad   = clamp(K*4.6, 2.6, 8);
      const boltR = clamp(K*1.0, 0.6, 1.4);
      const bolt = (x,y)=>`<circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR*0.42)}" fill="#8e96b6"/>`;

      // 斗体（金属）+ 深腔
      const bodyPoly = `${F(topL)},${F(topY)} ${F(topR)},${F(topY)} ${F(outR)},${F(outY)} ${F(outL)},${F(outY)}`;
      const cavOutR = Math.max(outL+wallT, outR-wallT);
      const cavOutL = Math.min(outR-wallT, outL+wallT);
      const cavPoly  = `${F(topL+pad)},${F(topY+pad)} ${F(topR-pad)},${F(topY+pad)} ${F(cavOutR)},${F(outY)} ${F(cavOutL)},${F(outY)}`;
      const body = `
        <polygon points="${bodyPoly}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>
        <polygon points="${cavPoly}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
        <polygon points="${cavPoly}" fill="#1b2340" opacity="0.35"/>
        <line x1="${F(topL+pad*0.6)}" y1="${F(topY+pad*0.8)}" x2="${F(outL+wallT*1.4)}" y2="${F(outY-wallT*1.6)}" stroke="#5b6280" stroke-width="${F(clamp(K*0.7,0.4,1))}" opacity="0.4"/>`;

      // 上口法兰 + 螺栓
      const flH = clamp(K*3, 1.8, 6), flExt = clamp(K*2, 1.2, 4);
      const topFlange = `<rect x="${F(topL-flExt)}" y="${F(topY-flH)}" width="${F(topR-topL+2*flExt)}" height="${F(flH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>` +
        bolt(lerp(topL, topR, 0.12), topY-flH*0.5) +
        bolt(lerp(topL, topR, 0.5),  topY-flH*0.5) +
        bolt(lerp(topL, topR, 0.88), topY-flH*0.5);

      // 出料口（短管 + 法兰）
      const outH = Math.max(1, baseY-outY);
      const outlet = `
        <rect x="${F(outL)}" y="${F(outY)}" width="${F(outR-outL)}" height="${F(outH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${F(outL-clamp(K*1,0.6,2))}" y="${F(outY+outH*0.52)}" width="${F(outR-outL+clamp(K*2,1.2,4))}" height="${F(clamp(K*2,1.2,3.4))}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // 支腿 + 地脚
      const legTopY = h*0.36;
      const t = (legTopY-topY)/(outY-topY);
      const legLX = lerp(topL, outL, t), legRX = lerp(topR, outR, t);
      const legW = clamp(K*2.2, 1.4, 4.5), footW = legW*2.6, footH = clamp(K*1.6, 1, 3);
      const leg = (lx)=>`<rect x="${F(lx-legW/2)}" y="${F(legTopY)}" width="${F(legW)}" height="${F(Math.max(1,baseY-legTopY))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(lx-footW/2)}" y="${F(baseY-footH)}" width="${F(footW)}" height="${F(footH)}" rx="1" fill="#0c1020" stroke="#3f445c" stroke-width="0.8"/>`;
      const legs = leg(legLX) + leg(legRX);

      // 斗内物料下落（裁剪于深腔 + 出料口）
      const clipDef = `<clipPath id="${clipId}"><polygon points="${cavPoly}"/><rect x="${F(outL)}" y="${F(outY)}" width="${F(outR-outL)}" height="${F(outH)}"/></clipPath>`;
      const matR = clamp(K*1.6, 0.9, 2.6);
      let mat = '';
      for(let i=0;i<12;i++){
        const delay = -(i*0.5).toFixed(2);
        let px=[], py=[];
        for(let k=0;k<=16;k++){
          const tt=k/16, y=lerp(topY+pad, baseY, tt);
          const conv = Math.min(1, tt*1.3);
          const wL = lerp(topL+pad, outL, conv), wR = lerp(topR-pad, outR, conv);
          const fi = (i*0.31 + tt*0.55) % 1;
          px.push((wL + (wR-wL)*fi).toFixed(1)); py.push(y.toFixed(1));
        }
        mat += `<circle cx="${px[0]}" cy="${py[0]}" r="${F(matR)}" fill="${c}" opacity="0.85" clip-path="url(#${clipId})">
          <animate attributeName="cx" values="${px.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${py.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
      }

      return `
        <defs>${metalDef}${metalVDef}${clipDef}</defs>
        ${legs}
        ${body}
        ${topFlange}
        ${outlet}
        ${mat}
      `;
    }
};
