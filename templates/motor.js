/* ============================================================
 * PFD Editor · 组件模板：motor（电机）
 *   三相异步电机侧视：机座（散热片）+ 前后端盖 + 出线盒 + 地脚 + 输出轴/联轴器。
 *   配色与画法对齐 pump / blower（风机水泵件）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突）：
 *       #7d849e → #d9dded → #767d97（机座 / 端盖）
 *       #12162b（出线盒内腔）  #6a7192（深腔描边）  #2a2f45 / #3f445c（出线盒 / 底座）
 *       #9aa2bc / #5b6280（散热片 / 亮线）  #0c1020（地脚）  #8e96b6（螺栓头）
 *   端口：out=右（输出轴端）
 * ============================================================ */

TEMPLATES.motor = {
    name: '电机', category: '风机泵阀',
    defaultSize: { w: 50, h: 50 },
    ports: [{ id:'out', x:1, y:.5, dir:'right' }],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      const F = v => (+v).toFixed(2);
      const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
      const K = clamp(Math.min(w/50, h/50), 0.3, 2.4);
      const uid = Math.random().toString(36).slice(2,7);
      const metalId = 'mt_'+uid, metalVId = 'mtv_'+uid;
      const metalDef  = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
      const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;

      const cy = h*0.50;                            // 电机轴线（= 输出轴端口 y，须与 ports.out 同步）
      const bodyH = clamp(h*0.40, 6, 40);
      const bodyT = cy - bodyH/2, bodyB = cy + bodyH/2;
      const bodyL = w*0.22, bodyR = w*0.72;
      const capW = clamp(bodyH*0.16, 1.4, 6);
      const boltR = clamp(K*0.9, 0.5, 1.2);
      const bolt = (x,y)=>`<circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${F(x)}" cy="${F(y)}" r="${F(boltR*0.42)}" fill="#8e96b6"/>`;

      // 散热片
      let fins = '';
      const nf = 7;
      for(let i=1;i<=nf;i++){
        const x = bodyL + capW + (bodyR-bodyL-capW*1.4)*(i/(nf+1));
        fins += `<line x1="${F(x)}" y1="${F(bodyT+bodyH*0.14)}" x2="${F(x)}" y2="${F(bodyB-bodyH*0.14)}" stroke="#5b6280" stroke-width="${F(clamp(K*0.8,0.4,1.1))}" opacity="0.7"/>`;
      }
      // 后风扇罩（左端）：圆头 + 格栅环
      const fanR = clamp(bodyH*0.50, 3, 15);
      const fanCx = bodyL;
      let grille = '';
      for(let i=1;i<=3;i++) grille += `<circle cx="${F(fanCx)}" cy="${F(cy)}" r="${F(fanR*(i/4))}" fill="none" stroke="#5b6280" stroke-width="${F(clamp(K*0.7,0.4,1))}" opacity="0.6"/>`;

      // 出线盒（顶部）+ 引线管
      const tbW = bodyH*0.62, tbH = bodyH*0.46;
      const tbX = (bodyL+bodyR)/2 - tbW/2, tbY = bodyT - tbH;
      const terminal = `
        <rect x="${F(tbX)}" y="${F(tbY)}" width="${F(tbW)}" height="${F(tbH)}" rx="${F(clamp(K,0.6,1.8))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(tbX+clamp(K,0.6,1.4))}" y="${F(tbY+clamp(K,0.6,1.4))}" width="${F(tbW-2*clamp(K,0.6,1.4))}" height="${F(Math.max(1,tbH-2*clamp(K,0.6,1.4)))}" fill="#12162b" opacity="0.5"/>
        <rect x="${F(tbX+tbW*0.30)}" y="${F(tbY-clamp(K*2.4,1.2,4))}" width="${F(tbW*0.40)}" height="${F(clamp(K*2.4,1.2,4))}" rx="0.6" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      // 地脚 + 底座
      const footTop = bodyB, baseY = h*0.88, footW = clamp(bodyH*0.22, 1.6, 5);
      const base = `
        <rect x="${F(bodyL+capW*0.6)}" y="${F(footTop)}" width="${F(footW)}" height="${F(Math.max(1,baseY-footTop))}" fill="#0c1020" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${F(bodyR-capW*0.6-footW)}" y="${F(footTop)}" width="${F(footW)}" height="${F(Math.max(1,baseY-footTop))}" fill="#0c1020" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${F(bodyL)}" y="${F(baseY-clamp(K*1.6,1,2.6))}" width="${F(bodyR-bodyL)}" height="${F(clamp(K*1.6,1,2.6))}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // 机座 + 前端盖
      const body = `
        <rect x="${F(bodyL)}" y="${F(bodyT)}" width="${F(bodyR-bodyL)}" height="${F(bodyH)}" rx="${F(clamp(bodyH*0.10,0.8,3))}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1.1"/>
        ${fins}
        <rect x="${F(bodyR-capW*0.2)}" y="${F(bodyT)}" width="${F(capW*1.2)}" height="${F(bodyH)}" rx="${F(clamp(bodyH*0.10,0.8,3))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${F(bodyL-capW*0.4)}" y="${F(bodyT)}" width="${F(capW)}" height="${F(bodyH)}" rx="${F(clamp(bodyH*0.10,0.8,3))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        ${bolt(bodyR-capW*0.2+capW*0.6, bodyT+bodyH*0.28)}
        ${bolt(bodyR-capW*0.2+capW*0.6, bodyT+bodyH*0.72)}`;

      // 输出轴 + 联轴器（旋转标记，示意运转）
      const shaftY = cy, shaftH = clamp(bodyH*0.20, 1.2, 4);
      const shaftX0 = bodyR + capW, shaftX1 = w;
      const cplCx = clamp(shaftX1 - (shaftX1-shaftX0)*0.42, shaftX0+2, shaftX1-2);
      const cplR = clamp(bodyH*0.16, 1.4, 4);
      const shaft = `
        <rect x="${F(shaftX0)}" y="${F(shaftY-shaftH/2)}" width="${F(Math.max(1,shaftX1-shaftX0))}" height="${F(shaftH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${F(cplCx)} ${F(shaftY)}" to="360 ${F(cplCx)} ${F(shaftY)}" dur="1.2s" repeatCount="indefinite"/>
          <circle cx="${F(cplCx)}" cy="${F(shaftY)}" r="${F(cplR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
          <line x1="${F(cplCx-cplR*0.85)}" y1="${F(shaftY)}" x2="${F(cplCx+cplR*0.85)}" y2="${F(shaftY)}" stroke="${c}" stroke-width="${F(clamp(K*0.9,0.5,1.3))}" opacity="0.9"/>
          <line x1="${F(cplCx)}" y1="${F(shaftY-cplR*0.85)}" x2="${F(cplCx)}" y2="${F(shaftY+cplR*0.85)}" stroke="${c}" stroke-width="${F(clamp(K*0.9,0.5,1.3))}" opacity="0.9"/>
        </g>`;

      return `
        <defs>${metalDef}${metalVDef}</defs>
        ${base}
        ${body}${terminal}
        <circle cx="${F(fanCx)}" cy="${F(cy)}" r="${F(fanR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        ${grille}
        ${shaft}
      `;
    }
};
