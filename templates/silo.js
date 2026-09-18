/* ============================================================
 * PFD Editor · 组件模板：silo
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.silo。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）/ weighFeeder（配料秤）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip 与 .equip-body（CSS 的 stroke 会覆盖行内自定义色）：
 *       #7d849e → #d9dded → #767d97（金属仓身 / 锥斗 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 * ============================================================ */

TEMPLATES.silo = {
    name: '料仓', category: '设备',
    defaultSize: { w: 90, h: 150 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'side',x:1,y:.4,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'silo_metal_'+uid, metalVId = 'silo_metalv_'+uid, clipId = 'silo_clip_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';

      /* 纵向分区（自上而下）：进料短管 → 顶盖 → 圆柱仓身 → 收口锥斗 → 出料管。
         仓身与锥斗按高度比例取，但都受"可用高度"约束，
         极小尺寸下不会把出料管挤成负高。*/
      const inletH = Math.max(4, Math.min(14, h*0.055));   // 进料短管长（定尺封顶）
      const capH = Math.max(2, Math.min(5, h*0.025));      // 顶盖板厚（定尺封顶）
      const topY = inletH + capH;
      const availH = Math.max(2, h - topY);
      const bodyH = Math.min(h*0.46, availH*0.60);         // 圆柱仓身高
      const coneH = Math.min(h*0.24, availH*0.32);         // 锥斗高
      const bodyBotY = topY + bodyH;
      const coneBotY = bodyBotY + coneH;
      const outletH = Math.max(0, h - coneBotY);           // 出料管长（到设备下沿，与 bottom 端口同轴）

      /* 横向：仓身左右各留 10% —— 右侧放 side 接管（中心线 y=0.4h），下方放支腿。*/
      const bodyW = w*0.80, bodyX = w*0.10;
      const topW = w*0.34, topX = (w-topW)/2;              // 顶部进料口（中心线 0.5w，与 top 端口同轴）
      const botW = w*0.20, botX = (w-botW)/2;              // 锥斗收口
      const wallT = Math.max(1.2, w*0.045);                // 外壁 / 后壁厚
      const padT = Math.max(1.2, Math.min(4, wallT*0.5));  // 内腔留边（定尺封顶）

      // 后壁层（比金属层大一圈 wallT，露在外沿形成壁厚）
      const backBody = `<rect x="${f(bodyX-wallT)}" y="${f(topY)}" width="${f(bodyW+wallT*2)}" height="${f(bodyH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      const backCone = `<polygon points="${f(bodyX-wallT)},${f(bodyBotY)} ${f(bodyX+bodyW+wallT)},${f(bodyBotY)} ${f(botX+botW)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      // 金属层（仓身 + 锥斗，局部渐变）
      const metalBody = `<rect x="${f(bodyX)}" y="${f(topY)}" width="${f(bodyW)}" height="${f(bodyH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      const metalCone = `<polygon points="${f(bodyX)},${f(bodyBotY)} ${f(bodyX+bodyW)},${f(bodyBotY)} ${f(botX+botW)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      // 内部深色腔（仓身矩形 + 锥斗梯形，四周留 padT，金属边圈清晰可见）
      const cavBody = `<rect x="${f(bodyX+padT)}" y="${f(topY+padT)}" width="${f(Math.max(0.1, bodyW-padT*2))}" height="${f(Math.max(0, bodyH-padT))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;
      const cavCone = `<polygon points="${f(bodyX+padT)},${f(bodyBotY)} ${f(bodyX+bodyW-padT)},${f(bodyBotY)} ${f(botX+botW-padT*0.6)},${f(coneBotY-padT*0.6)} ${f(botX+padT*0.6)},${f(coneBotY-padT*0.6)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;

      /* 料位指示条（横条，贴在仓身上部）：深色底槽 + ${c} 着色填充（约 70%）。
         条厚与长度均按仓身内腔定尺，不随尺寸变粗。*/
      const barH = Math.max(2, Math.min(6, bodyH*0.06));
      const barX = bodyX + padT + Math.max(1, bodyW*0.06);
      const barW = Math.max(1, bodyW - padT*2 - Math.max(2, bodyW*0.12));
      const barY = topY + padT + Math.max(1, bodyH*0.08);
      const levelBar =
        `<rect x="${f(barX)}" y="${f(barY)}" width="${f(barW)}" height="${f(barH)}" rx="1" fill="#1a1f33" stroke="#3f445c" stroke-width="0.5"/>` +
        `<rect x="${f(barX)}" y="${f(barY)}" width="${f(barW*0.7)}" height="${f(barH)}" rx="1" fill="${c}" opacity="0.65"/>`;

      /* 防溢出裁剪区 = 内腔形状（仓身矩形 + 锥斗梯形），比内腔再内缩 clipPad，
         料流粒子只在腔内可见，落到锥面处自动被裁掉，不会压到金属壁或描边上。*/
      const clipPad = Math.max(0.7, padT*0.5);
      const clipDef =
        `<clipPath id="${clipId}">` +
        `<rect x="${f(bodyX+clipPad)}" y="${f(topY)}" width="${f(Math.max(0.1, bodyW-clipPad*2))}" height="${f(bodyH)}"/>` +
        `<polygon points="${f(bodyX+clipPad)},${f(bodyBotY)} ${f(bodyX+bodyW-clipPad)},${f(bodyBotY)} ${f(botX+botW-clipPad*0.6)},${f(coneBotY-padT*0.4)} ${f(botX+clipPad*0.6)},${f(coneBotY-padT*0.4)}"/>` +
        `</clipPath>`;

      /* 仓内落料粒子（SMIL）：自内腔顶部竖直落到锥底出料口，靠 keyTimes 在两端淡入淡出，
         多颗粒子用负 begin 错开相位形成连续料流；运行态由浏览器驱动，编辑态被 stripSMIL() 剥掉。
         闭合标签写法（<circle>…</circle>）是为了让 stripSMIL 的正则同时匹配带子节点的动画。*/
      const dotN = 4;
      const dotR = Math.max(0.7, Math.min(2.2, w*0.016));
      const dotTop = topY - Math.max(1, padT), dotBot = coneBotY - padT*0.6;
      const dotDur = 2.6;
      let feedDots = '';
      for(let i=0;i<dotN;i++){
        const dx = w*0.5 + (i-(dotN-1)/2) * (bodyW*0.16);
        const begin = `-${f(i*dotDur/dotN)}s`;
        feedDots +=
          `<circle cx="${f(dx)}" cy="${f(dotTop)}" r="${f(dotR)}" fill="${c}" opacity="0.8">` +
            `<animate attributeName="cy" values="${f(dotTop)};${f(dotBot)}" dur="${f(dotDur)}s" begin="${begin}" repeatCount="indefinite"/>` +
            `<animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.14;0.86;1" dur="${f(dotDur)}s" begin="${begin}" repeatCount="indefinite"/>` +
          `</circle>`;
      }
      const feedFlow = `<g clip-path="url(#${clipId})">${feedDots}</g>`;

      /* 接管三件套（对齐配料秤 / 反应釜）：
         金属渐变管壁 + 深色管腔（#12162b / #6a7192，内缩约 0.9）+ 端面法兰（#2a2f45 / #3f445c）。
         竖直接管用横向渐变 metalVId，水平接管用纵向渐变 metalId。
         端口契约：top(0.5w, 0) / bottom(0.5w, h) / side(w, 0.4h) —— 管中心线严格同轴。*/
      const flH = Math.max(1.2, Math.min(3, h*0.020));      // 端面法兰厚（定尺封顶）
      const flW = Math.max(0.8, Math.min(2, w*0.025));      // 端面法兰单边加宽（定尺封顶）

      // 顶部进料管（竖）：管口贴 y=0，中心线 0.5w
      const topWall = Math.max(0.8, Math.min(2, topW*0.09));
      const topPipe = `
        <rect x="${f(topX)}" y="0" width="${f(topW)}" height="${f(topY)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${f(topX+topWall)}" y="${f(topWall*0.6)}" width="${f(Math.max(0.1, topW-topWall*2))}" height="${f(Math.max(0, topY-topWall*0.6))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(topX-flW)}" y="0" width="${f(topW+flW*2)}" height="${f(Math.min(flH, topY))}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // 底部出料管（竖）：管口贴 y=h，中心线 0.5w；逼近 0 高时整体省略
      const outWall = Math.max(0.8, Math.min(2, botW*0.10));
      const botFlH = Math.min(flH, outletH);
      const botPipe = outletH > 0.6 ? `
        <rect x="${f(botX)}" y="${f(coneBotY)}" width="${f(botW)}" height="${f(outletH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${f(botX+outWall)}" y="${f(coneBotY)}" width="${f(Math.max(0.1, botW-outWall*2))}" height="${f(Math.max(0, outletH-outWall*0.6))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(botX-flW)}" y="${f(h-botFlH)}" width="${f(botW+flW*2)}" height="${f(botFlH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` : '';

      /* 右侧接管（横）：中心线严格 y=0.4h，管口贴 x=w。
         起画点从仓身右壁外沿内缩 wallT*0.5，让管与壁面衔接无缝。*/
      const sideCy = h*0.4;
      const sideW = Math.max(3, Math.min(w*0.11, bodyH*0.35));   // 管径（定尺封顶）
      const sideX0 = bodyX + bodyW - wallT*0.5;
      const sideL = Math.max(0, w - sideX0);
      const sideWall = Math.max(0.7, Math.min(1.8, sideW*0.14));
      const sidePipe = sideL > 0.6 ? `
        <rect x="${f(sideX0)}" y="${f(sideCy-sideW/2)}" width="${f(sideL)}" height="${f(sideW)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${f(sideX0+sideWall*0.6)}" y="${f(sideCy-sideW/2+sideWall)}" width="${f(Math.max(0.1, sideL-sideWall*0.6))}" height="${f(Math.max(0.1, sideW-sideWall*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(w-flW)}" y="${f(sideCy-sideW/2-flW)}" width="${f(flW)}" height="${f(sideW+flW*2)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` : '';

      /* 提升机式细节：把合法兰条（按仓身高度自动增多）+ 螺栓、仓顶盖板法兰、
         锥底法兰、人孔检修门、仓内爬梯。法兰与螺栓尺寸一律定尺封顶，
         料仓放大时只是仓身变长，法兰不会跟着变粗。*/
      const stripH = Math.max(1.6, Math.min(3.4, bodyH*0.055));   // 把合法兰条厚（定尺封顶）
      const jointH = Math.max(1.2, Math.min(2.6, bodyH*0.045));
      const boltR = Math.max(0.8, Math.min(1.6, w*0.018));        // 螺栓半径（定尺封顶）
      const bolt = (bx,by)=>
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>` +
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;

      const nSec = Math.max(2, Math.round(bodyH/(w*0.34)));
      let joints = '';
      for(let i=1;i<nSec;i++){
        const jy = topY + bodyH*i/nSec;
        joints +=
          `<rect x="${f(bodyX-wallT*0.6)}" y="${f(jy-jointH*0.5)}" width="${f(bodyW+wallT*1.2)}" height="${f(jointH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
          bolt(bodyX+wallT*0.2, jy) + bolt(bodyX+bodyW-wallT*0.2, jy);
      }

      // 仓顶盖板法兰（落在进料短管与仓身之间的 capH 区，兼作仓顶盖板）+ 均布螺栓
      const topFlW = bodyW + wallT*2;
      const topFl = `<rect x="${f(bodyX-wallT)}" y="${f(topY-capH)}" width="${f(topFlW)}" height="${f(capH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const topBolts = [0.10, 0.37, 0.63, 0.90]
        .map(u => bolt(bodyX-wallT + topFlW*u, topY-capH*0.5)).join('');

      // 锥底法兰（锥斗与出料管的连接法兰），出料管极短时省略
      const botFlH2 = Math.min(stripH, Math.max(0, outletH));
      const botFl = outletH > 0.6 ? `<rect x="${f(botX-wallT)}" y="${f(coneBotY)}" width="${f(botW+wallT*2)}" height="${f(botFlH2)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>` : '';
      const botBolts = outletH > 0.6
        ? bolt(botX-wallT*0.2, coneBotY+botFlH2*0.5) + bolt(botX+botW+wallT*0.2, coneBotY+botFlH2*0.5)
        : '';

      /* 仓身人孔/检修门（清仓、检修用）：门板 + 两条铰链 + 把手，
         沿用 bucketElevator 观察门画法（#1a1f33 / #3a4060 / #8e96b6），
         居中偏下，让开料位条与右侧接管。*/
      const doorW = Math.max(4, Math.min(w*0.20, bodyW*0.26));
      const doorH = Math.max(3, Math.min(bodyH*0.45, doorW*0.85));
      const doorX = bodyX + (bodyW-doorW)/2;
      const doorY = Math.max(topY + padT, bodyBotY - padT - doorH - bodyH*0.10);
      const door =
        `<rect x="${f(doorX)}" y="${f(doorY)}" width="${f(doorW)}" height="${f(doorH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.26)}" y1="${f(doorY+1.4)}" x2="${f(doorX+doorW*0.26)}" y2="${f(doorY+doorH-1.4)}" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.74)}" y1="${f(doorY+1.4)}" x2="${f(doorX+doorW*0.74)}" y2="${f(doorY+doorH-1.4)}" stroke="#3a4060" stroke-width="1"/>` +
        `<circle cx="${f(doorX+doorW*0.5)}" cy="${f(doorY+doorH*0.5)}" r="${f(Math.max(0.6, Math.min(doorW,doorH)*0.13))}" fill="#8e96b6" opacity="0.75"/>`;

      /* 仓内爬梯（检修用）：两条竖杆 + 横档，横档数按可用高度自适应，
         贴在仓内左侧、料位条之下，压在把合法兰条之上保持连续。*/
      const railGap = Math.max(1.6, Math.min(4, bodyW*0.055));
      const railW = Math.max(0.5, Math.min(1.2, w*0.010));
      const ladX = bodyX + padT + Math.max(1.2, bodyW*0.05);
      const ladY0 = barY + barH + Math.max(1.5, bodyH*0.045);
      const ladY1 = bodyBotY - padT;
      const ladLen = ladY1 - ladY0;
      let rungs = '';
      let ladder = '';
      if (ladLen > railGap*2) {
        const nRung = Math.max(2, Math.round(ladLen/(railGap*1.8)));
        for(let i=0;i<nRung;i++){
          const ry = ladY0 + ladLen*(i/(nRung-1));
          rungs += `<line x1="${f(ladX)}" y1="${f(ry)}" x2="${f(ladX+railGap)}" y2="${f(ry)}"/>`;
        }
        ladder = `<g stroke="#9aa2bc" stroke-width="${f(railW)}" opacity="0.55" stroke-linecap="round">
          <line x1="${f(ladX)}" y1="${f(ladY0)}" x2="${f(ladX)}" y2="${f(ladY1)}"/>
          <line x1="${f(ladX+railGap)}" y1="${f(ladY0)}" x2="${f(ladX+railGap)}" y2="${f(ladY1)}"/>
          ${rungs}
        </g>`;
      }

      /* 支腿与基础：料仓属高位仓，靠两侧支腿落地。
         支腿自仓身下沿（锥顶）直落到基础板上沿，基础板下沿与 bottom 端口同高（y=h），
         地脚螺栓落在基础板两端；斜撑自支腿内侧斜拉到锥斗壁上（沿锥面 85% 处），
         全部尺寸定尺封顶，且与中部出料管、锥底法兰互不干涉。*/
      const baseH = Math.max(1.5, Math.min(4, h*0.020));
      const legW = Math.max(2, Math.min(6, w*0.060));
      const legY0 = bodyBotY;
      const legY1 = Math.max(legY0, h - baseH);
      const legH = legY1 - legY0;
      const legX0 = bodyX + wallT*0.5;
      const legX1 = bodyX + bodyW - wallT*0.5 - legW;
      const basePad = Math.max(0.8, Math.min(2, legW*0.40));
      const anchorR = Math.max(0.35, Math.min(boltR, baseH*0.35));
      const anchor = (bx,by)=>`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(anchorR)}" fill="#8e96b6" opacity="0.85"/>`;

      let legs = '', bases = '', braces = '';
      if (legH > 0.5) {
        legs =
          `<rect x="${f(legX0)}" y="${f(legY0)}" width="${f(legW)}" height="${f(legH)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>` +
          `<rect x="${f(legX1)}" y="${f(legY0)}" width="${f(legW)}" height="${f(legH)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>`;
        bases =
          `<rect x="${f(legX0-basePad)}" y="${f(h-baseH)}" width="${f(legW+basePad*2)}" height="${f(baseH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
          `<rect x="${f(legX1-basePad)}" y="${f(h-baseH)}" width="${f(legW+basePad*2)}" height="${f(baseH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
          anchor(legX0-basePad*0.35, h-baseH*0.5) + anchor(legX0+legW+basePad*0.35, h-baseH*0.5) +
          anchor(legX1-basePad*0.35, h-baseH*0.5) + anchor(legX1+legW+basePad*0.35, h-baseH*0.5);
      }
      // 斜撑：终点取锥面 85% 高度处的锥壁点（不与中部出料管相交）
      const braceW = Math.max(0.7, Math.min(1.6, legW*0.32));
      const coneInset = (bodyW - botW)/2;
      const braceToY = bodyBotY + coneH*0.85;
      if (legH > 2 && coneH > 1) {
        braces = `<g stroke="#9aa2bc" stroke-width="${f(braceW)}" opacity="0.85" stroke-linecap="round">
          <line x1="${f(legX0+legW)}" y1="${f(legY0+legH*0.15)}" x2="${f(bodyX+coneInset*0.85)}" y2="${f(braceToY)}"/>
          <line x1="${f(legX1)}" y1="${f(legY0+legH*0.15)}" x2="${f(bodyX+bodyW-coneInset*0.85)}" y2="${f(braceToY)}"/>
        </g>`;
      }

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
        <!-- 1. 设备后壁（仓身 + 锥斗，比金属层大一圈 wallT 形成壁厚） -->
        ${backBody}
        ${backCone}
        <!-- 2. 设备主体金属填充 -->
        ${metalBody}
        ${metalCone}
        <!-- 3. 内部深色腔（仓身 + 锥斗）+ 受裁剪的落料粒子 + 料位指示条 -->
        ${cavBody}
        ${cavCone}
        ${feedFlow}
        ${levelBar}
        <!-- 4. 接管三件套（顶进料管 / 底出料管 / 右侧接管） -->
        ${topPipe}
        ${botPipe}
        ${sidePipe}
        <!-- 5. 仓身把合法兰条（自动增多）+ 仓顶盖板法兰 + 锥底法兰 + 螺栓 -->
        ${joints}
        ${topFl}
        ${topBolts}
        ${botFl}
        ${botBolts}
        <!-- 6. 人孔检修门 + 仓内爬梯 -->
        ${door}
        ${ladder}
        <!-- 7. 支腿 / 基础板与地脚螺栓 / 锥斗斜撑 -->
        ${legs}
        ${bases}
        ${braces}
      `;
    }
};
