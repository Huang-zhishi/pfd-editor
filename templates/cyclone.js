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
 *     inlet.y=0.20（筒体上部 · 切向进口）、cleanGas=顶中向上、dustOut=底中向下
 * ============================================================ */

TEMPLATES.cyclone = {
    name: '旋风除尘器', category: '设备',
    defaultSize: { w: 130, h: 190 },
    ports: [
      {id:'inlet',    x:0,   y:.20, dir:'left'},
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
      const bodyH0 = clamp(D*1.15, 8, 300);            // 筒体高（≈1–2D，工程常用）
      const coneH0 = clamp(D*1.75, 6, 300);            // 锥体高（≈1–3D，锥体偏长更利分离）
      // 按可用高度整体缩放：小尺寸压缩，保证锥底不越过星型阀；
      // 大尺寸适度拉伸（上限 2.0）以填满箱体，避免"筒锥偏小 + 排灰管过长"的失衡比例。
      const availBody = Math.max(2, coneBotY - topY);
      const totalK = Math.min(2.0, availBody/(bodyH0 + coneH0));
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

      // —— 步骤2：接管与排灰装置 ——

      /* 2a. 切向进气管（含尘气入口 · 左侧 · 与 inlet 端口 y=0.20 同轴）：
         矩形断面风道自左侧水平接入筒体上部——工程上进口宜靠近筒体顶端，气流沿筒壁切向卷入
         才有足够行程形成外旋流；管口内伸少许越过筒壁，示意"切入"而非"径向对冲"。
         画法沿用 dustCollector 接管：金属管壁 + 深色管腔 + 端面法兰。*/
      const inletPortY = h*0.20;
      const ductH = clamp(D*0.24, 3.5, 26);            // 进气管断面高
      const ductTop = inletPortY - ductH/2;
      const ductEndX = topX + clamp(D*0.10, 1.5, 8);   // 管口越过筒壁的收口位置
      const ductLen = Math.max(2, ductEndX - edgePad);
      const ductWall = clamp(D*0.03, 0.7, 1.6);
      const inletDuct = `
        <rect x="${f(edgePad)}" y="${f(ductTop)}" width="${f(ductLen)}" height="${f(ductH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(edgePad+ductWall)}" y="${f(ductTop+ductWall)}" width="${f(Math.max(0.5, ductLen-ductWall*2))}" height="${f(Math.max(0.5, ductH-ductWall*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(edgePad)}" y="${f(ductTop-ductH*0.14)}" width="1.8" height="${f(ductH*1.28)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;
      const inletFlange = bolt(edgePad+1.5, ductTop-ductH*0.14+boltR+0.6) + bolt(edgePad+1.5, ductTop+ductH*1.14-boltR-0.6);

      /* 2b. 中心排气管（净化气出口 · vortex finder）：
         自顶盖中心向上伸出接 cleanGas 端口，向下插入筒体内部约 0.50 筒高——
         插入段正是防"短路"的关键：进口气流不能直接从出口溜走，必须先向下旋再反转上升。
         管径取 ≈0.46D（工程常用 0.4–0.6D），顶部设端面法兰，穿盖处设把合法兰。*/
      const cgPipeR = clamp(D*0.23, 1.6, 34);          // 排气管外半径
      const cgWall = clamp(cgPipeR*0.16, 0.5, 1.4);
      const cgTopY = 0;                                // 与 cleanGas 端口 y=0 齐平
      const cgInY = bodyTopY + bodyH*0.50;             // 插入筒体内的深度（须低于进气管下沿，杜绝短路）
      const cgFlH = clamp(cgPipeR*2*0.14, 1.2, 3);
      const cgPipe = `
        <rect x="${f(cx-cgPipeR)}" y="${f(cgTopY)}" width="${f(cgPipeR*2)}" height="${f(Math.max(0.5, cgInY-cgTopY))}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${f(cx-cgPipeR+cgWall)}" y="${f(cgTopY)}" width="${f(Math.max(0.3, cgPipeR*2-cgWall*2))}" height="${f(Math.max(0.5, cgInY-cgTopY))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(cx-cgPipeR-cgWall)}" y="${f(cgTopY)}" width="${f(cgPipeR*2+cgWall*2)}" height="${f(cgFlH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(cx-cgPipeR-cgWall)}" y="${f(bodyTopY-capT2)}" width="${f(cgPipeR*2+cgWall*2)}" height="${f(capT2)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      const cgFlange = bolt(cx-cgPipeR+cgWall+boltR+0.8, cgTopY+cgFlH/2) + bolt(cx+cgPipeR-cgWall-boltR-0.8, cgTopY+cgFlH/2);

      /* 2c. 星型卸料阀（锥底 · 连续排灰并锁气）：
         壳体金属渐变 + 深色腔 + 两端 #2a2f45 端盖；腔内转子用 ${c} 着色并保留旋转动画。
         画法与 dustCollector 的星型阀一致，保证同系列设备观感统一。*/
      const starW = Math.max(botW*1.15, botW+2);
      const starY = coneBotY2;
      const starWall = clamp(starH*0.16, 1, 2.4);
      const starCapW = clamp(starW*0.13, 1.5, 3.2);
      const starValve = `
        <rect x="${f(cx-starW/2)}" y="${f(starY)}" width="${f(starW)}" height="${f(starH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${f(cx-starW/2+starWall)}" y="${f(starY+starWall)}" width="${f(Math.max(0.5, starW-starWall*2))}" height="${f(Math.max(0.5, starH-starWall*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${f(cx)} ${f(starY+starH/2)}" to="360 ${f(cx)} ${f(starY+starH/2)}" dur="3s" repeatCount="indefinite"/>
          <polygon points="${f(cx)},${f(starY+starH*0.15)} ${f(cx+starW*0.2)},${f(starY+starH/2)} ${f(cx)},${f(starY+starH*0.35)}" fill="${c}" opacity="0.7"/>
          <polygon points="${f(cx+starW*0.2)},${f(starY+starH/2)} ${f(cx)},${f(starY+starH*0.65)} ${f(cx-starW*0.15)},${f(starY+starH*0.45)}" fill="${c}" opacity="0.6"/>
          <polygon points="${f(cx)},${f(starY+starH*0.65)} ${f(cx-starW*0.2)},${f(starY+starH/2)} ${f(cx)},${f(starY+starH*0.45)}" fill="${c}" opacity="0.5"/>
          <polygon points="${f(cx-starW*0.2)},${f(starY+starH/2)} ${f(cx)},${f(starY+starH*0.35)} ${f(cx+starW*0.15)},${f(starY+starH*0.55)}" fill="${c}" opacity="0.6"/>
          <circle cx="${f(cx)}" cy="${f(starY+starH/2)}" r="${f(clamp(starH*0.18, 1.2, 4))}" fill="${c}" opacity="0.8"/>
        </g>
        <rect x="${f(cx-starW/2)}" y="${f(starY)}" width="${f(starCapW)}" height="${f(starH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(cx+starW/2-starCapW)}" y="${f(starY)}" width="${f(starCapW)}" height="${f(starH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      /* 2d. 排灰短管（经星型阀后的粉尘出口，与 dustOut 端口同轴落到设备下沿） */
      const dustTop = starY + starH;
      const dustH = Math.max(0, (h-edgePad) - dustTop);
      const dustOut = dustH > 0.4 ? `
        <rect x="${f(cx-botW/2)}" y="${f(dustTop)}" width="${f(botW)}" height="${f(dustH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${f(cx-botW/2+0.9)}" y="${f(dustTop)}" width="${f(Math.max(0.4, botW-1.8))}" height="${f(dustH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` : '';
      /* 锥底与星型阀之间的落料颈（把收口与阀体连成一体，不留悬空断面） */
      const neckH = Math.max(0, starY - coneBotY2);
      const neck = neckH > 0.5 ? `<rect x="${f(botX)}" y="${f(coneBotY2)}" width="${f(botW)}" height="${f(neckH)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>` : '';

      // —— 步骤3：内腔流场（外旋流 / 内旋流 + 粒子动画） ——

      /* 3a. 局部半径函数：该高度处内腔的横向半宽（筒体段恒定、锥体段随收口线性收小）。
             所有旋流轨迹据此缩放，保证轨迹始终贴在内腔里，不越壁。*/
      const cavTopY = bodyTopY + padT*0.6;
      const cavBotY = coneBotY2 - padT*0.7;
      const rAt = (y)=>{
        if(y <= coneTopY) return Math.max(0.2, halfW - padT);
        const tt = clamp((y-coneTopY)/Math.max(0.01, coneH), 0, 1);
        return Math.max(0.2, (halfW-padT) + ((botW/2 - padT*0.7) - (halfW-padT))*tt);
      };

      /* 3b. 外旋流导向线：气流沿筒壁螺旋下行，正面投影为正弦摆动的螺旋线；
             两条相位错开，虚线低透明度，仅作流向提示（不抢主体）。*/
      const swirlTurns = 1.5, swirlN = 56;
      const swirlGuide = (phase, op)=>{
        let pts = [];
        for(let i=0;i<=swirlN;i++){
          const t = i/swirlN, y = cavTopY + (cavBotY-cavTopY)*t;
          const x = cx + rAt(y)*0.80*Math.sin(2*Math.PI*swirlTurns*t + phase);
          pts.push(`${f(x)},${f(y)}`);
        }
        return `<polyline points="${pts.join(' ')}" fill="none" stroke="#8e96b6" stroke-width="0.8" stroke-dasharray="3 2.6" opacity="${op}"/>`;
      };
      const outerSwirl = swirlGuide(0, 0.34) + swirlGuide(Math.PI, 0.22);

      /* 3c. 内旋流导向线：锥底反转后形成的上行内旋，半径更小（≈0.42 局部半径），
             一路上升至中心排气管口——与外旋流方向相反，形成"双旋流"结构。*/
      const innerGuide = (()=>{
        let pts = [];
        for(let i=0;i<=swirlN;i++){
          const t = i/swirlN;
          const y = cavBotY - (cavBotY - cgInY)*t;
          const x = cx + rAt(y)*0.42*Math.sin(2*Math.PI*swirlTurns*t + Math.PI*0.5);
          pts.push(`${f(x)},${f(y)}`);
        }
        return `<polyline points="${pts.join(' ')}" fill="none" stroke="#d9dded" stroke-width="0.7" stroke-dasharray="2.4 2.4" opacity="0.30"/>`;
      })();

      /* 3d. 切向旋流箭头（筒体上部 · 环形流道内）：一段顺时针圆弧 + 箭头，点出"气流绕轴旋转"。
             圆弧半径取"排气管外缘"与"筒壁"之间的中径，落在环形流道正中，不与中心管重叠。*/
      const swirlArrow = (()=>{
        const aR = Math.max(1.5, Math.min((cgPipeR + halfW - padT)/2, bodyH*0.34));
        const aCy = bodyTopY + bodyH*0.40;
        const a0 = 195*Math.PI/180, a1 = 345*Math.PI/180, N = 18;
        let pts = [];
        for(let i=0;i<=N;i++){
          const a = a0 + (a1-a0)*i/N;
          pts.push(`${f(cx + aR*Math.cos(a))},${f(aCy + aR*Math.sin(a))}`);
        }
        const tipX = cx + aR*Math.cos(a1), tipY = aCy + aR*Math.sin(a1);
        const tx = -Math.sin(a1), ty = Math.cos(a1);        // 切线（a 递增方向）
        const nx = -ty, ny = tx;                            // 法线
        const hL = clamp(aR*0.42, 1.6, 5), hW = clamp(aR*0.26, 1, 3.2);
        const head = `<polygon points="${f(tipX+tx*hL)},${f(tipY+ty*hL)} ${f(tipX+nx*hW)},${f(tipY+ny*hW)} ${f(tipX-nx*hW)},${f(tipY-ny*hW)}" fill="#d9dded" opacity="0.55"/>`;
        return `<polyline points="${pts.join(' ')}" fill="none" stroke="#d9dded" stroke-width="1" opacity="0.45"/>${head}`;
      })();

      /* 3e. 粉尘颗粒（下行 · 外旋流）：自切向进气口高度进入，沿筒壁螺旋下降、
             随锥体收口加速旋入锥底，最后淡出进入星型卸料阀。多颗粒用负 begin 错相形成连续料流。*/
      const dustN = 5, dustDur = 4.6, pS = 40;
      const dustY0 = Math.max(cavTopY, Math.min(inletPortY, coneTopY));
      let dustFlow = '';
      for(let i=0;i<dustN;i++){
        const ph = i*2*Math.PI/dustN;
        const xs = [], ys = [], ops = [];
        for(let k=0;k<=pS;k++){
          const t = k/pS;
          const y = dustY0 + (cavBotY-dustY0)*t;
          xs.push(f(cx + rAt(y)*0.78*Math.sin(2*Math.PI*swirlTurns*t + ph)));
          ys.push(f(y));
          ops.push(t<0.10 ? f(t/0.10*0.85) : (t>0.90 ? f((1-t)/0.10*0.85) : '0.85'));
        }
        const begin = `-${f(i*dustDur/dustN)}s`;
        dustFlow += `<circle cx="${xs[0]}" cy="${ys[0]}" r="${f(clamp(D*0.022, 0.7, 2.4))}" fill="${c}" opacity="0.85">
            <animate attributeName="cx" values="${xs.join(';')}" dur="${f(dustDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${ys.join(';')}" dur="${f(dustDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${ops.join(';')}" dur="${f(dustDur)}s" begin="${begin}" repeatCount="indefinite"/>
          </circle>`;
      }

      /* 3f. 净化气颗粒（上行 · 内旋流）：自锥底反转后沿中心螺旋上升，进入排气管后收拢为直线、
             经管口排出（淡出）。颜色取金属亮色，与含尘气流（${c}）区分。*/
      const cleanN = 4, cleanDur = 4.0, cs = 36;
      const cleanY0 = cavBotY, cleanY1 = cgInY, cleanY2 = edgePad;
      let cleanFlow = '';
      for(let i=0;i<cleanN;i++){
        const ph = i*2*Math.PI/cleanN;
        const xs = [], ys = [], ops = [];
        for(let k=0;k<=cs;k++){
          const t = k/cs;
          let y, x;
          if(t < 0.62){                                  // 内旋上行段
            const tt = t/0.62;
            y = cleanY0 - (cleanY0-cleanY1)*tt;
            x = cx + rAt(y)*0.40*Math.sin(2*Math.PI*swirlTurns*tt + ph + Math.PI*0.5);
          } else {                                       // 排气管内直线上升段
            const tt = (t-0.62)/0.38;
            y = cleanY1 - (cleanY1-cleanY2)*tt;
            x = cx + cgPipeR*0.42*Math.sin(2*Math.PI*0.9*tt + ph + Math.PI*0.5);
          }
          xs.push(f(x)); ys.push(f(y));
          ops.push(t<0.10 ? f(t/0.10*0.8) : (t>0.90 ? f((1-t)/0.10*0.8) : '0.8'));
        }
        const begin = `-${f(i*cleanDur/cleanN)}s`;
        cleanFlow += `<circle cx="${xs[0]}" cy="${ys[0]}" r="${f(clamp(D*0.018, 0.6, 2))}" fill="#d9dded" opacity="0.8">
            <animate attributeName="cx" values="${xs.join(';')}" dur="${f(cleanDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${ys.join(';')}" dur="${f(cleanDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${ops.join(';')}" dur="${f(cleanDur)}s" begin="${begin}" repeatCount="indefinite"/>
          </circle>`;
      }

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
        <!-- 5. 接管：切向进气管 -->
        ${inletDuct}
        ${inletFlange}
        <!-- 6. 锥底落料颈 + 星型卸料阀 + 排灰短管 -->
        ${neck}
        ${starValve}
        ${dustOut}
        <!-- 7. 内腔流场：旋流导向线 + 切向旋流箭头 + 粉尘下行粒子（裁剪在内腔内） -->
        <g clip-path="url(#${clipId})">
          ${outerSwirl}
          ${innerGuide}
          ${swirlArrow}
          ${dustFlow}
        </g>
        <!-- 8. 中心排气管（插入筒内的 vortex finder）置于流场之上，遮住越界的旋流线，保持管体完整 -->
        ${cgPipe}
        ${cgFlange}
        <!-- 9. 净化气上行粒子（沿管内上升排出，绘制在管体之上才可见） -->
        ${cleanFlow}
      `;
    }
};
