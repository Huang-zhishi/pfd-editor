/* ============================================================
 * PFD Editor · 组件模板：blower
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.blower。
 *   参考图（蜗壳 + 左侧水平进风管带法兰 + 右上部水平出风管）
 *   蜗壳型线按工业离心风机常规画法：阿基米德螺旋线（平均速度法），壳顶（出风管上缘）
 *   为最大半径 R，沿包角约 300° 线性收缩到蜗舌（出风管下缘）处的 0.74R，蜗舌倒圆角，
 *   叶轮外径与蜗舌留约 6% 间隙 —— 壳型明显偏心成"蜗形"，而非正圆。
 *   配色与画法对齐 bucketElevator / vrm：本文件 <defs> 内局部金属渐变（id 带 uid 后缀，
 *   避免同页多实例 id 冲突），替换掉对外部全局 gEquip 的依赖
 *     #7d849e → #d9dded → #767d97（金属壳壁）
 *     #12162b（深色内腔）  #6a7192 / #3f445c（内腔与轮廓描边）  #2a2f45（端法兰）
 * ============================================================ */

TEMPLATES.blower = {
    name: '离心风机/鼓风机', category: '风机泵阀',
    defaultSize: { w: 90, h: 78 },
    ports: [{id:'in',x:0,y:.645,dir:'left'},{id:'out',x:1,y:.4738,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'bl_metal_'+uid;
      const c = (p && p.color) || '#9C99FF';
      // 半径只由 h 决定 → 蜗壳恒为圆形，且端口 y 比例不随宽高比漂移
      const R  = h*0.25;                     // 蜗壳半径
      const s  = R/19.5;                     // 等比系数（默认尺寸 90×78 时 s=1）
      const sw = k => (k*s).toFixed(2);      // 线宽等比：组件缩小时描边同步变细
      const f2 = n => n.toFixed(2);
      const cy = h*0.645;                    // 蜗壳中心 y

      // 蜗壳螺旋：壳顶 → 逆时针绕 294° → 舌部（落在出风管下缘延长线上），半径由 R 渐收至 0.90R
      const a0 = -Math.PI/2, a1 = Math.asin(-0.37/0.90);
      const rWall   = 1 - 0.10*(-Math.PI - a0)/(a1 - 2*Math.PI - a0);  // 蜗壳最左点半径系数
      const rTongue = 0.90*Math.cos(a1);                               // 舌部到壳心的水平距离系数
      // 壳心 x：令进风管与出风管伸出壳外的长度相等（左侧到壳壁 = 右侧到舌部）
      const cx = (w + (rWall - rTongue)*R)/2;

      const outTop = cy - R;                 // 出风管顶边（与壳顶相切）
      const outBot = cy - R*0.37;            // 出风管底边
      const inletH = R*0.63;                 // 进风管高
      const inTop  = cy - inletH/2;
      const inBot  = cy + inletH/2;

      /* 机壳壁厚与管壁厚：蜗壳内腔 = 外轮廓向内偏置一个壁厚，
         于是壳壁呈一条金属环、内腔深色，与 bucketElevator 的"金属壳 + 深腔"同构。*/
      const wall = R*0.08;
      const SEG = 64, arc = [], arcC = [];
      for(let i=0;i<=SEG;i++){
        const t = i/SEG, ang = a0 + (a1-2*Math.PI-a0)*t, r = R*(1-0.10*t);
        arc.push([cx+Math.cos(ang)*r, cy+Math.sin(ang)*r]);
        const rc = r - wall;
        arcC.push([cx+Math.cos(ang)*rc, cy+Math.sin(ang)*rc]);
      }
      const arcBack = arc.slice().reverse().map(q=>`L ${f2(q[0])} ${f2(q[1])}`).join(' ');
      const arcBackC = arcC.slice().reverse().map(q=>`L ${f2(q[0])} ${f2(q[1])}`).join(' ');
      // 壳体与出风管合并为一个闭合轮廓：出口上缘 → 右端 → 出口下缘 → 蜗壳回到壳顶
      const bodyD = `M ${f2(arc[0][0])} ${f2(arc[0][1])} L ${f2(w)} ${f2(outTop)} L ${f2(w)} ${f2(outBot)} L ${f2(arc[SEG][0])} ${f2(arc[SEG][1])} ${arcBack} Z`;
      // 内腔：同一轮廓向内偏置 wall（出风管腔内缩 wall，右端退到 w-wall）
      const cavD = `M ${f2(arcC[0][0])} ${f2(arcC[0][1])} L ${f2(w-wall)} ${f2(outTop+wall)} L ${f2(w-wall)} ${f2(outBot-wall)} L ${f2(arcC[SEG][0])} ${f2(arcC[SEG][1])} ${arcBackC} Z`;

      // 进风管右端越过壳壁 2s 伸入壳内，由后画的蜗壳完全盖住，接缝处不会留下截断线
      const xIn = cx - rWall*R + 2*s;
      // 端法兰尺寸：进风管与出风管完全一致（宽 4s，上下各外扩 1.5s）
      const flangeW = 4*s, flangeH = inletH + 3*s;
      const inlet = `
        <!-- 进风管：金属管壁 + 深色管腔，右端伸入蜗壳内由壳体盖住 -->
        <rect x="0" y="${f2(inTop)}" width="${f2(xIn)}" height="${f2(inletH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="${sw(0.8)}"/>
        <rect x="0" y="${f2(inTop+wall)}" width="${f2(xIn)}" height="${f2(inletH-wall*2)}" fill="#12162b" stroke="#6a7192" stroke-width="${sw(0.7)}"/>
        <!-- 进风管端法兰：贴管口端(x=0)，与出风管同尺寸 -->
        <rect x="0" y="${f2(inTop-1.5*s)}" width="${f2(flangeW)}" height="${f2(flangeH)}" rx="${f2(0.8*s)}" fill="#2a2f45" stroke="#6a7192" stroke-width="${sw(0.9)}"/>
        <line x1="${f2(flangeW*0.22)}" y1="${f2(inTop-1.5*s+0.6*s)}" x2="${f2(flangeW*0.22)}" y2="${f2(inBot+1.5*s-0.6*s)}" stroke="#8e96b6" stroke-width="${sw(0.6)}" opacity="0.4"/>`;

      // 叶轮（后弯式离心叶片，连续旋转）
      const impR = R*0.68, hubR = R*0.20, bladeCount = 8;
      let blades = '';
      for(let i=0; i<bladeCount; i++){
        const angle = (i/bladeCount) * Math.PI*2;
        const b1a = angle + 0.15, b2a = angle + 0.65, b3a = angle + 0.75, b4a = angle + 0.08;
        blades += `<polygon points="${f2(cx+Math.cos(b1a)*hubR)},${f2(cy+Math.sin(b1a)*hubR)} ${f2(cx+Math.cos(b2a)*impR)},${f2(cy+Math.sin(b2a)*impR)} ${f2(cx+Math.cos(b3a)*impR*0.97)},${f2(cy+Math.sin(b3a)*impR*0.97)} ${f2(cx+Math.cos(b4a)*hubR*1.05)},${f2(cy+Math.sin(b4a)*hubR*1.05)}" fill="${c}" opacity="0.4" stroke="${c}" stroke-width="${sw(0.5)}"/>`;
      }
      const impeller = `
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${f2(cx)} ${f2(cy)}" to="360 ${f2(cx)} ${f2(cy)}" dur="0.7s" repeatCount="indefinite"/>
          <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(impR)}" fill="#0c1020" stroke="${c}" stroke-width="${sw(0.8)}" opacity="0.9"/>
          ${blades}
          <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(hubR)}" fill="#2b3050" stroke="${c}" stroke-width="${sw(1)}"/>
        </g>`;

      return `
      <defs>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      ${inlet}
      <!-- 蜗壳 + 出风管（合并轮廓）：金属壳壁 + 深色内腔 -->
      <path d="${bodyD}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="${sw(0.9)}" stroke-linejoin="round"/>
      <path d="${cavD}" fill="#12162b" stroke="#6a7192" stroke-width="${sw(0.7)}" stroke-linejoin="round"/>
      ${impeller}
      <!-- 出风管端法兰：贴管口端(x=w)，与进风管同尺寸 -->
      <rect x="${f2(w-flangeW)}" y="${f2(outTop-1.5*s)}" width="${f2(flangeW)}" height="${f2(flangeH)}" rx="${f2(0.8*s)}" fill="#2a2f45" stroke="#6a7192" stroke-width="${sw(0.9)}"/>
      <line x1="${f2(w-flangeW*0.22)}" y1="${f2(outTop-1.5*s+0.6*s)}" x2="${f2(w-flangeW*0.22)}" y2="${f2(outBot+1.5*s-0.6*s)}" stroke="#8e96b6" stroke-width="${sw(0.6)}" opacity="0.4"/>
      <!-- 壳体轮廓高光：与 vrm 机壳边缘的高光同一处理 -->
      <path d="${bodyD}" fill="none" stroke="#8e96b6" stroke-width="${sw(0.5)}" stroke-linejoin="round" opacity="0.35"/>
      `;
    }
};
