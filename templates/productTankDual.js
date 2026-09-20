/* ============================================================
 * PFD Editor · 组件模板：productTankDual（双格成品储罐）
 *   形制（对齐现场流程图上的双格成品储罐）：一套罐身 + 一套锥底，中间一道隔板
 *   自罐顶贯通到锥底平底，把罐子分成左右两格（如「1#成品储罐 / 不合格品储罐」）；
 *   两格各自进料、各自出料。罐身 : 锥底 = 0.50 : 0.50，锥底平底宽 0.25w（现场图实测）。
 *   画法与配色与 productTank / silo / storageSilo 家族完全一致：
 *     罐顶法兰圈（均布螺栓）→ 筒锥连接法兰圈（螺栓）→ 罐身把合法兰条（螺栓）
 *     → 锥体加强环（沿锥面收窄的梯形带）→ 两格底部出料接管（锥底对接法兰 +
 *     金属管壁 + 深色管腔 + 端面法兰 + 螺栓）→ 中隔板 → 两格外侧壁板式液位计
 *     → 两格格内标注。
 *   细节落位：罐身中上部被两格文字占满，故把合条只压一道在标注下方，
 *     其余五金件放在罐顶、锥面、锥底与两格外侧壁（液位计让开文字 12% 留白）。
 *   格内标注：格名称（超宽自动折两行居中）+ 格位号，画在罐身内，
 *     取值见 productTankDualCells（props.cellAName / cellATag / cellBName / cellBTag）。
 *   渐变：罐身与锥底共用一条 gradientUnits="userSpaceOnUse" 的横向渐变（按组件宽度铺开，
 *     两格配色连续、锥体收窄不重算）；竖直接管另用 objectBoundingBox 渐变取圆柱面明暗。
 *   端口：topA(0.25w,0) / topB(0.75w,0) 两格进料 · bottomA(0.415w,h) / bottomB(0.585w,h) 两格出料
 * ============================================================ */

TEMPLATES.productTankDual = {
    name: '双格成品储罐', category: '储存与反应',
    defaultSize: { w: 110, h: 124 },
    ports: [
      {id:'topA',   x:.25,  y:0, dir:'up'},
      {id:'topB',   x:.75,  y:0, dir:'up'},
      {id:'bottomA',x:.415, y:1, dir:'down'},
      {id:'bottomB',x:.585, y:1, dir:'down'}
    ],
    render: (w,h,p)=>{
      const gm = productTankDualGeom(w,h);
      const cell = productTankDualCells(p);
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'ptd_metal_'+uid, pipeVId = 'ptd_pipev_'+uid;
      const f = n => Number(n).toFixed(2);
      const cx = w/2;
      const coneL = cx - gm.coneBotW/2, coneR = cx + gm.coneBotW/2;
      // 模板内自带的转义（不依赖 editor.js 的 esc，属性面板外的调用路径也安全）
      const escT = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

      // 螺栓：深色六角底 + 高光内芯（与 silo / bucketElevator 同一画法）
      const bolt = (bx,by)=>
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(gm.boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>` +
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(gm.boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;

      // 1. 罐身（矩形段）与锥底：两格共用同一条横向金属渐变，整体仍是一台设备
      const body = `<rect x="0" y="${f(gm.shellTop)}" width="${f(w)}" height="${f(gm.bodyH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>`;
      const cone = `<polygon points="0,${f(gm.bodyBot)} ${f(w)},${f(gm.bodyBot)} ${f(coneR)},${f(gm.coneBotY)} ${f(coneL)},${f(gm.coneBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>`;

      // 2. 罐顶法兰圈（两格共用顶盖）+ 均布螺栓
      const rim = `<rect x="0" y="0" width="${f(w)}" height="${f(gm.rimH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const rimBolts = [0.10,0.37,0.63,0.90].map(u=>bolt(w*u, gm.rimH*0.5)).join('');

      // 3. 筒锥连接法兰圈（罐身/锥底对接）+ 螺栓
      const collar = `<rect x="0" y="${f(gm.bodyBot-gm.collarH/2)}" width="${f(w)}" height="${f(gm.collarH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const collarBolts = bolt(w*0.12, gm.bodyBot) + bolt(w*0.88, gm.bodyBot);

      // 4. 罐身把合法兰条：格内文字占满罐身中上部，故只压一道在标注下方的空档里 + 两端螺栓
      const jointY = gm.shellTop + gm.bodyH*gm.stripPos;
      const joint =
        `<rect x="0" y="${f(jointY-gm.stripH/2)}" width="${f(w)}" height="${f(gm.stripH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
        bolt(w*0.12, jointY) + bolt(w*0.88, jointY);

      // 5. 锥体加强环：按锥面宽度裁成梯形，贴着锥壁走，组件缩放时不会翘出锥面
      const ringY = gm.bodyBot + gm.coneH*gm.ringPos;
      const halfAt = y => Math.max(0, gm.coneBotW/2 + (w-gm.coneBotW)/2*(gm.coneBotY-y)/gm.coneH - 0.6);
      const coneRing = `<polygon points="${f(cx-halfAt(ringY-gm.ringH/2))},${f(ringY-gm.ringH/2)} ${f(cx+halfAt(ringY-gm.ringH/2))},${f(ringY-gm.ringH/2)} ${f(cx+halfAt(ringY+gm.ringH/2))},${f(ringY+gm.ringH/2)} ${f(cx-halfAt(ringY+gm.ringH/2))},${f(ringY+gm.ringH/2)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // 6. 两格各自的底部出料接管（锥底连接法兰 / 管壁 / 深色管腔 / 端面法兰 / 螺栓）
      const outWall = Math.max(0.7, Math.min(1.6, gm.outW*0.18));
      const outlet = (ocx)=>{
        const ox = ocx - gm.outW/2;
        const nozFlH = Math.max(1, Math.min(gm.stripH*0.7, gm.outH*0.32));
        return `<rect x="${f(ox)}" y="${f(gm.coneBotY)}" width="${f(gm.outW)}" height="${f(gm.outH)}" fill="url(#${pipeVId})" stroke="#3f445c" stroke-width="0.9"/>` +
          `<rect x="${f(ox+outWall)}" y="${f(gm.coneBotY)}" width="${f(Math.max(0.1, gm.outW-outWall*2))}" height="${f(Math.max(0, gm.outH-outWall*0.6))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` +
          // 锥底与出料管的对接法兰（压在锥底平底上）
          `<rect x="${f(ox-gm.flW*0.8)}" y="${f(gm.coneBotY)}" width="${f(gm.outW+gm.flW*1.6)}" height="${f(nozFlH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
          // 管口端面法兰 + 两颗法兰螺栓
          `<rect x="${f(ox-gm.flW)}" y="${f(h-gm.flH)}" width="${f(gm.outW+gm.flW*2)}" height="${f(gm.flH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
          bolt(ox-gm.flW*0.5, h-gm.flH*0.5) + bolt(ox+gm.outW+gm.flW*0.5, h-gm.flH*0.5);
      };
      const outlets = outlet(cx - gm.outOff) + outlet(cx + gm.outOff);

      // 7. 中隔板：自罐顶法兰下沿直落锥底平底，贯通罐身与锥底（现场图里这道线是通到底的）
      const divider = `<line x1="${f(cx)}" y1="${f(gm.shellTop)}" x2="${f(cx)}" y2="${f(gm.coneBotY)}" stroke="#3f445c" stroke-width="${f(gm.divW)}" opacity="0.9"/>`;

      // 8. 两格外侧壁的板式液位计：深色表体 + 刻度线 + 高光边（画在各自远离中隔板的一侧）
      const gauge = (gx)=>{
        const gy0 = gm.shellTop + Math.max(2, gm.bodyH*0.06);
        const gy1 = gm.bodyBot - Math.max(2, gm.bodyH*0.06);
        const nTick = Math.max(3, Math.round((gy1-gy0)/Math.max(4, gm.bodyH*0.16)));
        let ticks = '';
        for(let i=1;i<nTick;i++){
          const ty = gy0 + (gy1-gy0)*i/nTick;
          ticks += `<line x1="${f(gx+gm.gaugeW*0.22)}" y1="${f(ty)}" x2="${f(gx+gm.gaugeW*0.78)}" y2="${f(ty)}"/>`;
        }
        return `<rect x="${f(gx)}" y="${f(gy0)}" width="${f(gm.gaugeW)}" height="${f(gy1-gy0)}" rx="0.8" fill="#1a1f33" stroke="#3a4060" stroke-width="0.8"/>` +
          `<g stroke="#8e96b6" stroke-width="0.5" opacity="0.85">${ticks}</g>` +
          `<line x1="${f(gx+gm.gaugeW*0.22)}" y1="${f(gy0+1)}" x2="${f(gx+gm.gaugeW*0.22)}" y2="${f(gy1-1)}" stroke="#c9cde6" stroke-width="0.5" opacity="0.35"/>`;
      };
      const gauges = gauge(gm.gaugePad) + gauge(w - gm.gaugePad - gm.gaugeW);

      // 6. 两格格内标注：名称（超宽折两行）+ 位号，居中画在本格罐身内
      const label = (ccx, cellW, name, tag)=>{
        const maxW = cellW*0.76;                                          // 格内可用文字宽（两侧各留 12%，让开外侧液位计）
        const fsN0 = Math.max(6, Math.min(w*0.095, 15));
        const fit = productTankDualFit(name, maxW, fsN0, 2);
        const fsN = fit.fs, lines = fit.lines;
        const lineH = fsN*1.30;
        const top = gm.shellTop + gm.bodyH*0.36 - lines.length*lineH/2;   // 名称块垂直中心 = 罐身 36% 处
        const spans = lines.map((ln,i)=>
          `<tspan x="${f(ccx)}" y="${f(top + fsN*0.82 + i*lineH)}">${escT(ln)}</tspan>`).join('');
        const nameEl = lines.length
          ? `<text text-anchor="middle" font-family="inherit" font-size="${f(fsN)}" font-weight="700" fill="#12162b">${spans}</text>` : '';
        // 位号：同宽约束，超宽按比例缩字号
        const tagS = String(tag==null?'':tag).trim();
        let tagEl = '';
        if(tagS){
          const fsT0 = fsN*0.78, wT = productTankDualTextW(tagS, fsT0);
          const fsT = wT > maxW ? Math.max(4.5, fsT0*maxW/wT) : fsT0;
          tagEl = `<text x="${f(ccx)}" y="${f(gm.shellTop + gm.bodyH*0.74)}" text-anchor="middle" font-family="inherit" font-size="${f(fsT)}" font-weight="600" fill="#1d2135">${escT(tagS)}</text>`;
        }
        return nameEl + tagEl;
      };
      const labels =
        label(cx*0.5, cx, cell.aName, cell.aTag) +
        label(cx*1.5, cx, cell.bName, cell.bTag);

      return `
      <defs>
        <!-- 罐身/锥底共用：按组件宽度铺开的横向渐变（两格配色连续、锥体收窄不重算） -->
        <linearGradient id="${metalId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(w)}" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <!-- 竖直接管用：横向明暗取圆柱面高光（objectBoundingBox，随管径自适应） -->
        <linearGradient id="${pipeVId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      <!-- 1. 罐身 + 锥底（两格共用的金属壳体） -->
      ${body}
      ${cone}
      <!-- 2. 罐顶法兰圈 + 均布螺栓 -->
      ${rim}
      ${rimBolts}
      <!-- 3. 筒锥连接法兰圈 + 螺栓 -->
      ${collar}
      ${collarBolts}
      <!-- 4. 罐身把合法兰条（压在格内标注下方）+ 螺栓 -->
      ${joint}
      <!-- 5. 锥体加强环（沿锥面收窄的梯形带） -->
      ${coneRing}
      <!-- 6. 两格底部出料接管（锥底对接法兰 / 管腔 / 端面法兰 / 螺栓） -->
      ${outlets}
      <!-- 7. 中隔板（贯通罐身与锥底） -->
      ${divider}
      <!-- 8. 两格外侧壁板式液位计 -->
      ${gauges}
      <!-- 9. 两格格内标注（名称 / 位号） -->
      ${labels}`;
    }
};


/* ============================================================
 * 双格成品储罐（productTankDual）几何：相对组件 w/h 推导。
 *   纵向自上而下：罐顶法兰圈 rimH → 罐身 bodyH → 筒锥连接法兰圈 collarH → 锥底 coneH → 出料接管 outH。
 *   罐身 : 锥底 = 0.50 : 0.50（现场图实测 102 : 102），锥底平底宽 0.25w；
 *   两格出料管口径各 0.075w、中心距中隔板 outOff = 0.085w —— 两根管连同端面法兰
 *   都落在 0.25w 的锥底平底范围内且互不干涉；五金件一律定尺封顶。
 * ============================================================ */
function productTankDualGeom(w,h){
  const outH    = Math.max(0, Math.min(h*0.075, 14));            // 底部出料接管总高（含端面法兰）
  const rimH    = Math.max(2.4, Math.min(6, h*0.030));           // 罐顶法兰圈厚
  const shellTop = rimH;                                         // 罐身顶（罐顶法兰下沿）
  const shellH  = Math.max(4, h - outH - rimH);                  // 罐身 + 锥底可用高
  const bodyH   = shellH*0.50;                                   // 罐身（矩形段）高
  const bodyBot = shellTop + bodyH;                              // 罐身下沿 = 锥顶（筒锥法兰圈所在）
  const coneBotY = shellTop + shellH;                            // 锥底平底（出料接管顶面）
  const coneH   = coneBotY - bodyBot;                            // 锥底高
  const coneBotW = w*0.25;                                       // 锥底平底宽
  const outW    = w*0.075;                                       // 单格出料管口径
  const outOff  = w*0.085;                                       // 出料管中心距中隔板的偏移
  const collarH = Math.max(1.6, Math.min(3.6, shellH*0.024));     // 筒锥连接法兰圈厚
  const stripH  = Math.max(1.4, Math.min(2.8, bodyH*0.060));      // 罐身把合法兰条厚
  const stripPos = 0.88;                                          // 把合条位置（罐身高比例，压在格内位号下方）
  const ringH   = Math.max(1.2, Math.min(2.8, coneH*0.045));      // 锥体加强环厚
  const ringPos = 0.34;                                           // 加强环位置（锥高比例，自锥顶往下）
  const gaugeW  = Math.max(2.2, Math.min(5.5, w*0.045));          // 液位计表体宽
  const gaugePad = Math.max(1, w*0.014);                          // 液位计距组件侧边
  const divW    = Math.max(1, Math.min(1.8, w*0.012));            // 中隔板线宽（定尺封顶）
  const boltR   = Math.max(0.8, Math.min(1.6, w*0.018));          // 螺栓半径
  const flH     = Math.max(1.2, Math.min(3, h*0.020));            // 端面法兰厚
  const flW     = Math.max(0.8, Math.min(1.6, w*0.020));          // 端面法兰单边加宽
  return {
    rimH, shellTop, shellH, bodyH, bodyBot, coneBotY, coneH, coneBotW,
    outH, outW, outOff, collarH, stripH, stripPos, ringH, ringPos, gaugeW, gaugePad, divW, boltR, flH, flW
  };
}

/* 两格标注默认值（属性面板 normalizeDualTankProps 与模板渲染共用同一份） */
function productTankDualDefaults(){
  return { cellAName:'1#成品储罐', cellATag:'V0301', cellBName:'不合格品储罐', cellBTag:'V0302' };
}
/* 取两格标注：props 里未设置(undefined)时用默认值；显式清空('')则留空不画 */
function productTankDualCells(props){
  const d = productTankDualDefaults(), o = props || {};
  const pick = k => (o[k]===undefined ? d[k] : String(o[k]));
  return { aName: pick('cellAName'), aTag: pick('cellATag'), bName: pick('cellBName'), bTag: pick('cellBTag') };
}
/* 文本估宽：SVG 里量不到字宽，按 CJK/全角 1em、ASCII 0.56em 估算 */
function productTankDualTextW(str, fs){
  return Array.from(String(str==null?'':str))
    .reduce((n,ch)=> n + (/[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 1 : 0.56) * fs, 0);
}

/* 折行 + 自适应字号，返回 {lines, fs}：
 *   - 文本里的 | 作显式断行符（如「1#成品|储罐」），按用户给的断，不再自动折；
 *   - 无断行符时按宽度贪心折行，最多 maxLines 行，画不完在末行加省略号；
 *   - 折成两行而第二行只剩一个字时，从第一行挪一个过来，避免出现「孤字行」
 *     （「1#成品储 / 罐」→「1#成品 / 储罐」）；
 *   - 任一行仍超出可用宽度时整体缩字号（下限 5px），保证不会串到相邻格。
 */
function productTankDualFit(text, maxW, fs, maxLines){
  const raw = String(text==null?'':text).trim();
  if(!raw) return { lines:[], fs };
  const parts = raw.split('|').map(s=>s.trim()).filter(s=>s);
  let lines;
  if(parts.length > 1){
    lines = parts.slice(0, maxLines);                     // 显式断行：尊重用户给的断法
  } else {
    lines = []; let cur = '';
    for(const ch of Array.from(raw)){
      if(cur && productTankDualTextW(cur + ch, fs) > maxW){
        lines.push(cur); cur = '';
        if(lines.length >= maxLines) break;
      }
      cur += ch;
    }
    if(lines.length < maxLines && cur) lines.push(cur);
    if(lines.length === 2){
      const a = Array.from(lines[0]), b = Array.from(lines[1]);
      if(b.length === 1 && a.length > 1){ lines[0] = a.slice(0,-1).join(''); lines[1] = a[a.length-1] + lines[1]; }
    }
    const drawn = lines.join('').length;
    if(drawn < raw.length && lines.length) lines[lines.length-1] = Array.from(lines[lines.length-1]).slice(0,-1).join('') + '…';
  }
  const widest = lines.reduce((m,s)=>Math.max(m, productTankDualTextW(s, fs)), 0);
  return { lines, fs: widest > maxW ? Math.max(5, fs*maxW/widest) : fs };
}
