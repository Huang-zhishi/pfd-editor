/* ============================================================
 * PFD Editor · 组件模板：desulfTower
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.desulfTower。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属塔壳 / 锥底 / 烟囱 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *       #9aa2bc / #5b6280（件体明细）  #1a1f33 / #3a4060 / #8e96b6（门板 / 铰链 / 把手）
 * ============================================================ */

TEMPLATES.desulfTower = {
    name: '工业脱硫塔', category: '设备',
    defaultSize: { w: 120, h: 280 },
    ports: [
      {id:'gasIn',x:.084,y:.74,dir:'left'},
      {id:'gasOut',x:.5,y:0,dir:'up'},
      {id:'slurryOut',x:.5,y:1,dir:'down'},
      {id:'sprayIn',x:.916,y:.52,dir:'right'},
      {id:'overflow',x:.23625,y:.86,dir:'left'}
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'clip_tower_'+uid, metalId = 'dt_metal_'+uid, metalVId = 'dt_metalv_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const cx = w/2;
      const tw = w*0.58;
      const tx = (w - tw)/2;
      const r = tw/2;
      // 塔壁厚 / 内腔留边（定尺封顶），内腔左上角与可用宽度由此推出
      const wallT = Math.max(1.5, Math.min(4, tw*0.055));
      const innerL = tx + wallT;
      const innerW = tw - wallT*2;
      // 三根横向管道的伸出长度：管口端即端口锚点（端口 x 因此为 .084 / .23625 / .916）
      const stubLen = tx*0.6;
      // ── 垂直布局（全部在 0~h 范围内，排气蒸汽除外）──
      const capPeakY = 0;           // 防雨帽顶点（刚好在组件顶部边界）
      const stackOpenY = h*0.035;   // 烟囱顶部开口
      const stackBotY = h*0.437;    // 烟囱直管底部（= topY - 锥形过渡0.02h）
      const topY = h*0.457;         // 塔体顶部（塔身:烟囱 = 15:20）
      const botY = h*0.80;          // 塔体底部（锥顶开始）
      const coneBotY = h*0.88;      // 锥底结束
      const baseBotY = h*0.94;      // 底座结束
      const nameBotY = h*0.99;      // 铭牌底部
      const tH = botY - topY;
      const sprayDur = 2.5;
      const gasDur = 3;

      // 烟囱尺寸
      const stackW = tw*0.30;
      const stackBaseW = tw*0.42;
      const stackH = stackBotY - stackOpenY;
      const capH = h*0.038;
      const capR = stackW*0.75;

      // 1. 底座 + 锥底 + 塔体 + 顶帽
      const coneH = coneBotY - botY;
      const baseH = baseBotY - coneBotY;
      const nameH = nameBotY - baseBotY;

      // 锥底：金属渐变斗体 + #3f445c 描边（画法对齐 reactor 锥底）
      const cone = `<polygon points="${tx},${botY} ${tx+tw},${botY} ${cx+r*0.3},${coneBotY} ${cx-r*0.3},${coneBotY}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>`;
      // 底座（裙座）：法兰色 #2a2f45 + #3f445c 描边，底座脚板用件体色 #9aa2bc
      const base = `<rect x="${cx-r*0.6}" y="${coneBotY}" width="${r*1.2}" height="${baseH}" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>
        <rect x="${cx-r*0.7}" y="${baseBotY-2}" width="${r*1.4}" height="4" rx="1" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>`;
      // 塔体：金属塔壳 + 深色内腔（#12162b / #6a7192），内腔即塔内件与浆液的背景
      const body = `<rect x="${tx}" y="${topY}" width="${tw}" height="${tH}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
        <rect x="${f(innerL)}" y="${f(topY+wallT)}" width="${f(innerW)}" height="${f(tH-wallT*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;
      // 塔顶封头：法兰色 #2a2f45，内面 #12162b（画法对齐提升机顶盖）
      const topCap = `<ellipse cx="${cx}" cy="${topY}" rx="${r}" ry="${h*0.03}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>
        <ellipse cx="${cx}" cy="${topY+2}" rx="${r-3}" ry="${h*0.022}" fill="#12162b" opacity="0.75"/>`;

      // 2. 排气烟囱（锥形过渡+直管+法兰+防雨帽）
      // 锥形过渡：下宽（塔顶 stackBaseW @topY）→ 上窄（直管 stackW @stackBotY），金属壳 + #3f445c 描边
      // （原实现 coneTopY = topY-h*0.02 与 stackBotY 恒等，四点共线、喇叭口不可见，此处修正）
      const stackCone = `<polygon points="${f(cx-stackBaseW/2)},${f(topY)} ${f(cx+stackBaseW/2)},${f(topY)} ${f(cx+stackW/2)},${f(stackBotY)} ${f(cx-stackW/2)},${f(stackBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <line x1="${f(cx-stackBaseW/2)}" y1="${f(topY-1)}" x2="${f(cx-stackW/2+1)}" y2="${f(stackBotY)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
      // 烟囱直管：金属管壁 + 深色管腔（与塔体同一套画法）
      const stackWallT = Math.max(1, Math.min(2.5, stackW*0.08));
      const stackBody = `<rect x="${f(cx-stackW/2)}" y="${f(stackOpenY)}" width="${f(stackW)}" height="${f(stackBotY-stackOpenY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <rect x="${f(cx-stackW/2+stackWallT)}" y="${f(stackOpenY)}" width="${f(stackW-stackWallT*2)}" height="${f(stackBotY-stackOpenY-stackWallT)}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>`;
      // 三道法兰环（定尺封顶：板厚 / 外伸 / 螺栓半径不随烟囱放大变粗）
      const stackFlH = Math.max(2, Math.min(5, stackH*0.075));      // 法兰板厚
      const stackFlPad = Math.max(1.5, Math.min(4, stackW*0.18));   // 法兰外伸
      const stackBoltR = Math.max(0.7, Math.min(1.5, stackFlH*0.28)); // 螺栓半径
      const flanges = [0.2, 0.55, 0.9].map(frac=>{
        const fy = stackOpenY + (stackBotY - stackOpenY)*(1-frac);
        return `<rect x="${f(cx-stackW/2-stackFlPad)}" y="${f(fy-stackFlH/2)}" width="${f(stackW+stackFlPad*2)}" height="${f(stackFlH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
          <circle cx="${f(cx-stackW/2-stackFlPad*0.5)}" cy="${f(fy)}" r="${f(stackBoltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>
          <circle cx="${f(cx-stackW/2-stackFlPad*0.5)}" cy="${f(fy)}" r="${f(stackBoltR*0.4)}" fill="#8e96b6" opacity="0.9"/>
          <circle cx="${f(cx+stackW/2+stackFlPad*0.5)}" cy="${f(fy)}" r="${f(stackBoltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>
          <circle cx="${f(cx+stackW/2+stackFlPad*0.5)}" cy="${f(fy)}" r="${f(stackBoltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;
      }).join('');
      // 防雨帽（蘑菇形，顶点在y=0边界）：帽面 #2a2f45 + 内面 #12162b，三根支杆按烟囱直径定位
      const capY = capPeakY + capH*0.5;
      const capStrutX = stackW*0.38;                      // 支杆到中心的距离（随烟囱直径）
      const capStrutW = Math.max(0.8, Math.min(1.8, stackW*0.06));
      const rainCap = `<path d="M ${f(cx-capR)} ${f(capY+2)} Q ${cx} ${f(capPeakY)} ${f(cx+capR)} ${f(capY+2)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.3"/>
        <path d="M ${f(cx-capR*0.85)} ${f(capY+3)} Q ${cx} ${f(capPeakY+capH*0.3)} ${f(cx+capR*0.85)} ${f(capY+3)}" fill="#12162b" opacity="0.7"/>
        <line x1="${f(cx-capStrutX)}" y1="${f(capY+1)}" x2="${f(cx-capStrutX)}" y2="${f(stackOpenY+2)}" stroke="#9aa2bc" stroke-width="${f(capStrutW)}"/>
        <line x1="${f(cx+capStrutX)}" y1="${f(capY+1)}" x2="${f(cx+capStrutX)}" y2="${f(stackOpenY+2)}" stroke="#9aa2bc" stroke-width="${f(capStrutW)}"/>
        <line x1="${cx}" y1="${f(capY+1)}" x2="${cx}" y2="${f(stackOpenY+2)}" stroke="#9aa2bc" stroke-width="${f(capStrutW)}"/>`;
      // 烟囱顶部开口：#0c1020 收口 + #12162b 内腔（描边 #6a7192），口沿厚度定尺封顶
      const stackRimH = Math.max(1.2, Math.min(3, stackW*0.12));
      const stackTop = `<ellipse cx="${cx}" cy="${f(stackOpenY)}" rx="${f(stackW/2)}" ry="${f(stackRimH)}" fill="#0c1020" stroke="#6a7192" stroke-width="1"/>
        <ellipse cx="${cx}" cy="${f(stackOpenY-1)}" rx="${f(stackW/2-2)}" ry="${f(stackRimH*0.5)}" fill="#12162b" opacity="0.85"/>`;

      const topPipe = stackCone + stackBody + flanges + stackTop + rainCap;

      // 2b. 排气特效（从烟囱口冒出，向上飘——允许超出组件顶部）
      const exhaustStartY = stackOpenY;
      // 粒径 / 摆动幅度按烟囱直径缩放（定尺封顶）：小尺寸不糊成一团，大尺寸不缩成小点
      const exR0 = Math.max(1.4, Math.min(4, stackW*0.12));      // 外层起始半径（默认 ≈2.5）
      const exRGrow = Math.max(4, Math.min(14, stackW*0.38));    // 外层半径增量（默认 ≈8）
      const exSway = Math.max(1.5, Math.min(8, stackW*0.19));    // 摆动基数（默认 ≈4）
      let exhaustSteam = '';
      const steamCount = 10;
      for(let i=0; i<steamCount; i++){
        const phase = i/steamCount;
        const dur = 3.5 + (i%4)*0.6;
        const delay = -(phase*dur).toFixed(2);
        const seed = (i*37)%10;
        const baseX = cx - stackW*0.25 + (seed/10)*stackW*0.5;
        const sway = exSway*(1 + (i*19%5)*0.25);
        const dir = i%2?1:-1;
        // 外层烟
        let sx=[], sy=[], sr=[], so=[];
        for(let k=0; k<=24; k++){
          const t = k/24;
          const y = exhaustStartY - h*0.20*t;
          const x = baseX + Math.sin(t*Math.PI*2 + phase*Math.PI*3)*sway + dir*t*sway*0.5;
          const r = exR0 + t*exRGrow;
          const op = t < 0.1 ? t/0.1*0.28 : (t > 0.75 ? (1-t)/0.25*0.28 : 0.28);
          sx.push(x.toFixed(1)); sy.push(y.toFixed(1)); sr.push(r.toFixed(1)); so.push(op.toFixed(2));
        }
        exhaustSteam += `<circle cx="${sx[0]}" cy="${sy[0]}" r="${sr[0]}" fill="#dce5ff" opacity="${so[0]}">
          <animate attributeName="cx" values="${sx.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${sy.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${sr.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${so.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
        // 内层烟
        let sx2=[], sy2=[], sr2=[], so2=[];
        for(let k=0; k<=24; k++){
          const t = k/24;
          const y = exhaustStartY - h*0.18*t - stackW*0.08;
          const x = baseX - stackW*0.05 + Math.sin(t*Math.PI*2 + phase*Math.PI*3 + 0.7)*(sway*0.75) + dir*t*sway*0.3;
          const r = exR0*0.48 + t*exRGrow*0.62;
          const op = t < 0.08 ? t/0.08*0.18 : (t > 0.7 ? (1-t)/0.3*0.18 : 0.18);
          sx2.push(x.toFixed(1)); sy2.push(y.toFixed(1)); sr2.push(r.toFixed(1)); so2.push(op.toFixed(2));
        }
        exhaustSteam += `<circle cx="${sx2[0]}" cy="${sy2[0]}" r="${sr2[0]}" fill="#eef2ff" opacity="${so2[0]}">
          <animate attributeName="cx" values="${sx2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${sy2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${sr2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${so2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`;
      }

      /* 3. 三根横向接管（烟气入口 / 喷淋液入口 / 溢流口）统一画法 —— 对齐除尘布袋净化气出口接管：
         金属管壁（metalVId）+ 深色管腔（#12162b / #6a7192）+ 端面法兰（#2a2f45 / #3f445c）+ 两颗螺栓（#8e96b6）。
         管壁厚 / 法兰板厚 / 螺栓半径按管高定尺封顶；端面法兰画在管口内侧，管口最外端坐标不变（即端口锚点）。*/
      const pipeWallT = ph => Math.max(0.8, Math.min(2, ph*0.16));
      const pipeFlW = ph => Math.max(2, Math.min(5, ph*0.34));
      const pipeBoltR = ph => Math.max(0.6, Math.min(1.2, ph*0.09));
      const makePipe = (x0, x1, cy, ph, side)=>{
        const wl = pipeWallT(ph), flW = pipeFlW(ph), boltR = pipeBoltR(ph);
        const flH = ph + flW*0.7;
        // side='left' → 管口在左端 x0；side='right' → 管口在右端 x1（管口最外端即端口锚点，不得外扩）
        const flX = (side === 'right') ? x1 - flW - wl*0.4 : x0 + wl*0.4;
        return `<rect x="${f(x0)}" y="${f(cy-ph/2)}" width="${f(x1-x0)}" height="${f(ph)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
          <rect x="${f(x0)}" y="${f(cy-ph/2+wl)}" width="${f(x1-x0)}" height="${f(ph-wl*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
          <rect x="${f(flX)}" y="${f(cy-flH/2)}" width="${f(flW)}" height="${f(flH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
          <circle cx="${f(flX+flW/2)}" cy="${f(cy-flH*0.28)}" r="${f(boltR)}" fill="#8e96b6" opacity="0.85"/>
          <circle cx="${f(flX+flW/2)}" cy="${f(cy+flH*0.28)}" r="${f(boltR)}" fill="#8e96b6" opacity="0.85"/>`;
      };

      // 3a. 烟气入口（左侧，端口 y:.74）：管口最外端 gasInX0 = 端口锚点（x 比例 .084）
      const gasInY = h*0.74;
      const gasInH = Math.max(3, Math.min(14, h*0.044));   // 管高（定尺封顶）
      const gasInX0 = tx - stubLen;                        // 管口（= 端口锚点）
      const gasInPipe = makePipe(gasInX0, tx, gasInY, gasInH, 'left');

      // 4. 喷淋液入口管（右侧，端口 y:.52）：管口最外端 tx+tw+stubLen = 端口锚点（x 比例 .916）
      const sprayInY = h*0.52;
      const sprayPipeW = stubLen;                          // 管口端即端口锚点（x = tx+tw+stubLen → 比例 .916）
      const sprayPipeH = Math.max(3, Math.min(14, h*0.035));
      const sprayInPipe = makePipe(tx+tw, tx+tw+sprayPipeW, sprayInY, sprayPipeH, 'right');

      // 5. 溢流口（左侧，端口 y:.86，锥底位置）：管口最外端 overflowPipeX0 = 端口锚点（x 比例 .23625）
      const overflowY = h*0.86;
      const overflowH = Math.max(2.5, Math.min(12, h*0.03));
      const coneT = (overflowY - botY) / coneH;
      const overflowWallX = cx - r + (r - r*0.3) * coneT;
      const overflowPipeX0 = overflowWallX - stubLen;      // 管口端即端口锚点（比例 .23625）
      const overflowPipe = makePipe(overflowPipeX0, overflowWallX, overflowY, overflowH, 'left');

      // 6. 喷淋层（3层，分布在塔体内）：法兰色横管 + 深色喷口 + 彩色液滴
      let sprayLayers = '';
      let droplets = '';
      const sprayFracs = [0.18, 0.38, 0.58];  // 相对塔体
      const dropColors = ['#7ec8ff', '#9ad4ff', '#b0ddff'];
      sprayFracs.forEach((frac, li)=>{
        const sy = topY + tH*frac;
        sprayLayers += `<rect x="${f(tx+2)}" y="${f(sy-2)}" width="${f(tw-4)}" height="4" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
          <line x1="${f(tx+4)}" y1="${f(sy-1.3)}" x2="${f(tx+tw-4)}" y2="${f(sy-1.3)}" stroke="#6a7192" stroke-width="0.6" opacity="0.5"/>`;
        const nozzleCount = 5;
        for(let ni=0; ni<nozzleCount; ni++){
          const nx = tx + 8 + ni*((tw-16)/(nozzleCount-1));
          sprayLayers += `<circle cx="${f(nx)}" cy="${f(sy+2)}" r="2.5" fill="#12162b" stroke="#3f445c" stroke-width="0.8"/>
            <circle cx="${f(nx)}" cy="${f(sy+3)}" r="1" fill="${c}" opacity="0.5"/>`;
          const dropCount = 3;
          for(let di=0; di<dropCount; di++){
            const phase = (di/dropCount + li*0.15 + ni*0.07);
            const delay = -(phase*sprayDur).toFixed(2);
            const seed = (ni*7 + di*13 + li*3)%10;
            const dx = nx + ((di%2?1:-1)*(2+seed*0.5)-3);
            const fallDist = tH*0.10;
            const endY = sy + fallDist;
            let dy=[], dr=[], do_=[];
            for(let k=0; k<=14; k++){
              const t = k/14;
              dy.push((sy+4+(endY-sy-4)*t).toFixed(1));
              dr.push((1+t*1.2).toFixed(1));
              do_.push(t<0.1?t/0.1*0.65:(t>0.85?(1-t)/0.15*0.65:0.65).toFixed(2));
            }
            droplets += `<circle cx="${dx.toFixed(1)}" cy="${dy[0]}" r="${dr[0]}" fill="${dropColors[li]}" clip-path="url(#${clipId})" opacity="${do_[0]}">
              <animate attributeName="cy" values="${dy.join(';')}" dur="${sprayDur}s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="r" values="${dr.join(';')}" dur="${sprayDur}s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="${do_.join(';')}" dur="${sprayDur}s" begin="${delay}s" repeatCount="indefinite"/>
            </circle>`;
          }
        }
      });

      // 7. 除雾器（顶部，塔内最上方）：件体色栅板（#5b6280 板面 / #9aa2bc 亮边与斜栅条）
      const demistY = topY + 6;
      const demistH = h*0.05;
      let demister = `<rect x="${f(tx+3)}" y="${f(demistY)}" width="${f(tw-6)}" height="${f(demistH)}" rx="0.8" fill="#5b6280" stroke="#9aa2bc" stroke-width="0.8" opacity="0.9"/>`;
      for(let gi=0; gi<8; gi++){
        const gx = tx+4+gi*((tw-8)/7);
        demister += `<line x1="${f(gx)}" y1="${f(demistY+1)}" x2="${f(gx+3.5)}" y2="${f(demistY+demistH-1)}" stroke="#9aa2bc" stroke-width="0.8" opacity="0.75"/>`;
      }

      // 8. 烟气上升粒子
      let gasParticles = '';
      const gasCount = 8;
      for(let i=0; i<gasCount; i++){
        const phase = i/gasCount;
        const delay = -(phase*gasDur).toFixed(2);
        const startX = tx+tw*0.2+(i%5)*(tw*0.6/4);
        let gx=[], gy=[], gop=[], gr=[];
        for(let k=0; k<=20; k++){
          const t = k/20;
          const y = gasInY-(gasInY-(topY+demistH+8))*t;
          const x = startX+Math.sin(t*Math.PI*3+phase*Math.PI*2)*6+(i%2?1:-1)*t*4;
          const r = 1.2+t*0.8;
          const op = t<0.15?t/0.15*0.45:(t>0.8?(1-t)/0.2*0.45:0.45);
          gx.push(x.toFixed(1)); gy.push(y.toFixed(1)); gop.push(op.toFixed(2)); gr.push(r.toFixed(1));
        }
        gasParticles += `<circle cx="${gx[0]}" cy="${gy[0]}" r="${gr[0]}" fill="#c8b8ff" clip-path="url(#${clipId})" opacity="${gop[0]}">
          <animate attributeName="cx" values="${gx.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${gy.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${gr.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${gop.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 9. 浆液池液面（波纹动画，在锥底上方）
      const liquidY = botY - h*0.03;
      let fillVals=[], strokeVals=[];
      for(let k=0; k<=12; k++){
        let sPts=[], fPts=[];
        for(let si=0; si<=20; si++){
          const x = tx+4+si*((tw-8)/20);
          const y = liquidY+Math.sin(si*0.5+k*0.5)*2;
          sPts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
          fPts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        strokeVals.push(`M ${tx+4} ${liquidY+1} ${sPts.join(' ')}`);
        fillVals.push(`M ${tx+4} ${liquidY+1} ${fPts.join(' ')} L ${tx+tw-4} ${botY-2} L ${tx+4} ${botY-2} Z`);
      }
      const liquid = `<path d="${fillVals[0]}" fill="${c}" opacity="0.2" clip-path="url(#${clipId})">
          <animate attributeName="d" values="${fillVals.join(';')}" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="${strokeVals[0]}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4" clip-path="url(#${clipId})">
          <animate attributeName="d" values="${strokeVals.join(';')}" dur="3s" repeatCount="indefinite"/>
        </path>`;

      // 10. 人孔 → 提升机式观察门（门板 #1a1f33 / 两条铰链 #3a4060 / 把手 #8e96b6），贴在塔壁右侧
      const manholeY = topY + tH*0.5;
      const mhW = Math.max(4, Math.min(7, tw*0.09));
      const mhH = mhW*1.35;
      const mhX = tx + tw + 1;
      const mhTop = manholeY - mhH/2;
      const manholes = `<rect x="${f(mhX)}" y="${f(mhTop)}" width="${f(mhW)}" height="${f(mhH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>
        <line x1="${f(mhX+mhW*0.28)}" y1="${f(mhTop+1.6)}" x2="${f(mhX+mhW*0.28)}" y2="${f(manholeY+mhH/2-1.6)}" stroke="#3a4060" stroke-width="1"/>
        <line x1="${f(mhX+mhW*0.72)}" y1="${f(mhTop+1.6)}" x2="${f(mhX+mhW*0.72)}" y2="${f(manholeY+mhH/2-1.6)}" stroke="#3a4060" stroke-width="1"/>
        <circle cx="${f(mhX+mhW*0.5)}" cy="${f(manholeY)}" r="${f(Math.min(mhW,mhH)*0.11)}" fill="#8e96b6" opacity="0.7"/>`;

      // 11. 环箍（3道，在塔体上）：件体色 #9aa2bc / #5b6280
      //     位置取喷淋层之间的空档（sprayFracs + 0.10），避免与除雾器 / 喷淋层叠压
      let bands = '';
      sprayFracs.map(fr=>fr+0.10).forEach(frac=>{
        const by = topY+tH*frac;
        bands += `<rect x="${f(tx-1)}" y="${f(by-2)}" width="${f(tw+2)}" height="4" rx="1" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.6" opacity="0.85"/>
          <line x1="${f(tx-1)}" y1="${f(by)}" x2="${f(tx+tw+1)}" y2="${f(by)}" stroke="#5b6280" stroke-width="0.5" opacity="0.7"/>`;
      });

      // 11b. 塔体把合法兰（塔顶 / 塔底接头）+ 标准节焊缝（画在塔壁壳上，随塔身加高增多，定尺封顶）
      const bodyFlH = Math.max(2, Math.min(5, tH*0.055));
      const bodyFlPad = Math.max(1.5, Math.min(4, tw*0.055));
      const bodyBoltR = Math.max(0.5, Math.min(1.1, bodyFlH*0.26));
      const bodyFlange = [topY, botY].map(fy=>
        `<rect x="${f(tx-bodyFlPad)}" y="${f(fy-bodyFlH/2)}" width="${f(tw+bodyFlPad*2)}" height="${f(bodyFlH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <circle cx="${f(tx-bodyFlPad*0.5)}" cy="${f(fy)}" r="${f(bodyBoltR)}" fill="#8e96b6" opacity="0.85"/>
        <circle cx="${f(tx+tw+bodyFlPad*0.5)}" cy="${f(fy)}" r="${f(bodyBoltR)}" fill="#8e96b6" opacity="0.85"/>`
      ).join('');
      const segCount = Math.max(1, Math.min(6, Math.round(tH/Math.max(10, h*0.09))));
      const segTick = Math.max(2, Math.min(4, wallT*0.9));   // 焊缝标记长度（只画在塔壁上，不压塔内件）
      let segments = '';
      for(let si=0; si<segCount; si++){
        const sy = topY + tH*((si+0.5)/segCount);
        segments += `<line x1="${f(tx)}" y1="${f(sy)}" x2="${f(tx+wallT+segTick)}" y2="${f(sy)}" stroke="#5b6280" stroke-width="0.9" opacity="0.9"/>
          <line x1="${f(tx+tw-wallT-segTick)}" y1="${f(sy)}" x2="${f(tx+tw)}" y2="${f(sy)}" stroke="#5b6280" stroke-width="0.9" opacity="0.9"/>`;
      }

      // 12. 铭牌（底座下方，底边收进 h 范围内）：法兰色板面 + 钢印字
      const nameY = baseBotY + 2;
      const namePlateH = Math.max(4, nameBotY - nameY - 2);
      const nameplate = `<rect x="${cx-28}" y="${f(nameY)}" width="56" height="${f(namePlateH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <text x="${cx}" y="${f(nameY+namePlateH/2+2.2)}" text-anchor="middle" fill="${c}" font-size="6" opacity="0.85">脱硫塔</text>`;

      // 13. 外部循环管（从溢流口管口沿外壁向上接至喷淋液入口）：件体色管壁 + 深色内衬 + 弯头
      const circX = tx - Math.max(2, Math.min(9, w*0.075));       // 立管中心（定尺封顶）
      const circW = Math.max(1.5, Math.min(4, w*0.022));          // 管径（定尺封顶）
      const circPath = `M ${f(overflowPipeX0)} ${f(overflowY)} L ${f(circX)} ${f(overflowY)} L ${f(circX)} ${f(sprayInY)} L ${f(tx+tw)} ${f(sprayInY)}`;
      const extPipe = `<path d="${circPath}" fill="none" stroke="#9aa2bc" stroke-width="${f(circW)}" opacity="0.85"/>
        <path d="${circPath}" fill="none" stroke="#1a1f33" stroke-width="${f(circW*0.5)}"/>
        <rect x="${f(circX-circW*0.8)}" y="${f(overflowY-circW*0.8)}" width="${f(circW*1.6)}" height="${f(circW*1.6)}" rx="0.6" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;

      // clipPath 内缩到塔体内腔：塔内件 / 液滴 / 粒子不会溢出塔壁
      const clipDef = `<clipPath id="${clipId}"><rect x="${f(innerL)}" y="${f(topY+wallT)}" width="${f(innerW)}" height="${f(tH-wallT*2)}"/></clipPath>`;

      return `
        <defs>
          ${clipDef}
          <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
          <linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
        </defs>
        ${base}
        ${cone}
        ${gasInPipe}
        ${overflowPipe}
        ${extPipe}
        ${body}
        <g clip-path="url(#${clipId})">
          ${liquid}
          ${demister}
          ${sprayLayers}
          ${droplets}
          ${gasParticles}
        </g>
        ${segments}
        ${bands}
        ${topCap}
        ${bodyFlange}
        ${topPipe}
        ${exhaustSteam}
        ${sprayInPipe}
        ${manholes}
        ${nameplate}
      `;
    }
};
