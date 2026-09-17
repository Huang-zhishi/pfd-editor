/* ============================================================
 * PFD Editor · 组件模板：screwConveyorLite
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.screwConveyorLite。
 * ============================================================ */

TEMPLATES.screwConveyorLite = {
    name: '螺旋输送机(简化)', category: '设备',
    defaultSize: { w: 250, h: 60 },
    ports: [{id:'inlet',x:0.3,y:0,dir:'up'},{id:'outlet',x:1,y:0.75,dir:'right'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      // 简化版：去除左右两端端板/电机/链传动，仅保留中间螺旋槽体 + 叶片旋转 + 物料流动 + 顶部进料 + 底部出料
      const bodyX = 8;
      const bodyW = w - 16;
      const bodyH = h*0.38;
      const bodyY = h*0.35;
      const cy = bodyY+bodyH/2;
      const reversed = p.reverse || false;
      // 数据驱动动画：绑定输送机开关 tag（runTag）时由外部注入 _run（true=运行，false=停止）；未绑定/未注入默认运行
      const runTag = (p.runTag || '').trim();
      const running = runTag ? (p._run !== false) : true;
      const clipId = 'screw_'+Math.random().toString(36).substr(2,6);
      // 方案B：斜线螺纹牙（等距平行斜线，像螺钉/绞龙的螺纹牙），整组沿轴向滑动一个螺距 = 螺旋推进
      const pitch = bodyW/3.5;               // 螺距（槽体内约 3.5 道牙）
      const skew = pitch*0.22;               // 牙的横向半宽（控制倾斜度）
      const toothStart = bodyX - pitch;      // 左冗余一道牙，滑动时始终覆盖槽体
      const toothEnd = bodyX + bodyW + pitch;
      const toothCount = Math.round((toothEnd-toothStart)/pitch);
      const sgn = reversed ? -1 : 1;         // 反向时牙面镜像
      let teeth = '';
      for(let i=0;i<=toothCount;i++){
        const x = toothStart + i*pitch;
        teeth += `<line x1="${(x-skew*sgn).toFixed(2)}" y1="${(bodyY+bodyH-2).toFixed(2)}" x2="${(x+skew*sgn).toFixed(2)}" y2="${(bodyY+2).toFixed(2)}" stroke="${p.color}" stroke-width="1.8" stroke-linecap="round"/>`;
      }
      const moveTo = reversed ? -pitch : pitch;
      // 运行态：螺纹牙 + 平移动画；停止态：静态螺纹牙（无动画，定格在停转瞬间）
      const helix = running
        ? `<g clip-path="url(#${clipId})"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="${moveTo} 0" dur="1.6s" repeatCount="indefinite"/>${teeth}</g></g>`
        : `<g clip-path="url(#${clipId})">${teeth}</g>`;
      // 槽体左右端圆滑收口（替代原端板，使螺旋自然终止）
      const endCap = `
      <rect x="${bodyX-3}" y="${bodyY-3}" width="3" height="${bodyH+6}" fill="#1c1b40" stroke="${p.color}" stroke-width="0.8" opacity="0.85"/>
      <rect x="${bodyX+bodyW}" y="${bodyY-3}" width="3" height="${bodyH+6}" fill="#1c1b40" stroke="${p.color}" stroke-width="0.8" opacity="0.85"/>
      <circle cx="${bodyX}" cy="${cy}" r="2.2" fill="#161534" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>
      <circle cx="${bodyX+bodyW}" cy="${cy}" r="2.2" fill="#161534" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>`;
      // 顶部进料口：必须随组件尺寸缩放，否则组件缩小时管口尺寸不变
      // 基准尺寸 defaultSize（w=250,h=60）→ 横向量按 w/250、纵向量按 h/60 等比换算
      const sW = w/250, sH = h/60;
      const cx = w*0.3;                        // 进料口中心（锚定 w*0.3，与 inlet 端口对齐）
      const inW = (20*sW).toFixed(2);          // 进料管宽
      const inH = (8*sH).toFixed(2);           // 进料管高
      const inBot = bodyY - 2*sH;              // 进料管底（与槽体顶面留 2 的间隙）
      const inTop = inBot - 8*sH;              // 进料管顶
      const colW = (28*sW).toFixed(2);         // 进料口法兰宽
      const colH = (4*sH).toFixed(2);          // 进料口法兰高
      const topInlet = `
      <rect x="${(cx-10*sW).toFixed(2)}" y="${inTop.toFixed(2)}" width="${inW}" height="${inH}" fill="#0a0a1a" stroke="${p.color}" stroke-width="1.2"/>
      <rect x="${(cx-14*sW).toFixed(2)}" y="${(inTop-4*sH).toFixed(2)}" width="${colW}" height="${colH}" fill="#1c1b40" stroke="${p.color}" stroke-width="1"/>
      <line x1="${(cx-12*sW).toFixed(2)}" y1="${inBot.toFixed(2)}" x2="${(cx+12*sW).toFixed(2)}" y2="${inBot.toFixed(2)}" stroke="${p.color}" stroke-width="0.8" opacity="0.5" stroke-dasharray="2 2"/>`;
      return `
      <clipPath id="${clipId}"><rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="2"/></clipPath>
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="2" fill="url(#gEquip)" stroke="${p.color}" stroke-width="1.5"/>
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH*0.55}" fill="#0f0e22" opacity="0.75" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${bodyX-2}" y="${bodyY-3}" width="${bodyW+4}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${bodyX-2}" y="${bodyY+bodyH}" width="${bodyW+4}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      ${helix}
      ${topInlet}
      ${endCap}
      `
    }
};
