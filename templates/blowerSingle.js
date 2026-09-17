/* ============================================================
 * PFD Editor · 组件模板：blowerSingle
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.blowerSingle。
 * ============================================================ */

TEMPLATES.blowerSingle = {
    name: '离心风机/鼓风机(单出口)', category: '设备',
    // 与 blower 同款蜗壳，仅保留右侧出风管；左侧不设进风管，由蜗壳壁自身封闭
    defaultSize: { w: 66, h: 78 },
    ports: [{id:'out',x:1,y:.4738,dir:'right'}],
    render: (w,h,p)=>{
      const c = p.color;
      // 半径只由 h 决定 → 蜗壳恒为圆形，与 blower 完全同尺寸
      const R  = h*0.25;                     // 蜗壳半径
      const s  = R/19.5;                     // 等比系数（默认尺寸 66×78 时 s=1）
      const sw = k => (k*s).toFixed(2);      // 线宽等比：组件缩小时描边同步变细
      const f2 = n => n.toFixed(2);
      const cy = h*0.645;                    // 蜗壳中心 y

      // 蜗壳螺旋：壳顶 → 逆时针绕 294° → 舌部（落在出风管下缘延长线上），半径由 R 渐收至 0.90R
      const a0 = -Math.PI/2, a1 = Math.asin(-0.37/0.90);
      const rWall   = 1 - 0.10*(-Math.PI - a0)/(a1 - 2*Math.PI - a0);  // 蜗壳最左点半径系数
      const rTongue = 0.90*Math.cos(a1);                               // 舌部到壳心的水平距离系数
      // 无进风管：壳心按左侧 3s 留白定位，蜗壳最左点贴近组件左边界
      const cx = 3*s + rWall*R;

      const outTop = cy - R;                 // 出风管顶边（与壳顶相切）
      const outBot = cy - R*0.37;            // 出风管底边

      const SEG = 64, arc = [];
      for(let i=0;i<=SEG;i++){
        const t = i/SEG, ang = a0 + (a1-2*Math.PI-a0)*t, r = R*(1-0.10*t);
        arc.push([cx+Math.cos(ang)*r, cy+Math.sin(ang)*r]);
      }
      const arcBack = arc.slice().reverse().map(q=>`L ${f2(q[0])} ${f2(q[1])}`).join(' ');
      // 蜗壳与出风管合并为一个闭合轮廓：出口上缘 → 右端 → 出口下缘 → 蜗壳回到壳顶
      const bodyD = `M ${f2(arc[0][0])} ${f2(arc[0][1])} L ${f2(w)} ${f2(outTop)} L ${f2(w)} ${f2(outBot)} L ${f2(arc[SEG][0])} ${f2(outBot)} ${arcBack} Z`;

      // 端法兰尺寸：与 blower 出风管完全一致（宽 4s，上下各外扩 1.5s）
      const flangeW = 4*s, flangeH = (outBot - outTop) + 3*s;

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
          <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(impR)}" fill="#0f0d24" stroke="${c}" stroke-width="${sw(0.8)}" opacity="0.9"/>
          ${blades}
          <circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(hubR)}" fill="#1a1835" stroke="${c}" stroke-width="${sw(1)}"/>
        </g>`;

      return `
        <!-- 蜗壳 + 出风管（合并轮廓，深色底 + 边框） -->
        <path d="${bodyD}" fill="#0d0b20" stroke="${c}" stroke-width="${sw(1.8)}" stroke-linejoin="round"/>
        <path d="${bodyD}" fill="url(#gEquip)" opacity="0.5" stroke="none"/>
        ${impeller}
        <!-- 出风管端法兰：贴管口端(x=w)，与 blower 同尺寸 -->
        <rect x="${f2(w-flangeW)}" y="${f2(outTop-1.5*s)}" width="${f2(flangeW)}" height="${f2(flangeH)}" rx="${f2(0.8*s)}" fill="#1c1b40" stroke="${c}" stroke-width="${sw(1)}"/>
        <path d="${bodyD}" fill="none" stroke="${c}" stroke-width="${sw(1.5)}" stroke-linejoin="round"/>
      `;
    }
};
