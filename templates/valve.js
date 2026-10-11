/* ============================================================
 * PFD Editor · 组件模板：valve（气密阀 / 星形卸料阀）
 *   粉料气力/重力输送线上的回转气密给料阀：转子腔 + 多叶片转子（旋转）+ 减速电机 +
 *   左右接管与法兰，靠转子叶片间的料腔实现“锁气 + 定量给料”。
 *   配色与画法对齐 blower / pump（风机泵阀件）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突）：
 *       #7d849e → #d9dded → #767d97（阀体 / 转子腔 / 接管）
 *       #12162b（腔体内暗色）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰 / 电机座）
 *       #9aa2bc（转子叶片 / 亮件）  #8e96b6（螺栓头）  #0c1020（电机）
 *   端口：in=左（进料）  out=右（出料）
 * ============================================================ */

TEMPLATES.valve = {
    name: '气密阀', category: '风机泵阀',
    defaultSize: { w: 45, h: 35 },
    ports: [{ id:'in', x:0, y:.5, dir:'left' }, { id:'out', x:1, y:.5, dir:'right' }],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      const F = v => (+v).toFixed(2);
      const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
      const K = clamp(Math.min(w/45, h/35), 0.3, 2.4);
      const uid = Math.random().toString(36).slice(2,7);
      const metalId = 'vl_'+uid, metalVId = 'vlv_'+uid;
      const metalDef  = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;

      const cy = h*0.50;                                  // 通道轴线（= in/out 端口 y）
      const cx = w*0.5;
      const rH = clamp(Math.min(w,h)*0.30, 4, 60);        // 转子腔半径
      const rR = rH*0.66;                                 // 转子半径
      const pipeH = clamp(h*0.26, 2, 14);
      const housL = cx - rH, housR = cx + rH;
      const boltR = clamp(K*0.9, 0.5, 1.2);
      const bolt = (x,y)=>`<circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR*0.42)}" fill="#8e96b6"/>`;

      // 左右接管 + 端面法兰（管口最外端即端口锚点）
      const flW = clamp(K*2.6, 1.6, 4.5), flH = pipeH*1.9;
      const pipe = (x0,x1,flX)=>`
        <rect x="${F(x0)}" y="${F(cy-pipeH/2)}" width="${F(x1-x0)}" height="${F(pipeH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${F(x0)}" y="${F(cy-pipeH/2+clamp(K*0.6,0.4,1))}" width="${F(x1-x0)}" height="${F(Math.max(1,pipeH-2*clamp(K*0.6,0.4,1)))}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>
        <rect x="${F(flX)}" y="${F(cy-flH/2)}" width="${F(flW)}" height="${F(flH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${bolt(flX+flW/2, cy-flH*0.30)}${bolt(flX+flW/2, cy+flH*0.30)}`;
      const leftPipe  = pipe(0, housL+clamp(K*0.6,0.4,1), clamp(K*0.5,0.3,1.2));
      const rightPipe = pipe(housR-clamp(K*0.6,0.4,1), w, w-flW-clamp(K*0.5,0.3,1.2));

      // 转子腔（金属环 + 深腔）
      const bore = `
        <circle cx="${F(cx)}" cy="${F(cy)}" r="${F(rH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <circle cx="${F(cx)}" cy="${F(cy)}" r="${F(rH-clamp(K*1.4,0.8,2.4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;

      // 转子（多叶片，随减速电机旋转）——料腔锁气示意
      const nv = 8;
      let vanes = '';
      for(let i=0;i<nv;i++){
        const a = i*2*Math.PI/nv;
        vanes += `<line x1="${F(cx+Math.cos(a)*rR*0.16)}" y1="${F(cy+Math.sin(a)*rR*0.16)}" x2="${F(cx+Math.cos(a)*rR*0.96)}" y2="${F(cy+Math.sin(a)*rR*0.96)}" stroke="#9aa2bc" stroke-width="${F(clamp(K*1.1,0.6,1.7))}" stroke-linecap="round"/>`;
      }
      const rotor = `
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${F(cx)} ${F(cy)}" to="360 ${F(cx)} ${F(cy)}" dur="2.4s" repeatCount="indefinite"/>
          <circle cx="${F(cx)}" cy="${F(cy)}" r="${F(rR)}" fill="#0f1322" stroke="#6a7192" stroke-width="0.8"/>
          ${vanes}
          <circle cx="${F(cx)}" cy="${F(cy)}" r="${F(rR*0.20)}" fill="#2a2f45" stroke="#8e96b6" stroke-width="0.6"/>
        </g>`;

      // 减速电机（顶部，驱动转子）
      const mountH = clamp(K*1.4, 1, 2.4), mountW = clamp(K*3, 2, 5);
      const mW = clamp(rH*0.80, 5, 16), mH = clamp(rH*0.44, 3, 10);
      const mX = cx - mW/2, mY = Math.max(0.5, cy - rH - mountH - mH);
      const gearmotor = `
        <rect x="${F(cx-mountW/2)}" y="${F(cy-rH-mountH)}" width="${F(mountW)}" height="${F(mountH+0.5)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <rect x="${F(mX)}" y="${F(mY)}" width="${F(mW)}" height="${F(mH)}" rx="${F(clamp(K,0.6,1.6))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(mX+clamp(K,0.5,1))}" y="${F(mY+mH*0.55)}" width="${F(mW-2*clamp(K,0.5,1))}" height="${F(Math.max(1,mH*0.28))}" fill="#0c1020" opacity="0.5"/>
        ${bolt(mX+mW*0.22, mY+mH*0.28)}${bolt(mX+mW*0.78, mY+mH*0.28)}`;

      return `
        <defs>${metalDef}${metalVDef}</defs>
        ${leftPipe}${rightPipe}
        ${bore}
        ${rotor}
        ${gearmotor}
      `;
    }
};
