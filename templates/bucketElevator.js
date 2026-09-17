/* ============================================================
 * PFD Editor · 组件模板：bucketElevator
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.bucketElevator。
 *   配色与画法对齐 reactor（反应釜）：金属渐变机壳 + 深色内腔 + 法兰色系
 *     #7d849e → #d9dded → #767d97（金属渐变）
 *     #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   链斗与链轮用 SMIL 动画驱动，编辑态由 editor.js stripSMIL() 自动剥离。
 * ============================================================ */

TEMPLATES.bucketElevator = {
    name: '斗式提升机', category: '设备',
    defaultSize: { w: 92, h: 190 },
    ports: [
      {id:'outlet', x:1, y:.16,  dir:'right'},
      {id:'inlet',  x:0, y:.89,  dir:'left'}
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'be_clip_'+uid, metalId = 'be_metal_'+uid;
      const cx = w/2;
      const f = n => Number(n).toFixed(2);
      // 驱动装置（机头顶部）
      const driveY = h*0.012, driveH = h*0.046, driveW = w*0.34, driveX = cx - w*0.06;
      // 机头（金属外壳 + 深色内腔）
      const headX = w*0.06, headW = w*0.88, headTop = h*0.055, headH = h*0.15;
      const headBot = headTop + headH;
      // 中间机壳
      const casingX = w*0.26, casingW = w*0.48, casingTop = headBot, casingBot = h*0.86;
      // 机座（底座 + 斜底）
      const bootX = w*0.20, bootW = w*0.60, bootTop = casingBot, bootRectH = h*0.088;
      const bootRectBot = bootTop + bootRectH, bootBotY = h*0.99;
      // 链轮与链条（上下链轮同径，链条为一条闭合环）
      const spR = Math.min(headH*0.30, casingW*0.28, bootRectH*0.46);
      const topSpY = headTop + headH*0.5, botSpY = bootTop + bootRectH*0.5;
      const chainL = cx - spR, chainR = cx + spR;
      const loopP = `M ${f(chainR)} ${f(topSpY)} L ${f(chainR)} ${f(botSpY)} ` +
        `A ${f(spR)} ${f(spR)} 0 0 1 ${f(chainL)} ${f(botSpY)} L ${f(chainL)} ${f(topSpY)} ` +
        `A ${f(spR)} ${f(spR)} 0 0 1 ${f(chainR)} ${f(topSpY)} Z`;
      // 料斗：左链上行、右链下行，端部淡入淡出（避免循环跳变）
      const bucketW = casingW*0.30, bucketH = Math.max(3, h*0.028), dur = 4, perRun = 4;
      const bucketPath = bx => `M ${f(bx-bucketW/2)} 0 L ${f(bx+bucketW/2)} 0 ` +
        `L ${f(bx+bucketW*0.32)} ${f(bucketH)} L ${f(bx-bucketW*0.32)} ${f(bucketH)} Z`;
      const bucketFly = (bx, fromY, toY, d) =>
        `<g><animateTransform attributeName="transform" type="translate" from="0 ${f(fromY)}" to="0 ${f(toY)}" dur="${dur}s" begin="-${d}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="${dur}s" begin="-${d}s" repeatCount="indefinite"/>` +
        `<path d="${bucketPath(bx)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.6"/></g>`;
      let buckets = '';
      for(let i=0;i<perRun;i++){
        const d = (i*dur/perRun).toFixed(2);
        buckets += bucketFly(chainL, botSpY, topSpY, d) + bucketFly(chainR, topSpY, botSpY, d);
      }
      // 链轮：深色轮盘 + 旋转辐条（上下反向）+ 轮毂
      const spokes = (scy)=>{
        let s = '';
        for(let i=0;i<6;i++){
          const a = i*Math.PI/3;
          s += `<line x1="${f(cx+Math.cos(a)*spR*0.32)}" y1="${f(scy+Math.sin(a)*spR*0.32)}" ` +
               `x2="${f(cx+Math.cos(a)*(spR-0.9))}" y2="${f(scy+Math.sin(a)*(spR-0.9))}" stroke="#5b6280" stroke-width="1"/>`;
        }
        return s;
      };
      const sprocket = (scy, forward)=>
        `<circle cx="${f(cx)}" cy="${f(scy)}" r="${f(spR)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>` +
        `<g><animateTransform attributeName="transform" type="rotate" from="${forward?'0':'360'} ${f(cx)} ${f(scy)}" to="${forward?'360':'0'} ${f(cx)} ${f(scy)}" dur="3.2s" repeatCount="indefinite"/>${spokes(scy)}</g>` +
        `<circle cx="${f(cx)}" cy="${f(scy)}" r="${f(spR*0.26)}" fill="#6a7192" opacity="0.85"/>`;
      // 机壳分节线（等分三段，模拟机壳标准节拼接）
      let joints = '';
      for(let i=1;i<=3;i++){
        const jy = casingTop + (casingBot-casingTop)*i/4;
        joints += `<line x1="${f(casingX)}" y1="${f(jy)}" x2="${f(casingX+casingW)}" y2="${f(jy)}" stroke="#3f445c" stroke-width="1" opacity="0.55"/>`;
      }
      // 进出料口（沿用反应釜侧向接管画法）
      const nozzleH = h*0.035, inY = h*0.89, outY = h*0.16;
      const flangeW = w*0.045, flangeH = h*0.060;
      return `
      <defs>
        <clipPath id="${clipId}"><rect x="${f(casingX)}" y="${f(headTop)}" width="${f(casingW)}" height="${f(bootRectBot-headTop)}" rx="1"/></clipPath>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      <rect x="${f(headX)}" y="${f(headTop)}" width="${f(headW)}" height="${f(headH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(headX+2)}" y="${f(headTop+2)}" width="${f(headW-4)}" height="${f(headH-4)}" rx="1" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      <polygon points="${f(bootX)},${f(bootRectBot)} ${f(bootX+bootW)},${f(bootRectBot)} ${f(cx+w*0.09)},${f(bootBotY)} ${f(cx-w*0.09)},${f(bootBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(bootX)}" y="${f(bootTop)}" width="${f(bootW)}" height="${f(bootRectH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(bootX+2)}" y="${f(bootTop+2)}" width="${f(bootW-4)}" height="${f(bootRectH-4)}" rx="1" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      <rect x="${f(casingX)}" y="${f(casingTop)}" width="${f(casingW)}" height="${f(casingBot-casingTop)}" fill="#12162b" stroke="#6a7192" stroke-width="1"/>
      ${joints}
      <rect x="${f(casingX-w*0.03)}" y="${f(casingTop)}" width="${f(casingW+w*0.06)}" height="${f(h*0.016)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
      <rect x="${f(casingX-w*0.03)}" y="${f(casingBot-h*0.016)}" width="${f(casingW+w*0.06)}" height="${f(h*0.016)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
      <g clip-path="url(#${clipId})">
        <path d="${loopP}" fill="none" stroke="#3f445c" stroke-width="1.6" opacity="0.9"/>
        ${buckets}
      </g>
      ${sprocket(topSpY, true)}
      ${sprocket(botSpY, false)}
      <rect x="0" y="${f(inY-nozzleH/2)}" width="${f(casingX)}" height="${f(nozzleH)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.7"/>
      <rect x="0" y="${f(inY-flangeH/2)}" width="${f(flangeW)}" height="${f(flangeH)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.7"/>
      <rect x="${f(w-w*0.10)}" y="${f(outY-nozzleH/2)}" width="${f(w*0.10)}" height="${f(nozzleH)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.7"/>
      <rect x="${f(w-flangeW)}" y="${f(outY-flangeH/2)}" width="${f(flangeW)}" height="${f(flangeH)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.7"/>
      <rect x="${f(driveX)}" y="${f(driveY)}" width="${f(driveW)}" height="${f(driveH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <circle cx="${f(driveX+driveW)}" cy="${f(driveY+driveH/2)}" r="${f(driveH*0.62)}" fill="#2a2f45" stroke="#6a7192" stroke-width="0.8"/>
      `;
    }
};
