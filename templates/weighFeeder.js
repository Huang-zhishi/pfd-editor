/* ============================================================
 * PFD Editor · 组件模板：weighFeeder
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.weighFeeder。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属筒体 / 锥体 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   料流粒子与仪表指示灯用 SMIL 动画驱动，编辑态由 editor.js stripSMIL() 自动剥离。
 * ============================================================ */

TEMPLATES.weighFeeder = {
    name: '配料秤/称重料斗', category: '设备',
    defaultSize: { w: 110, h: 160 },
    ports: [{id:'inlet',x:.5,y:0,dir:'up'},{id:'outlet',x:.5,y:1,dir:'down'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'wf_metal_'+uid, metalVId = 'wf_metalv_'+uid, clipId = 'wf_clip_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';

      /* 纵向分区（自上而下）：进料短管 → 圆柱筒体 → 收口锥体 → 出料管。
         筒体与锥体按高度比例取，但都受"可用高度"约束（各占 45%），
         极小尺寸下不会把出料管挤成负高。*/
      const inletH = Math.max(4, Math.min(14, h*0.056));   // 进料短管长（定尺封顶）
      const gapH = Math.max(1, Math.min(3, h*0.02));       // 筒顶法兰条厚（定尺封顶）
      const topY = inletH + gapH;
      const availH = Math.max(2, h - topY);
      const bodyH = Math.min(h*0.30, availH*0.45);         // 筒体高
      const coneH = Math.min(h*0.30, availH*0.45);         // 锥体高
      const coneTopY = topY + bodyH;
      const coneBotY = coneTopY + coneH;
      const outletH = Math.max(0, h - coneBotY);           // 出料管长（到设备下沿，与 outlet 端口同轴）

      const inletW = w*0.30, inletX = (w-inletW)/2;        // 顶部进料口（与 inlet 端口同轴）
      const topW = w*0.56, topX = (w-topW)/2;              // 筒体外径
      const botW = w*0.16, botX = (w-botW)/2;              // 锥体收口
      const wallT = Math.max(1.2, w*0.05);                 // 外壁 / 后壁厚
      const padT = Math.max(1.2, Math.min(4, wallT*0.5));  // 内腔留边（定尺封顶）

      // 后壁层（比金属层大一圈 wallT，露在外沿形成壁厚）
      const backBody = `<rect x="${f(topX-wallT)}" y="${f(topY)}" width="${f(topW+wallT*2)}" height="${f(bodyH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      const backCone = `<polygon points="${f(topX-wallT)},${f(coneTopY)} ${f(topX+topW+wallT)},${f(coneTopY)} ${f(botX+botW)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      // 金属层（筒体 + 锥体，局部渐变）
      const metalBody = `<rect x="${f(topX)}" y="${f(topY)}" width="${f(topW)}" height="${f(bodyH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      const metalCone = `<polygon points="${f(topX)},${f(coneTopY)} ${f(topX+topW)},${f(coneTopY)} ${f(botX+botW)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      // 内部深色腔（筒体矩形 + 锥体梯形，四周留 padT，金属边圈清晰可见）
      const cavBody = `<rect x="${f(topX+padT)}" y="${f(topY+padT)}" width="${f(topW-padT*2)}" height="${f(Math.max(0, bodyH-padT))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;
      const cavCone = `<polygon points="${f(topX+padT)},${f(coneTopY)} ${f(topX+topW-padT)},${f(coneTopY)} ${f(botX+botW-padT*0.6)},${f(coneBotY-padT*0.6)} ${f(botX+padT*0.6)},${f(coneBotY-padT*0.6)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;

      /* 防溢出裁剪区 = 内腔形状（筒体矩形 + 锥体梯形），比内腔再内缩 clipPad，
         料流粒子只在腔内可见，不会压到金属壁或描边上。*/
      const clipPad = Math.max(0.7, padT*0.5);
      const clipDef =
        `<clipPath id="${clipId}">` +
        `<rect x="${f(topX+clipPad)}" y="${f(topY)}" width="${f(Math.max(0.1, topW-clipPad*2))}" height="${f(bodyH)}"/>` +
        `<polygon points="${f(topX+clipPad)},${f(coneTopY)} ${f(topX+topW-clipPad)},${f(coneTopY)} ${f(botX+botW-clipPad*0.6)},${f(coneBotY-padT*0.4)} ${f(botX+clipPad*0.6)},${f(coneBotY-padT*0.4)}"/>` +
        `</clipPath>`;

      /* 料流粒子（SMIL）：自内腔顶部竖直落到锥底出料口，靠 keyTimes 在两端淡入淡出，
         多颗粒子用负 begin 错开相位形成连续料流；运行态由浏览器驱动，编辑态被 stripSMIL() 剥掉。
         闭合标签写法（<circle>…</circle>）是为了让 stripSMIL 的正则同时匹配带子节点的动画。*/
      const dotN = 3;
      const dotR = Math.max(0.7, Math.min(2.2, w*0.018));
      const dotTop = topY - Math.max(1, padT), dotBot = coneBotY - padT*0.6;
      const dotDur = 1.8;
      let feedDots = '';
      for(let i=0;i<dotN;i++){
        const dx = w*0.5 + (i-(dotN-1)/2) * (topW*0.20);
        const begin = `-${f(i*dotDur/dotN)}s`;
        feedDots +=
          `<circle cx="${f(dx)}" cy="${f(dotTop)}" r="${f(dotR)}" fill="${c}" opacity="0.8">` +
            `<animate attributeName="cy" values="${f(dotTop)};${f(dotBot)}" dur="${f(dotDur)}s" begin="${begin}" repeatCount="indefinite"/>` +
            `<animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.14;0.86;1" dur="${f(dotDur)}s" begin="${begin}" repeatCount="indefinite"/>` +
          `</circle>`;
      }
      const feedFlow = `<g clip-path="url(#${clipId})">${feedDots}</g>`;

      /* 接管三件套（对齐除尘布袋 / 反应釜）：
         金属管壁（渐变）+ 深色管腔（#12162b / #6a7192）+ 端面法兰（#2a2f45 / #3f445c）。
         进料管竖向 → 用横向渐变 metalVId；出料管竖向同理。*/
      const pipeWall = Math.max(0.8, Math.min(2, inletW*0.09));
      const flW = Math.max(0.8, Math.min(2, inletW*0.08));   // 端面法兰单边加宽
      const inletPipe = `
        <rect x="${f(inletX)}" y="0" width="${f(inletW)}" height="${f(topY)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${f(inletX+pipeWall)}" y="${f(pipeWall*0.6)}" width="${f(inletW-pipeWall*2)}" height="${f(topY-pipeWall*0.6)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(inletX-flW)}" y="0" width="${f(inletW+flW*2)}" height="${f(gapH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      const outWall = Math.max(0.8, Math.min(2, botW*0.09));
      const outletPipe = outletH > 0.6 ? `
        <rect x="${f(botX)}" y="${f(coneBotY)}" width="${f(botW)}" height="${f(outletH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${f(botX+outWall)}" y="${f(coneBotY)}" width="${f(botW-outWall*2)}" height="${f(Math.max(0, outletH-outWall*0.6))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(botX-flW)}" y="${f(h-gapH)}" width="${f(botW+flW*2)}" height="${f(gapH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` : '';

      /* 定尺封顶：法兰条厚、把合法兰厚、螺栓半径都按筒高/筒径封顶 ——
         料斗放大时只是筒身变长，法兰与螺栓不会跟着变粗。
         筒身加高后把合法兰自动增多（单节约 0.30 筒径），与提升机标准节同理。*/
      const flH = Math.max(2, Math.min(4, bodyH*0.09));
      const boltR = Math.max(0.9, Math.min(1.7, flH*0.5));
      const nSec = Math.max(2, Math.round(bodyH/(w*0.30)));
      const jointH = Math.max(1.2, Math.min(2.8, bodyH*0.05));
      const bolt = (bx,by)=>`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;
      let joints = '';
      for(let i=1;i<nSec;i++){
        const jy = topY + bodyH*i/nSec;
        joints += `<rect x="${f(topX-wallT*0.6)}" y="${f(jy-jointH*0.5)}" width="${f(topW+wallT*1.2)}" height="${f(jointH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      }
      // 筒顶把合法兰条（落在进料短管与筒体之间的 gapH 内）+ 锥底法兰条
      const botFlH = Math.min(flH, Math.max(0, outletH*0.4));
      const topFl = `<rect x="${f(topX-wallT)}" y="${f(topY-gapH)}" width="${f(topW+wallT*2)}" height="${f(gapH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const botFl = `<rect x="${f(botX-wallT)}" y="${f(coneBotY)}" width="${f(botW+wallT*2)}" height="${f(botFlH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;

      /* 筒体检修门（观察料位 / 清理粘料用）：门板 + 两条铰链 + 把手，
         画法沿用 bucketElevator 观察门（#1a1f33 门板 / #3a4060 铰链 / #8e96b6 把手），
         贴筒身左侧，让开顶法兰、把合法兰与右侧仪表。*/
      const doorW = Math.max(4, Math.min(w*0.13, topW*0.30));
      const doorH = Math.max(3, Math.min(bodyH*0.55, doorW*3));
      const doorX = topX + topW*0.10;
      const doorY = topY + (bodyH-doorH)/2;
      const door =
        `<rect x="${f(doorX)}" y="${f(doorY)}" width="${f(doorW)}" height="${f(doorH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.26)}" y1="${f(doorY+1.4)}" x2="${f(doorX+doorW*0.26)}" y2="${f(doorY+doorH-1.4)}" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.74)}" y1="${f(doorY+1.4)}" x2="${f(doorX+doorW*0.74)}" y2="${f(doorY+doorH-1.4)}" stroke="#3a4060" stroke-width="1"/>` +
        `<circle cx="${f(doorX+doorW*0.5)}" cy="${f(doorY+doorH*0.5)}" r="${f(Math.max(0.6, Math.min(doorW,doorH)*0.13))}" fill="#8e96b6" opacity="0.75"/>`;

      /* 称重仪表：面板 #2a2f45 + 深色屏幕 #12162b / #6a7192 + kg 读数（${c}）+ 绿色指示灯，
         信号线改 #6a7192 虚线，自仪表下沿接到筒体右下侧壁（原右支腿顶部的接点位置）。*/
      const boxW = Math.max(6, Math.min(16, w*0.135));
      const boxH = Math.max(5, Math.min(boxW, h*0.20));
      const boxPad = Math.max(1, Math.min(4, w*0.027));
      const boxX = w - boxW - boxPad, boxY = Math.max(1, Math.min(4, h*0.025));
      const scrX = boxX+boxW*0.12, scrY = boxY+boxH*0.12, scrW = boxW*0.76, scrH = boxH*0.42;
      const fs = Math.max(3, Math.min(8, scrH*0.95));
      const lampR = Math.max(0.5, Math.min(2, boxW*0.10));
      const lampX = boxX+boxW*0.5, lampY = boxY+boxH*0.80;
      const signalY = Math.max(coneTopY, boxY+boxH);
      const meter = `
        <rect x="${f(boxX)}" y="${f(boxY)}" width="${f(boxW)}" height="${f(boxH)}" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>
        <rect x="${f(scrX)}" y="${f(scrY)}" width="${f(scrW)}" height="${f(scrH)}" rx="1" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <text x="${f(boxX+boxW*0.5)}" y="${f(scrY+scrH*0.82)}" text-anchor="middle" fill="${c}" font-size="${f(fs)}" font-family="inherit">kg</text>
        <circle cx="${f(lampX)}" cy="${f(lampY)}" r="${f(lampR)}" fill="#33aa33" stroke="#3f445c" stroke-width="0.4"><animate attributeName="opacity" values="1;0.22;1" dur="1.6s" repeatCount="indefinite"/></circle>
        <path d="M ${f(boxX+boxW*0.25)} ${f(boxY+boxH)} L ${f(boxX+boxW*0.25)} ${f(signalY)} L ${f(topX+topW)} ${f(signalY)}" fill="none" stroke="#6a7192" stroke-width="0.6" stroke-dasharray="2 1.5" opacity="0.75"/>`;

      return `
        <defs>
          <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
          <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
          ${clipDef}
        </defs>
        <!-- 1. 设备后壁（筒体 + 锥体，比金属层大一圈 wallT 形成壁厚） -->
        ${backBody}
        ${backCone}
        <!-- 2. 设备主体金属填充 -->
        ${metalBody}
        ${metalCone}
        <!-- 3. 内部深色腔（筒体 + 锥体）+ 受裁剪的料流粒子 -->
        ${cavBody}
        ${cavCone}
        ${feedFlow}
        <!-- 4. 筒身把合法兰（自动增多）与检修门 -->
        ${joints}
        ${door}
        <!-- 5. 进料口 / 出料管（接管三件套）+ 顶/底法兰条与螺栓 -->
        ${inletPipe}
        ${outletPipe}
        ${topFl}
        ${bolt(topX-wallT*0.5, topY-gapH*0.5)}
        ${bolt(topX+topW*0.34, topY-gapH*0.5)}
        ${bolt(topX+topW*0.66, topY-gapH*0.5)}
        ${bolt(topX+topW+wallT*0.5, topY-gapH*0.5)}
        ${botFl}
        ${bolt(botX-wallT*0.5, coneBotY+botFlH*0.5)}
        ${bolt(botX+botW+wallT*0.5, coneBotY+botFlH*0.5)}
        <!-- 6. 称重仪表 -->
        ${meter}
      `;
    }
};
