/* ============================================================
 * PFD Editor · 组件模板：hotAirFurnace（热风机）
 *   方案：卧式圆筒 + 端部燃烧机 + 筒内混风室 + 顶部热风出口
 *   画法/配色对齐 tubeCooler、rotaryKiln：
 *     金属渐变 #7d849e → #d9dded → #767d97（局部 <defs>，id 带 uid 后缀）
 *     深色内腔 #12162b / 描边 #6a7192 / 轮廓 #3f445c / 法兰 #2a2f45
 *   端口比例（须与 ports 同步）：fuel.y=0.56、airIn.x=0.36、hotAirOut.x=0.72
 * ============================================================ */

TEMPLATES.hotAirFurnace = {
    name: '热风机', category: '设备',
    defaultSize: { w: 280, h: 140 },
    ports: [
      {id:'fuel',      x:0,   y:.56, dir:'left'},
      {id:'airIn',     x:.36, y:1,   dir:'down'},
      {id:'hotAirOut', x:.72, y:0,   dir:'up'}
    ],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      // 定尺封顶：F 固定小数位；K 细部基准；逐量 clamp(比例量, 下限, 上限)
      const F = v=>(+v).toFixed(2);
      const clamp = (v, lo, hi)=>Math.max(lo, Math.min(hi, v));
      const K = clamp(Math.min(w/280, h/140), 0.3, 2.4);
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = `hf_metal_${uid}`;
      const metalVId = `hf_metalv_${uid}`;
      const shadeId = `hf_shade_${uid}`;
      const clipIdIn= `hf_clipin_${uid}`;

      // —— 端口锚点比例（须与文件顶部 ports 定义同步）——
      const fuelYR = 0.56, airInXR = 0.36, outletXR = 0.72;

      // —— 卧式圆筒 ——
      const cy = h*fuelYR;
      const R = h*0.30;
      const drumL = w*0.18, drumR = w*0.80;
      const drumW = Math.max(1, drumR - drumL);
      const drumTop = cy - R, drumBot = cy + R;
      const drumInset = clamp(R*0.09, 1.5, 3.5);
      const wallSW = clamp(K*1.5, 1.1, 2.2);

      // —— 底部支座 ——
      const footH = clamp(R*0.18, 2, 6);
      const baseY = h - footH;
      const supW = clamp(R*0.5, 6, 22);
      const supTop = cy + R*0.5;
      const supportXs = [drumL+drumW*0.16, drumL+drumW*0.84];
      let supports = '';
      supportXs.forEach(sx=>{
        supports += `<path d="M ${F(sx-supW/2)} ${F(baseY)} L ${F(sx-supW*0.32)} ${F(supTop)} L ${F(sx+supW*0.32)} ${F(supTop)} L ${F(sx+supW/2)} ${F(baseY)} Z" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
          <rect x="${F(sx-supW/2)}" y="${F(baseY)}" width="${F(supW)}" height="${F(footH)}" rx="1" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;
      });

      // —— 端部燃烧机（左端）：管身 + 端法兰 + 观察孔 ——
      const burnerR = clamp(R*0.17, 3, 8);
      const burnFlW = clamp(K*5, 3, 7), burnFlH = clamp(burnerR*2.8, 6, 16);
      const burner = `
        <rect x="0" y="${F(cy-burnerR)}" width="${F(drumL+burnerR)}" height="${F(burnerR*2)}" rx="${F(clamp(burnerR*0.4,1,3))}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="0" y="${F(cy-burnFlH/2)}" width="${F(burnFlW)}" height="${F(burnFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <circle cx="${F(burnFlW*2)}" cy="${F(cy)}" r="${F(clamp(K*2.4,1.5,4))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.6"/>
        <circle cx="${F(drumL*0.55)}" cy="${F(cy-burnerR*0.5)}" r="${F(clamp(K*1.4,0.9,2.2))}" fill="#ff6020" opacity="0.55"><animate attributeName="opacity" values="0.35;0.75;0.35" dur="1.2s" repeatCount="indefinite"/></circle>
        <rect x="${F(burnFlW+clamp(K*3,2,5))}" y="${F(cy+clamp(K*2,1,4))}" width="${F(clamp(K*10,6,14))}" height="${F(clamp(K*3,2,4))}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;

      // —— 顶部热风出口（竖直管 + 顶法兰 + 螺栓）——
      const outX = w*outletXR;
      const outHalf = clamp(K*5, 3, 8);
      const outFlW = clamp(K*20, 12, 28), outFlH = clamp(K*5, 3, 7);
      const outPipeH = Math.max(1, drumTop - outFlH);
      const outletDuct = `
        <rect x="${F(outX-outHalf)}" y="${F(outFlH)}" width="${F(outHalf*2)}" height="${F(outPipeH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(outX-outHalf+clamp(K*1.2,0.8,1.6))}" y="${F(outFlH)}" width="${F(Math.max(1,(outHalf-clamp(K*1.2,0.8,1.6))*2))}" height="${F(outPipeH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>
        <rect x="${F(outX-outFlW/2)}" y="0" width="${F(outFlW)}" height="${F(outFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // —— 底部冷风入口（竖直管 + 底法兰），供筒内混风室掺混 ——
      const inX = w*airInXR;
      const inHalf = clamp(K*4, 2.5, 6);
      const inFlW = clamp(K*16, 10, 24), inFlH = clamp(K*4, 2.5, 5.5);
      const inPipeH = Math.max(1, h - drumBot);
      const inletDuct = `
        <rect x="${F(inX-inHalf)}" y="${F(drumBot)}" width="${F(inHalf*2)}" height="${F(inPipeH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(inX-inHalf+clamp(K*1,0.7,1.4))}" y="${F(drumBot)}" width="${F(Math.max(1,(inHalf-clamp(K*1,0.7,1.4))*2))}" height="${F(inPipeH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>
        <rect x="${F(inX-inFlW/2)}" y="${F(h-inFlH)}" width="${F(inFlW)}" height="${F(inFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // —— 筒内混风室：两端多孔隔板 + 中间混流叶轮 ——
      const mixL = drumL + drumW*0.34, mixR = drumL + drumW*0.64;
      const partRx = clamp(R*0.10, 2, 5);
      const perforR = clamp(R*0.05, 1, 2.4);
      const mixerPlate = (px)=>{
        let holes='';
        for(let i=0;i<5;i++){
          const hy = cy - R*0.55 + i*(R*1.1/4);
          holes += `<circle cx="${F(px)}" cy="${F(hy)}" r="${F(perforR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.4"/>`;
        }
        return `<ellipse cx="${F(px)}" cy="${F(cy)}" rx="${F(partRx)}" ry="${F(Math.max(1,R-1))}" fill="#2a2f45" stroke="#6a7192" stroke-width="0.9" opacity="0.92"/>${holes}`;
      };
      const swirlCX = (mixL+mixR)/2, swirlR = clamp(R*0.42, 4, 20);
      const swirl = `
        <rect x="${F(mixL)}" y="${F(drumTop)}" width="${F(mixR-mixL)}" height="${F(R*2)}" fill="#12162b" opacity="0.22"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${F(swirlCX)} ${F(cy)}" to="360 ${F(swirlCX)} ${F(cy)}" dur="1.6s" repeatCount="indefinite"/>
          ${Array.from({length:6}).map((_,i)=>{const a=i*60*Math.PI/180;return `<line x1="${F(swirlCX)}" y1="${F(cy)}" x2="${F(swirlCX+Math.cos(a)*swirlR)}" y2="${F(cy+Math.sin(a)*swirlR)}" stroke="${c}" stroke-width="${F(clamp(K*1.6,1,2.2))}" stroke-linecap="round" opacity="0.55"/>`;}).join('')}
          <circle cx="${F(swirlCX)}" cy="${F(cy)}" r="${F(clamp(K*2.2,1.4,3.6))}" fill="${c}" opacity="0.7"/>
        </g>`;
      const mixingChamber = mixerPlate(mixL) + mixerPlate(mixR) + swirl;

      // —— 火焰：外橙焰 + 内黄焰，焰根在燃烧机出口，随筒径缩放 ——
      const flameRootX = drumL + drumW*0.03;
      const flameLen = drumW*0.28, flameR = R*0.5;
      let flames = '';
      for(let fi=0;fi<2;fi++){
        const fBaseY = cy + (fi-0.5)*R*0.12, fDelay = -(fi*0.35).toFixed(2);
        let fl=[], ft=[], fr=[], fo=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          fl.push((flameRootX + t*flameLen - Math.sin(t*4+fi)*flameLen*0.04).toFixed(1));
          ft.push((fBaseY + Math.sin(t*3+fi*1.5)*flameR*0.35*(1-t*0.5)).toFixed(1));
          fr.push((flameR*(1-fi*0.4) - t*flameR*(0.6-fi*0.3)).toFixed(1));
          fo.push((0.85-fi*0.1 - t*(0.6-fi*0.2)).toFixed(2));
        }
        flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${(fr[0]*0.65).toFixed(1)}" fill="${fi===0?'#ff6a10':'#ffdd44'}" opacity="${fo[0]}" clip-path="url(#${clipIdIn})">
          <animate attributeName="cx" values="${fl.join(';')}" dur="${(1.6-fi*0.4).toFixed(2)}s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ft.join(';')}" dur="${(1.6-fi*0.4).toFixed(2)}s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${fr.join(';')}" dur="${(1.6-fi*0.4).toFixed(2)}s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fo.join(';')}" dur="${(1.6-fi*0.4).toFixed(2)}s" begin="${fDelay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }
      const flameGlow = `<ellipse cx="${F(flameRootX)}" cy="${F(cy)}" rx="${F(flameR*1.1)}" ry="${F(flameR*0.9)}" fill="#ffa040" opacity="0.3" clip-path="url(#${clipIdIn})">
        <animate attributeName="opacity" values="0.18;0.4;0.18" dur="1.1s" repeatCount="indefinite"/></ellipse>`;

      // —— 热风粒子：沿顶部出口管内上升 ——
      const riseAmp = clamp(K*3, 1.5, 5), pR = clamp(K*1.6, 1, 2.6);
      const riseTop = outFlH, riseFrom = drumTop;
      let hotParticles = '';
      for(let i=0;i<4;i++){
        const delay = -(i*0.55).toFixed(2);
        let px=[], py=[], pr=[], po=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          px.push((outX + Math.sin(t*3+i)*riseAmp).toFixed(1));
          py.push((Math.max(riseTop, riseFrom - t*(riseFrom-riseTop))).toFixed(1));
          pr.push((pR+t*pR*0.6).toFixed(1));
          po.push((0.5-t*0.4).toFixed(2));
        }
        hotParticles += `<circle cx="${px[0]}" cy="${py[0]}" r="${pr[0]}" fill="#ffa040" opacity="${po[0]}">
          <animate attributeName="cx" values="${px.join(';')}" dur="2.2s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${py.join(';')}" dur="2.2s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${pr.join(';')}" dur="2.2s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${po.join(';')}" dur="2.2s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // —— 筒体主体 + 焊缝环 ——
      const drumBody = `
        <rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.28)}" ry="${F(R)}" fill="url(#${shadeId})" stroke="#3f445c" stroke-width="${F(wallSW)}"/>
        <rect x="${F(drumL+drumInset)}" y="${F(drumTop+drumInset)}" width="${F(Math.max(1,drumW-2*drumInset))}" height="${F(R*0.42)}" rx="${F(R*0.2)}" ry="${F(R*0.4)}" fill="#5b6280" opacity="0.32"/>
        <ellipse cx="${F(drumL)}" cy="${F(cy)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.1" opacity="0.65"/>
        <ellipse cx="${F(drumR)}" cy="${F(cy)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.1" opacity="0.65"/>`;
      let weldRings = '';
      for(let i=1;i<=6;i++){
        const wx = drumL + drumW*i/7;
        weldRings += `<ellipse cx="${F(wx)}" cy="${F(cy)}" rx="${F(clamp(R*0.07,1,3))}" ry="${F(Math.max(1,R-clamp(K,0.5,1.4)))}" fill="none" stroke="${c}" stroke-width="${F(clamp(K*0.9,0.5,1.4))}" opacity="0.28"/>`;
      }

      // —— 顶法兰螺栓 ——
      const flangeBolt = (bx,by,r)=>`<circle cx="${F(bx)}" cy="${F(by)}" r="${F(r)}" fill="#8e96b6" stroke="#5b6280" stroke-width="0.5"/>`;
      const outBolts = flangeBolt(outX-outFlW*0.3, outFlH*0.5, clamp(K,0.7,1.3)) + flangeBolt(outX+outFlW*0.3, outFlH*0.5, clamp(K,0.7,1.3));

      // —— 铭牌（保色回填 c）——
      const plateFs = clamp(h*0.043, 3.5, 9);
      const plateW = clamp(Math.min(plateFs*7.2, w*0.6), 22, 80);
      const plateH = clamp(plateFs*2, 7, 18);
      const plateX = clamp(w*0.54 - plateW/2, 1, Math.max(1, w-plateW-1));
      const plateY = clamp(drumBot + clamp(K*1.5, 0.5, 2), 1, Math.max(1, h-plateH-1));
      const nameplate = `
        <rect x="${F(plateX)}" y="${F(plateY)}" width="${F(plateW)}" height="${F(plateH)}" rx="${F(clamp(K,0.5,2))}" fill="#2a2f45" stroke="#3f445c" stroke-width="${F(clamp(K*0.6,0.4,1))}"/>
        <text x="${F(plateX+plateW/2)}" y="${F(plateY+plateH/2+plateFs*0.35)}" text-anchor="middle" fill="${c}" font-size="${F(plateFs)}" opacity="0.78">热风机</text>`;

      // —— 局部 defs ——
      const metalDef  = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const shadeDef  = `<linearGradient id="${shadeId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const clipDefIn= `<clipPath id="${clipIdIn}"><rect x="${F(drumL+drumInset)}" y="${F(drumTop+drumInset)}" width="${F(Math.max(1,drumW-2*drumInset))}" height="${F(Math.max(1,R*2-2*drumInset))}" rx="${F(R*0.22)}" ry="${F(Math.max(1,R-drumInset))}"/></clipPath>`;

      return `
        <defs>${metalDef}${metalVDef}${shadeDef}${clipDefIn}</defs>
        ${supports}
        ${burner}
        ${inletDuct}
        ${outletDuct}${outBolts}
        ${drumBody}
        <g clip-path="url(#${clipIdIn})">
          ${weldRings}
          ${flameGlow}
          ${flames}
          ${mixingChamber}
        </g>
        ${hotParticles}
        ${nameplate}
      `;
    }
};
