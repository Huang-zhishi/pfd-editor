/* ============================================================
 * PFD Editor · 组件模板：vibratingScreen（工业振动筛 · 直线振动筛）
 *   用于锰粉 / 煤粉等粉料的筛分分级：
 *     粉料自进料口入筛 → 筛箱沿直线振动（两台振动电机反向自同步）
 *     → 细粉透过筛网落入下锥斗由筛下物口排出
 *     → 粗粉（筛上物）沿筛面移至出料端由粗料口排出。
 *   配色与画法对齐 classifier / screwConveyor / dustCollector：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例冲突）：
 *       #7d849e → #d9dded → #767d97（筛箱 / 电机 / 锥斗）
 *       #12162b（深腔）  #6a7192（深腔描边）  #2a2f45 / #3f445c（法兰 / 机架 / 支座）
 *       #9aa2bc（筛网 / 亮件）  #0c1020（收口 / 弹簧座）  #8e96b6（螺栓头）
 *   端口比例（须与文件顶部 ports 同步）：
 *     inlet=左侧进料  coarse=右上筛上物  fine=底部筛下物  dust=顶部除尘
 * ============================================================ */

TEMPLATES.vibratingScreen = {
  name: '工业振动筛',
  category: '粉磨与分级',
  defaultSize: { w: 300, h: 180 },
  ports: [
    { id:'inlet',  x:0,    y:.25, dir:'left'  },   // 进料口
    { id:'coarse', x:1,    y:.415, dir:'right' },  // 筛上物（粗料）
    { id:'fine',   x:.504, y:.98, dir:'down'  },   // 筛下物（细料）
    { id:'dust',   x:.49,  y:.06, dir:'up'    }    // 除尘口
  ],
  render: (w,h,p)=>{
    const c = (p && p.color) || '#9C99FF';
    const F = v => (+v).toFixed(2);
    const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
    const K = clamp(Math.min(w/300, h/180), 0.3, 2.4);
    const uid = Math.random().toString(36).slice(2,7);
    const lerp = (a,b,t)=>a+(b-a)*t;

    /* ---------- 筛箱几何（左高右低，缓倾角） ---------- */
    const bx = w*0.14, bxr = w*0.84, bw = bxr-bx;
    const slope = h*0.055;                       // 右端下沉量
    const byTop = h*0.22;                        // 箱顶（左端）
    const bh = h*0.28;                           // 箱体竖向高度
    const TL = [bx, byTop], TR = [bxr, byTop+slope], BR = [bxr, byTop+slope+bh], BL = [bx, byTop+bh];
    const P = a => a.map(F).join(',');
    const boxTopYat = x => byTop + slope*(x-bx)/bw;
    const boxBotYat = x => byTop + bh + slope*(x-bx)/bw;

    /* ---------- 筛网（之字形网面） ---------- */
    const pad = clamp(bw*0.03, 3, 10);
    const deckOff = bh*0.40;
    const deckLx = bx+pad, deckRx = bxr-pad;
    const deckYat = x => boxTopYat(x) + deckOff;
    const deckLy = deckYat(deckLx), deckRy = deckYat(deckRx);
    const meshN = 26;
    let mesh = '';
    for(let i=0;i<meshN;i++){
      const t0=i/meshN, t1=(i+1)/meshN;
      const x0=lerp(deckLx,deckRx,t0), x1=lerp(deckLx,deckRx,t1);
      const y0=lerp(deckLy,deckRy,t0), y1=lerp(deckLy,deckRy,t1);
      const xm=(x0+x1)/2, ym=(y0+y1)/2 + clamp(bh*0.10,2,8);
      mesh += `<path d="M ${F(x0)} ${F(y0)} L ${F(xm)} ${F(ym)} L ${F(x1)} ${F(y1)}" fill="none" stroke="#9aa2bc" stroke-width="${F(clamp(K*0.7,0.5,1.1))}" opacity="0.5"/>`;
    }

    /* ---------- 筛下锥斗 + 出料口 ---------- */
    const hopTopL = [bx+bw*0.08, byTop+bh], hopTopR = [bxr-bw*0.10, byTop+slope+bh];
    const fineX = bx+bw*0.52, fineY = h*0.98;
    const outW = clamp(bw*0.05, 3, 10);
    const fineOutlet = [fineX-outW, fineY, fineX+outW, fineY];

    /* ---------- 减振弹簧 + 机架 ---------- */
    const baseY = h*0.92, baseH = clamp(K*2.4, 1.5, 4.5);
    const sprXs = [bx+bw*0.07, bxr-bw*0.07];
    const coilH = clamp(h*0.05, 4, 14);
    let springs = '', base = '';
    sprXs.forEach((sx,si)=>{
      const topY = boxBotYat(sx);
      const botY = baseY - baseH;
      const turns = 6, amp = clamp(K*1.2, 1, 3);
      let d = `M ${F(sx)} ${F(topY)}`;
      for(let i=0;i<turns;i++){
        const yy = lerp(topY, botY, (i+0.5)/turns);
        d += ` L ${F(sx-amp)} ${F(yy)} L ${F(sx+amp)} ${F(yy)}`;
      }
      d += ` L ${F(sx)} ${F(botY)}`;
      springs += `<path d="${d}" fill="none" stroke="#8e96b6" stroke-width="${F(clamp(K*1.1,0.7,1.8))}" stroke-linecap="round"/>
        <rect x="${F(sx-amp*2)}" y="${F(topY-2)}" width="${F(amp*4)}" height="${F(clamp(K*1.4,1,2.4))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <rect x="${F(sx-amp*2)}" y="${F(botY)}" width="${F(amp*4)}" height="${F(clamp(K*1.4,1,2.4))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
    });
    // 基础地脚板（两根支柱下方，不做贯通横梁，避免锥斗出料口与框架打架）
    sprXs.forEach(sx=>{
      const fw = clamp(K*9, 7, 20);
      base += `<rect x="${F(sx-fw/2)}" y="${F(baseY-baseH)}" width="${F(fw)}" height="${F(baseH)}" rx="1" fill="#0c1020" stroke="#3f445c" stroke-width="1"/>`;
    });

    /* ---------- 静态件：进料溜槽 + 除尘罩 ---------- */
    const inletY = byTop + bh*0.10, inletH = clamp(bh*0.34, 5, 22);
    const feedChute = `
      <rect x="0" y="${F(inletY-inletH/2)}" width="${F(bx+pad)}" height="${F(inletH)}" fill="url(#vs_metalv_${uid})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(bx*0.5)}" y="${F(inletY-inletH/2-clamp(K*2,1,3))}" width="${F(clamp(K*3,1.5,5))}" height="${F(inletH+clamp(K*4,2,6))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
    const dustCX = bx+bw*0.50, dustW = clamp(bw*0.10, 6, 20), dustTopY = h*0.06;
    const dustHoodTopY = byTop+slope*0.5;
    const dustPipe = `
      <rect x="${F(dustCX-dustW/2)}" y="${F(dustTopY)}" width="${F(dustW)}" height="${F(Math.max(1, dustHoodTopY-dustTopY))}" fill="url(#vs_metalv_${uid})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(dustCX-dustW*0.72)}" y="${F(dustTopY-clamp(K*3,1.5,5))}" width="${F(dustW*1.44)}" height="${F(clamp(K*3,1.5,5))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

    /* ---------- 振动电机（两台，偏心块反向自同步） ---------- */
    const motorXs = [bx+bw*0.30, bx+bw*0.70];
    const mBodyW = clamp(bw*0.11, 7, 26), mBodyH = clamp(bh*0.30, 5, 18);
    const mR = clamp(K*4, 3, 9);
    let motors = '';
    motorXs.forEach((mx,mi)=>{
      const myTop = boxTopYat(mx);
      const bodyY = myTop - mBodyH - mR*1.1;
      const wcy = bodyY + mBodyH*0.5;   // 偏心块中心（近箱顶）
      const dir = mi===0 ? 1 : -1;
      motors += `
        <rect x="${F(mx-mBodyW/2)}" y="${F(myTop-clamp(K*1.4,1,2.4))}" width="${F(mBodyW)}" height="${F(clamp(K*1.6,1.2,2.6))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${F(mx-mBodyW/2)}" y="${F(bodyY)}" width="${F(mBodyW)}" height="${F(mBodyH)}" rx="${F(clamp(K*1.5,1,3))}" fill="url(#vs_metal_${uid})" stroke="#3f445c" stroke-width="1"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="${dir>0?0:360} ${F(mx)} ${F(wcy)}" to="${dir>0?360:0} ${F(mx)} ${F(wcy)}" dur="0.6s" repeatCount="indefinite"/>
          <circle cx="${F(mx)}" cy="${F(wcy)}" r="${F(mR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
          <path d="M ${F(mx)} ${F(wcy)} L ${F(mx+mR*0.9)} ${F(wcy-mR*0.3)} A ${F(mR*0.9)} ${F(mR*0.9)} 0 0 1 ${F(mx+mR*0.55)} ${F(wcy+mR*0.75)} Z" fill="${c}" opacity="0.9"/>
        </g>
        <circle cx="${F(mx)}" cy="${F(wcy)}" r="${F(clamp(mR*0.22,0.8,1.8))}" fill="#9aa2bc"/>`;
    });

    /* ---------- 筛箱（含筛网 / 出料端） ---------- */
    const wallT = clamp(K*1.2, 0.8, 2);
    const innerPad = clamp(bh*0.09, 2, 7);
    const boxPoly = `M ${P(TL)} L ${P(TR)} L ${P(BR)} L ${P(BL)} Z`;
    const cavPoly = `M ${F(TL[0]+innerPad)} ${F(TL[1]+innerPad)} L ${F(TR[0]-innerPad)} ${F(TR[1]+innerPad)} L ${F(BR[0]-innerPad)} ${F(BR[1]-innerPad)} L ${F(BL[0]+innerPad)} ${F(BL[1]-innerPad)} Z`;
    // 顶盖条 + 螺栓（把合线）
    const coverT = clamp(K*2, 1.2, 3.5);
    const cover = `<path d="M ${F(bx-coverT)} ${F(byTop-coverT)} L ${F(bxr+coverT)} ${F(byTop+slope-coverT)} L ${F(bxr+coverT)} ${F(byTop+slope+coverT*0.5)} L ${F(bx-coverT)} ${F(byTop+coverT*0.5)} Z" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
    const boltR = clamp(K*1.1, 0.7, 1.5);
    const bolt = (x,y)=>`<circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR*0.42)}" fill="#8e96b6"/>`;
    let boxBolts = '';
    for(let i=0;i<=6;i++){
      const x = lerp(bx, bxr, i/6);
      boxBolts += bolt(x, boxTopYat(x)+coverT*0.75);
      boxBolts += bolt(x, boxBotYat(x)-clamp(K*1.4,1,2.4));
    }
    const box = `
      <path d="${boxPoly}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.6"/>
      <path d="${cavPoly}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      <path d="M ${F(TL[0])} ${F(TL[1])} L ${F(TR[0])} ${F(TR[1])}" stroke="#9aa2bc" stroke-width="${F(clamp(K*1.2,0.8,1.8))}" opacity="0.5"/>`;

    /* ---------- 筛上物出料溜槽 ---------- */
    const coarseY = deckRy + h*0.03, chuteH = clamp(bh*0.30, 4, 16);
    const coarseChute = `
      <path d="M ${F(bxr-clamp(K*2,1,3))} ${F(deckRy-chuteH*0.5)} L ${F(w)} ${F(coarseY-chuteH*0.5)} L ${F(w)} ${F(coarseY+chuteH*0.5)} L ${F(bxr-clamp(K*2,1,3))} ${F(deckRy+chuteH*0.5)} Z" fill="url(#vs_metalv_${uid})" stroke="#3f445c" stroke-width="1"/>`;

    /* ---------- 锥斗 ---------- */
    const hopper = `
      <path d="M ${P(hopTopL)} L ${P(hopTopR)} L ${F(fineX+outW)} ${F(fineY)} L ${F(fineX-outW)} ${F(fineY)} Z" fill="url(#vs_metal_${uid})" stroke="#3f445c" stroke-width="1.2"/>
      <path d="M ${F(hopTopL[0]+innerPad)} ${F(hopTopL[1])} L ${F(hopTopR[0]-innerPad)} ${F(hopTopR[1])} L ${F(fineX+outW*0.7)} ${F(fineY)} L ${F(fineX-outW*0.7)} ${F(fineY)} Z" fill="#12162b" opacity="0.45"/>
      <rect x="${F(fineX-outW*1.6)}" y="${F(fineY-clamp(K*2.2,1.4,4))}" width="${F(outW*3.2)}" height="${F(clamp(K*2.2,1.4,4))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

    /* ---------- 物料：粗料沿筛面前行 + 细料透筛下落 ---------- */
    const upperClip = `vs_up_${uid}`, lowerClip = `vs_lo_${uid}`;
    const clipDefs = `
      <clipPath id="${upperClip}"><path d="M ${P(TL)} L ${P(TR)} L ${F(deckRx)} ${F(deckRy)} L ${F(deckLx)} ${F(deckLy)} Z"/></clipPath>
      <clipPath id="${lowerClip}">
        <path d="M ${F(deckLx)} ${F(deckLy)} L ${F(deckRx)} ${F(deckRy)} L ${P(BR)} L ${P(BL)} Z"/>
        <path d="M ${P(hopTopL)} L ${P(hopTopR)} L ${F(fineX+outW)} ${F(fineY)} L ${F(fineX-outW)} ${F(fineY)} Z"/>
      </clipPath>`;
    const matR = clamp(K*1.25, 0.7, 2.1);
    let coarseMat = '';
    for(let i=0;i<9;i++){
      const delay = -(i*0.55).toFixed(2);
      let px=[], py=[];
      const yOff = clamp(bh*0.16, 2, 9);
      for(let k=0;k<=24;k++){
        const t=k/24, x=lerp(deckLx, deckRx, t);
        px.push(x.toFixed(1));
        py.push((deckYat(x)-yOff - Math.abs(Math.sin(t*7+i))*clamp(K*1.4,1,3)).toFixed(1));
      }
      coarseMat += `<circle cx="${px[0]}" cy="${py[0]}" r="${F(matR)}" fill="${c}" opacity="0.85" clip-path="url(#${upperClip})">
        <animate attributeName="cx" values="${px.join(';')}" dur="6s" begin="${delay}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${py.join(';')}" dur="6s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
    }
    let fineMat = '';
    for(let i=0;i<6;i++){
      const delay = -(i*1.0).toFixed(2);
      const x0 = lerp(deckLx, deckRx, (i+1)/7);
      let px=[], py=[];
      const steps=20;
      for(let k=0;k<=steps;k++){
        const t=k/steps;
        let x, y;
        if(t<0.35){ x=lerp(x0, x0+bw*0.06, t/0.35); y=deckYat(x0); }
        else { const tt=(t-0.35)/0.65; x=lerp(x0+bw*0.06, fineX, tt); y=lerp(deckYat(x0), fineY, tt); }
        px.push(x.toFixed(1)); py.push(y.toFixed(1));
      }
      fineMat += `<circle cx="${px[0]}" cy="${py[0]}" r="${F(matR*0.85)}" fill="${c}" opacity="0.7" clip-path="url(#${lowerClip})">
        <animate attributeName="cx" values="${px.join(';')}" dur="3.4s" begin="${delay}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${py.join(';')}" dur="3.4s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
    }

    /* ---------- 箱体整体振动（直线振动：沿驱动方向小幅往复） ---------- */
    const vibA = clamp(K*1.3, 0.8, 2.6), vibB = vibA*0.45;
    const vibVals = `0,0;${(-vibA).toFixed(2)},${vibB.toFixed(2)};0,0;${vibA.toFixed(2)},${(-vibB).toFixed(2)};0,0`;

    return `
      <defs>
        <linearGradient id="vs_metal_${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>
        <linearGradient id="vs_metalv_${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>
        ${clipDefs}
      </defs>
      ${base}
      ${springs}
      ${hopper}
      ${feedChute}
      ${dustPipe}
      <g>
        <animateTransform attributeName="transform" type="translate" values="${vibVals}" dur="0.5s" repeatCount="indefinite"/>
        ${cover}
        ${box}
        ${mesh}
        ${boxBolts}
        ${motors}
        ${coarseChute}
        ${coarseMat}${fineMat}
      </g>
    `;
  }
};
