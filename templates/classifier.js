/* ============================================================
 * PFD Editor · 组件模板：classifier（选粉机 / 动态选粉机）
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.classifier。
 *   配色与画法对齐 vrm（立磨选粉机段）/ dustCollector（除尘布袋）/ cyclone（旋风除尘器）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突）：
 *       #7d849e → #d9dded → #767d97（金属筒体 / 收集锥 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边 / 静叶）  #2a2f45 / #3f445c（法兰与机架）
 *   结构（切向进风 · 笼式转子型）：
 *     经粉磨烘干的物料随气流自下部切向进风管进入 → 导风叶片（静叶）使气固两相形成切向旋流
 *     → 转子笼与导风叶片同向旋转、在两者之间的环形间隙形成离心力场完成分选
 *     → 粗粉被抛向外壁、受重力下落经锥底由返料装置送回磨机重磨
 *     → 成品细粉随气流穿过转子笼、经上部出风管排出。
 *   端口比例（须与文件顶部 ports 定义同步）：
 *     inlet=左下（切向进风）、product=右上（成品出风）、coarse=右下（粗粉返料）
 * ============================================================ */

TEMPLATES.classifier = {
    name: '选粉机', category: '粉磨与分级',
    defaultSize: { w: 160, h: 240 },
    ports: [
      {id:'inlet',   x:0, y:.68, dir:'left'},    // 含料气流入口（下部 · 切向进风）
      {id:'product', x:1, y:.18, dir:'right'},   // 成品气粉出口（上部 · 出风管）
      {id:'coarse',  x:1, y:.92, dir:'right'}    // 粗粉返料口（底部 · 返回磨机）
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'cl_clip_'+uid, metalId = 'cl_metal_'+uid, metalVId = 'cl_metalv_'+uid;
      const retClipId = 'cl_ret_'+uid, rotorClipId = 'cl_rotor_'+uid, prodClipId = 'cl_prod_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const K = clamp(Math.min(w/160, h/240), 0.3, 2.4);
      const cx = w/2;
      const edgePad = 2;

      // —— 纵向分区（自上而下）：驱动装置 → 顶盖 → 筒体（分级区）→ 收集锥 → 机架支腿 ——
      const driveH = clamp(h*0.12, 8, 32);             // 顶部驱动装置（减速机 + 电机）高度
      const capT   = clamp(w*0.022, 1.5, 3.5);         // 顶盖厚
      const legH   = clamp(h*0.075, 4, 18);            // 支腿高

      const D = clamp(w*0.62, 10, 260);                // 筒体外径
      const halfW = D/2;
      const topX = cx - halfW, topX2 = cx + halfW;     // 筒体左右缘
      const wallT = clamp(D*0.035, 1, 2.6);            // 壁厚
      const padT  = clamp(D*0.05, 1.2, 4);             // 内腔留边

      const capBotY  = edgePad + driveH;               // 顶盖上表面（驱动装置坐落面）
      const bodyTopY = capBotY + capT;                 // 筒体顶
      const bodyH0 = clamp(D*1.05, 10, 300);           // 筒体高（分级区）
      const coneH0 = clamp(D*0.55, 6, 180);            // 收集锥自然高
      // 底部先预留返料螺旋输送机的槽体空间：锥底恰好落在槽口上沿，粗粉落锥后即入槽外送
      const coarseY = h*0.92;                          // 返料口中心线（须与 ports.coarse 同步）
      const retH    = clamp(h*0.085, 5, 20);           // 返料螺旋槽体外高
      const coneBotY = coarseY - retH/2;               // 锥底 = 槽口上沿
      // 筒体 + 锥体按自然高比整体缩放填满可用高度；锥体吸收余量，保证锥底恒落在槽口
      const avail = Math.max(2, coneBotY - bodyTopY);
      const totalK = Math.min(2.4, avail/(bodyH0 + coneH0));
      const bodyH = bodyH0*totalK;
      const coneH = Math.max(1, avail - bodyH);
      const coneTopY = bodyTopY + bodyH;               // 筒体 / 锥体交界

      const botW = clamp(D*0.34, 3, 40);               // 锥底收口宽（接返料装置）
      const botX = cx - botW/2, botX2 = cx + botW/2;

      // —— 步骤1 骨架：机架 + 主体 + 顶盖 + 收集锥 + 驱动装置 + 中心轴/转子笼/导风叶片 ——
      //    （步骤2 在此之上加入进/出风管与返料螺旋；流场动画在步骤3加入）

      // 后壁层（比金属层大 wallT，露在外沿形成壁厚）
      const backBody = `<rect x="${f(topX-wallT)}" y="${f(bodyTopY)}" width="${f(D+wallT*2)}" height="${f(bodyH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      const backCone = `<polygon points="${f(topX-wallT)},${f(coneTopY)} ${f(topX2+wallT)},${f(coneTopY)} ${f(botX2)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      // 金属层（筒体 + 收集锥，局部渐变）
      const metalBody = `<rect x="${f(topX)}" y="${f(bodyTopY)}" width="${f(D)}" height="${f(bodyH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      const metalCone = `<polygon points="${f(topX)},${f(coneTopY)} ${f(topX2)},${f(coneTopY)} ${f(botX2)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.4"/>`;
      // 内部深色腔（筒体矩形 + 锥体梯形，四周留 padT）
      const cavBody = `<rect x="${f(topX+padT)}" y="${f(bodyTopY+padT)}" width="${f(D-padT*2)}" height="${f(Math.max(0, bodyH-padT))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;
      const cavCone = `<polygon points="${f(topX+padT)},${f(coneTopY)} ${f(topX2-padT)},${f(coneTopY)} ${f(botX2)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;

      // 顶盖法兰条 + 两端螺栓（盖与筒体把合）
      const boltR = clamp(K*1.3, 0.8, 1.8);
      const bolt = (bx,by)=>`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;
      const capFlange =
        `<rect x="${f(topX-wallT)}" y="${f(capBotY)}" width="${f(D+wallT*2)}" height="${f(capT)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>` +
        bolt(topX-wallT+boltR+1, capBotY+capT/2) +
        bolt(topX2+wallT-boltR-1, capBotY+capT/2);

      /* 机架支腿：生根于筒体/锥体交界，落到组件下沿的基础板。
         两根立柱在锥体收口之外（不与锥壁相交），加斜撑与地脚板，读作"立式悬臂机架"。 */
      const legTopY = coneTopY;
      const legBotY = h - edgePad;
      const legX0 = cx - halfW*0.94, legX1 = cx + halfW*0.94;
      const legW = clamp(D*0.05, 1.2, 4.5);
      const footW = legW*2.6, footH = clamp(legH*0.22, 1.2, 4);
      const leg = (lx, sgn)=>{
        const braceY = legTopY + (legBotY-legTopY)*0.42;
        const coneX = cx + sgn*(halfW - (halfW - botW/2)*((braceY-coneTopY)/Math.max(0.01,coneH)));
        return `<rect x="${f(lx-legW/2)}" y="${f(legTopY)}" width="${f(legW)}" height="${f(legBotY-legTopY)}" fill="#0c1020" stroke="#3f445c" stroke-width="1"/>` +
          `<line x1="${f(coneX)}" y1="${f(braceY)}" x2="${f(lx)}" y2="${f(braceY)}" stroke="#3f445c" stroke-width="${f(clamp(legW*0.55,0.8,2.4))}" stroke-linecap="round"/>` +
          `<rect x="${f(lx-footW/2)}" y="${f(legBotY-footH)}" width="${f(footW)}" height="${f(footH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      };
      const legs = leg(legX0, -1) + leg(legX1, 1);
      // 基础环板（把两根支腿连成一体）
      const basePlate = `<rect x="${f(legX0-footW/2)}" y="${f(legBotY-footH)}" width="${f(legX1-legX0+footW)}" height="${f(footH)}" rx="1" fill="#0c1020" stroke="#3f445c" stroke-width="1"/>`;

      /* 顶部驱动装置：立式减速机（居中，输出轴即中心竖轴）+ 侧置主电机。
         减速机坐在顶盖上，竖轴穿过顶盖伸入筒体驱动转子笼。 */
      const gbH = clamp(driveH*0.62, 5, 22);
      const gbW = clamp(D*0.34, 7, 40);
      const gbX = cx - gbW/2, gbY = capBotY - gbH;
      const motorH = clamp(gbH*0.80, 4, 18);
      const motorW = clamp(D*0.30, 6, 34);
      const gapM = clamp(D*0.05, 1, 4);
      const motorX = gbX + gbW + gapM, motorY = capBotY - motorH;
      const drive =
        // 减速机底座（与顶盖把合）
        `<rect x="${f(gbX-boltR-0.6)}" y="${f(gbY-gbH*0.16)}" width="${f(gbW+boltR*2+1.2)}" height="${f(gbH*0.20)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>` +
        // 减速机箱体 + 把合面
        `<rect x="${f(gbX)}" y="${f(gbY)}" width="${f(gbW)}" height="${f(gbH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.1"/>` +
        `<line x1="${f(gbX+1.5)}" y1="${f(gbY+gbH*0.38)}" x2="${f(gbX+gbW-1.5)}" y2="${f(gbY+gbH*0.38)}" stroke="#5b6280" stroke-width="0.8" stroke-dasharray="4 3"/>` +
        `<circle cx="${f(cx)}" cy="${f(gbY+gbH*0.5)}" r="${f(clamp(gbH*0.16,1,3.4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>` +
        // 主电机：横置圆筒 + 散热筋 + 接线盒 + 输出轴联轴器
        `<rect x="${f(motorX)}" y="${f(motorY)}" width="${f(motorW)}" height="${f(motorH)}" rx="2" fill="#2f3550" stroke="#6a7192" stroke-width="1.1"/>` +
        `<line x1="${f(motorX+motorW*0.16)}" y1="${f(motorY+1.6)}" x2="${f(motorX+motorW*0.16)}" y2="${f(motorY+motorH-1.6)}" stroke="#5b6280" stroke-width="0.9"/>` +
        `<line x1="${f(motorX+motorW*0.40)}" y1="${f(motorY+1.6)}" x2="${f(motorX+motorW*0.40)}" y2="${f(motorY+motorH-1.6)}" stroke="#5b6280" stroke-width="0.9"/>` +
        `<rect x="${f(motorX+motorW*0.52)}" y="${f(motorY-motorH*0.34)}" width="${f(motorW*0.34)}" height="${f(motorH*0.34)}" rx="1" fill="url(#${metalVId})" stroke="#6a7192" stroke-width="0.8"/>` +
        `<rect x="${f(motorX+motorW)}" y="${f(motorY+motorH*0.30)}" width="${f(Math.max(1.5, gapM*0.9))}" height="${f(motorH*0.40)}" fill="url(#${metalVId})" stroke="#6a7192" stroke-width="0.8"/>`;

      /* 分级区：导风叶片环（静叶，外圈） + 转子笼（动叶，内圈）。
         正面投影上：静叶落在转子两侧的环形带内（斜置短片），转子为居中的竖叶片笼。
         两者同向旋转、其间的环形间隙即离心分选空间——分级区高度取筒体的中段。 */
      const zoneTopY = bodyTopY + bodyH*0.16;
      const zoneBotY = bodyTopY + bodyH*0.84;
      const zoneH = Math.max(1, zoneBotY - zoneTopY);
      const guideR = Math.max(4, Math.min(D*0.40, halfW - padT*1.6));
      const rotorR = clamp(D*0.20, 2, 60);
      const ringH = clamp(D*0.045, 1.2, 4);
      const bladeW = clamp(D*0.016, 0.8, 2.2);

      // 导风叶片（静叶）：左右各一条环形带，带内斜置叶片，叶片数与带高自适应
      const vaneBand = (sgn)=>{
        const xa = cx + sgn*guideR, xb = cx + sgn*rotorR;
        const bw = Math.abs(xa - xb);
        const n = Math.max(3, Math.round(zoneH/(Math.max(3, bw)*1.15)));
        const lean = bw*0.44;
        let out = '';
        for(let i=0;i<n;i++){
          const y = zoneTopY + zoneH*(i+0.5)/n;
          out += `<line x1="${f(xa)}" y1="${f(y-lean*0.5)}" x2="${f(xb)}" y2="${f(y+lean*0.5)}" stroke="#6a7192" stroke-width="${f(bladeW)}" stroke-linecap="round"/>`;
        }
        return out;
      };
      const guideVanes = vaneBand(-1) + vaneBand(1);

      // 转子笼：上下环 + 竖向叶片（动叶）。叶片在转子环带窗口内沿水平方向平移一个叶距后无缝循环，
      // 正面投影下读作"转子笼绕竖轴同向旋转"；叶片向窗口两侧各多画一个叶距，平移过程中始终铺满窗口。
      const rotorRing = y => `<rect x="${f(cx-rotorR)}" y="${f(y-ringH/2)}" width="${f(rotorR*2)}" height="${f(ringH)}" rx="${f(ringH*0.4)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>`;
      const rotorBladeN = 9;
      const rotorPitch = (rotorR*2)/rotorBladeN;
      const rotorBladeW = clamp(bladeW*1.15, 1, 2.6);
      let rotorBlades = '';
      for(let i=-rotorBladeN;i<rotorBladeN*2;i++){
        const bx = cx - rotorR + rotorPitch*(i+0.5);
        rotorBlades += `<line x1="${f(bx)}" y1="${f(zoneTopY)}" x2="${f(bx)}" y2="${f(zoneBotY)}" stroke="${c}" stroke-width="${f(rotorBladeW)}" opacity="0.85"/>`;
      }
      // 转子环带裁剪窗：把冗余叶片裁到转子宽度内，平移时不外溢到环形间隙
      const rotorClipDef = `<clipPath id="${rotorClipId}"><rect x="${f(cx-rotorR)}" y="${f(zoneTopY)}" width="${f(rotorR*2)}" height="${f(zoneH)}"/></clipPath>`;
      const rotor =
        rotorRing(zoneTopY) +
        `<g clip-path="url(#${rotorClipId})"><g>` +
          `<animateTransform attributeName="transform" type="translate" from="0 0" to="${f(rotorPitch)} 0" dur="1.1s" repeatCount="indefinite"/>` +
          `${rotorBlades}` +
        `</g></g>` +
        rotorRing(zoneBotY);

      // 中心竖轴：减速机输出轴穿过顶盖伸入筒体，吊挂转子笼
      const shaftW = clamp(D*0.045, 1, 3.5);
      const shaft = `<rect x="${f(cx-shaftW/2)}" y="${f(capBotY)}" width="${f(shaftW)}" height="${f(zoneBotY-capBotY)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.8"/>`;
      // 轴穿过顶盖处的密封轴承座
      const shaftSeat = `<rect x="${f(cx-shaftW*1.8)}" y="${f(bodyTopY-padT*0.2)}" width="${f(shaftW*3.6)}" height="${f(clamp(padT*0.9,1.2,3.6))}" rx="1" fill="url(#${metalVId})" stroke="#6a7192" stroke-width="0.8"/>`;

      // 防溢出裁剪区 = 内腔形状（筒体 + 收集锥）
      const clipDef = `<clipPath id="${clipId}">
        <rect x="${f(topX+padT)}" y="${f(bodyTopY)}" width="${f(Math.max(0.1, D-padT*2))}" height="${f(bodyH)}"/>
        <polygon points="${f(topX+padT)},${f(coneTopY)} ${f(topX2-padT)},${f(coneTopY)} ${f(botX2)},${f(coneBotY)} ${f(botX)},${f(coneBotY)}"/>
      </clipPath>`;

      /* ============================================================
       * 步骤2：接管（下部切向进风管 + 顶部成品出风管 + 底部返料螺旋输送机）
       *   端口中心线严格取 h*0.68 / h*0.18 / h*0.92，与文件顶部 ports 一一对应。
       *   风管画法沿用 cyclone：金属管壁 + 深色管腔 + 端面法兰 + 螺栓。
       * ============================================================ */

      /* 2a. 下部切向进风管（含料气流入口 · 左侧 · 与 inlet 端口 y=0.68 同轴）：
         矩形断面风道自左侧水平接入筒体下部，管口越过壁面少许示意"切向切入"。
         左壁 x 随高度变化：筒体段为 topX，锥体段随收口线性内移，故按高度取交点。 */
      const inletY = h*0.68;
      const inDuctH = clamp(D*0.22, 3, 24);
      const inDuctTop = inletY - inDuctH/2;
      const wallXAt = yy => {
        if(yy <= coneTopY) return topX;
        const t = clamp((yy-coneTopY)/Math.max(0.01, coneH), 0, 1);
        return topX + (botX-topX)*t;
      };
      const inWallX = wallXAt(inletY);                     // 与左壁的交点
      const inEndX  = inWallX + clamp(D*0.06, 1, 5);       // 管口伸入内腔少许
      const inLen   = Math.max(2, inEndX - edgePad);
      const inWall  = clamp(D*0.03, 0.7, 1.6);
      const inletDuct =
        `<rect x="${f(edgePad)}" y="${f(inDuctTop)}" width="${f(inLen)}" height="${f(inDuctH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<rect x="${f(edgePad+inWall)}" y="${f(inDuctTop+inWall)}" width="${f(Math.max(0.5, inLen-inWall*2))}" height="${f(Math.max(0.5, inDuctH-inWall*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` +
        // 组件左缘的对接法兰（外接风管用）
        `<rect x="${f(edgePad)}" y="${f(inDuctTop-inDuctH*0.14)}" width="1.8" height="${f(inDuctH*1.28)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>` +
        // 与筒壁把合的法兰
        `<rect x="${f(inWallX-1.2)}" y="${f(inDuctTop-inDuctH*0.14)}" width="1.2" height="${f(inDuctH*1.28)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;
      const inletFlange = bolt(edgePad+1.5, inDuctTop-inDuctH*0.14+boltR+0.6) + bolt(edgePad+1.5, inDuctTop+inDuctH*1.14-boltR-0.6);

      /* 2b. 顶部成品出风管（成品气粉出口 · 右侧 · 与 product 端口 y=0.18 同轴）：
         矩形断面风道自筒体上部右壁水平引出，成品细粉随气流经此排出选粉机。 */
      const productY = h*0.18;
      const outDuctH = clamp(D*0.20, 3, 22);
      const outDuctTop = productY - outDuctH/2;
      const outStartX = topX2;                             // 贴筒体右壁
      const outLen = Math.max(2, (w-edgePad) - outStartX);
      const outWall = clamp(D*0.03, 0.7, 1.6);
      const productDuct =
        `<rect x="${f(outStartX)}" y="${f(outDuctTop)}" width="${f(outLen)}" height="${f(outDuctH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<rect x="${f(outStartX)}" y="${f(outDuctTop+outWall)}" width="${f(Math.max(0.5, outLen-outWall*2))}" height="${f(Math.max(0.5, outDuctH-outWall*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` +
        // 与筒壁把合的法兰
        `<rect x="${f(outStartX-1.2)}" y="${f(outDuctTop-outDuctH*0.14)}" width="1.2" height="${f(outDuctH*1.28)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>` +
        // 组件右缘的对接法兰
        `<rect x="${f(w-edgePad-1.8)}" y="${f(outDuctTop-outDuctH*0.14)}" width="1.8" height="${f(outDuctH*1.28)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;
      const productFlange = bolt(w-edgePad-0.9, outDuctTop-outDuctH*0.14+boltR+0.6) + bolt(w-edgePad-0.9, outDuctTop+outDuctH*1.14-boltR-0.6);

      /* 2c. 底部返料螺旋输送机（粗粉返料口 · 右侧 · 与 coarse 端口 y=0.92 同轴）：
         收集锥落下的粗粉进入横向螺旋槽，被螺旋叶片推送到右端排出、返回磨盘再粉磨。
         槽体 = 金属外壳 + 深色内腔，腔内斜置螺旋牙（受内腔裁剪）；左端带座轴承、右端出料端面法兰。
         画法沿用 screwConveyor：端板 / 螺旋牙 / 内腔 clipPath 一套。 */
      const retTopY = coneBotY;                            // 槽口上沿 = 锥底
      const screwLX = Math.max(edgePad, botX - clamp(D*0.06, 1, 6));
      const screwRX = w - edgePad;                         // 出料端贴组件右缘（= coarse 端口）
      const screwW  = Math.max(4, screwRX - screwLX);
      const retWall = clamp(retH*0.16, 0.8, 2.4);
      const retInnerTop = retTopY + retWall, retInnerBot = retTopY + retH - retWall;
      // 螺旋牙：斜置短片，牙距约等于槽高；两端各冗余一道由内腔裁剪，读作连续螺旋
      const rzPitch = clamp(screwW/10, Math.max(2, retH*0.9), Math.max(3, retH*1.5));
      const rzSkew  = rzPitch*0.36;
      const rzN     = Math.max(3, Math.round(screwW/rzPitch));
      const rzToothW = clamp(retH*0.10, 0.8, 1.8);
      let rzTeeth = '';
      for(let i=0;i<=rzN;i++){
        const px = screwLX + rzPitch*(i-0.5);
        rzTeeth += `<line x1="${f(px-rzSkew)}" y1="${f(retInnerBot)}" x2="${f(px+rzSkew)}" y2="${f(retInnerTop)}" stroke="#9aa2bc" stroke-width="${f(rzToothW)}" stroke-linecap="round"/>`;
      }
      const retClipDef = `<clipPath id="${retClipId}">
        <rect x="${f(screwLX+retWall)}" y="${f(retInnerTop)}" width="${f(Math.max(0.1, screwW-retWall*2))}" height="${f(Math.max(0.1, retH-retWall*2))}"/>
      </clipPath>`;
      const retEndW = clamp(retH*0.46, 2.5, 11);
      const retHubR = clamp(retH*0.24, 1, 3.6);
      const screwConveyor =
        // 槽体外壳 + 深色内腔
        `<rect x="${f(screwLX)}" y="${f(retTopY)}" width="${f(screwW)}" height="${f(retH)}" rx="1.5" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>` +
        `<rect x="${f(screwLX+retWall)}" y="${f(retInnerTop)}" width="${f(Math.max(0.5, screwW-retWall*2))}" height="${f(Math.max(0.5, retH-retWall*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        // 螺旋牙（内腔裁剪）+ 中心轴
        `<g clip-path="url(#${retClipId})">` +
          `${rzTeeth}` +
          `<line x1="${f(screwLX)}" y1="${f(coarseY)}" x2="${f(screwRX)}" y2="${f(coarseY)}" stroke="#6a7192" stroke-width="${f(clamp(retH*0.12,0.8,2.2))}"/>` +
        `</g>` +
        // 左端带座轴承
        `<rect x="${f(screwLX)}" y="${f(retTopY)}" width="${f(retEndW)}" height="${f(retH)}" rx="1" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<circle cx="${f(screwLX+retEndW*0.5)}" cy="${f(coarseY)}" r="${f(retHubR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>` +
        // 右端出料端面法兰（= coarse 端口面）
        `<rect x="${f(screwRX-1.8)}" y="${f(retTopY-retH*0.12)}" width="1.8" height="${f(retH*1.24)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      const screwFlange = bolt(screwRX-0.9, retTopY-retH*0.12+boltR+0.6) + bolt(screwRX-0.9, retTopY+retH*1.12-boltR-0.6);

      /* ============================================================
       * 步骤3：流场动画（转子旋转 · 含料气流上行 · 粗粉下落返料 · 成品气排出）
       *   全部用 SMIL：编辑态被 stripSMIL 剥离，只留沿轨迹的静态点位；运行态按关键帧循环。
       *   与 cyclone 同款：局部半宽函数约束轨迹贴内腔；多粒子用负 begin 错相形成连续料流。
       * ============================================================ */

      // 3a. 局部半宽函数：该高度处内腔的横向半宽（筒体段恒定，锥体段随收口线性收小）
      const cavTopY = bodyTopY + padT;
      const cavBotY = coneBotY;
      const rAt = (y)=>{
        if(y <= coneTopY) return Math.max(0.2, halfW - padT);
        const tt = clamp((y-coneTopY)/Math.max(0.01, coneH), 0, 1);
        return Math.max(0.2, (halfW-padT) + ((botW/2) - (halfW-padT))*tt);
      };

      // 3b. 上行螺旋导向线（含料气流沿内壁切向盘旋上升）：两条相位错开的虚线，仅作流向提示
      //     线宽与虚线间隔随 K 缩放，避免小尺寸下标注过粗、大尺寸下过细
      const swirlTurns = 1.6, swirlN = 54;
      const flowStroke = clamp(0.9*K, 0.5, 1.6);
      const flowDash = `${f(3*K)} ${f(2.8*K)}`;
      const upSwirl = (phase, op)=>{
        let pts = '';
        for(let i=0;i<=swirlN;i++){
          const t = i/swirlN, y = cavBotY - (cavBotY-cavTopY)*t;
          const x = cx + rAt(y)*0.82*Math.sin(2*Math.PI*swirlTurns*t + phase);
          pts += `${f(x)},${f(y)} `;
        }
        return `<polyline points="${pts.trim()}" fill="none" stroke="#00E5FF" stroke-width="${f(flowStroke)}" stroke-dasharray="${flowDash}" opacity="${op}"/>`;
      };
      const swirlGuides = upSwirl(0, 0.30) + upSwirl(Math.PI, 0.20);

      // 3c. 分级区环隙上行箭头（静叶与转子之间的环形间隙即离心分选空间，气流由此上行）
      //     箭头尺寸同样随 K 缩放（固定像素会在小尺寸下放大成三角块）
      const gapMidR = (guideR + rotorR)/2;
      const arrowW = clamp(2.6*K, 1.1, 5.4);
      const arrowH = clamp(3.8*K, 1.6, 7);
      const arrowStroke = clamp(1.1*K, 0.6, 2);
      const upArrow = (x, yLow, yTip, op)=>
        `<line x1="${f(x)}" y1="${f(yLow)}" x2="${f(x)}" y2="${f(yTip+arrowH*0.9)}" stroke="#00E5FF" stroke-width="${f(arrowStroke)}" opacity="${op}"/>` +
        `<polygon points="${f(x-arrowW)},${f(yTip+arrowH)} ${f(x+arrowW)},${f(yTip+arrowH)} ${f(x)},${f(yTip)}" fill="#00E5FF" opacity="${f(op+0.1)}"/>`;
      const gapArrows = upArrow(cx-gapMidR, zoneBotY, zoneTopY, 0.5) + upArrow(cx+gapMidR, zoneBotY, zoneTopY, 0.5);

      // 3d. 含料气流粒子：自下部切向进风管进入 → 沿内壁盘旋上行 → 升入分级区（气固两相流）
      const dustN = 6, dustDur = 4.4, pS = 40;
      const riseY0 = Math.min(cavBotY, inletY);
      const riseY1 = Math.min(riseY0 - 1, Math.max(cavTopY + 0.5, zoneTopY + zoneH*0.12));
      let dustRise = '';
      for(let i=0;i<dustN;i++){
        const ph = i*2*Math.PI/dustN;
        const xs = [], ys = [], ops = [];
        for(let k=0;k<=pS;k++){
          const t = k/pS;
          const y = riseY0 - (riseY0 - riseY1)*t;
          xs.push(f(cx + rAt(y)*0.80*Math.sin(2*Math.PI*swirlTurns*t + ph)));
          ys.push(f(y));
          ops.push(t<0.12 ? f(t/0.12*0.9) : (t>0.90 ? f((1-t)/0.10*0.9) : '0.90'));
        }
        const begin = `-${f(i*dustDur/dustN)}s`;
        dustRise += `<circle cx="${xs[0]}" cy="${ys[0]}" r="${f(clamp(D*0.020, 0.7, 2.2))}" fill="${c}" opacity="0.90">
            <animate attributeName="cx" values="${xs.join(';')}" dur="${f(dustDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${ys.join(';')}" dur="${f(dustDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${ops.join(';')}" dur="${f(dustDur)}s" begin="${begin}" repeatCount="indefinite"/>
          </circle>`;
      }

      // 3e. 粗粉下落粒子：被抛向内壁 → 受重力沿锥壁下落 → 落至锥底进入返料螺旋槽
      const coarseN = 5, coarseDur = 4.2, cS = 34;
      const fallY0 = zoneBotY, fallY1 = Math.max(fallY0 + 1, cavBotY);
      let coarseFall = '';
      for(let i=0;i<coarseN;i++){
        const ph = i*2*Math.PI/coarseN;
        const xs = [], ys = [], ops = [];
        for(let k=0;k<=cS;k++){
          const t = k/cS;
          const y = fallY0 + (fallY1-fallY0)*t;
          xs.push(f(cx + rAt(y)*(t<0.15 ? 0.80 : 0.94)*Math.sin(2*Math.PI*0.9*t + ph)));
          ys.push(f(y));
          ops.push(t<0.12 ? f(t/0.12*0.85) : (t>0.90 ? f((1-t)/0.10*0.85) : '0.85'));
        }
        const begin = `-${f(i*coarseDur/coarseN)}s`;
        coarseFall += `<circle cx="${xs[0]}" cy="${ys[0]}" r="${f(clamp(D*0.022, 0.7, 2.4))}" fill="#FFB03A" opacity="0.85">
            <animate attributeName="cx" values="${xs.join(';')}" dur="${f(coarseDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${ys.join(';')}" dur="${f(coarseDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${ops.join(';')}" dur="${f(coarseDur)}s" begin="${begin}" repeatCount="indefinite"/>
          </circle>`;
      }

      // 3f. 成品气排出粒子：穿转子笼上行后转向，经上部出风管排出（净化细粉随气流）
      const cleanN = 4, cleanDur = 4.0, qS = 36;
      const exitY = productY, exitX1 = w - edgePad;
      let cleanOut = '';
      for(let i=0;i<cleanN;i++){
        const ph = i*2*Math.PI/cleanN;
        const xs = [], ys = [], ops = [];
        for(let k=0;k<=qS;k++){
          const t = k/qS;
          let y, x;
          if(t < 0.45){                                  // 穿转子笼上行段（半径收拢，末端并到轴心）
            const tt = t/0.45;
            y = zoneBotY - (zoneBotY - exitY)*tt;
            x = cx + rotorR*0.50*Math.sin(2*Math.PI*1.3*tt + ph)*(1-tt);
          } else {                                        // 出风管内水平排出段
            const tt = (t-0.45)/0.55;
            y = exitY;
            x = cx + (exitX1 - cx)*tt;
          }
          xs.push(f(x)); ys.push(f(y));
          ops.push(t<0.12 ? f(t/0.12*0.85) : (t>0.86 ? f((1-t)/0.14*0.85) : '0.85'));
        }
        const begin = `-${f(i*cleanDur/cleanN)}s`;
        cleanOut += `<circle cx="${xs[0]}" cy="${ys[0]}" r="${f(clamp(D*0.018, 0.6, 2.0))}" fill="#d9dded" opacity="0.85">
            <animate attributeName="cx" values="${xs.join(';')}" dur="${f(cleanDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${ys.join(';')}" dur="${f(cleanDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${ops.join(';')}" dur="${f(cleanDur)}s" begin="${begin}" repeatCount="indefinite"/>
          </circle>`;
      }
      // 成品气轨迹裁剪窗 = 内腔（筒体段） ∪ 出风管内腔，保证上行段不越壁、排出段只走管内
      const prodClipDef = `<clipPath id="${prodClipId}">
        <rect x="${f(topX+padT)}" y="${f(bodyTopY)}" width="${f(Math.max(0.1, D-padT*2))}" height="${f(Math.max(0.1, bodyH))}"/>
        <rect x="${f(outStartX)}" y="${f(outDuctTop+outWall)}" width="${f(Math.max(0.5, outLen-outWall*2))}" height="${f(Math.max(0.5, outDuctH-outWall*2))}"/>
      </clipPath>`;

      // 3g. 粗粉螺旋外送粒子：落入返料螺旋槽后被螺旋牙推送至右端排出（裁剪在螺旋内腔）
      const rzPartN = 4, rzPartDur = 2.6;
      const rzBodyL = screwLX + retWall, rzBodyR = Math.max(rzBodyL + 1, screwLX + screwW - retWall);
      let rzParts = '';
      for(let i=0;i<rzPartN;i++){
        const px = rzBodyL + (rzBodyR-rzBodyL)*(i+1)/(rzPartN+1);
        const begin = `-${f(i*rzPartDur/rzPartN)}s`;
        rzParts += `<circle cx="${f(px)}" cy="${f(coarseY)}" r="${f(clamp(retH*0.16, 0.7, 1.8))}" fill="#FFB03A" opacity="0.85">
            <animate attributeName="cx" values="${f(px)};${f(rzBodyR)}" dur="${f(rzPartDur)}s" begin="${begin}" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.85;0.85;0.10" dur="${f(rzPartDur)}s" begin="${begin}" repeatCount="indefinite"/>
          </circle>`;
      }

      return `
        <defs>
          ${clipDef}
          ${retClipDef}
          ${rotorClipDef}
          ${prodClipDef}
          <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
          <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
        </defs>
        <!-- 1. 机架支腿（在主体之后绘制，锥体压住支腿内缘） -->
        ${basePlate}
        ${legs}
        <!-- 2. 设备后壁（筒体 + 收集锥，比金属层大一圈 wallT） -->
        ${backBody}
        ${backCone}
        <!-- 3. 设备主体金属填充 -->
        ${metalBody}
        ${metalCone}
        <!-- 4. 内部深色层 -->
        ${cavBody}
        ${cavCone}
        <!-- 5. 顶盖法兰 + 螺栓 -->
        ${capFlange}
        <!-- 6. 分级区：导风叶片（静叶）+ 转子笼（动叶，绕竖轴同向旋转），裁剪在内腔内 -->
        <g clip-path="url(#${clipId})">
          ${guideVanes}
          ${rotor}
        </g>
        <!-- 6b. 内腔流场：上行螺旋导向线 + 环隙上行箭头 + 含料气流上行粒子 + 粗粉下落粒子（裁剪在内腔） -->
        <g clip-path="url(#${clipId})">
          ${swirlGuides}
          ${gapArrows}
          ${dustRise}
          ${coarseFall}
        </g>
        <!-- 7. 中心竖轴 + 穿盖轴封座 -->
        ${shaftSeat}
        ${shaft}
        <!-- 8. 顶部驱动装置（减速机 + 主电机） -->
        ${drive}
        <!-- 9. 下部切向进风管（含料气流入口） -->
        ${inletDuct}
        ${inletFlange}
        <!-- 10. 顶部成品出风管（成品气粉出口） -->
        ${productDuct}
        ${productFlange}
        <!-- 10b. 成品气排出粒子（穿转子笼上行 → 经出风管排出，裁剪在内腔 ∪ 出风管内腔，绘制在管体之上才可见） -->
        <g clip-path="url(#${prodClipId})">
          ${cleanOut}
        </g>
        <!-- 11. 底部返料螺旋输送机（粗粉返料口，返回磨盘再粉磨） -->
        ${screwConveyor}
        ${screwFlange}
        <!-- 11b. 粗粉螺旋外送粒子（落入螺旋槽后被推送至右端排出，裁剪在螺旋内腔，绘制在槽体之上才可见） -->
        <g clip-path="url(#${retClipId})">
          ${rzParts}
        </g>
      `;
    }
};
