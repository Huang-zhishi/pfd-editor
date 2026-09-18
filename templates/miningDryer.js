/* ============================================================
 * PFD Editor · 组件模板：miningDryer（矿用烘干机）
 *   结构（回转滚筒式，独立设计的简版）：
 *     卧式回转筒体 + 筒内扬料板 + 滚圈/托轮支撑 + 大齿圈传动装置
 *     + 进料口 / 热风进口 / 出料口 / 废气出口
 *   端口比例（须与文件顶部 ports 同步）：
 *     feed.y=0.30、hotAir.y=0.66、discharge.y=0.62、exhaust.x=0.70
 * ============================================================ */

TEMPLATES.miningDryer = {
    name: '矿用烘干机', category: '设备',
    defaultSize: { w: 340, h: 160 },
    ports: [
      {id:'feed',      x:0,   y:.30, dir:'left'},
      {id:'hotAir',    x:0,   y:.66, dir:'left'},
      {id:'discharge', x:1,   y:.62, dir:'right'},
      {id:'exhaust',   x:.70, y:0,   dir:'up'}
    ],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      // 定尺封顶：F 固定小数位；K 细部基准；逐量 clamp(比例量, 下限, 上限)
      const F = v=>(+v).toFixed(2);
      const clamp = (v, lo, hi)=>Math.max(lo, Math.min(hi, v));
      const K = clamp(Math.min(w/340, h/160), 0.3, 2.4);
      const uid = Math.random().toString(36).substr(2,6);
      const metalId  = `md_metal_${uid}`;
      const metalVId = `md_metalv_${uid}`;
      const shadeId  = `md_shade_${uid}`;
      const clipInId = `md_clipin_${uid}`;

      // —— 端口锚点比例（须与文件顶部 ports 定义同步）——
      const feedYR = 0.30, hotAirYR = 0.66, dischYR = 0.62, exhXR = 0.70;

      // —— 卧式回转筒体 ——
      const cy = h*0.46;
      const R = h*0.26;
      const drumL = w*0.16, drumR = w*0.82;
      const drumW = Math.max(1, drumR - drumL);
      const drumTop = cy - R, drumBot = cy + R;
      const drumInset = clamp(R*0.09, 1.5, 3.5);
      const wallSW = clamp(K*1.6, 1.1, 2.2);

      // —— 地面基线 ——
      const footH = clamp(R*0.16, 2, 6);
      const baseY = h - footH;

      const bolt = (bx,by,r)=>`<circle cx="${F(bx)}" cy="${F(by)}" r="${F(r)}" fill="#8e96b6" stroke="#5b6280" stroke-width="0.5"/>`;

      // —— 滚圈 / 托轮支撑（2 组，位于滚圈正下方）——
      const ring1X = drumL + drumW*0.28;
      const ring2X = drumL + drumW*0.72;
      const rollerR = clamp(R*0.20, 3, 9);
      const rollerOff = clamp(rollerR*1.45, 4, 14);
      const rollerCY = cy + R + rollerR*0.35;
      let supports = '';
      [ring1X, ring2X].forEach(rx=>{
        const baseW = clamp(rollerOff*2 + rollerR*2 + clamp(K*8,4,14), 16, w*0.3);
        const baseX = rx - baseW/2;
        const pedH = Math.max(1, baseY - (rollerCY + rollerR*0.6));
        supports += `
          <path d="M ${F(baseX)} ${F(baseY)} L ${F(rx-rollerOff)} ${F(rollerCY+rollerR*0.6)} L ${F(rx+rollerOff)} ${F(rollerCY+rollerR*0.6)} L ${F(baseX+baseW)} ${F(baseY)} Z" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.9"/>
          <rect x="${F(baseX)}" y="${F(baseY)}" width="${F(baseW)}" height="${F(footH)}" rx="1" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
          <circle cx="${F(rx-rollerOff)}" cy="${F(rollerCY)}" r="${F(rollerR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
          <circle cx="${F(rx+rollerOff)}" cy="${F(rollerCY)}" r="${F(rollerR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
          <circle cx="${F(rx-rollerOff)}" cy="${F(rollerCY)}" r="${F(clamp(rollerR*0.28,1,2.4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
          <circle cx="${F(rx+rollerOff)}" cy="${F(rollerCY)}" r="${F(clamp(rollerR*0.28,1,2.4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
          <rect x="${F(rx-rollerOff*0.35)}" y="${F(rollerCY)}" width="${F(rollerOff*0.7)}" height="${F(Math.max(1,pedH))}" fill="#12162b" opacity="0.25"/>`;
      });

      // —— 筒体主体（圆柱明暗 + 两端闷头）——
      const drumBody = `
        <rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.28)}" ry="${F(R)}" fill="url(#${shadeId})" stroke="#3f445c" stroke-width="${F(wallSW)}"/>
        <rect x="${F(drumL+drumInset)}" y="${F(drumTop+drumInset)}" width="${F(Math.max(1,drumW-2*drumInset))}" height="${F(R*0.4)}" rx="${F(R*0.2)}" ry="${F(R*0.4)}" fill="#5b6280" opacity="0.32"/>
        <ellipse cx="${F(drumL)}" cy="${F(cy)}" rx="${F(R*0.28)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.1" opacity="0.7"/>
        <ellipse cx="${F(drumR)}" cy="${F(cy)}" rx="${F(R*0.28)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.1" opacity="0.7"/>`;

      // —— 进料管（左端上部，湿料进）——
      const feedY = h*feedYR;
      const feedH = clamp(K*8, 5, 12);
      const feedFlW = clamp(K*4, 2.5, 5), feedFlH = clamp(feedH*1.5, 8, 20);
      const feedPipe = `
        <rect x="0" y="${F(feedY-feedH/2)}" width="${F(Math.max(1,drumL))}" height="${F(feedH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="0" y="${F(feedY-feedFlH/2)}" width="${F(feedFlW)}" height="${F(feedFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${bolt(feedFlW/2, feedY-feedFlH*0.26, clamp(K,0.7,1.3))}${bolt(feedFlW/2, feedY+feedFlH*0.26, clamp(K,0.7,1.3))}`;

      // —— 热风进口（左端下部，接热风炉）——
      const hotY = h*hotAirYR;
      const hotH = clamp(K*9, 5, 14);
      const hotFlW = clamp(K*4, 2.5, 5), hotFlH = clamp(hotH*1.4, 8, 20);
      const hotPipe = `
        <rect x="0" y="${F(hotY-hotH/2)}" width="${F(Math.max(1,drumL))}" height="${F(hotH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="0" y="${F(hotY-hotFlH/2)}" width="${F(hotFlW)}" height="${F(hotFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${bolt(hotFlW/2, hotY-hotFlH*0.26, clamp(K,0.7,1.3))}${bolt(hotFlW/2, hotY+hotFlH*0.26, clamp(K,0.7,1.3))}`;

      // —— 出料管（右端，干料出）——
      const disY = h*dischYR;
      const disH = clamp(K*8, 5, 12);
      const disFlW = clamp(K*4, 2.5, 5);
      const disPipeLen = Math.max(1, w - drumR);
      const dischPipe = `
        <rect x="${F(drumR)}" y="${F(disY-disH/2)}" width="${F(disPipeLen)}" height="${F(disH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(w-disFlW)}" y="${F(disY-disH*0.8)}" width="${F(disFlW)}" height="${F(disH*1.6)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${bolt(w-disFlW/2, disY-disH*0.4, clamp(K,0.7,1.3))}${bolt(w-disFlW/2, disY+disH*0.4, clamp(K,0.7,1.3))}`;

      // —— 废气出口（顶部竖直管 + 顶法兰）——
      const exhCX = w*exhXR;
      const exhHalf = clamp(K*5, 3, 8);
      const exhFlW = clamp(K*18, 11, 26), exhFlH = clamp(K*4, 2.5, 5);
      const exhPipeH = Math.max(1, drumTop - exhFlH);
      const exhDuct = `
        <rect x="${F(exhCX-exhHalf)}" y="${F(exhFlH)}" width="${F(exhHalf*2)}" height="${F(exhPipeH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(exhCX-exhHalf+clamp(K*1.2,0.8,1.6))}" y="${F(exhFlH)}" width="${F(Math.max(1,(exhHalf-clamp(K*1.2,0.8,1.6))*2))}" height="${F(exhPipeH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>
        <rect x="${F(exhCX-exhFlW/2)}" y="0" width="${F(exhFlW)}" height="${F(exhFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      const exhBolts = bolt(exhCX-exhFlW*0.3, exhFlH*0.5, clamp(K,0.7,1.3)) + bolt(exhCX+exhFlW*0.3, exhFlH*0.5, clamp(K,0.7,1.3));

      // —— 筒内：热风辉光（靠进风端）+ 扬料板 + 物料颗粒 ——
      const glowL = drumL + drumInset;
      const glowR = drumL + drumW*0.45;
      const heatGlow = `
        <rect x="${F(glowL)}" y="${F(drumTop+drumInset)}" width="${F(Math.max(1,glowR-glowL))}" height="${F(Math.max(1,R*2-2*drumInset))}" fill="#ff6a10" opacity="0.14" clip-path="url(#${clipInId})">
          <animate attributeName="opacity" values="0.08;0.22;0.08" dur="2.2s" repeatCount="indefinite"/>
        </rect>`;

      let flights = '';
      const flTop = drumTop + drumInset*2;
      const flLen = clamp(R*0.45, 3, 20);
      for(let i=0;i<5;i++){
        const fx = drumL + drumW*(0.16 + i*0.17);
        flights += `<line x1="${F(fx)}" y1="${F(flTop)}" x2="${F(fx)}" y2="${F(flTop+flLen)}" stroke="#9aa2bc" stroke-width="${F(clamp(K*2,1.2,3))}" stroke-linecap="round" opacity="0.55" clip-path="url(#${clipInId})"/>`;
      }

      const matInset = clamp(drumW*0.06, 4, 16);
      const matAmp = clamp(K*2, 1, 4), matR0 = clamp(K*1.3, 0.8, 2.2);
      let matParticles = '';
      for(let i=0;i<6;i++){
        const delay = -(i*0.85).toFixed(2);
        let px=[], py=[], pr=[];
        for(let k=0;k<=24;k++){
          const t=k/24;
          const x = drumL + matInset + t*(drumW - 2*matInset);
          const phase = (t*3)%1;
          let y = cy + R*0.45;
          if(phase >= 0.5 && phase < 0.8){ const lt=(phase-0.5)/0.3; y = cy + R*0.45 - R*0.55*Math.sin(lt*Math.PI); }
          else if(phase >= 0.8){ const ft=(phase-0.8)/0.2; y = cy + R*0.45 - R*0.15 + ft*R*0.15; }
          px.push(x.toFixed(1));
          py.push((y + Math.sin(t*7+i)*matAmp).toFixed(1));
          pr.push((matR0 + Math.sin(t*6)*matR0*0.4).toFixed(1));
        }
        matParticles += `<circle cx="${px[0]}" cy="${py[0]}" r="${pr[0]}" fill="${c}" opacity="0.72" clip-path="url(#${clipInId})">
          <animate attributeName="cx" values="${px.join(';')}" dur="9s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${py.join(';')}" dur="9s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${pr.join(';')}" dur="9s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // —— 滚圈（轮带）：环抱筒体、略高于筒面 ——
      const ringRx = clamp(R*0.11, 2, 4.5), ringRy = R*1.06;
      const ring = (rx)=>`
        <ellipse cx="${F(rx)}" cy="${F(cy)}" rx="${F(ringRx)}" ry="${F(ringRy)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <ellipse cx="${F(rx)}" cy="${F(cy)}" rx="${F(Math.max(0.6,ringRx*0.4))}" ry="${F(Math.max(1,ringRy-3))}" fill="#12162b" opacity="0.35"/>`;
      const rings = ring(ring1X) + ring(ring2X);

      // —— 大齿圈（带齿，随筒体转动）——
      const gearX = drumL + drumW*0.50;
      const gearRx = clamp(R*0.17, 3, 7), gearRy = R*1.14;
      const toothH = clamp(K*2.4, 1.5, 4);
      const gearTeeth = 20;
      let gearTeethStr = '';
      for(let i=0;i<gearTeeth;i++){
        const a = i/gearTeeth*2*Math.PI, cA=Math.cos(a), sA=Math.sin(a);
        const px = gearX + gearRx*cA, py = cy + gearRy*sA;
        const nX = cA/gearRx, nY = sA/gearRy, nL = Math.hypot(nX,nY) || 1;
        gearTeethStr += `<line x1="${F(px)}" y1="${F(py)}" x2="${F(px+(nX/nL)*toothH)}" y2="${F(py+(nY/nL)*toothH)}" stroke="#3f445c" stroke-width="${F(clamp(K*1.1,0.7,1.5))}" stroke-linecap="round"/>`;
      }
      const gear = `
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${F(gearX)} ${F(cy)}" to="360 ${F(gearX)} ${F(cy)}" dur="8s" repeatCount="indefinite"/>
          <ellipse cx="${F(gearX)}" cy="${F(cy)}" rx="${F(gearRx)}" ry="${F(gearRy)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.1"/>
          <ellipse cx="${F(gearX)}" cy="${F(cy)}" rx="${F(Math.max(0.6,gearRx*0.45))}" ry="${F(Math.max(1,gearRy-4))}" fill="#12162b" opacity="0.4"/>
          ${gearTeethStr}
        </g>`;

      // —— 传动装置（小齿轮 + 减速机 + 电机，落地）——
      const pinionR = clamp(R*0.16, 3, 7);
      const pinionCY = cy + gearRy + pinionR*0.7;
      const redW = clamp(K*22, 12, 36), redH = clamp(K*14, 8, 22);
      const redX = clamp(gearX - redW/2, 1, Math.max(1, w-redW-1));
      const redY = baseY - redH;
      const motorW = clamp(K*18, 10, 30), motorH = clamp(K*11, 6, 18);
      const motorX = Math.min(redX + redW + clamp(K*3,1.5,5), Math.max(1, w-motorW-1));
      const motorY = baseY - motorH;
      const driveBaseW = Math.min(motorX+motorW - redX + clamp(K*4,2,6), w);
      const drive = `
        <circle cx="${F(gearX)}" cy="${F(pinionCY)}" r="${F(pinionR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <circle cx="${F(gearX)}" cy="${F(pinionCY)}" r="${F(clamp(pinionR*0.3,1,2.4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <line x1="${F(gearX)}" y1="${F(pinionCY+pinionR)}" x2="${F(gearX)}" y2="${F(redY)}" stroke="#9aa2bc" stroke-width="${F(clamp(K*1.4,1,2))}"/>
        <rect x="${F(redX)}" y="${F(redY)}" width="${F(redW)}" height="${F(redH)}" rx="${F(clamp(K*2,1,4))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.1"/>
        <circle cx="${F(redX+redW*0.28)}" cy="${F(redY+redH/2)}" r="${F(clamp(redH*0.26,2,5))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${F(motorX)}" y="${F(motorY)}" width="${F(motorW)}" height="${F(motorH)}" rx="${F(clamp(K*2,1,4))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.1"/>
        <ellipse cx="${F(motorX+motorW)}" cy="${F(motorY+motorH/2)}" rx="${F(motorH/2+clamp(K*1,0.6,2))}" ry="${F(motorH/2)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <line x1="${F(redX+redW)}" y1="${F(redY+redH/2)}" x2="${F(motorX)}" y2="${F(motorY+motorH/2)}" stroke="#9aa2bc" stroke-width="${F(clamp(K*1.2,0.8,1.6))}"/>
        <rect x="${F(redX-clamp(K*2,1,3))}" y="${F(baseY)}" width="${F(driveBaseW+clamp(K*4,2,6))}" height="${F(footH)}" rx="1" fill="#0c1020" stroke="#6a7192" stroke-width="0.6"/>`;

      // —— 铭牌（保色回填 c）——
      const plateFs = clamp(h*0.042, 3.5, 9);
      const plateW = clamp(Math.min(plateFs*7, w*0.4), 22, 70);
      const plateH = clamp(plateFs*2, 7, 18);
      const plateX = clamp(w - plateW - clamp(K*6,3,8), 1, Math.max(1, w-plateW-1));
      const plateY = clamp(baseY - plateH - clamp(K*2,1,4), 1, Math.max(1, h-plateH-1));
      const nameplate = `
        <rect x="${F(plateX)}" y="${F(plateY)}" width="${F(plateW)}" height="${F(plateH)}" rx="${F(clamp(K,0.5,2))}" fill="#2a2f45" stroke="#3f445c" stroke-width="${F(clamp(K*0.6,0.4,1))}"/>
        <text x="${F(plateX+plateW/2)}" y="${F(plateY+plateH/2+plateFs*0.35)}" text-anchor="middle" fill="${c}" font-size="${F(plateFs)}" opacity="0.78">矿用烘干机</text>`;

      // —— 局部 defs ——
      const metalDef  = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const shadeDef  = `<linearGradient id="${shadeId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const clipDefIn = `<clipPath id="${clipInId}"><rect x="${F(drumL+drumInset)}" y="${F(drumTop+drumInset)}" width="${F(Math.max(1,drumW-2*drumInset))}" height="${F(Math.max(1,R*2-2*drumInset))}" rx="${F(R*0.22)}" ry="${F(Math.max(1,R-drumInset))}"/></clipPath>`;

      return `
        <defs>${metalDef}${metalVDef}${shadeDef}${clipDefIn}</defs>
        ${supports}
        ${drive}
        ${feedPipe}${hotPipe}${dischPipe}${exhDuct}${exhBolts}
        ${drumBody}
        <g clip-path="url(#${clipInId})">
          ${heatGlow}
          ${flights}
          ${matParticles}
        </g>
        ${rings}
        ${gear}
        ${nameplate}
      `;
    }
};
