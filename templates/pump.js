/* ============================================================
 * PFD Editor · 组件模板：pump
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.pump。
 *   配色与画法对齐 valve（气密阀）/ reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再平涂、也不依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属蜗壳 / 接管）
 *       #12162b（深色管腔 / 表盘）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *       #9aa2bc / #5b6280（件体明细：底座 / 机脚 / 高光）  #8e96b6（螺栓头 / 指针）
 *   保留叶轮旋转与进 / 出口水流粒子动画（共 17 个 SMIL 标签，编辑态由 stripSMIL 剥离）。
 *   本模板无任何文字（压力表刻意无字），亦不新增铭牌。
 * ============================================================ */

TEMPLATES.pump = {
    name: '工业抽水泵', category: '风机泵阀',
    defaultSize: { w: 120, h: 90 },
    ports: [{id:'in',x:0,y:.5,dir:'left'},{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'pump_metal_'+uid, metalVId = 'pump_metalv_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const cx = w/2, cy = h*0.5;

      /* 定尺封顶：蜗壳、接管、法兰、螺栓、压力表、底座机脚都按泵宽 / 泵高封顶，
         放大时只有接管变长、蜗壳略大，法兰 / 螺栓 / 表径 / 机脚等定尺件不随之变粗。 */
      // 压力表：先按高度反推表径与表颈，再据此给蜗壳半径让出顶部空间（修 P5 越界）
      const gaugeR    = Math.max(1.4, Math.min(4.5, h*0.05));
      const neckLen   = Math.max(1, Math.min(2, h*0.02));
      const gaugeNeed = gaugeR*2 + neckLen + 1;                 // 表盘 + 表颈 + 上沿留边
      const R = Math.max(1, Math.min(h*0.38, w*0.34, cy - gaugeNeed));
      const gaugeCx = cx, gaugeCy = cy - R - neckLen - gaugeR;

      // 叶轮片（随叶轮旋转）
      const bladeW = Math.max(0.6, Math.min(1.2, R*0.04));
      const blades = Array.from({length:6}).map((_,i)=>{
        const a = i*60*Math.PI/180;
        return `<line x1="${f(cx+Math.cos(a)*R*0.34)}" y1="${f(cy+Math.sin(a)*R*0.34)}" x2="${f(cx+Math.cos(a)*R*0.62)}" y2="${f(cy+Math.sin(a)*R*0.62)}" stroke="${c}" stroke-width="${f(bladeW)}" opacity="0.5"/>`;
      }).join('');

      // 接管 / 法兰 / 螺栓尺寸（定尺封顶）
      const pipeH  = Math.max(3, Math.min(7, h*0.075));
      const wallT  = Math.max(0.7, Math.min(1.6, pipeH*0.20));
      const flW    = Math.max(2, Math.min(9, w*0.075));
      const flH    = pipeH + Math.max(1, Math.min(3, pipeH*0.5));
      const boltR  = Math.max(0.6, Math.min(1.4, flW*0.16));

      /* 左右接管统一画法 —— 对齐阀 / 脱硫塔接管：
         金属管壁（metalVId，横向管取竖向渐变）+ 深色管腔（#12162b / #6a7192）
         + 端面把合法兰（#2a2f45 / #3f445c）+ 两颗螺栓（#8e96b6）。
         管口最外端即端口锚点（左管口 x=0、右管口 x=w），端面法兰画在管口内侧。 */
      const makePipe = (x0, x1, ph, side)=>{
        const yTop = cy - ph/2;
        const flX  = (side === 'right') ? x1 - wallT - flW : x0 + wallT;
        const boltX = flX + flW/2;
        const boltY1 = cy - flH*0.32, boltY2 = cy + flH*0.32;
        const cavityH = Math.max(0.4, ph - wallT*2);
        return `<rect x="${f(x0)}" y="${f(yTop)}" width="${f(x1-x0)}" height="${f(ph)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
          <rect x="${f(x0)}" y="${f(yTop+wallT)}" width="${f(x1-x0)}" height="${f(cavityH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
          <rect x="${f(flX)}" y="${f(cy-flH/2)}" width="${f(flW)}" height="${f(flH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
          <rect x="${f(flX)}" y="${f(cy-flH/2+flH*0.12)}" width="${f(flW)}" height="${f(Math.max(0.3, flH*0.12))}" fill="#5b6280" opacity="0.7"/>
          <circle cx="${f(boltX)}" cy="${f(boltY1)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.4"/><circle cx="${f(boltX)}" cy="${f(boltY1)}" r="${f(boltR*0.45)}" fill="#8e96b6" opacity="0.9"/>
          <circle cx="${f(boltX)}" cy="${f(boltY2)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.4"/><circle cx="${f(boltX)}" cy="${f(boltY2)}" r="${f(boltR*0.45)}" fill="#8e96b6" opacity="0.9"/>`;
      };
      const innerL = cx - R*0.4, innerR = cx + R*0.4;   // 接管内端（贯穿蜗壳直通泵内）
      const pipeIn  = makePipe(0, innerL, pipeH, 'left');
      const pipeOut = makePipe(innerR, w, pipeH, 'right');

      // 蜗壳两侧对开把合法兰：接管进入蜗壳的交接处加法兰环 + 两颗螺栓
      const jointFlW   = Math.max(1.5, Math.min(3.5, pipeH*0.30));
      const jointFlH   = pipeH + Math.max(1.5, Math.min(4, pipeH*0.7));
      const jointBoltR = Math.max(0.5, Math.min(1, jointFlH*0.10));
      const jointFlange = (jx)=>`<rect x="${f(jx-jointFlW/2)}" y="${f(cy-jointFlH/2)}" width="${f(jointFlW)}" height="${f(jointFlH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <circle cx="${f(jx)}" cy="${f(cy-jointFlH*0.32)}" r="${f(jointBoltR)}" fill="#8e96b6" opacity="0.85"/>
        <circle cx="${f(jx)}" cy="${f(cy+jointFlH*0.32)}" r="${f(jointBoltR)}" fill="#8e96b6" opacity="0.85"/>`;
      const jointL = jointFlange(cx - R);
      const jointR = jointFlange(cx + R);

      // 压力表（顶部居中，无文字）：表颈 + 深色表盘 + 金属描边 + 指针
      const neckW = Math.max(1, Math.min(3, gaugeR*0.7));
      const needleA = 0.6;
      const gauge = `
        <rect x="${f(gaugeCx-neckW/2)}" y="${f(gaugeCy+gaugeR)}" width="${f(neckW)}" height="${f(neckLen)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>
        <circle cx="${f(gaugeCx)}" cy="${f(gaugeCy)}" r="${f(gaugeR)}" fill="#12162b" stroke="#6a7192" stroke-width="1"/>
        <circle cx="${f(gaugeCx)}" cy="${f(gaugeCy)}" r="${f(gaugeR*0.8)}" fill="#12162b" stroke="#5b6280" stroke-width="0.6"/>
        <line x1="${f(gaugeCx)}" y1="${f(gaugeCy)}" x2="${f(gaugeCx+Math.cos(needleA)*gaugeR*0.6)}" y2="${f(gaugeCy+Math.sin(needleA)*gaugeR*0.6)}" stroke="${c}" stroke-width="1.1"/>
        <circle cx="${f(gaugeCx)}" cy="${f(gaugeCy)}" r="${f(Math.max(0.5, gaugeR*0.3))}" fill="${c}"/>`;

      // 泵底座 / 机脚：蜗壳下方件体底板 + 机脚支座，底边收进 h（先画，蜗壳压在其上）
      const baseH   = Math.max(1.5, Math.min(3.5, h*0.05));
      const baseBot = h - Math.max(0.8, baseH*0.30);
      const baseTop = baseBot - baseH;
      const baseW   = Math.max(w*0.3, Math.min(w*0.72, R*2));
      const baseX   = cx - baseW/2;
      const pedW    = Math.max(2, Math.min(R*0.8, w*0.30));
      const pedTop  = cy + R*0.78;
      const pedal = pedTop < baseTop
        ? `<rect x="${f(cx-pedW/2)}" y="${f(pedTop)}" width="${f(pedW)}" height="${f(baseTop-pedTop)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.7"/>`
        : '';
      const base = `
        ${pedal}
        <rect x="${f(baseX)}" y="${f(baseTop)}" width="${f(baseW)}" height="${f(baseH)}" rx="${f(Math.min(1, baseH*0.4))}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>
        <rect x="${f(baseX)}" y="${f(baseTop+baseH*0.18)}" width="${f(baseW)}" height="${f(Math.max(0.3, baseH*0.22))}" fill="#d9dded" opacity="0.5"/>`;

      // 水流粒子（定尺封顶）+ 进出路径
      const pR = Math.max(0.8, Math.min(1.8, h*0.02));
      const inStart  = flW + wallT + 1,   inEnd  = innerL - 1;
      const outStart = innerR + 1,        outEnd = w - flW - wallT - 1;
      const inTravel  = Math.max(0, inEnd - inStart);
      const outTravel = Math.max(0, outEnd - outStart);
      const particles = (start, travel)=> [0,0.25,0.5,0.75].map((ph)=>
        `<g><circle cx="${f(start)}" cy="${f(cy)}" r="${f(pR)}" fill="${c}" opacity="0.85">
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0 0;${f(travel)} 0;${f(travel)} 0" keyTimes="0;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
          </circle></g>`).join('');
      const inParticles  = particles(inStart, inTravel);
      const outParticles = particles(outStart, outTravel);

      return `
      <defs>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      <!-- 泵底座 / 机脚（先画，蜗壳压在其上） -->
      ${base}
      <!-- 蜗壳（居中对称）：金属壳 + 内圈高光 + 轮毂 -->
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.6"/>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R*0.78)}" fill="none" stroke="#5b6280" stroke-width="0.9" opacity="0.8"/>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R*0.3)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>
      <!-- 叶轮（旋转） -->
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 ${f(cx)} ${f(cy)}" to="360 ${f(cx)} ${f(cy)}" dur="3s" repeatCount="indefinite"/>
        ${blades}
        <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Math.max(0.6, R*0.12))}" fill="${c}" opacity="0.7"/>
      </g>
      <!-- 吸入管 in / 排出管 out（贯穿蜗壳直通泵内）+ 对开把合法兰 -->
      ${pipeIn}
      ${pipeOut}
      ${jointL}
      ${jointR}
      <!-- 压力表（顶部居中，无文字） -->
      ${gauge}
      <!-- 水流粒子：进口 4 颗流入泵内、出口 4 颗流出 -->
      ${inParticles}
      ${outParticles}`;
    }
};
