/* ============================================================
 * PFD Editor · 组件模板：storageSilo（储料仓）
 *   由 reactor（反应釜）复制而来，仅改名——罐体、接管、液位读数带与
 *   液位动态绑定（props.levelTag / levelMax）完全沿用反应釜的画法与行为。
 *   独立几何：storageSiloGeom（与 reactorGeom 各自演化，互不影响）。
 *   液位换算仍共用 reactorLevelFrac / reactorLevelText（纯数值换算，与几何无关）。
 *   液位 DOM 沿用 .rv-liquid / .rv-liquid-dots / .rv-surface / .rv-band 类名，
 *   由 editor.js / preview.html 的 refreshReactorLevel 统一刷新（按 comp.type 选几何）。
 * ============================================================ */

TEMPLATES.storageSilo = {
    name: '储料仓', category: '设备',
    defaultSize: { w: 96, h: 190 },
    ports: [
      {id:'top',x:.5,y:0,dir:'up'},
      {id:'side',x:1,y:.38,dir:'right'},
      {id:'bottom',x:.5,y:1,dir:'down'}
    ],
    render: (w,h,p)=>{
      const gm = storageSiloGeom(w,h);
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'ss_clip_'+uid, metalId = 'ss_metal_'+uid, liqId = 'ss_liq_'+uid, dotId = 'ss_dot_'+uid;
      const cx = w/2;
      // 液位取值：绑定 levelTag 时读实时缓存；未绑定 / 无数据按 60% 静态示意（读数显示 --）
      const live = (typeof sensorValueMap!=='undefined' && p.levelTag) ? sensorValueMap[p.levelTag] : null;
      const rd = reactorLevelText(live);
      const frac = reactorLevelFrac(live ? live.value : NaN, p.levelMax);
      const f = (frac==null) ? 0.6 : frac;
      const surfaceY = gm.bodyBot - (gm.bodyBot - gm.bodyTop) * f;
      const liqH = Math.max(0, gm.bodyBot - surfaceY);
      const coneTopY = gm.bodyBot + gm.collarH;   // 法兰颈下沿 = 锥底顶边
      const nozzleW = w*0.32, sideY = 0.38*h;
      return `
      <defs>
        <clipPath id="${clipId}"><rect x="${gm.bodyX}" y="${gm.bodyTop}" width="${gm.bodyW}" height="${gm.bodyBot-gm.bodyTop}" rx="2"/></clipPath>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${liqId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFB457"/><stop offset="1" stop-color="#ED7A0F"/>
        </linearGradient>
        <pattern id="${dotId}" patternUnits="userSpaceOnUse" width="5" height="5">
          <circle cx="1.3" cy="1.3" r="0.85" fill="#FFE0AE" opacity="0.55"/>
          <circle cx="3.8" cy="3.8" r="0.85" fill="#FFC072" opacity="0.45"/>
        </pattern>
      </defs>
      <rect x="${gm.bodyX}" y="0" width="${gm.bodyW}" height="${gm.rimH}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${gm.bodyX}" y="${gm.bodyTop}" width="${gm.bodyW}" height="${gm.bodyBot-gm.bodyTop}" rx="2" fill="#12162b"/>
      <g clip-path="url(#${clipId})">
        <rect class="rv-liquid" x="${gm.bodyX}" y="${surfaceY}" width="${gm.bodyW}" height="${liqH}" fill="url(#${liqId})"/>
        <rect class="rv-liquid-dots" x="${gm.bodyX}" y="${surfaceY}" width="${gm.bodyW}" height="${liqH}" fill="url(#${dotId})"/>
        <line class="rv-surface" x1="${gm.bodyX}" x2="${gm.bodyX+gm.bodyW}" y1="${surfaceY}" y2="${surfaceY}" stroke="#FFE3B0" stroke-width="1.2" opacity="0.8"/>
      </g>
      <rect x="${gm.bodyX}" y="${gm.bodyTop}" width="${gm.bodyW}" height="${gm.bodyBot-gm.bodyTop}" rx="2" fill="none" stroke="#6a7192" stroke-width="1"/>
      <rect x="${gm.bodyX+gm.bodyW}" y="${sideY-h*0.012}" width="${w*0.08}" height="${h*0.024}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.7"/>
      <rect x="${gm.bodyX}" y="${gm.bodyBot}" width="${gm.bodyW}" height="${gm.collarH}" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
      <polygon points="${gm.bodyX},${coneTopY} ${gm.bodyX+gm.bodyW},${coneTopY} ${cx+nozzleW/2},${gm.coneBotY} ${cx-nozzleW/2},${gm.coneBotY}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${cx-nozzleW/2}" y="${gm.coneBotY}" width="${nozzleW}" height="${gm.nozzleH}" fill="#1d2135" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${cx-w*0.05}" y="${gm.coneBotY+gm.nozzleH}" width="${w*0.10}" height="${gm.pipeH}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
      <g class="rv-band" transform="translate(0,${surfaceY})">
        <rect x="${gm.bandX}" y="${-gm.bandH/2}" width="${gm.bandW}" height="${gm.bandH}" rx="${gm.bandH*0.14}" fill="#0a0e1e" opacity="0.86" stroke="#FF9A2E" stroke-width="1"/>
        <text x="${cx}" y="${(gm.fs*0.36).toFixed(1)}" text-anchor="middle" font-family="inherit"><tspan class="rv-level-value" fill="#FFA33C" font-size="${gm.fs.toFixed(1)}" font-weight="700" style="font-variant-numeric:tabular-nums">${rd.text}</tspan><tspan class="rv-level-unit" fill="#c9cde6" font-size="${(gm.fs*0.62).toFixed(1)}" dx="2">${rd.unit}</tspan></text>
      </g>`;
    }
};


/* ============================================================
 * 储料仓（storageSilo）几何：相对组件 w/h 推导，各段高度占比与 reactor 原始版一致。
 *   editor.js / preview.html 的 refreshReactorLevel 按 comp.type 选择本函数或 reactorGeom。
 * ============================================================ */
function storageSiloGeom(w,h){
  const rimH    = Math.max(4, h*0.045);   // 顶部法兰盘
  const collarH = Math.max(5, h*0.042);   // 罐底法兰颈
  const coneH   = h*0.21;                 // 锥底
  const nozzleH = h*0.035;                // 出料口
  const pipeH   = h*0.065;                // 底部接管
  const bodyX = 0, bodyW = w;             // 罐体与上下法兰同宽
  const bodyTop = rimH;                   // 罐体紧贴法兰下沿，无缝衔接
  const coneBotY = h - nozzleH - pipeH;
  const bodyBot = coneBotY - coneH - collarH;
  const bandH = Math.max(13, h*0.105);    // 液位读数带高度
  const bandPad = w*0.14;                 // 读数带与罐体边缘的留白
  return {
    rimH, collarH, coneH, nozzleH, pipeH, bodyX, bodyW, bodyTop, bodyBot, coneBotY, bandH,
    bandX: bodyX + bandPad, bandW: bodyW - bandPad*2,
    fs: Math.max(9, Math.min(bandH*0.74, w*0.24))   // 读数字号
  };
}
