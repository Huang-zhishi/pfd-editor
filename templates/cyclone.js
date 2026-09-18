/* ============================================================
 * PFD Editor · 组件模板：cyclone（旋风除尘器）
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.cyclone。
 *   配色与画法对齐 dustCollector（除尘布袋）/ weighFeeder（配料秤）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突）：
 *       #7d849e → #d9dded → #767d97（金属筒体 / 锥体 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   结构（切向进口标准型）：顶盖 + 圆筒体 + 圆锥体 + 排灰口；
 *     含尘气自切向进气管进入 → 外旋流沿筒壁螺旋下降（粉尘甩向壁面滑下）
 *     → 锥底反转成内旋流 → 净化气经中心排气管（插入筒内的 vortex finder）上升排出。
 *   端口比例（须与文件顶部 ports 定义同步）：
 *     inlet.y=0.38、cleanGas=顶中向上、dustOut=底中向下
 * ============================================================ */

TEMPLATES.cyclone = {
    name: '旋风除尘器', category: '设备',
    defaultSize: { w: 130, h: 190 },
    ports: [
      {id:'inlet',    x:0,   y:.38, dir:'left'},
      {id:'cleanGas', x:.5,  y:0,   dir:'up'},
      {id:'dustOut',  x:.5,  y:1,   dir:'down'}
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'cy_metal_'+uid, metalVId = 'cy_metalv_'+uid, clipId = 'cy_clip_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const K = clamp(Math.min(w/130, h/190), 0.3, 2.4);
      const cx = w/2;
      const edgePad = 2;

      // —— 纵向分区（自上而下）：顶部排气管 → 顶盖 → 圆筒体 → 圆锥体 → 星型卸料阀 → 排灰短管 ——
      const topPipeH = clamp(h*0.075, 4, 13);          // 中心排气管伸出顶盖段（cleanGas 端口）
      const D = clamp(w*0.46, 6, 220);                 // 筒体外径（直径）
      const capT2 = clamp(D*0.08, 1.5, 4);             // 顶盖厚
      const topY = topPipeH + capT2;                   // 筒体顶
      const wallT = clamp(D*0.05, 1.2, 3);             // 壁厚
      const padT = clamp(D*0.06, 1.2, 4);              // 内腔留边
      const starH = clamp(h*0.06, 5, 12);              // 星型卸料阀高
      const dustPipeH = clamp(h*0.045, 3, 9);          // 底部排灰短管长
      const coneBotY = h - edgePad - starH - dustPipeH;// 锥底（与星型阀顶把合）
      const bodyH0 = clamp(D*1.35, 8, 300);            // 筒体高（初始）
      const coneH0 = clamp(D*1.25, 6, 300);            // 锥体高（初始）
      // 极小尺寸下按可用高度同比例压缩，避免锥底越过星型阀
      const availBody = Math.max(2, coneBotY - topY);
      const totalK = Math.min(1, availBody/(bodyH0 + coneH0));
      const bodyH = bodyH0*totalK;
      const coneH = coneH0*totalK;
      const bodyTopY = topY;
      const coneTopY = topY + bodyH;
      const coneBotY2 = coneTopY + coneH;              // 锥体实际底（≈coneBotY）

      const halfW = D/2;
      const topX = cx - halfW, topX2 = cx + halfW;     // 筒体左右缘
      const botW = clamp(D*0.16, 2.5, 16);             // 锥体收口宽
      const botX = cx - botW/2, botX2 = cx + botW/2;

      // —— 步骤1 骨架：后壁 + 金属层 + 内腔 + 顶盖（接管 / 卸料阀 / 动画在后续步骤加入） ——

      // 后壁层（比金属层大 wallT，露在外沿形成壁厚）
      const backBody = `<rect x="${f(topX-wallT)}" y="${f(bodyTopY)}" width="${f(D+wallT*2)}" height="${f(bodyH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      const backCone = `<polygon points="${f(topX-wallT)},${f(coneTopY)} ${f(topX2+wallT)},${f(coneTopY)} ${f(botX2)},${f(coneBotY2)} ${f(botX)},${f(coneBotY2)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      // 金属层（筒体 + 锥体，局部渐变）
      const metalBody = `<rect x="${f(topX)}" y="${f(bodyTopY)}" width="${f(D)}" height="${f(bodyH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      const metalCone = `<polygon points="${f(topX)},${f(coneTopY)} ${f(topX2)},${f(coneTopY)} ${f(botX2)},${f(coneBotY2)} ${f(botX)},${f(coneBotY2)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      // 内部深色腔（筒体矩形 + 锥体梯形，四周留 padT）
      const cavBody = `<rect x="${f(topX+padT)}" y="${f(bodyTopY+padT)}" width="${f(D-padT*2)}" height="${f(Math.max(0, bodyH-padT))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;
      const cavCone = `<polygon points="${f(topX+padT)},${f(coneTopY)} ${f(topX2-padT)},${f(coneTopY)} ${f(botX2-padT*0.7)},${f(coneBotY2-padT*0.7)} ${f(botX+padT*0.7)},${f(coneBotY2-padT*0.7)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;

      // 顶盖法兰条 + 四角螺栓（盖与筒体把合）
      const boltR = clamp(K*1.1, 0.8, 1.6);
      const bolt = (bx,by)=>`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;
      const capFlange =
        `<rect x="${f(topX-wallT)}" y="${f(bodyTopY-capT2)}" width="${f(D+wallT*2)}" height="${f(capT2)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>` +
        bolt(topX-wallT+boltR+1, bodyTopY-capT2/2) +
        bolt(topX2+wallT-boltR-1, bodyTopY-capT2/2);

      // 防溢出裁剪区 = 内腔形状
      const clipDef = `<clipPath id="${clipId}">
        <rect x="${f(topX+padT)}" y="${f(bodyTopY)}" width="${f(Math.max(0.1, D-padT*2))}" height="${f(bodyH)}"/>
        <polygon points="${f(topX+padT)},${f(coneTopY)} ${f(topX2-padT)},${f(coneTopY)} ${f(botX2-padT*0.7)},${f(coneBotY2-padT*0.7)} ${f(botX+padT*0.7)},${f(coneBotY2-padT*0.7)}"/>
      </clipPath>`;

      return `
        <defs>
          ${clipDef}
          <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
          <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
        </defs>
        <!-- 1. 设备后壁（筒体 + 锥体，比金属层大一圈 wallT） -->
        ${backBody}
        ${backCone}
        <!-- 2. 设备主体金属填充 -->
        ${metalBody}
        ${metalCone}
        <!-- 3. 内部深色层 -->
        ${cavBody}
        ${cavCone}
        <!-- 4. 顶盖法兰 + 螺栓 -->
        ${capFlange}
      `;
    }
};
