/* ============================================================
 * PFD Editor · 组件模板：filterPress（压滤机）
 *   由 templates.js 统一加载，本文件只注册 TEMPLATES.filterPress。
 *   机型：卧式板框 / 厢式压滤机（左端固定头板 → 中部滤板组 →
 *         活动压紧板 → 右端液压缸，两片机架主梁承托滤板）。
 *   配色与画法对齐 reactor / screwConveyorLite：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（滤板 / 端板 / 缸筒）
 *       #5b6178 → #8f97b0 → #4a5068（机架主梁 / 支腿 深色金属）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与联接件）
 *   四个端口：进料 / 压缩空气（左端固定头板）+ 滤液 / 滤饼出口（底部）。
 *   滤板张合 + 滤饼掉落用同一 SMIL 循环驱动，编辑态由 editor.js stripSMIL() 自动剥离；
 *   绑定 runTag 时由 refreshFilterPressRun() 注入 props._run 切换运行 / 停止。
 * ============================================================ */

TEMPLATES.filterPress = {
    name: '压滤机', category: '除尘与分离',
    defaultSize: { w: 300, h: 150 },
    ports: [
      {id:'feed',     x:0,    y:0.36, dir:'left'},   // 进料
      {id:'air',      x:0,    y:0.60, dir:'left'},   // 压缩空气
      {id:'filtrate', x:0.30, y:1,    dir:'down'},   // 滤液出口
      {id:'cake',     x:0.62, y:1,    dir:'down'}    // 滤饼出口
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'fpr_metal_'+uid, metalVId = 'fpr_metalv_'+uid, beamId = 'fpr_beam_'+uid;
      const f = n => Number(n).toFixed(2);
      const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
      const c = (p && p.color) || '#9C99FF';
      /* 数据驱动动画：绑定压滤机开关 tag（runTag）时由外部注入 _run（true=运行，false=停止）；
         未绑定 / 未注入 → 默认运行。运行态才挂滤板张合 + 滤饼掉落的 SMIL 动画。*/
      const runTag = (p.runTag || '').trim();
      const running = runTag ? (p._run !== false) : true;

      /* 机架布置（横向）：左端固定头板 → 中部滤板组 → 活动压紧板 → 右端液压缸。
         滤板组占用的横向空间随 w 伸缩（滤板张数自动增减），
         端板、缸筒、主梁厚度等定尺部件按 h 封顶，组件缩小时同步变薄。*/
      const margin = clamp(w*0.035, 3, 12);
      const left = margin, right = w - margin;
      const cy = h*0.42;                              // 滤板 / 缸筒中心线
      const plateH = h*0.46;                          // 滤板高度
      const plateTop = cy - plateH*0.5, plateBot = cy + plateH*0.5;

      const beamH = clamp(h*0.05, 2.4, 8);            // 机架主梁厚
      const topBeamY = plateTop - beamH;              // 上主梁（滤板悬挂其上）
      const botBeamY = plateBot;                      // 下主梁（托住滤板底部）
      const endExt = beamH*0.5;                       // 端板高出主梁的加宽量（端板比滤板明显高）

      const headW  = clamp(w*0.035, 6, 16);           // 固定头板厚
      const followW = clamp(w*0.026, 5, 12);          // 活动压紧板厚
      const cylRegion = clamp(w*0.22, 34, 76);        // 液压缸区总宽

      const xHead = left;
      const xPlates0 = xHead + headW;                 // 滤板组起点
      const xFollow = right - cylRegion - followW;    // 活动压紧板左边
      const xCyl0 = xFollow + followW;                // 液压缸区起点
      const platesSpan = Math.max(8, xFollow - xPlates0);

      // 滤板组：按可用跨度定张数，张数随组件加宽自动增多，单板厚度封顶
      const plateT0 = clamp(platesSpan/13, 3.2, 11);
      const nPlates = Math.max(5, Math.round(platesSpan/plateT0));
      const pitch = platesSpan/nPlates;
      const pw = pitch*0.84, pad = (pitch-pw)*0.5;
      const pRx = Math.min(2.2, pw*0.35);
      const eyeR = Math.max(0.8, Math.min(pw*0.30, plateH*0.055));
      const hdW = Math.min(pw*0.55, beamH*0.9), hdH = beamH*0.8;

      /* 机架主梁：上下各一根，贯穿固定头板到液压缸（滤板挂/托在梁上） */
      const beamW = right - left;
      const beams =
        `<rect x="${f(left)}" y="${f(topBeamY)}" width="${f(beamW)}" height="${f(beamH)}" rx="1" fill="url(#${beamId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<rect x="${f(left)}" y="${f(botBeamY)}" width="${f(beamW)}" height="${f(beamH)}" rx="1" fill="url(#${beamId})" stroke="#3f445c" stroke-width="0.8"/>`;

      /* 支腿底座：两处支腿 + 底脚板，把机架抬离基础面 */
      const baseY = h - clamp(h*0.06, 3, 10);
      const legW = clamp(w*0.03, 3, 9);
      const legY0 = botBeamY + beamH;
      const legH = Math.max(2, baseY - legY0);
      const footH = Math.max(1.6, Math.min(legW*0.45, 4));
      const legAt = lx =>
        `<rect x="${f(lx)}" y="${f(legY0)}" width="${f(legW)}" height="${f(legH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
        `<rect x="${f(lx-legW*0.55)}" y="${f(baseY)}" width="${f(legW*2.1)}" height="${f(footH)}" rx="0.8" fill="url(#${beamId})" stroke="#3f445c" stroke-width="0.7"/>`;
      const legX1 = left + beamW*0.10 + legW*0.5;
      const legX2 = left + beamW*0.90 - legW*0.5;
      const legs = legAt(legX1 - legW*0.5) + legAt(legX2 - legW*0.5);

      /* 固定头板（止推板）：左端厚立板，比滤板明显高、把主梁端头夹住，
         承担进料 / 压空的推力，螺栓联接在机架端部 */
      const endTop = topBeamY - endExt, endBot = botBeamY + beamH + endExt, endH = endBot - endTop;
      const endPlate = (ex,ew)=>
        `<rect x="${f(ex)}" y="${f(endTop)}" width="${f(ew)}" height="${f(endH)}" rx="1.5" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>` +
        `<circle cx="${f(ex+ew*0.5)}" cy="${f(endTop+beamH*0.55)}" r="${f(Math.max(0.7, beamH*0.22))}" fill="#2a2f45" stroke="#6a7192" stroke-width="0.5"/>` +
        `<circle cx="${f(ex+ew*0.5)}" cy="${f(endBot-beamH*0.55)}" r="${f(Math.max(0.7, beamH*0.22))}" fill="#2a2f45" stroke="#6a7192" stroke-width="0.5"/>`;
      const headPlate = endPlate(xHead, headW);

      /* 活动压紧板：液压缸推动它把整叠滤板压紧，结构与头板一致 */
      const followPlate = endPlate(xFollow, followW);

      /* 滤板组：每片 = 金属板体 + 顶部挂耳（搭在上主梁上）+ 中心进料孔（连成进料通道）。
         板组按张数对半分成左右两半：左半顶住固定头板不动，右半连同活动压紧板一起
         沿 +x 微移——张开缝因此落在板组中缝，左右对称，不会整叠往一端挤。 */
      const plateAt = i => {
        const px = xPlates0 + i*pitch;
        return `<rect x="${f(px+pad)}" y="${f(plateTop)}" width="${f(pw)}" height="${f(plateH)}" rx="${f(pRx)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.7"/>` +
          `<rect x="${f(px+pad+pw*0.5-hdW*0.5)}" y="${f(topBeamY-beamH*0.30)}" width="${f(hdW)}" height="${f(hdH)}" rx="0.8" fill="#9aa2bc" stroke="#3f445c" stroke-width="0.6"/>` +
          `<circle cx="${f(px+pad+pw*0.5)}" cy="${f(cy)}" r="${f(eyeR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>`;
      };
      const nLeft = Math.max(1, Math.floor(nPlates/2));   // 左半滤板张数
      let platesL = '', platesR = '';
      for(let i=0;i<nPlates;i++){
        if(i < nLeft) platesL += plateAt(i); else platesR += plateAt(i);
      }

      /* 液压缸：活塞杆（连活动压紧板）+ 缸筒 + 缸头导向套 + 缸底法兰 */
      const cylH = clamp(plateH*0.32, 8, 30);
      const rodH = clamp(cylH*0.24, 2, 6.5);
      const rodLen = cylRegion*0.34;
      const xRod0 = xCyl0 + 1;
      const xBarrel0 = xRod0 + rodLen;
      const barrelW = Math.max(6, right - xBarrel0);
      const rodY = cy - rodH*0.5;
      const barrelY = cy - cylH*0.5;
      const glandW = Math.max(2, cylH*0.16);
      const flangeW = Math.max(2, cylH*0.14);
      const cylinder =
        `<rect x="${f(xRod0)}" y="${f(rodY)}" width="${f(xBarrel0-xRod0)}" height="${f(rodH)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.6"/>` +
        `<rect x="${f(xBarrel0)}" y="${f(barrelY)}" width="${f(barrelW)}" height="${f(cylH)}" rx="${f(cylH*0.14)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.9"/>` +
        `<line x1="${f(xBarrel0+glandW)}" y1="${f(cy-cylH*0.26)}" x2="${f(right-flangeW)}" y2="${f(cy-cylH*0.26)}" stroke="#d9dded" stroke-width="0.7" opacity="0.55"/>` +
        `<rect x="${f(xBarrel0)}" y="${f(barrelY-cylH*0.05)}" width="${f(glandW)}" height="${f(cylH*1.1)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
        `<rect x="${f(right-flangeW)}" y="${f(barrelY-cylH*0.05)}" width="${f(flangeW)}" height="${f(cylH*1.1)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
        `<circle cx="${f(right-flangeW*0.5)}" cy="${f(barrelY-cylH*0.05+cylH*0.16)}" r="${f(Math.max(0.8, cylH*0.09))}" fill="${c}" opacity="0.85"/>`;

      /* ===== 接管 =====
         · 进料 / 压缩空气：左端固定头板水平接出，端口落在组件左缘（x=0, y=0.36h / 0.60h）
         管件画法与 screwConveyorLite 出料管统一：金属管壁 + 深色管腔 + 端口法兰。
         底部滤液 / 滤饼出口不画管件，只在 ports 里保留两个浮空连接点。*/
      const pFlangeW = Math.max(1.6, Math.min(beamH*0.36, 3.6));
      const rootXP = xHead + headW*0.35;                 // 左接管根部：插入固定头板
      const hPipe = (py,ph)=>{                            // 水平左接管（端口朝左，落在 x=0）
        const top = py - ph*0.5, wall = clamp(ph*0.28, 0.7, 2.0);
        return `<rect x="0" y="${f(top)}" width="${f(rootXP)}" height="${f(ph)}" rx="1" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>` +
          `<rect x="0" y="${f(top+wall)}" width="${f(rootXP-wall)}" height="${f(ph-wall*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` +
          `<rect x="0" y="${f(top-ph*0.10)}" width="${f(pFlangeW)}" height="${f(ph*1.20)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      };
      const feedPipeH = clamp(h*0.09, 4, 10);            // 进料管高
      const airPipeH  = clamp(h*0.07, 3, 8);             // 压缩空气管高
      const leftPipes =
        hPipe(h*0.36, feedPipeH) +                         // 进料管
        hPipe(h*0.60, airPipeH);                           // 压缩空气管

      /* ===== 运行动画（滤板中缝张合 + 滤饼掉落，同一循环内同步） =====
         一个 cycle 走完一次压滤节拍：合拢过滤 → 松开 → 中间开板卸饼 → 再合拢。
         · 张合：板组从正中间分成左右两半——左半顶住固定头板不动，右半连同活动压紧板
           整体沿 +x 微移 openGap（不逐板），张开缝因此落在板组中缝、左右对称；
           不在某一端拉开，免得整叠板往一端挤、看着别扭。
           keyTimes 0~0.55 保持合拢（过滤段），0.68 张开到位，保持到 0.92 回程。
         · 掉落：滤饼就在中缝正下方落下——哪里张开就在哪里掉饼，
           张开到位后（0.69）才出现，0.88 落到底、0.92 淡出，与张合同拍。
         动画刻意越出组件底边（与 desulfTower 排气蒸汽同理，模板不被 bbox 裁剪），
         行程按 clamp(h*0.30, 10, 45) 限制在 45px 内，以免超出导出 PNG 的 60px 留白。*/
      const cycle = 5.0;                                 // 一个完整压滤循环(s)
      const openGap = clamp(pitch*1.40, 4, 14);          // 张开缝加大量（右半板组沿 +x 位移）
      const plateOpen = running
        ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;${f(openGap)} 0;${f(openGap)} 0;0 0" keyTimes="0;0.55;0.68;0.92;1" dur="${cycle}s" repeatCount="indefinite"/>`
        : '';
      const plateGroup = `<g>${plateOpen}${followPlate}${platesR}</g>`;

      const gapW  = 2*pad + openGap;                     // 中缝净宽
      const gapCx = xPlates0 + nLeft*pitch + openGap*0.5; // 中缝中心（左半末片与右半首片之间）
      const dropLen = clamp(h*0.30, 10, 45);             // 允许的下落总行程（含饼自身高度）
      const cakeW = Math.min(gapW*0.92, pw*1.60);        // 饼比缝略窄：像从缝里挤出来
      const cakeH = clamp(plateH*0.76, 10, 56);          // 饼厚：按滤板高度取，约占板高七成半
      const cakeR = Math.min(cakeH*0.30, cakeW*0.30);    // 圆角按饼宽收着，免得饼一高就成胶囊
      const cakeX = gapCx - cakeW*0.5;                   // 落在中缝正中
      const cakeY0 = legY0, cakeY1 = h + dropLen - cakeH; // 落到底时饼底刚好停在 h+dropLen
      const cakeDrop = running
        ? `<rect x="${f(cakeX)}" y="${f(cakeY0)}" width="${f(cakeW)}" height="${f(cakeH)}" rx="${f(cakeR)}" fill="#a8834f" stroke="#6f5430" stroke-width="0.6" opacity="0">` +
            `<animate attributeName="y" values="${f(cakeY0)};${f(cakeY0)};${f(cakeY1)};${f(cakeY1)}" keyTimes="0;0.69;0.88;1" dur="${cycle}s" repeatCount="indefinite"/>` +
            `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.66;0.69;0.88;0.92;1" dur="${cycle}s" repeatCount="indefinite"/>` +
          `</rect>`
        : '';

      return `
      <defs>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${beamId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#5b6178"/><stop offset="0.42" stop-color="#8f97b0"/><stop offset="1" stop-color="#4a5068"/>
        </linearGradient>
      </defs>
      ${legs}
      ${beams}
      ${headPlate}
      ${platesL}
      ${cylinder}
      ${plateGroup}
      ${leftPipes}
      ${cakeDrop}
      `
    }
};
