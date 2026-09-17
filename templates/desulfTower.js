/* ============================================================
 * PFD Editor · 组件模板：desulfTower
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.desulfTower。
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
      const c = p.color;
      const cx = w/2;
      const tw = w*0.58;
      const tx = (w - tw)/2;
      const r = tw/2;
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
      const clipId = `clip_tower_${Math.random().toString(36).substr(2,6)}`;
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

      const cone = `<polygon points="${tx},${botY} ${tx+tw},${botY} ${cx+r*0.3},${coneBotY} ${cx-r*0.3},${coneBotY}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
        <line x1="${tx+2}" y1="${botY+2}" x2="${cx-r*0.3+2}" y2="${coneBotY-1}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      const base = `<rect x="${cx-r*0.6}" y="${coneBotY}" width="${r*1.2}" height="${baseH}" rx="2" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <rect x="${cx-r*0.7}" y="${baseBotY-2}" width="${r*1.4}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;
      const body = `<rect x="${tx}" y="${topY}" width="${tw}" height="${tH}" fill="url(#gEquip)" stroke="${c}" stroke-width="2"/>
        <rect x="${tx+2}" y="${topY+1}" width="${tw-4}" height="${tH-2}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      const topCap = `<ellipse cx="${cx}" cy="${topY}" rx="${r}" ry="${h*0.03}" fill="#252545" stroke="${c}" stroke-width="1.5"/>
        <ellipse cx="${cx}" cy="${topY+2}" rx="${r-3}" ry="${h*0.022}" fill="#1a1835" opacity="0.6"/>`;

      // 2. 排气烟囱（锥形过渡+直管+法兰+防雨帽）
      const coneTopY = topY - h*0.02;
      const stackCone = `<polygon points="${cx-stackBaseW/2},${coneTopY} ${cx+stackBaseW/2},${coneTopY} ${cx+stackW/2},${stackBotY} ${cx-stackW/2},${stackBotY}" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <line x1="${cx-stackBaseW/2+2}" y1="${coneTopY+1}" x2="${cx-stackW/2+2}" y2="${stackBotY-1}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      const stackBody = `<rect x="${cx-stackW/2}" y="${stackOpenY}" width="${stackW}" height="${stackBotY-stackOpenY}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.5"/>
        <rect x="${cx-stackW/2+1}" y="${stackOpenY+1}" width="${stackW-2}" height="${stackBotY-stackOpenY-2}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      // 三道法兰环
      const flanges = [0.2, 0.55, 0.9].map(frac=>{
        const fy = stackOpenY + (stackBotY - stackOpenY)*(1-frac);
        return `<rect x="${cx-stackW/2-4}" y="${fy-3}" width="${stackW+8}" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
          <circle cx="${cx-stackW/2-1}" cy="${fy-0.5}" r="1.2" fill="${c}" opacity="0.5"/>
          <circle cx="${cx+stackW/2+1}" cy="${fy-0.5}" r="1.2" fill="${c}" opacity="0.5"/>`;
      }).join('');
      // 防雨帽（蘑菇形，顶点在y=0边界）
      const capY = capPeakY + capH*0.5;
      const rainCap = `<path d="M ${cx-capR} ${capY+2} Q ${cx} ${capPeakY} ${cx+capR} ${capY+2}" fill="#252545" stroke="${c}" stroke-width="1.3"/>
        <path d="M ${cx-capR*0.85} ${capY+3} Q ${cx} ${capPeakY+capH*0.3} ${cx+capR*0.85} ${capY+3}" fill="#1a1835" opacity="0.6"/>
        <line x1="${cx-stackW/2+3}" y1="${capY+1}" x2="${cx-stackW/2+3}" y2="${stackOpenY+2}" stroke="${c}" stroke-width="1.2"/>
        <line x1="${cx+stackW/2-3}" y1="${capY+1}" x2="${cx+stackW/2-3}" y2="${stackOpenY+2}" stroke="${c}" stroke-width="1.2"/>
        <line x1="${cx}" y1="${capY+1}" x2="${cx}" y2="${stackOpenY+2}" stroke="${c}" stroke-width="1.2"/>`;
      // 烟囱开口（在防雨帽下方）
      const stackTop = `<ellipse cx="${cx}" cy="${stackOpenY}" rx="${stackW/2}" ry="2.5" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <ellipse cx="${cx}" cy="${stackOpenY-1}" rx="${stackW/2-2}" ry="1.2" fill="#060515" opacity="0.8"/>`;

      const topPipe = stackCone + stackBody + flanges + stackTop + rainCap;

      // 2b. 排气特效（从烟囱口冒出，向上飘——允许超出组件顶部）
      const exhaustStartY = stackOpenY;
      let exhaustSteam = '';
      const steamCount = 10;
      for(let i=0; i<steamCount; i++){
        const phase = i/steamCount;
        const dur = 3.5 + (i%4)*0.6;
        const delay = -(phase*dur).toFixed(2);
        const seed = (i*37)%10;
        const baseX = cx - stackW*0.25 + (seed/10)*stackW*0.5;
        const sway = 4 + (i*19%5);
        const dir = i%2?1:-1;
        // 外层烟
        let sx=[], sy=[], sr=[], so=[];
        for(let k=0; k<=24; k++){
          const t = k/24;
          const y = exhaustStartY - h*0.20*t;
          const x = baseX + Math.sin(t*Math.PI*2 + phase*Math.PI*3)*sway + dir*t*sway*0.5;
          const r = 2.5 + t*8;
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
          const y = exhaustStartY - h*0.18*t - 2;
          const x = baseX - 1 + Math.sin(t*Math.PI*2 + phase*Math.PI*3 + 0.7)*(sway-1) + dir*t*sway*0.3;
          const r = 1.2 + t*5;
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

      // 3. 烟气入口（左侧，端口y:.74）
      const gasInY = h*0.74;
      const gasInH = h*0.044;
      const gasInX0 = tx - stubLen;          // 管口（= 端口锚点）
      const gasInPipe = `<path d="M ${gasInX0} ${gasInY-gasInH/2} L ${tx} ${gasInY-gasInH/2+2} L ${tx} ${gasInY+gasInH/2-2} L ${gasInX0} ${gasInY+gasInH/2} Z" fill="#1a1835" stroke="${c}" stroke-width="1.1"/>
        <rect x="${gasInX0}" y="${gasInY-gasInH/2-2}" width="5" height="${gasInH+4}" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
        <line x1="${gasInX0+7}" y1="${gasInY-gasInH/2+2}" x2="${tx-2}" y2="${gasInY-gasInH/2+4}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <circle cx="${gasInX0}" cy="${gasInY}" r="2" fill="${c}" opacity="0.3"/>`;

      // 4. 喷淋液入口管（右侧，端口y:.52）
      const sprayInY = h*0.52;
      const sprayPipeW = stubLen;     // 管口端即端口锚点（x = tx+tw+stubLen → 比例 .916）
      const sprayPipeH = h*0.035;
      const sprayInPipe = `<rect x="${tx+tw}" y="${sprayInY-sprayPipeH/2}" width="${sprayPipeW}" height="${sprayPipeH}" fill="#1a1835" stroke="${c}" stroke-width="1.1"/>
        <rect x="${tx+tw+stubLen-5}" y="${sprayInY-sprayPipeH/2-2}" width="5" height="${sprayPipeH+4}" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>`;

      // 5. 溢流口（左侧，端口y:.86，锥底位置）
      const overflowY = h*0.86;
      const overflowH = h*0.03;
      const coneT = (overflowY - botY) / coneH;
      const overflowWallX = cx - r + (r - r*0.3) * coneT;
      const overflowPipeX0 = overflowWallX - stubLen;   // 管口端即端口锚点（比例 .23625）
      const overflowPipe = `<rect x="${overflowPipeX0}" y="${overflowY-overflowH/2}" width="${stubLen}" height="${overflowH}" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        <rect x="${overflowPipeX0}" y="${overflowY-overflowH/2-2}" width="5" height="${overflowH+4}" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
        <circle cx="${overflowPipeX0}" cy="${overflowY}" r="2" fill="${c}" opacity="0.3"/>`;

      // 6. 喷淋层（3层，分布在塔体内）
      let sprayLayers = '';
      let droplets = '';
      const sprayFracs = [0.18, 0.38, 0.58];  // 相对塔体
      const dropColors = ['#7ec8ff', '#9ad4ff', '#b0ddff'];
      sprayFracs.forEach((frac, li)=>{
        const sy = topY + tH*frac;
        sprayLayers += `<rect x="${tx+2}" y="${sy-2}" width="${tw-4}" height="4" rx="2" fill="#252545" stroke="${c}" stroke-width="0.8"/>`;
        const nozzleCount = 5;
        for(let ni=0; ni<nozzleCount; ni++){
          const nx = tx + 8 + ni*((tw-16)/(nozzleCount-1));
          sprayLayers += `<circle cx="${nx}" cy="${sy+2}" r="2.5" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
            <circle cx="${nx}" cy="${sy+3}" r="1" fill="${c}" opacity="0.5"/>`;
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

      // 7. 除雾器（顶部，塔内最上方）
      const demistY = topY + 6;
      const demistH = h*0.05;
      let demister = `<rect x="${tx+3}" y="${demistY}" width="${tw-6}" height="${demistH}" fill="#0d0b20" stroke="${c}" stroke-width="0.8" opacity="0.8"/>`;
      for(let gi=0; gi<8; gi++){
        const gx = tx+4+gi*((tw-8)/7);
        demister += `<line x1="${gx.toFixed(1)}" y1="${demistY+1}" x2="${(gx+3.5).toFixed(1)}" y2="${demistY+demistH-1}" stroke="${c}" stroke-width="0.8" opacity="0.4"/>`;
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

      // 10. 人孔
      const manholeY = topY + tH*0.5;
      const manholes = `<ellipse cx="${tx+tw+2}" cy="${manholeY}" rx="5" ry="7" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        <circle cx="${tx+tw+2}" cy="${manholeY}" r="2" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <circle cx="${tx+tw+2}" cy="${manholeY}" r="1" fill="${c}" opacity="0.3"/>`;

      // 11. 环箍（3道，在塔体上）
      let bands = '';
      [0.2, 0.5, 0.8].forEach(frac=>{
        const by = topY+tH*frac;
        bands += `<rect x="${tx-1}" y="${by-2}" width="${tw+2}" height="4" rx="1" fill="#252545" stroke="${c}" stroke-width="0.6" opacity="0.7"/>`;
      });

      // 12. 铭牌（在底座下方，h范围内）
      const nameY = baseBotY + 2;
      const nameplate = `<rect x="${cx-28}" y="${nameY}" width="56" height="${nameBotY-nameY-2}" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${cx}" y="${nameY+(nameBotY-nameY-2)/2+3}" text-anchor="middle" fill="${c}" font-size="6" opacity="0.75">脱硫塔</text>`;

      // 13. 外部循环管（从溢流口管口沿外壁向上到喷淋层）
      const extPipe = `<path d="M ${overflowPipeX0} ${overflowY} L ${tx-9} ${overflowY} L ${tx-9} ${sprayInY} L ${tx+tw} ${sprayInY}" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.5"/>
        <path d="M ${overflowPipeX0} ${overflowY} L ${tx-9} ${overflowY} L ${tx-9} ${sprayInY} L ${tx+tw} ${sprayInY}" fill="none" stroke="#1a1835" stroke-width="1.5"/>
        <rect x="${tx+tw-2}" y="${sprayInY-3}" width="4" height="6" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>`;

      const clipDef = `<clipPath id="${clipId}"><rect x="${tx}" y="${topY}" width="${tw}" height="${tH}"/></clipPath>`;

      return `
        <defs>${clipDef}</defs>
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
        ${bands}
        ${topCap}
        ${topPipe}
        ${exhaustSteam}
        ${sprayInPipe}
        ${manholes}
        ${nameplate}
      `;
    }
};
