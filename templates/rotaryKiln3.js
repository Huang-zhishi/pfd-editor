/* ============================================================
 * PFD Editor · 组件模板：rotaryKiln3（3#线回转窑 · 定制）
 *   由 templates/rotaryKiln.js（回转窑/旋转煅烧窑）派生的定制组件：
 *     · 窑体沿轴向划分为 8 个温区：预热1区、预热2区、加热1~5区、冷却区
 *     · 天然气黄管“一上一下、对角”布置：上管供加热 2/4 区，下管供加热 1/3/5 区
 *     · 窑体上方 11 个测温点（既驱动筒体温度色带，又显示实时读数）
 *     · 窑体下方 8 个分温区读数
 *
 *   对外契约（沿用 rotaryKiln 的测温渐变机制，供 editor.js 增量刷新）：
 *     · <linearGradient class="kiln-temp-grad">（x1=0,y1=0,x2=1,y2=0）
 *     · <stop class="kiln-temp-stop" data-kidx="i" offset="…%" stop-color="…">
 *     · <rect class="kiln-temp-overlay" fill="url(#温度渐变id)" clip-path=筒体clip>
 *     · 温度读数 <text class="kiln-temp-val"  data-kidx="i">   （上方 11 点）
 *     · 分区读数 <text class="kiln-zone-val" data-zoneidx="i">（下方 8 区）
 *   数据源：props.tempPoints = [{tag,label}]（默认 11 点）
 *           props.zoneTemps  = [{tag}]        （默认 8 区）
 * ============================================================ */

/* 默认测温点标签（上方：1#温度…11#温度） */
const RK3_TEMP_LABELS = ['1#温度','2#温度','3#温度','4#温度','5#温度','6#温度','7#温度','8#温度','9#温度','10#温度','11#温度'];

/* 窑尾 → 窑头：预热1/2区 → 加热1~5区 → 冷却区。f = 各温区占筒体长度的比例 */
const RK3_ZONES = [
  { n:'预热1区', f:.18 },
  { n:'预热2区', f:.29 },
  { n:'加热1区', f:.09 },
  { n:'加热2区', f:.09 },
  { n:'加热3区', f:.09 },
  { n:'加热4区', f:.09 },
  { n:'加热5区', f:.09 },
  { n:'冷却区',  f:.08 }
];

TEMPLATES.rotaryKiln3 = {
  name: '3#线回转窑',
  category: '干燥煅烧与冷却',
  defaultSize: { w: 760, h: 300 },
  ports: [
    { id:'inlet',     x:0,    y:.50, dir:'left'  },  // 进料（窑尾罩进料溜槽外端）
    { id:'fuel',      x:.9713, y:.50, dir:'right' },  // 燃烧器 / 喷煤管
    { id:'outlet',    x:1,    y:.86, dir:'right' },  // 出料（窑头罩）
    { id:'flueGas',   x:.0785, y:.10, dir:'up'   },  // 烟气出口
    { id:'gasTop',    x:0,    y:.27, dir:'left'  },  // 天然气（上：供加热 2/4 区）
    { id:'gasBottom', x:0,    y:.73, dir:'left'  }   // 天然气（下：供加热 1/3/5 区）
  ],
  render: (w,h,p)=>{
    const c = (p && p.color) || '#9C99FF';
    const F = v => (+v).toFixed(2);
    const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
    const K = clamp(Math.min(w/380, h/180), 0.3, 2.4);
    const xesc = s => String(s==null?'':s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const uid = Math.random().toString(36).slice(2,7);

    /* ---------- 筒体基准 ---------- */
    const drumL = w*0.10, drumR = w*0.86, drumW = drumR-drumL;
    const cy = h*0.50, R = h*0.115;
    const drumTop = cy-R, drumBot = cy+R;

    /* ---------- 温区累加（x0/x1/cx 为筒体相对比例；用副本避免污染模块常量） ---------- */
    const zones = RK3_ZONES.map(z=>({ n:z.n, f:z.f }));
    let cum = 0;
    zones.forEach(z=>{ z.x0 = cum; cum += z.f; z.x1 = cum; z.cx = (z.x0+z.x1)/2; });

    /* ---------- 渐变 / 裁剪 ---------- */
    const metalId = `rk3m_${uid}`, metalVId = `rk3mv_${uid}`, drumId = `rk3d_${uid}`;
    const gradId = `kiln3_temp_${uid}`;
    const clipId = `rk3c_${uid}`, clipInId = `rk3ci_${uid}`;
    const tubeInset  = clamp(R*0.14, 2, 6);
    const drumInset  = clamp(R*0.10, 1.5, 3.5);

    const metalDef = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
    const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
    const drumDef = `<linearGradient id="${drumId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
    const clipDef   = `<clipPath id="${clipId}"><rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.25)}" ry="${F(R)}"/></clipPath>`;
    const clipInDef = `<clipPath id="${clipInId}"><rect x="${F(drumL+tubeInset)}" y="${F(drumTop+tubeInset)}" width="${F(drumW-2*tubeInset)}" height="${F(R*2-2*tubeInset)}" rx="${F(R*0.2)}" ry="${F(Math.max(1,R-tubeInset))}"/></clipPath>`;

    /* ---------- 温度色带（测温点 → 颜色锚点，沿用 rotaryKiln 契约） ---------- */
    const tps = (p && Array.isArray(p.tempPoints) && p.tempPoints.length)
      ? p.tempPoints
      : RK3_TEMP_LABELS.map(lb=>({ label: lb }));
    const tempCold = [122,26,8], tempHot = [255,191,92];
    const tempGrad = `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0" class="kiln-temp-grad">${tps.map((pt,i)=>{
      const f = tps.length > 1 ? i/(tps.length-1) : 0;
      const col = 'rgb(' + tempCold.map((v,j)=>Math.round(v+(tempHot[j]-v)*f)).join(',') + ')';
      return `<stop class="kiln-temp-stop" data-kidx="${i}" offset="${(f*100).toFixed(1)}%" stop-color="${col}"/>`;
    }).join('')}</linearGradient>`;
    const tempOverlay = `<rect class="kiln-temp-overlay" x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.25)}" ry="${F(R)}" fill="url(#${gradId})" opacity="0.5" clip-path="url(#${clipId})"/>`;

    /* ---------- 筒体主体 ---------- */
    const drumBody = `
      <rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.25)}" ry="${F(R)}" fill="url(#${drumId})" stroke="#3f445c" stroke-width="1.8"/>
      <rect x="${F(drumL+drumInset)}" y="${F(drumTop+drumInset)}" width="${F(drumW-2*drumInset)}" height="${F(R*0.4)}" rx="${F(R*0.2)}" ry="${F(R*0.4)}" fill="#5b6280" opacity="0.35"/>
      <ellipse cx="${F(drumL)}" cy="${F(cy)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2" opacity="0.7"/>
      <ellipse cx="${F(drumR)}" cy="${F(cy)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2" opacity="0.7"/>`;

    /* ---------- 温区：分隔线 + 竖排双行标签 ---------- */
    let zoneLines = '', zoneLabels = '';
    const zLineW = clamp(K*1.2, 1, 2);
    zones.forEach((z,i)=>{
      if(i < zones.length-1){
        const x = drumL + drumW*z.x1;
        zoneLines += `<line x1="${F(x)}" y1="${F(drumTop)}" x2="${F(x)}" y2="${F(drumBot)}" stroke="#7a8098" stroke-width="${F(zLineW)}" opacity="0.9"/>`;
      }
      const cx = drumL + drumW*z.cx;
      const fs = clamp(R*0.32, 5, 12), lh = fs*1.12, gap = fs*0.5;
      const r1 = z.n.slice(0,2).split(''), r2 = z.n.slice(2).split('');
      const totalH = r1.length*lh + gap + r2.length*lh;
      const y0 = cy - totalH/2;
      let t = '';
      r1.forEach((ch,k)=>{ t += `<text x="${F(cx)}" y="${F(y0+fs*0.82+k*lh)}" text-anchor="middle" font-size="${F(fs)}" font-weight="bold" fill="#3a2320">${ch}</text>`; });
      const divY = y0 + r1.length*lh + gap/2;
      t += `<line x1="${F(cx-fs*0.7)}" y1="${F(divY)}" x2="${F(cx+fs*0.7)}" y2="${F(divY)}" stroke="#3a2320" stroke-width="${F(clamp(fs*0.09,0.5,1.2))}" opacity="0.85"/>`;
      r2.forEach((ch,k)=>{ t += `<text x="${F(cx)}" y="${F(y0+r1.length*lh+gap+fs*0.82+k*lh)}" text-anchor="middle" font-size="${F(fs)}" font-weight="bold" fill="#3a2320">${ch}</text>`; });
      zoneLabels += `<g clip-path="url(#${clipId})">${t}</g>`;
    });

    /* ---------- 天然气管路（黄管） ---------- */
    const YEL = '#F2E27A', YEL_D = '#A98F1E';
    const pw = clamp(K*2.6, 1.8, 5);
    const gasTopY = h*0.27, gasBotY = h*0.73;
    const gasTopX1 = drumL + drumW*0.95, gasBotX1 = drumL + drumW*0.95;
    const dropX = [0.605, 0.785].map(f=>drumL+drumW*f);        // 加热2区、加热4区
    const riseX = [0.515, 0.695, 0.875].map(f=>drumL+drumW*f);  // 加热1、3、5区
    const yLine = (x1,y1,x2,y2)=>`
      <line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}" stroke="${YEL_D}" stroke-width="${F(pw+1.4)}" stroke-linecap="round"/>
      <line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}" stroke="${YEL}" stroke-width="${F(pw)}" stroke-linecap="round"/>`;
    let gas = '';
    // 上管：主横管 + 供加热 2/4 区的下降支管（含切断阀 + 烧嘴）
    gas += yLine(0, gasTopY, gasTopX1, gasTopY);
    dropX.forEach(x=>{
      gas += yLine(x, gasTopY, x, drumTop);
      gas += yLine(x-pw*1.5, gasTopY, x+pw*1.5, gasTopY);
      gas += `<rect x="${F(x-pw*1.5)}" y="${F(gasTopY+pw*0.6)}" width="${F(pw*3)}" height="${F(pw*1.6)}" rx="1" fill="${YEL}" stroke="${YEL_D}" stroke-width="0.6"/>`;
      gas += `<rect x="${F(x-pw*1.7)}" y="${F(drumTop-pw*0.9)}" width="${F(pw*3.4)}" height="${F(pw*1.5)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
    });
    // 下管：主横管 + 供加热 1/3/5 区的上升支管（含切断阀 + 烧嘴）
    gas += yLine(0, gasBotY, gasBotX1, gasBotY);
    riseX.forEach(x=>{
      gas += yLine(x, gasBotY, x, drumBot);
      gas += yLine(x-pw*1.5, gasBotY, x+pw*1.5, gasBotY);
      gas += `<rect x="${F(x-pw*1.5)}" y="${F(gasBotY-pw*2.2)}" width="${F(pw*3)}" height="${F(pw*1.6)}" rx="1" fill="${YEL}" stroke="${YEL_D}" stroke-width="0.6"/>`;
      gas += `<rect x="${F(x-pw*1.7)}" y="${F(drumBot-pw*0.6)}" width="${F(pw*3.4)}" height="${F(pw*1.5)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
    });

    /* ---------- 窑尾罩（左）+ 进料 + 烟气 ---------- */
    const hoodL = w*0.057, hoodW = drumL-hoodL;
    const hoodTop = cy - R*1.28, hoodH = R*2.56, hoodBot = hoodTop+hoodH;
    const hoodIn = clamp(K*2, 1, 4);
    const chuteH = clamp(R*0.5, 6, 20);
    const flueCX = hoodL + hoodW/2, flueW = clamp(R*0.42, 6, 16), flueTopY = h*0.10;
    const tailHood = `
      <rect x="0" y="${F(cy-chuteH/2)}" width="${F(hoodL)}" height="${F(chuteH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(hoodL)}" y="${F(hoodTop)}" width="${F(hoodW)}" height="${F(hoodH)}" rx="${F(clamp(K*2,1,4))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.3"/>
      <rect x="${F(hoodL+hoodIn)}" y="${F(hoodTop+hoodIn)}" width="${F(Math.max(1,hoodW-2*hoodIn))}" height="${F(hoodH-2*hoodIn)}" rx="1" fill="#12162b" opacity="0.5"/>
      <rect x="${F(flueCX-flueW/2)}" y="${F(flueTopY)}" width="${F(flueW)}" height="${F(Math.max(1,hoodTop-flueTopY))}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(flueCX-flueW*0.75)}" y="${F(flueTopY-clamp(K*3,1.5,5))}" width="${F(flueW*1.5)}" height="${F(clamp(K*3,1.5,5))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

    /* ---------- 窑头罩（右）+ 出料溜槽 + 燃烧器 ---------- */
    const headL = drumR, headR = w*0.95, headW = headR-headL;
    const headIn = clamp(K*2, 1, 4);
    const outletY = h*0.86, outPipeH = clamp(R*0.42, 6, 18);
    const burnerR = clamp(R*0.16, 3, 8);
    const burnEndX = w*0.9713, burnFlW = clamp(K*5, 3, 7), burnFlH = clamp(burnerR*2.8, 6, 16);
    const burnX0 = headR + clamp(K*6, 3, 9);
    const outElbowX = w*0.965;
    const headHood = `
      <rect x="${F(headL)}" y="${F(hoodTop)}" width="${F(headW)}" height="${F(hoodH)}" rx="${F(clamp(K*2,1,4))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.3"/>
      <rect x="${F(headL+headIn)}" y="${F(hoodTop+headIn)}" width="${F(Math.max(1,headW-2*headIn))}" height="${F(hoodH-2*headIn)}" rx="1" fill="#12162b" opacity="0.5"/>
      <path d="M ${F(headL+headW*0.22)} ${F(hoodBot)} L ${F(headL+headW*0.60)} ${F(hoodBot)} L ${F(outElbowX)} ${F(outletY-outPipeH/2)} L ${F(w)} ${F(outletY-outPipeH/2)} L ${F(w)} ${F(outletY+outPipeH/2)} L ${F(outElbowX-clamp(K*6,3,10))} ${F(outletY+outPipeH/2)} L ${F(headL+headW*0.22)} ${F(hoodBot+outPipeH)} Z" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
      <rect x="${F(headR)}" y="${F(cy-burnerR*1.5)}" width="${F(burnX0-headR)}" height="${F(burnerR*3)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${F(burnX0-burnerR)}" y="${F(cy-burnerR)}" width="${F(Math.max(1,burnEndX-burnX0+burnerR))}" height="${F(burnerR*2)}" rx="${F(clamp(burnerR*0.4,1,3))}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(burnEndX-burnFlW)}" y="${F(cy-burnFlH/2)}" width="${F(burnFlW)}" height="${F(burnFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>`;

    /* ---------- 火焰（窑头侧，筒内，三层叠加） ---------- */
    const flameStartX = drumR - drumW*0.02, flameLen = drumW*0.26, flameR = R*0.45;
    let flames = '';
    for(let fi=0; fi<3; fi++){
      const fBaseY = cy+(fi-1)*R*0.1, fDelay = -(fi*0.4).toFixed(2);
      let fl=[], ft=[], fr=[], fo=[];
      for(let k=0;k<=16;k++){
        const t=k/16;
        fl.push((flameStartX-t*flameLen-Math.sin(t*4+fi)*flameLen*0.04).toFixed(1));
        ft.push((fBaseY+Math.sin(t*3+fi*1.5)*flameR*0.4*(1-t*0.5)).toFixed(1));
        fr.push((flameR-t*flameR*0.7).toFixed(1)); fo.push((0.85-t*0.68).toFixed(2));
      }
      flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.7}" fill="#ff6a10" opacity="${fo[0]}" clip-path="url(#${clipInId})">
        <animate attributeName="cx" values="${fl.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${ft.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
        <animate attributeName="rx" values="${fr.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="${fo.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/></ellipse>`;
    }
    for(let fi=0; fi<2; fi++){
      const fBaseY = cy+(fi-0.5)*R*0.08, fDelay = -(fi*0.3+0.2).toFixed(2);
      let fl=[], ft=[], fr=[], fo=[];
      for(let k=0;k<=12;k++){
        const t=k/12;
        fl.push((flameStartX-t*flameLen*0.72-Math.sin(t*5+fi)*flameLen*0.03).toFixed(1));
        ft.push((fBaseY+Math.sin(t*4+fi)*flameR*0.25*(1-t*0.4)).toFixed(1));
        fr.push((flameR*0.55-t*flameR*0.38).toFixed(1)); fo.push((0.95-t*0.7).toFixed(2));
      }
      flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.6}" fill="#ffdd44" opacity="${fo[0]}" clip-path="url(#${clipInId})">
        <animate attributeName="cx" values="${fl.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${ft.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
        <animate attributeName="rx" values="${fr.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="${fo.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/></ellipse>`;
    }
    {
      let fl=[], ft=[], fr=[], fo=[];
      for(let k=0;k<=12;k++){
        const t=k/12;
        fl.push((flameStartX-t*flameLen*0.42-Math.sin(t*6)*flameLen*0.02).toFixed(1));
        ft.push((cy+Math.sin(t*4)*flameR*0.12).toFixed(1));
        fr.push((flameR*0.3-t*flameR*0.22).toFixed(1)); fo.push((1-t*0.75).toFixed(2));
      }
      flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.75}" fill="#fff6c8" opacity="${fo[0]}" clip-path="url(#${clipInId})">
        <animate attributeName="cx" values="${fl.join(';')}" dur="1.1s" begin="-0.1s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${ft.join(';')}" dur="1.1s" begin="-0.1s" repeatCount="indefinite"/>
        <animate attributeName="rx" values="${fr.join(';')}" dur="1.1s" begin="-0.1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="${fo.join(';')}" dur="1.1s" begin="-0.1s" repeatCount="indefinite"/></ellipse>`;
    }

    /* ---------- 轮带（2 道，压在托轮上方） ---------- */
    const tireXs = [0.47, 0.74].map(f=>drumL+drumW*f);
    const tireRx = clamp(R*0.15, 3, 9), tireOut = clamp(R*0.10, 2, 6);
    let tires = '';
    tireXs.forEach(tx=>{
      tires += `<ellipse cx="${F(tx)}" cy="${F(cy)}" rx="${F(tireRx)}" ry="${F(R+tireOut)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.3"/>
        <ellipse cx="${F(tx)}" cy="${F(cy)}" rx="${F(tireRx*0.45)}" ry="${F(R+R*0.3)}" fill="#12162b" opacity="0.45"/>`;
    });

    /* ---------- 托轮组 + 轴承座（位于筒体下方，天然气下管之上） ---------- */
    const rollerCY = drumBot + R*0.30, rollerR = clamp(R*0.20, 3, 9);
    const rollOff = R*0.34, rollGap = clamp(K*2, 1, 3);
    let supports = '';
    tireXs.forEach(tx=>{
      const bearW = rollerR*2.4, bearH = clamp(rollerR*0.9, 3, 10), bearY = rollerCY+rollerR;
      supports += `<circle cx="${F(tx-rollOff)}" cy="${F(rollerCY)}" r="${F(rollerR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <circle cx="${F(tx+rollOff)}" cy="${F(rollerCY)}" r="${F(rollerR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <circle cx="${F(tx-rollOff)}" cy="${F(rollerCY)}" r="${F(rollerR*0.28)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <circle cx="${F(tx+rollOff)}" cy="${F(rollerCY)}" r="${F(rollerR*0.28)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${F(tx-bearW/2)}" y="${F(bearY)}" width="${F(bearW)}" height="${F(bearH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(tx-bearW/2-rollGap)}" y="${F(bearY+bearH)}" width="${F(bearW+2*rollGap)}" height="${F(clamp(bearH*0.5,2,5))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;
    });

    /* ---------- 物料颗粒（筒底滚动） ---------- */
    const matInset = clamp(drumW*0.04, 5, 20);
    const matR0 = clamp(K*1.2, 0.8, 2);
    let material = '';
    for(let i=0;i<10;i++){
      const delay = -(i/10*8).toFixed(2);
      let px=[], py=[], pr=[];
      for(let k=0;k<=32;k++){
        const t=k/32, x=drumL+matInset+t*(drumW-2*matInset);
        const ph=(t*3.5)%1;
        let bedY;
        if(ph<0.55) bedY=cy+R*0.58;
        else if(ph<0.85){ const lt=(ph-0.55)/0.3; bedY=cy+R*0.58-R*0.45*Math.sin(lt*Math.PI); }
        else { const ft=(ph-0.85)/0.15; bedY=cy+R*0.58-R*0.25+ft*R*0.25; }
        px.push(x.toFixed(1)); py.push((bedY+Math.sin(t*8+i)*clamp(K*2,1,4)).toFixed(1)); pr.push((matR0+Math.sin(t*6)*clamp(K*0.4,0.25,0.8)).toFixed(1));
      }
      material += `<circle cx="${px[0]}" cy="${py[0]}" r="${pr[0]}" fill="${c}" opacity="0.7" clip-path="url(#${clipInId})">
        <animate attributeName="cx" values="${px.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${py.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
        <animate attributeName="r" values="${pr.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
    }

    /* ---------- 测温点（上 11 点：标签 + 实时读数 + 引线） ---------- */
    const labelFs = clamp(h*0.036, 6, 14), valFs = clamp(h*0.038, 6, 15);
    let tempTop = '';
    tps.forEach((pt,i)=>{
      const f = tps.length > 1 ? i/(tps.length-1) : 0;
      const cx = drumL + drumW*f;
      const lab = (pt && pt.label) || RK3_TEMP_LABELS[i] || ((i+1)+'#温度');
      const val = (pt && pt.value!=null && pt.value!=='') ? pt.value : '--';
      tempTop += `<line x1="${F(cx)}" y1="${F(h*0.125)}" x2="${F(cx)}" y2="${F(drumTop)}" stroke="${c}" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.4"/>
        <text class="kiln-temp-lab" x="${F(cx)}" y="${F(h*0.045)}" text-anchor="middle" font-size="${F(labelFs)}" fill="${c}">${xesc(lab)}</text>
        <text class="kiln-temp-val" data-kidx="${i}" x="${F(cx)}" y="${F(h*0.10)}" text-anchor="middle" font-size="${F(valFs)}" font-weight="bold" fill="#e8f6ff">${xesc(val)}</text>`;
    });

    /* ---------- 分温区读数（下 8 区） ---------- */
    const zts = (p && Array.isArray(p.zoneTemps)) ? p.zoneTemps : [];
    let tempBottom = '';
    zones.forEach((z,i)=>{
      const cx = drumL + drumW*z.cx;
      const val = (zts[i] && zts[i].value!=null && zts[i].value!=='') ? zts[i].value : '--';
      tempBottom += `<text class="kiln-zone-val" data-zoneidx="${i}" x="${F(cx)}" y="${F(h*0.82)}" text-anchor="middle" font-size="${F(valFs)}" font-weight="bold" fill="#e8f6ff">${xesc(val)}</text>`;
    });

    return `
      ${metalDef}${metalVDef}${drumDef}${tempGrad}${clipDef}${clipInDef}
      ${supports}
      ${gas}
      ${drumBody}
      ${tempOverlay}
      ${material}${flames}
      ${zoneLines}${zoneLabels}
      ${tires}
      ${tailHood}
      ${headHood}
      ${tempTop}
      ${tempBottom}
    `;
  }
};
