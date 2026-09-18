/* ============================================================
 * PFD Editor · 组件模板：screwConveyor
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.screwConveyor。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机），
 *   并与简化版 screwConveyorLite 保持同一套画法：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属槽壁 / 端板 / 进料斗 / 出料管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   槽体 = 金属外壳 + 深色内腔（螺旋牙在腔内可见）；槽身加长时把合法兰自动增多；
 *   螺旋牙由 SMIL 平移动画驱动、与物料粒子同受内腔 clipPath 约束（不越出槽体）；
 *   尾端为带座轴承、驱动端为链传动（本组件区别于简化版的实机结构）；
 *   槽顶左段为流入式进料斗、右端下部为水平出料接管（画法见下）。
 * ============================================================ */

TEMPLATES.screwConveyor = {
    name: '螺旋输送机', category: '设备',
    defaultSize: { w: 200, h: 90 },
    ports: [{id:'inlet',x:0.3,y:0,dir:'up'},{id:'outlet',x:1,y:0.75,dir:'right'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'scw_clip_'+uid, metalId = 'scw_metal_'+uid, metalVId = 'scw_metalv_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const reversed = (p && p.reverse) || false;

      /* 槽体：横向长条。竖向居中使螺旋轴心 cy 严格落在 0.5h，
         与 left / right 两个轴头端口（y = 0.5）同轴。 */
      const bodyH = h*0.38;
      const bodyY = h*0.5 - bodyH/2;
      const cy = h*0.5;
      /* 两端端板是定尺部件（尾轴承座 / 驱动端链传动都落在端板内），
         宽度按槽高封顶，并受组件宽度约束，避免宽扁/窄小尺寸下互相挤压。 */
      const endW = Math.max(6, Math.min(26, bodyH*0.62, w*0.14));
      /* 端板与槽体之间的净空：常规取 0.09 槽径（下限 1.5），组件过窄时按剩余宽度让位，
         保证槽体不被挤到压在右端板上（w 逼近下限 20 时会发生）。 */
      const gap  = Math.min(Math.max(1.5, Math.min(3, bodyH*0.09)), Math.max(0, (w - endW*2 - 6)/2));
      const bodyX = endW + gap;
      const bodyW = Math.max(6, w - bodyX*2);

      // 槽壁厚 / 法兰条厚：按槽高封顶，组件缩小时同步变薄，不随槽身拉长变粗
      const wall = Math.max(1.1, Math.min(2.2, bodyH*0.16));
      const flH  = Math.max(1.2, Math.min(2.6, bodyH*0.12));
      const innerTop = bodyY + wall, innerBot = bodyY + bodyH - wall;

      // 螺旋轴：贯穿槽体的中心管，两端伸入端板轴承座内
      const shaftW = Math.max(1, Math.min(2.4, bodyH*0.13));
      const shaft = `<line x1="${f(endW*0.5)}" y1="${f(cy)}" x2="${f(w-endW*0.5)}" y2="${f(cy)}" stroke="#6a7192" stroke-width="${f(shaftW)}"/>`;

      /* 螺旋牙：螺距约等于槽径（实机单头螺旋的常用螺距），槽内均布；reverse 时牙面镜像。
         左右各冗余一道牙，平移一个螺距的整个周期内槽体都被牙铺满、看不出接缝
         （冗余段由 <clipPath> 裁掉，不会露到槽体外）。 */
      const pitch = Math.max(bodyW/16, Math.min(bodyW/4, bodyH*1.05));
      const skew  = pitch*0.38;
      const sgn   = reversed ? -1 : 1;
      const toothStart = bodyX - pitch;
      const toothEnd   = bodyX + bodyW + pitch;
      const toothCount = Math.round((toothEnd - toothStart)/pitch);
      const flightW = Math.max(0.9, Math.min(1.8, bodyH*0.10));
      const moveTo  = reversed ? -pitch : pitch;   // 一个动画周期内牙与物料沿轴平移的距离
      let teeth = '';
      for(let i=0;i<=toothCount;i++){
        const x = toothStart + i*pitch;
        teeth += `<line x1="${f(x-skew*sgn)}" y1="${f(innerBot)}" x2="${f(x+skew*sgn)}" y2="${f(innerTop)}" stroke="#9aa2bc" stroke-width="${f(flightW)}" stroke-linecap="round"/>`;
      }

      /* 两端端板：金属端板把深色内腔封住，端面分别贴组件左右缘（x=0 / x=w），
         轴心 cy 与 left / right 轴头端口严格同轴。
         尾端（左）= 带座轴承；驱动端（右）= 链传动（双链轮 + 同一条闭合链条）。 */
      /* 轴承座半径同时受槽高与端板宽约束：endW*0.5-0.5 保证整圆落在端板内、不越出组件边界 */
      const hubR = Math.max(1.2, Math.min(4.5, bodyH*0.20, endW*0.5 - 0.5));
      const plate = ex =>
        `<rect x="${f(ex)}" y="${f(bodyY)}" width="${f(endW)}" height="${f(bodyH)}" rx="2" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>`;
      const shaftEnd = hx =>
        `<circle cx="${f(hx)}" cy="${f(cy)}" r="${f(hubR*0.34)}" fill="${c}" opacity="0.9"/>`;
      const tailSeat = ex =>
        plate(ex) +
        `<circle cx="${f(ex+endW*0.5)}" cy="${f(cy)}" r="${f(hubR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>` +
        shaftEnd(ex+endW*0.5);

      /* 驱动端链传动（配色与画法对齐 bucketElevator 的链轮 / 闭合链条）：
         从动链轮装在螺旋轴头上（与 right 端口同轴），主动链轮在其正上方，
         两轮由同一条闭合链条连成竖直链环，整体收在端板高度内（端板过扁时按比例收缩）。
         两轮由同一根链条驱动，必须同向旋转，否则链轮看起来在链条上打滑。 */
      const drvCX = w - endW*0.5;                                  // 链轮中心线（端板中心，与轴心同竖线）
      const spR1 = Math.max(2, Math.min(bodyH*0.30, endW*0.32));   // 从动链轮半径
      const spR2 = Math.max(1.4, spR1*0.62);                       // 主动链轮半径
      const upRoom = cy - bodyY - 0.6;                             // 轴心线到端板顶沿的可用高度
      const needH  = spR1 + 2*spR2;                                // 竖直链环所需高度 = R1 + 2*R2
      const kSp    = needH > upRoom ? Math.max(0, upRoom/needH) : 1;
      const R1 = spR1*kSp, R2 = spR2*kSp;
      const dCY = cy - (R1+R2);                                    // 主动链轮中心（正上方）
      const spDur = 1.6;                                           // 与螺旋牙平移周期一致
      const spDir = reversed ? -360 : 360;
      const spokes = (sx, sy, r)=>{
        let s = '';
        for(let i=0;i<6;i++){
          const a = i*Math.PI/3;
          s += `<line x1="${f(sx+Math.cos(a)*r*0.30)}" y1="${f(sy+Math.sin(a)*r*0.30)}" ` +
               `x2="${f(sx+Math.cos(a)*(r-0.9))}" y2="${f(sy+Math.sin(a)*(r-0.9))}" stroke="#5b6280" stroke-width="1"/>`;
        }
        return s;
      };
      const sprocket = (sx, sy, r)=>
        `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(r)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>` +
        `<g><animateTransform attributeName="transform" type="rotate" from="0 ${f(sx)} ${f(sy)}" to="${spDir} ${f(sx)} ${f(sy)}" dur="${f(spDur)}s" repeatCount="indefinite"/>${spokes(sx,sy,r)}</g>` +
        `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(r*0.26)}" fill="#6a7192" opacity="0.85"/>`;
      /* 闭合链条 = 左右两段公切线 + 上下两个绕轮圆弧（竖直长圆环）。
         路径走向为逆时针（右上行 → 顶弧向左 → 左下行 → 底弧向右），
         因此上下两段圆弧的 sweep-flag 均为 0；写成 1 会让底弧向内拱起、
         看起来链条没有绕过从动链轮。 */
      const chainP =
        `M ${f(drvCX+R1)} ${f(cy)} L ${f(drvCX+R2)} ${f(dCY)} ` +
        `A ${f(R2)} ${f(R2)} 0 0 0 ${f(drvCX-R2)} ${f(dCY)} L ${f(drvCX-R1)} ${f(cy)} ` +
        `A ${f(R1)} ${f(R1)} 0 0 0 ${f(drvCX+R1)} ${f(cy)} Z`;
      /* 端板过扁时链轮缩到看不清，整段省略（极小尺寸守卫，见步骤 4） */
      const driveChain = (R1 < 1.6 || R2 < 1) ? '' :
        `<path d="${chainP}" fill="none" stroke="#3f445c" stroke-width="${f(Math.max(0.9, Math.min(1.6, bodyH*0.055)))}" opacity="0.9" stroke-dasharray="2.6 1.4"/>` +
        sprocket(drvCX, dCY, R2) + sprocket(drvCX, cy, R1) + shaftEnd(drvCX);
      const endPlates = tailSeat(0) + plate(w-endW) + driveChain;

      /* 物料粒子：沿轴随螺旋推进（每个周期前进一个螺距、与牙同步），
         数量按槽长/螺距自适应，负 begin 错相形成连续料流。 */
      const pR = Math.max(0.55, Math.min(1.5, bodyH*0.08));
      const pCount = Math.max(2, Math.min(6, Math.round(bodyW/pitch)));
      const pY = cy + bodyH*0.13;
      let parts = '';
      for(let i=0;i<pCount;i++){
        const px = bodyX + bodyW*(i+0.5)/pCount;
        const ph = -(spDur*i/pCount);
        parts += `<circle cx="${f(px)}" cy="${f(pY)}" r="${f(pR)}" fill="${c}" opacity="0.5">` +
          `<animate attributeName="cx" values="${f(px)};${f(px+moveTo)}" dur="${f(spDur)}s" begin="${f(ph)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="cy" values="${f(pY)};${f(pY-pR*0.8)};${f(pY)}" dur="${f(spDur)}s" begin="${f(ph)}s" repeatCount="indefinite"/>` +
          `<animate attributeName="opacity" values="0.25;0.55;0.25" dur="${f(spDur)}s" begin="${f(ph)}s" repeatCount="indefinite"/>` +
          `</circle>`;
      }

      /* 螺旋推进动画：牙整体沿轴平移一个螺距（一个周期 1.6s，与链轮同周期同向，
         reverse 时反向），配合冗余牙读作连续推进的螺旋。
         牙与物料粒子同受内腔裁剪约束（裁剪范围 = 内腔，见 <defs> 的 clipPath），
         平移过程中都不会露到槽体外。 */
      const helix =
        `<g clip-path="url(#${clipId})">` +
          `<g>` +
            `<animateTransform attributeName="transform" type="translate" from="0 0" to="${f(moveTo)} 0" dur="${f(spDur)}s" repeatCount="indefinite"/>` +
            teeth +
          `</g>` +
          parts +
        `</g>`;

      // 槽体上下边缘法兰条（槽盖 / 槽底把合面）
      const edgeFl =
        `<rect x="${f(bodyX-2)}" y="${f(bodyY-flH*0.5)}" width="${f(bodyW+4)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
        `<rect x="${f(bodyX-2)}" y="${f(bodyY+bodyH-flH*0.5)}" width="${f(bodyW+4)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      /* 标准节之间的把合法兰：法兰宽度按槽高封顶，不随槽身变长而变粗；
         标准节数量 = 槽长 / 1.9 槽径（至少 3 节），但相邻法兰之间必须留出 1.5 倍
         法兰宽的净空 —— 窄高（槽身很短）时会被压到只剩 1 节，避免法兰挤成一团。 */
      const jointW = Math.max(1.4, Math.min(3.2, bodyH*0.15));
      const nSec = Math.min(Math.max(3, Math.round(bodyW/(bodyH*1.9))),
                            Math.max(1, Math.floor(bodyW/(jointW*2.5))));
      let joints = '';
      for(let i=1;i<nSec;i++){
        const jx = bodyX + bodyW*i/nSec;
        joints += `<rect x="${f(jx-jointW*0.5)}" y="${f(bodyY-flH*0.5)}" width="${f(jointW)}" height="${f(bodyH+flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      }

      // 法兰螺栓：沿槽体上下把合面均布，半径按槽高封顶
      const bR = Math.max(0.6, Math.min(1.6, bodyH*0.05));
      const boltGap = Math.max(6, Math.min(22, bodyH*0.8));
      const boltCount = Math.max(2, Math.floor(bodyW/boltGap));
      let bolts = '';
      for(let i=0;i<boltCount;i++){
        const bx = bodyX + bodyW*(i+0.5)/boltCount;
        bolts +=
          `<circle cx="${f(bx)}" cy="${f(bodyY)}" r="${f(bR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>` +
          `<circle cx="${f(bx)}" cy="${f(bodyY+bodyH)}" r="${f(bR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;
      }

      /* 进料斗（槽顶 · 流入式喂料）：梯形斗体，斗口朝上敞开、上宽下窄收口到槽顶法兰面，
         物料从上方倒入斗内、沿斗壁下滑收口后从槽顶喂入——是实机的"流入式喂料"，不是管道接管进料。
         斗口顶沿锚在 inlet 端口（w*0.3, 0），中心线不随槽体尺寸漂移。 */
      const inCX = w*0.3;
      const mouthY = 0;
      const mouthW = Math.max(6, Math.min(w*0.16, bodyH*1.5));
      const throatW = mouthW*0.42;
      const throatY = bodyY - flH*0.5;                    // 斗口收口落在槽顶法兰面上
      const inWall = Math.max(0.8, Math.min(1.6, bodyH*0.09));
      const mL = inCX-mouthW*0.5, mR = inCX+mouthW*0.5;
      const tL = inCX-throatW*0.5, tR = inCX+throatW*0.5;
      const opW = throatW*0.55;                            // 槽顶进料口（穿过法兰与槽壁）
      const inletHopper =
        `<rect x="${f(inCX-opW*0.5)}" y="${f(throatY)}" width="${f(opW)}" height="${f(bodyY+wall-throatY)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>` +
        `<polygon points="${f(mL)},${f(mouthY)} ${f(mR)},${f(mouthY)} ${f(tR)},${f(throatY)} ${f(tL)},${f(throatY)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<polygon points="${f(mL+inWall)},${f(mouthY+flH)} ${f(mR-inWall)},${f(mouthY+flH)} ${f(tR-inWall)},${f(throatY-inWall*0.7)} ${f(tL+inWall)},${f(throatY-inWall*0.7)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        `<rect x="${f(mL)}" y="${f(mouthY)}" width="${f(mouthW)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      /* 右端出料接管三件套：金属管壁 + 深色管腔 + 端面法兰，
         中心线严格 y = 0.75h（outlet 端口），管口贴 x = w、管腔朝右敞开。
         管腔比管壁内缩 outWall，右端不再单独收口，端口面即法兰面。 */
      const outCY = h*0.75;
      const outH  = Math.max(3.2, Math.min(bodyH*0.55, h*0.14));
      const outXL = bodyX + bodyW;                         // 接管根部（贴右端板）
      const outLen = Math.max(4, w - outXL);               // 接管长度（伸到组件右缘，与端口对齐）
      const outWall = Math.max(0.8, Math.min(1.6, outH*0.18));
      const outTop = outCY - outH*0.5 - 1.2, outHH = outH + 2.4;
      const outlet =
        `<rect x="${f(outXL)}" y="${f(outTop)}" width="${f(outLen)}" height="${f(outHH)}" rx="0.8" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<rect x="${f(outXL+outWall)}" y="${f(outTop+outWall)}" width="${f(outLen-outWall)}" height="${f(outHH-outWall*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        `<rect x="${f(w-2.2)}" y="${f(outTop)}" width="2.2" height="${f(outHH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      return `
      <defs>
        <clipPath id="${clipId}"><rect x="${f(bodyX+wall)}" y="${f(innerTop)}" width="${f(bodyW-wall*2)}" height="${f(innerBot-innerTop)}"/></clipPath>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      <rect x="${f(bodyX)}" y="${f(bodyY)}" width="${f(bodyW)}" height="${f(bodyH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(bodyX+wall)}" y="${f(innerTop)}" width="${f(bodyW-wall*2)}" height="${f(innerBot-innerTop)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      ${shaft}
      ${helix}
      ${endPlates}
      ${edgeFl}
      ${joints}
      ${bolts}
      ${inletHopper}
      ${outlet}
      `
    }
};
