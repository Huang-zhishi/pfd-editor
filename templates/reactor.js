/* ============================================================
 * PFD Editor · 组件模板：reactor（反应釜 · 顶部电机驱动搅拌）
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.reactor。
 *   结构（自上而下）：
 *     顶部搅拌驱动装置（立式电机 + 联轴器 + 减速机 + 支座机架）
 *     → 顶盖法兰（一侧带进料接管 top）→ 罐体（内置中心搅拌轴 + 单层桨叶）
 *     → 罐底法兰颈 → 锥底 → 出料口 → 底部接管（bottom）。
 *   动画（运行态 · stripSMIL 可剥）：桨叶绕竖轴旋转（水平向宽窄循环）+ 釜内环流粒子
 *     （左右各一环流胞，沿壁上升、沿轴回落，以液面裁剪窗限位）。
 *   端口：top 移至顶盖一侧（x=0.22，避开顶部电机轴心）· side 右侧 · bottom 底部。
 * ============================================================ */

TEMPLATES.reactor = {
    name: '反应釜', category: '设备',
    defaultSize: { w: 96, h: 190 },
    ports: [
      {id:'top',x:.22,y:0,dir:'up'},
      {id:'side',x:1,y:.38,dir:'right'},
      {id:'bottom',x:.5,y:1,dir:'down'}
    ],
    render: (w,h,p)=>{
      const gm = reactorGeom(w,h);
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'rv_clip_'+uid, metalId = 'rv_metal_'+uid, liqId = 'rv_liq_'+uid, dotId = 'rv_dot_'+uid, flowClipId = 'rv_flow_'+uid;
      const cx = w/2;
      const fr = n => Number(n).toFixed(2);
      const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
      // 液位取值：绑定 levelTag 时读实时缓存；未绑定 / 无数据按 60% 静态示意（读数显示 --）
      const live = (typeof sensorValueMap!=='undefined' && p.levelTag) ? sensorValueMap[p.levelTag] : null;
      const rd = reactorLevelText(live);
      const frac = reactorLevelFrac(live ? live.value : NaN, p.levelMax);
      const f = (frac==null) ? 0.6 : frac;
      const surfaceY = gm.bodyBot - (gm.bodyBot - gm.bodyTop) * f;
      const liqH = Math.max(0, gm.bodyBot - surfaceY);
      const coneTopY = gm.bodyBot + gm.collarH;   // 法兰颈下沿 = 锥底顶边
      const nozzleW = w*0.32, sideY = 0.38*h;
      const driveH = gm.driveH;

      /* —— 顶部搅拌驱动装置：立式电机（顶）→ 联轴器 → 减速机 → 支座机架（坐落顶盖法兰）——
         各段高度按驱动区 driveH 比例分配，小尺寸下等比缩小、不溢出。 */
      const motH = driveH*0.30, gapH = driveH*0.10, gbH = driveH*0.34, brkH = driveH*0.26;
      const motW = w*0.40, gbW = w*0.34, brkBotW = w*0.40, brkTopW = gbW*0.86;
      const motX = cx - motW/2, gbX = cx - gbW/2;
      const motBot = motH, gbTop = motBot + gapH, gbBot = gbTop + gbH;
      let motFins = '';
      for(let i=1;i<=3;i++){
        const fx = motX + motW*i/4;
        motFins += `<line x1="${fr(fx)}" y1="${fr(motH*0.14)}" x2="${fr(fx)}" y2="${fr(motH*0.86)}" stroke="#5b6280" stroke-width="0.9"/>`;
      }
      const motor =
        `<rect x="${fr(motX)}" y="0" width="${fr(motW)}" height="${fr(motH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.1"/>` +
        motFins +
        // 侧置接线盒
        `<rect x="${fr(motX+motW)}" y="${fr(motH*0.30)}" width="${fr(Math.max(1.5,w*0.05))}" height="${fr(motH*0.40)}" rx="1" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>` +
        // 联轴器（电机 → 减速机）
        `<rect x="${fr(cx-w*0.045)}" y="${fr(motBot)}" width="${fr(w*0.09)}" height="${fr(Math.max(0.8,gapH))}" fill="#2b3050" stroke="#6a7192" stroke-width="0.8"/>`;
      const gearbox =
        `<rect x="${fr(gbX)}" y="${fr(gbTop)}" width="${fr(gbW)}" height="${fr(gbH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.1"/>` +
        `<line x1="${fr(gbX+1.5)}" y1="${fr(gbTop+gbH*0.42)}" x2="${fr(gbX+gbW-1.5)}" y2="${fr(gbTop+gbH*0.42)}" stroke="#5b6280" stroke-width="0.8" stroke-dasharray="4 3"/>` +
        `<circle cx="${fr(cx)}" cy="${fr(gbTop+gbH*0.5)}" r="${fr(clamp(gbH*0.16,1,3.4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>`;
      // 支座机架：梯形灯笼架 + 底部安装法兰（压顶盖法兰）
      const brkPlateH = clamp(driveH*0.14, 0.8, 2.4);
      const bracket =
        `<polygon points="${fr(cx-brkTopW/2)},${fr(gbBot)} ${fr(cx+brkTopW/2)},${fr(gbBot)} ${fr(cx+brkBotW/2)},${fr(driveH)} ${fr(cx-brkBotW/2)},${fr(driveH)}" fill="none" stroke="#6a7192" stroke-width="1"/>` +
        `<rect x="${fr(cx-brkBotW/2)}" y="${fr(driveH-brkPlateH)}" width="${fr(brkBotW)}" height="${fr(brkPlateH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      const drive = motor + gearbox + bracket;

      /* —— 中心搅拌轴 + 穿盖轴封 + 单层桨式叶轮（顶部电机经减速机驱动旋转）——
         桨叶贴近罐底、恒没入常态液面；轴自减速机输出端下探至桨叶。 */
      const impY = gm.bodyBot - (gm.bodyBot - gm.bodyTop)*0.14;
      const shaftW = clamp(w*0.035, 1.2, 3.6);
      const shaft = `<rect x="${fr(cx-shaftW/2)}" y="${fr(gbBot)}" width="${fr(shaftW)}" height="${fr(Math.max(1, impY+shaftW*0.5-gbBot))}" fill="#2b3050" stroke="#6a7192" stroke-width="0.7"/>`;
      const sealH = Math.max(1.2, gm.rimH*0.9);
      const seal = `<rect x="${fr(cx-shaftW*2.2)}" y="${fr(gm.bodyTop - sealH*0.5)}" width="${fr(shaftW*4.4)}" height="${fr(sealH)}" rx="1" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>`;
      const padW = gm.bodyW*0.62, padT = clamp(w*0.030, 1.2, 3.2);
      const hubR = clamp(shaftW*1.5, 1.2, 3.4);
      const bladeH = padT*3.4;
      // 桨叶旋转：正面投影下绕竖轴转动 → 水平向宽窄循环（|cosθ| 近似），以桨心为缩放基点；
      // 轮毂不随缩放单独绘制，保持正圆。
      const spinVals = '1 1;0.86 1;0.5 1;0.22 1;0.5 1;0.86 1;1 1;0.86 1;0.5 1;0.22 1;0.5 1;0.86 1;1 1';
      const impellerSpin =
        `<g transform="translate(${fr(cx)},${fr(impY)})"><g>` +
          `<animateTransform attributeName="transform" type="scale" values="${spinVals}" dur="2.4s" repeatCount="indefinite"/>` +
          `<rect x="${fr(-padW/2)}" y="${fr(-padT/2)}" width="${fr(padW)}" height="${fr(padT)}" rx="${fr(padT*0.3)}" fill="#6a7192" stroke="#3f445c" stroke-width="0.7"/>` +
          `<rect x="${fr(-padW/2)}" y="${fr(-bladeH/2)}" width="${fr(padT*0.9)}" height="${fr(bladeH)}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.6"/>` +
          `<rect x="${fr(padW/2-padT*0.9)}" y="${fr(-bladeH/2)}" width="${fr(padT*0.9)}" height="${fr(bladeH)}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.6"/>` +
        `</g></g>`;
      const impellerHub = `<circle cx="${fr(cx)}" cy="${fr(impY)}" r="${fr(hubR)}" fill="#2a2f45" stroke="#6a7192" stroke-width="0.8"/>`;
      const impeller = impellerSpin + impellerHub;

      /* —— 釜内环流：桨叶驱动下液体沿釜壁上升、沿中心轴回落（左右各一个环流胞）；
             粒子沿闭合椭圆轨迹循环，以液面裁剪窗限位，仅浸没段可见。 */
      const bodyH = gm.bodyBot - gm.bodyTop;
      const cellYc = gm.bodyBot - bodyH*0.30;
      const cellRy = bodyH*0.19, cellRx = gm.bodyW*0.17;
      const flowSegs = 8;
      let flowParticles = '';
      [0,1].forEach(side=>{
        const cellCx = cx + (side===0 ? -1 : 1) * gm.bodyW*0.19;
        const dirSign = side===1 ? -1 : 1;   // 左右胞镜像：各自沿外壁上行、沿中心轴下行
        for(let k=0;k<3;k++){
          const xs = [], ys = [];
          for(let i=0;i<=flowSegs;i++){
            const t = (i/flowSegs + k/3)*Math.PI*2*dirSign;
            xs.push(fr(cellCx + cellRx*Math.sin(t)));
            ys.push(fr(cellYc - cellRy*Math.cos(t)));
          }
          flowParticles +=
            `<circle cx="${xs[0]}" cy="${ys[0]}" r="${fr(clamp(gm.bodyW*0.024,1,2.8))}" fill="#FFF7E6" opacity="0.9">` +
              `<animate attributeName="cx" values="${xs.join(';')}" dur="3s" begin="${fr(-k)}s" repeatCount="indefinite"/>` +
              `<animate attributeName="cy" values="${ys.join(';')}" dur="3s" begin="${fr(-k)}s" repeatCount="indefinite"/>` +
            `</circle>`;
        }
      });
      const flow = `<g clip-path="url(#${flowClipId})">${flowParticles}</g>`;

      /* —— 顶盖一侧进料接管（top 端口 · x=0.22w）：自顶盖法兰面升到组件上沿，
             与居中的电机轴心错开，互不干涉。 */
      const topNozCx = 0.22*w, topNozW = w*0.14, topNozX = topNozCx - topNozW/2;
      const topNozWall = clamp(topNozW*0.20, 0.5, 1.6);
      const topFlH = clamp(driveH*0.20, 0.8, 2.6);
      const topNozzle =
        `<rect x="${fr(topNozX)}" y="0" width="${fr(topNozW)}" height="${fr(driveH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.9"/>` +
        `<rect x="${fr(topNozX+topNozWall)}" y="${fr(topNozWall*0.6)}" width="${fr(Math.max(0.2, topNozW-topNozWall*2))}" height="${fr(Math.max(0.5, driveH-topNozWall*1.2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` +
        `<rect x="${fr(topNozX-topNozW*0.14)}" y="0" width="${fr(topNozW*1.28)}" height="${fr(topFlH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      return `
      <defs>
        <clipPath id="${clipId}"><rect x="${gm.bodyX}" y="${gm.bodyTop}" width="${gm.bodyW}" height="${gm.bodyBot-gm.bodyTop}" rx="2"/></clipPath>
        <clipPath id="${flowClipId}"><rect class="rv-flow-clip" x="${gm.bodyX}" y="${surfaceY}" width="${gm.bodyW}" height="${liqH}"/></clipPath>
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
      <rect x="${gm.bodyX}" y="${driveH}" width="${gm.bodyW}" height="${gm.rimH}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${gm.bodyX}" y="${gm.bodyTop}" width="${gm.bodyW}" height="${gm.bodyBot-gm.bodyTop}" rx="2" fill="#12162b"/>
      <g clip-path="url(#${clipId})">
        <rect class="rv-liquid" x="${gm.bodyX}" y="${surfaceY}" width="${gm.bodyW}" height="${liqH}" fill="url(#${liqId})"/>
        <rect class="rv-liquid-dots" x="${gm.bodyX}" y="${surfaceY}" width="${gm.bodyW}" height="${liqH}" fill="url(#${dotId})"/>
        <line class="rv-surface" x1="${gm.bodyX}" x2="${gm.bodyX+gm.bodyW}" y1="${surfaceY}" y2="${surfaceY}" stroke="#FFE3B0" stroke-width="1.2" opacity="0.8"/>
      </g>
      ${flow}
      <rect x="${gm.bodyX}" y="${gm.bodyTop}" width="${gm.bodyW}" height="${gm.bodyBot-gm.bodyTop}" rx="2" fill="none" stroke="#6a7192" stroke-width="1"/>
      ${impeller}
      ${shaft}
      ${seal}
      <rect x="${gm.bodyX+gm.bodyW}" y="${sideY-h*0.012}" width="${w*0.08}" height="${h*0.024}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.7"/>
      <rect x="${gm.bodyX}" y="${gm.bodyBot}" width="${gm.bodyW}" height="${gm.collarH}" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
      <polygon points="${gm.bodyX},${coneTopY} ${gm.bodyX+gm.bodyW},${coneTopY} ${cx+nozzleW/2},${gm.coneBotY} ${cx-nozzleW/2},${gm.coneBotY}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${cx-nozzleW/2}" y="${gm.coneBotY}" width="${nozzleW}" height="${gm.nozzleH}" fill="#1d2135" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${cx-w*0.05}" y="${gm.coneBotY+gm.nozzleH}" width="${w*0.10}" height="${gm.pipeH}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
      ${topNozzle}
      ${drive}
      <g class="rv-band" transform="translate(0,${surfaceY})">
        <rect x="${gm.bandX}" y="${-gm.bandH/2}" width="${gm.bandW}" height="${gm.bandH}" rx="${gm.bandH*0.14}" fill="#0a0e1e" opacity="0.86" stroke="#FF9A2E" stroke-width="1"/>
        <text x="${cx}" y="${(gm.fs*0.36).toFixed(1)}" text-anchor="middle" font-family="inherit"><tspan class="rv-level-value" fill="#FFA33C" font-size="${gm.fs.toFixed(1)}" font-weight="700" style="font-variant-numeric:tabular-nums">${rd.text}</tspan><tspan class="rv-level-unit" fill="#c9cde6" font-size="${(gm.fs*0.62).toFixed(1)}" dx="2">${rd.unit}</tspan></text>
      </g>`;
    }
};


/* ============================================================
 * 反应釜（reactor）液位：几何与换算工具
 *   组件渲染（上方 reactor 模板）与实时刷新（editor.js refreshReactorLevel）
 *   共用同一套换算，避免液面高度与读数两处各自推导而不一致。
 *   顶部预留 driveH 作搅拌驱动区，釜体各段高度相对可用高 hj 推导（小尺寸等比缩小）。
 * ============================================================ */

// 反应釜几何参数（相对组件 w/h 推导）
function reactorGeom(w,h){
  const driveH  = Math.max(4, Math.min(h*0.15, 34));  // 顶部搅拌驱动装置区高（定尺封顶）
  const hj      = Math.max(4, h - driveH);            // 釜体可用高度
  const rimH    = Math.max(2, hj*0.05);               // 顶部法兰盘
  const collarH = Math.max(2.5, hj*0.046);            // 罐底法兰颈
  const coneH   = hj*0.23;                            // 锥底
  const nozzleH = hj*0.038;                           // 出料口
  const pipeH   = hj*0.07;                            // 底部接管
  const bodyX = 0, bodyW = w;                         // 罐体与上下法兰同宽
  const bodyTop = driveH + rimH;                      // 罐体顶（顶法兰下沿）
  const coneBotY = h - nozzleH - pipeH;
  const bodyBot = coneBotY - coneH - collarH;
  const bandH = Math.max(13, hj*0.11);                // 液位读数带高度
  const bandPad = w*0.14;                             // 读数带与罐体边缘的留白
  return {
    driveH, hj, rimH, collarH, coneH, nozzleH, pipeH, bodyX, bodyW, bodyTop, bodyBot, coneBotY, bandH,
    bandX: bodyX + bandPad, bandW: bodyW - bandPad*2,
    fs: Math.max(9, Math.min(bandH*0.74, w*0.24))     // 读数字号
  };
}

// 液位换算：物理量 → 0~1 填充比例；无有效值返回 null（可通过 props.levelMax 配置量程，默认 50）
function reactorLevelFrac(value, max){
  const v = Number(value), m = Number(max) > 0 ? Number(max) : 50;
  if(value==null || value==='' || !isFinite(v)) return null;
  return Math.max(0, Math.min(1, v/m));
}

// 液位读数：{text, unit}（无有效值时 text='--'、unit=''）
function reactorLevelText(live){
  const ok = !!(live && live.value!=null && live.value!=='' && isFinite(Number(live.value)));
  return { text: ok ? Number(live.value).toFixed(2) : '--', unit: ok ? (live.unit || 'm') : '' };
}
