/* ============================================================
 * PFD Editor · 组件模板：pendulumMill（斜摆瀑料磨粉机）
 *   由 templates.js 统一加载，本文件只注册 TEMPLATES.pendulumMill。
 *   机型：立式斜摆（悬辊）磨粉机（雷蒙磨系列）
 *         —— 竖直中心轴由底部卧式「主电机 → 联轴器 → 减速机」驱动，
 *            轴上梅花架带动磨辊沿磨环公转，磨辊在摩擦力下自转；
 *            顶部弹簧经压力杆把磨辊压向磨环（斜摆加压）。
 *   工艺：物料自顶部进料口落入中心轴周边 → 均料至磨辊与磨环之间的碾磨区 →
 *         碾磨后物料落到下部磨盘，由铲刀刮向右侧出料口排出（本组件只画主机）。
 *   配色与画法对齐 vrm / reactor / filterPress：
 *     本文件 <defs> 内局部渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不依赖外部全局 gEquip：
 *       #8e96b6 → #e8edf8 → #c2cae2 → #4f5778（外壳横向高光）
 *       #7d849e → #d9dded → #767d97（金属竖渐变）
 *       #5b6280 → #d9dded → #9aa2bc（磨辊辊套横渐变）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与联接件）
 *       #1a1f33 → #0d1020（机座 / 基础）
 *   联轴器刻线、落料 / 出料粒子用 SMIL 动画驱动，
 *   编辑态由 editor.js stripSMIL() 自动剥离；绑定 runTag 时由
 *   refreshPendulumMillRun() 注入 props._run 切换运行 / 停止。
 *   注：磨辊「绕中心轴公转 / 自转」的旋转特效实现难度过高，已放弃；
 *       磨辊与梅花架按静态绘制（保留斜摆姿态与辊面刻线纹理）。
 * ============================================================ */

TEMPLATES.pendulumMill = {
    name: '斜摆瀑料磨粉机', category: '粉磨与分级',
    defaultSize: { w: 200, h: 280 },
    ports: [
      {id:'feed',      x:0.5, y:0,    dir:'up'},      // 进料（顶部中心，落料入碾磨区）
      {id:'discharge', x:1,   y:0.60, dir:'right'}    // 出料（右下侧，接半成品提升机）
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const c = (p && p.color) || '#9C99FF';
      const shellId = 'pm_shell_'+uid, metalId = 'pm_metal_'+uid;
      const baseId = 'pm_base_'+uid, rollId = 'pm_roll_'+uid;
      const cx = w/2, F = v=>(+v).toFixed(2);
      const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
      const H = (hr,wr)=>Math.min(h*hr, w*wr);        // 定尺封顶：取高度比例与宽度比例的较小值
      /* 数据驱动动画：绑定开关 tag（runTag）时由外部注入 _run（true=运行，false=停止）；
         未绑定 / 未注入 → 默认运行。 */
      const runTag = (p.runTag || '').trim();
      const running = runTag ? (p._run !== false) : true;

      /* ---- 纵向锚点：自上而下首尾相接，各段无悬空缝隙 ---- */
      const hopperTop = 0;                            // 进料口顶
      const hopperBot = h*0.052;                      // 进料口底 = 顶盖顶
      const capTop    = hopperBot;                    // 顶盖（可拆上盖）
      const capBot    = h*0.092;                      // 顶盖底 = 机壳顶
      const shellTop  = capBot;
      const stepTop   = h*0.470;                      // 机壳收分段起点
      const shellBot  = h*0.585;                      // 机壳底 = 底锥底
      const legBot    = h*0.905;                      // 支腿底
      const slabBot   = h*0.945;                      // 基础板底
      /* ---- 横向半宽 ---- */
      const hopperTopHW = w*0.150, hopperBotHW = w*0.078;
      const capHW      = w*0.360;
      const shellHW    = w*0.345;
      const shellBotHW = w*0.285;
      const legW       = clamp(w*0.045, 4, 12);
      const legX       = w*0.255;
      const slabHW     = w*0.375;
      /* ---- 壁厚 / 细部 ---- */
      const inset = clamp(w*0.018, 2, 5);
      const K = w/200;                                // 线宽等细部缩放基准（默认尺寸 200 下 = 1）

      /* ---- 机壳一体轮廓 + 内腔（同一套顶点的内外两条折线）---- */
      const shellPath = [
        [cx-shellHW, shellTop], [cx-shellHW, stepTop], [cx-shellBotHW, shellBot],
        [cx+shellBotHW, shellBot], [cx+shellHW, stepTop], [cx+shellHW, shellTop]
      ].map(pt=>`${F(pt[0])},${F(pt[1])}`).join(' ');
      const cavityPath = [
        [cx-shellHW+inset, shellTop+inset], [cx-shellHW+inset, stepTop],
        [cx-shellBotHW+inset, shellBot-inset], [cx+shellBotHW-inset, shellBot-inset],
        [cx+shellHW-inset, stepTop], [cx+shellHW-inset, shellTop+inset]
      ].map(pt=>`${F(pt[0])},${F(pt[1])}`).join(' ');

      /* ---- 顶盖螺栓 ---- */
      let capBolts = '';
      const boltN = 4;
      for(let i=0;i<boltN;i++){
        const bx = cx - capHW + (capHW*2)*(i+0.5)/boltN;
        capBolts += `<circle cx="${F(bx)}" cy="${F((capTop+capBot)/2)}" r="${F(clamp(1.5*K,0.8,2.2))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;
      }

      /* ---- 侧面检修门（下部出料腔清料门）：门框 + 铰链 + 把手 ---- */
      const doorH = h*0.075, doorTop = h*0.498, doorW = w*0.260;
      const doorX = cx - doorW*0.5;
      const hingeR = clamp(1.3*K,0.7,2);
      const door = `
      <rect x="${F(doorX)}" y="${F(doorTop)}" width="${F(doorW)}" height="${F(doorH)}" rx="${F(1.6*K)}" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>
      <line x1="${F(doorX+doorW*0.30)}" y1="${F(doorTop+2.5*K)}" x2="${F(doorX+doorW*0.30)}" y2="${F(doorTop+doorH-2.5*K)}" stroke="#3a4060" stroke-width="1"/>
      <circle cx="${F(doorX)}" cy="${F(doorTop+doorH*0.28)}" r="${F(hingeR)}" fill="#3a4060" stroke="#8e96b6" stroke-width="0.6"/>
      <circle cx="${F(doorX)}" cy="${F(doorTop+doorH*0.72)}" r="${F(hingeR)}" fill="#3a4060" stroke="#8e96b6" stroke-width="0.6"/>
      <circle cx="${F(doorX+doorW*0.82)}" cy="${F(doorTop+doorH*0.5)}" r="${F(clamp(1.1*K,0.6,1.6))}" fill="#8e96b6" opacity="0.75"/>`;

      /* ---- 支腿 / 基础板 / 地脚螺栓 ---- */
      const legTop = shellBot;
      const leg = sgn=>{
        const lx = cx + sgn*legX - legW*0.5;
        return `<rect x="${F(lx)}" y="${F(legTop)}" width="${F(legW)}" height="${F(legBot-legTop)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${F(lx-legW*0.55)}" y="${F(legBot)}" width="${F(legW*2.1)}" height="${F(slabBot-legBot)}" rx="0.8" fill="url(#${baseId})" stroke="#6a7192" stroke-width="0.8"/>`;
      };
      const slabW = slabHW*2;
      const foundation = `
      ${leg(-1)}${leg(1)}
      <rect x="${F(cx-slabHW)}" y="${F(slabBot)}" width="${F(slabW)}" height="${F(h*0.030)}" fill="url(#${baseId})" stroke="#6a7192" stroke-width="1"/>
      <line x1="${F(cx-slabHW)}" y1="${F(slabBot)}" x2="${F(cx+slabHW)}" y2="${F(slabBot)}" stroke="#8e96b6" stroke-width="1" opacity="0.35"/>
      <circle cx="${F(cx-slabHW*0.72)}" cy="${F(slabBot+h*0.015)}" r="${F(clamp(1.3*K,0.7,1.8))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
      <circle cx="${F(cx+slabHW*0.72)}" cy="${F(slabBot+h*0.015)}" r="${F(clamp(1.3*K,0.7,1.8))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;

      /* ================= 碾磨区内部（步骤 2）================= */
      const innerHW    = shellHW - inset;                 // 上段直筒内腔半宽
      const shaftHW    = clamp(w*0.021, 2.5, 6);          // 中心轴半宽
      const shaftTopY  = h*0.108;                         // 中心轴顶（伸入顶盖）
      const shaftBotY  = shellBot;                        // 中心轴底（步骤 3 续接主轴座）
      const spiderY    = h*0.235;                         // 梅花架（十字摆臂座）中心高度
      const armX       = innerHW*0.56;                    // 摆臂吊点中心距
      const ringTopY   = h*0.268;                         // 磨环工作带顶
      const ringBotY   = h*0.462;                         // 磨环工作带底
      const ringThick  = clamp(w*0.030, 3, 8);            // 磨环厚度
      const ringInnerHW= innerHW - ringThick;             // 磨环内表面半宽（工作带）
      const discY      = stepTop;                         // 磨盘顶面（= 收分段起点）
      const discH      = clamp(h*0.020, 5, 16);           // 磨盘厚度
      const rollHW     = clamp(w*0.043, 4, 11);           // 磨辊辊套半宽
      const rollLen    = clamp(h*0.140, 12, 46);          // 磨辊辊套长度
      const rollGapTop = clamp(h*0.020, 2, 7);            // 辊套顶到摆臂吊点的距离
      const pivotY     = spiderY + clamp(h*0.008, 1.5, 4); // 摆臂吊点
      const sprTopY    = h*0.100, sprBotY = h*0.172;      // 加压弹簧上下端
      const sprR       = clamp(w*0.032, 3, 9);            // 弹簧外半径
      const sprX       = Math.max(armX, shaftHW + sprR*1.1); // 弹簧与摆臂同一垂线

      /* ---- 中心轴（竖）---- */
      const shaft = `
      <rect x="${F(cx-shaftHW)}" y="${F(shaftTopY)}" width="${F(shaftHW*2)}" height="${F(shaftBotY-shaftTopY)}" fill="url(#${metalId})" stroke="#5b6280" stroke-width="0.9"/>
      <line x1="${F(cx-shaftHW*0.45)}" y1="${F(shaftTopY)}" x2="${F(cx-shaftHW*0.45)}" y2="${F(shaftBotY)}" stroke="#d9dded" stroke-width="0.7" opacity="0.5"/>`;

      /* ---- 磨环（环形内锥工作带，左右两片）---- */
      const ringPiece = sgn=>{
        const xo = cx + sgn*innerHW, xi = cx + sgn*ringInnerHW;
        return `<polygon points="${F(xo)},${F(ringTopY)} ${F(xi)},${F(ringTopY)} ${F(xi)},${F(ringBotY)} ${F(xo)},${F(ringBotY)}" fill="url(#${metalId})" stroke="#5b6280" stroke-width="0.8"/>
        <line x1="${F(xi)}" y1="${F(ringTopY)}" x2="${F(xi)}" y2="${F(ringBotY)}" stroke="${c}" stroke-width="1.2" opacity="0.85"/>`;
      };
      const ring = ringPiece(-1)+ringPiece(1);

      /* ---- 磨盘 / 底盘（承托料床、与磨环组成碾磨腔）---- */
      const disc = `
      <rect x="${F(cx-innerHW)}" y="${F(discY)}" width="${F(innerHW*2)}" height="${F(discH)}" fill="url(#${metalId})" stroke="#5b6280" stroke-width="1"/>
      <line x1="${F(cx-innerHW)}" y1="${F(discY)}" x2="${F(cx+innerHW)}" y2="${F(discY)}" stroke="${c}" stroke-width="1" opacity="0.6"/>`;

      /* ---- 铲刀（把碾磨后物料刮向出料口）---- */
      const scrubH = clamp(h*0.034, 4, 13);
      const scrub = sgn=>{
        const bx = cx + sgn*(ringInnerHW - clamp(w*0.006,1,2));
        const tx = cx + sgn*(ringInnerHW*0.34);
        return `<polygon points="${F(bx)},${F(discY-1)} ${F(bx)},${F(discY-scrubH)} ${F(tx)},${F(discY-scrubH*0.25)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>`;
      };
      const scraper = scrub(-1)+scrub(1);

      /* ---- 梅花架：中心毂（中心轴座）+ 左右摆臂与吊点（静态）---- */
      const spiderH = clamp(h*0.026, 5, 12);
      const armH    = clamp(h*0.018, 3, 9);
      const spiderHub = `
      <rect x="${F(cx-shaftHW*1.9)}" y="${F(spiderY-spiderH/2)}" width="${F(shaftHW*3.8)}" height="${F(spiderH)}" rx="${F(1.5*K)}" fill="url(#${metalId})" stroke="#5b6280" stroke-width="0.9"/>`;
      /* 单侧摆臂 + 吊点 */
      const arm = sgn=>{
        const x0 = cx + sgn*shaftHW*1.4, x1 = cx + sgn*(armX + rollHW*0.35);
        return `<rect x="${F(Math.min(x0,x1))}" y="${F(spiderY-armH/2)}" width="${F(Math.abs(x1-x0))}" height="${F(armH)}" rx="${F(armH*0.35)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>
        <circle cx="${F(cx+sgn*armX)}" cy="${F(pivotY)}" r="${F(clamp(2.1*K,1.2,3.4))}" fill="#2a2f45" stroke="#8e96b6" stroke-width="0.7"/>`;
      };

      /* ---- 斜摆磨辊（剖视可见左右各一，绕吊点向外下倾斜；辊套 + 磨辊轴 + 轴承座）
             静态绘制：辊面刻线仅作辊套纹理，不做滚动动画 ---- */
      const roller = sgn=>{
        const px = cx + sgn*armX, py = pivotY;
        const deg = -sgn*18;                            // 左辊 +18°（下端向左外摆），右辊 -18°
        const sleeveBot = rollGapTop + rollLen;
        let rollLines = '';
        for(let k=0;k<3;k++){
          const ly = rollGapTop + rollLen*(0.26 + k*0.24);
          rollLines += `<line x1="${F(-rollHW)}" y1="${F(ly)}" x2="${F(rollHW)}" y2="${F(ly)}" stroke="#3a4060" stroke-width="0.7" opacity="0.8"/>`;
        }
        return `<g transform="translate(${F(px)},${F(py)}) rotate(${deg})">
          <rect x="${F(-rollHW*0.42)}" y="0" width="${F(rollHW*0.84)}" height="${F(sleeveBot+clamp(h*0.018,2,7))}" rx="${F(rollHW*0.3)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>
          <rect x="${F(-rollHW)}" y="${F(rollGapTop)}" width="${F(rollHW*2)}" height="${F(rollLen)}" rx="${F(rollHW*0.45)}" fill="url(#${rollId})" stroke="#5b6280" stroke-width="1"/>
          ${rollLines}
          <rect x="${F(-rollHW*1.15)}" y="${F(rollGapTop+rollLen*0.06)}" width="${F(rollHW*2.3)}" height="${F(clamp(h*0.014,2,5))}" rx="${F(1.2*K)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.6"/>
          <rect x="${F(-rollHW*1.15)}" y="${F(rollGapTop+rollLen*0.86)}" width="${F(rollHW*2.3)}" height="${F(clamp(h*0.014,2,5))}" rx="${F(1.2*K)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.6"/>
          <line x1="${F(-rollHW*0.58)}" y1="${F(rollGapTop)}" x2="${F(-rollHW*0.58)}" y2="${F(sleeveBot)}" stroke="#e8edf8" stroke-width="0.9" opacity="0.5"/>
        </g>`;
      };
      /* 摆臂 + 磨辊成组（静态，不做公转 / 自转） */
      const rollerSet = sgn => arm(sgn)+roller(sgn);
      const rollers = rollerSet(-1)+rollerSet(1);

      /* ---- 顶部加压弹簧（螺旋线）+ 压杆 ----
         注释：说明书「弹簧 1 经压力杆 2 压紧磨辊」，此处画左右两组。 */
      const spring = sgn=>{
        const x = cx + sgn*sprX, coils = 6;
        const seg = (sprBotY - sprTopY)/coils;
        let d = `M ${F(x)} ${F(sprTopY)}`;
        for(let i=0;i<coils;i++){
          d += ` L ${F(x + (i%2===0 ? sprR : -sprR))} ${F(sprTopY + seg*(i+0.5))}`;
        }
        d += ` L ${F(x)} ${F(sprBotY)}`;
        const plateW = sprR*2.6;
        return `<path d="${d}" fill="none" stroke="#8e96b6" stroke-width="${F(clamp(1.6*K,1,2.4))}" stroke-linejoin="round"/>
        <rect x="${F(x-plateW/2)}" y="${F(sprTopY-clamp(h*0.010,2,5))}" width="${F(plateW)}" height="${F(clamp(h*0.010,2,5))}" rx="${F(1.2*K)}" fill="#2a2f45" stroke="#8e96b6" stroke-width="0.6"/>
        <rect x="${F(x-clamp(w*0.012,1.5,4))}" y="${F(sprBotY)}" width="${F(clamp(w*0.024,3,8))}" height="${F(spiderY-sprBotY)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.7"/>`;
      };
      const springs = spring(-1)+spring(1);

      /* ================= 底部传动装置 + 进出料接管（步骤 3）================== */
      /* ---- 减速机（变速箱）：输出竖轴向上接中心轴，卧式输入轴接联轴器 ---- */
      const gearH   = Math.min(clamp(h*0.095, 18, 40), Math.max(10, h*0.90 - shellBot)); // 箱体高（矮画布封顶防溢出）
      const gearW   = clamp(w*0.16, 22, 46);              // 箱体宽
      const gearTop = shellBot - clamp(h*0.006, 1, 3);    // 箱体顶贴壳底（输出端）
      const gearBot = gearTop + gearH;
      const gearX   = cx - gearW*0.5;                     // 箱体左缘
      const inY     = gearTop + gearH*0.58;               // 输入轴（卧式）中心高
      const inBearW = clamp(w*0.022, 3.5, 8);             // 输入轴承座宽
      const cplW    = clamp(w*0.030, 5, 10);              // 联轴器总宽
      const cplCX   = gearX - inBearW - cplW*0.5;         // 联轴器中心
      const motH    = clamp(h*0.052, 10, 22);             // 电机壳体高
      const motW0   = clamp(w*0.20, 30, 60);              // 电机壳体长（期望值）
      const motX0   = Math.max(0.5, gearX - inBearW - cplW - motW0); // 电机左缘（窄画布截短防溢出）
      const motW    = Math.max(8, gearX - inBearW - cplW - motX0);   // 电机实际长
      const motCY   = inY;                                // 电机与输入轴同轴（中心线）
      const motBaseH = Math.max(0, Math.min(clamp(h*0.018, 3, 7), h*0.94 - (motCY+motH/2))); // 电机底座高（矮画布封顶防溢出）

      /* ---- 电机壳体 + 散热筋 + 端盖 + M 铭牌 + 底座 ---- */
      const finN = Math.max(2, Math.min(5, Math.floor(motW/7)));
      let fins = '';
      for(let i=0;i<finN;i++){
        const fx = motX0 + motW*(i+0.5)/finN;
        fins += `<line x1="${F(fx)}" y1="${F(motCY-motH*0.40)}" x2="${F(fx)}" y2="${F(motCY+motH*0.40)}" stroke="#5b6280" stroke-width="0.5" opacity="0.45"/>`;
      }
      const motor = `
      <rect x="${F(motX0)}" y="${F(motCY-motH/2)}" width="${F(motW)}" height="${F(motH)}" rx="${F(2*K)}" fill="url(#${metalId})" stroke="#5b6280" stroke-width="1"/>
      ${fins}
      <rect x="${F(motX0+motW-clamp(w*0.022,3,7))}" y="${F(motCY-motH*0.42)}" width="${F(clamp(w*0.022,3,7))}" height="${F(motH*0.84)}" rx="${F(1.2*K)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
      <text x="${F(motX0+motW*0.30)}" y="${F(motCY+motH*0.18)}" text-anchor="middle" font-family="sans-serif" font-size="${F(clamp(motH*0.5,4,9))}" fill="${c}" opacity="0.85">M</text>
      <rect x="${F(motX0-2)}" y="${F(motCY+motH/2)}" width="${F(motW+4)}" height="${F(motBaseH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      /* ---- 联轴器（本体 + 十字刻线；刻线随传动旋转，SMIL 驱动）---- */
      const coupling = `
      <rect x="${F(cplCX-cplW*0.5)}" y="${F(inY-cplW*0.55)}" width="${F(cplW)}" height="${F(cplW*1.10)}" rx="${F(cplW*0.30)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
      <g>
        ${running?`<animateTransform attributeName="transform" type="rotate" from="0 ${F(cplCX)} ${F(inY)}" to="360 ${F(cplCX)} ${F(inY)}" dur="1.2s" repeatCount="indefinite"/>`:''}
        <line x1="${F(cplCX-cplW*0.38)}" y1="${F(inY)}" x2="${F(cplCX+cplW*0.38)}" y2="${F(inY)}" stroke="${c}" stroke-width="1" opacity="0.9"/>
        <line x1="${F(cplCX)}" y1="${F(inY-cplW*0.42)}" x2="${F(cplCX)}" y2="${F(inY+cplW*0.42)}" stroke="${c}" stroke-width="1" opacity="0.9"/>
      </g>`;

      /* ---- 减速机：箱体 + 把合面 + 顶盖螺栓 + 输入轴承座/输入轴 + 输出法兰（接中心轴）---- */
      const gbR = clamp(1.2*K, 0.7, 1.8);
      const reducer = `
      <rect x="${F(gearX)}" y="${F(gearTop)}" width="${F(gearW)}" height="${F(gearH)}" rx="1.5" fill="url(#${metalId})" stroke="#5b6280" stroke-width="1"/>
      <line x1="${F(gearX+1.5)}" y1="${F(gearTop+gearH*0.52)}" x2="${F(gearX+gearW-1.5)}" y2="${F(gearTop+gearH*0.52)}" stroke="#3f445c" stroke-width="0.7" stroke-dasharray="3 2"/>
      <circle cx="${F(gearX+gearW*0.24)}" cy="${F(gearTop+gearH*0.26)}" r="${F(gbR)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.6"/>
      <circle cx="${F(gearX+gearW*0.76)}" cy="${F(gearTop+gearH*0.26)}" r="${F(gbR)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.6"/>
      <rect x="${F(gearX-inBearW)}" y="${F(inY-inBearW*0.42)}" width="${F(inBearW)}" height="${F(inBearW*0.84)}" rx="${F(0.8*K)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
      <rect x="${F(gearX-inBearW)}" y="${F(inY-clamp(w*0.010,1.5,3))}" width="${F(inBearW)}" height="${F(clamp(w*0.020,3,6))}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.6"/>
      <rect x="${F(cx-shaftHW*1.5)}" y="${F(gearTop-clamp(h*0.008,1.5,3))}" width="${F(shaftHW*3)}" height="${F(clamp(h*0.008,1.5,3))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;
      const drive = motor + coupling + reducer;

      /* ---- 进料口端口法兰（顶部中心，与 ports.feed 严格同轴）---- */
      const feedFlange =
        `<rect x="${F(cx-hopperTopHW*1.14)}" y="0" width="${F(hopperTopHW*2.28)}" height="${F(clamp(h*0.012,2,4))}" rx="0.7" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      /* ---- 出料接管（右下侧下倾管，端口朝右；中心线在端口处 = ports.discharge.y*h）
             根端自壳底上方锥腔接出（上缘在壳底之上），端口略低 → 物料向右下自然流出 ---- */
      const disY   = h*0.60;                              // 端口中心 y（= ports.discharge.y*h，同轴）
      const disH   = clamp(h*0.052, 10, 20);             // 端口处管高
      const disWall = clamp(disH*0.24, 1, 2.5);          // 管壁厚
      const disX0  = cx + shellBotHW*0.92;               // 根端：贴出料锥腔右壁
      const disYTop0 = shellBot - disH*0.5;              // 根端上缘（壳底上方锥腔内 → 管向下倾）
      const disYBot0 = disYTop0 + disH*1.06;             // 根端下缘
      const disYTop1 = disY - disH/2, disYBot1 = disY + disH/2; // 端口上下缘
      const disFlangeW = clamp(disH*0.22, 2, 4);         // 端口法兰宽
      const discharge = `
      <polygon points="${F(disX0)},${F(disYTop0)} ${F(disX0)},${F(disYBot0)} ${F(w)},${F(disYBot1)} ${F(w)},${F(disYTop1)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <polygon points="${F(disX0+disWall)},${F(disYTop0+disWall)} ${F(disX0+disWall)},${F(disYBot0-disWall)} ${F(w-disWall)},${F(disYBot1-disWall)} ${F(w-disWall)},${F(disYTop1+disWall)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
      <rect x="${F(w-disFlangeW)}" y="${F(disYTop1-disH*0.10)}" width="${F(disFlangeW)}" height="${F(disH*1.20)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      /* ================= 运行动画（步骤 4）================== */
      /* ---- 进料落料粒子：自顶盖下方沿中心轴两侧落向磨盘料床（`<animate>` 关键帧）---- */
      const fallTop = capTop + clamp(h*0.012, 2, 5);     // 粒子起点（顶盖下方）
      const fallBot = discY;                             // 粒子终点（磨盘料床）
      const feedN = 7;                                   // 粒子数恒定（不随尺寸变化）
      let feedDots = '';
      for(let i=0;i<feedN;i++){
        const sgn = (i%2===0)?1:-1;
        const fx = cx + sgn*(clamp(w*0.020,2,5) + (i%3)*clamp(w*0.012,1.5,3)); // 中心轴两侧散落
        const dur = 1.0 + (i%3)*0.18;
        const delay = i*0.14;
        feedDots += `<circle cx="${F(fx)}" cy="${F(fallTop)}" r="${F(clamp(1.8*K,1,2.4))}" fill="#FFB03A" opacity="0.9">
        ${running?`<animate attributeName="cy" values="${F(fallTop)};${F(fallBot)}" dur="${dur.toFixed(2)}s" begin="${delay.toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.25;0.8;1" dur="${dur.toFixed(2)}s" begin="${delay.toFixed(2)}s" repeatCount="indefinite"/>`:''}
        </circle>`;
      }

      /* ---- 出料粒子：碾磨后物料沿出料接管流向端口（粒子串平移 + 管腔裁剪，无缝循环）---- */
      const disClipId = 'pm_disclip_'+uid;
      const disCy0 = disYTop0 + disH*0.53;               // 根端中心线
      const disSlope = (disY - disCy0) / Math.max(1, w - disX0); // 中心线斜率
      const disGap = clamp(disH*1.6, 4, 12);             // 粒子间距（平移量整除间距 → 无缝）
      let disDots = '';
      const disN = Math.ceil((w - disX0)/disGap) + 2;
      for(let i=-1;i<disN;i++){
        const dx = i*disGap, dy = dx*disSlope;
        disDots += `<circle cx="${F(disX0+dx)}" cy="${F(disCy0+dy)}" r="${F(clamp(1.6*K,0.8,2.2))}" fill="#4FD1FF" opacity="0.85"/>`;
      }
      const disFlow = running
        ? `<g clip-path="url(#${disClipId})"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="${F(disGap)} ${F(disGap*disSlope)}" dur="1.6s" repeatCount="indefinite"/>${disDots}</g></g>`
        : `<g clip-path="url(#${disClipId})">${disDots}</g>`;

      return `
      <defs>
        <linearGradient id="${shellId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8e96b6"/><stop offset="0.30" stop-color="#e8edf8"/>
          <stop offset="0.58" stop-color="#c2cae2"/><stop offset="1" stop-color="#4f5778"/>
        </linearGradient>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${rollId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5b6280"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#9aa2bc"/>
        </linearGradient>
        <linearGradient id="${baseId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a1f33"/><stop offset="1" stop-color="#0d1020"/>
        </linearGradient>
        <clipPath id="${disClipId}"><polygon points="${F(disX0+disWall)},${F(disYTop0+disWall)} ${F(disX0+disWall)},${F(disYBot0-disWall)} ${F(w-disWall)},${F(disYBot1-disWall)} ${F(w-disWall)},${F(disYTop1+disWall)}"/></clipPath>
      </defs>
      ${foundation}
      <!-- 机壳一体轮廓 + 深色内腔 -->
      <polygon points="${shellPath}" fill="url(#${shellId})" stroke="#6a7192" stroke-width="1.3"/>
      <polygon points="${cavityPath}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      <!-- 磨环（6）+ 磨盘 / 底盘（7）+ 铲刀 -->
      ${ring}
      ${disc}
      ${scraper}
      <!-- 中心轴（2）+ 梅花架毂 + 摆臂/磨辊（静态，斜摆姿态）-->
      ${shaft}
      ${spiderHub}
      ${rollers}
      <!-- 进料落料粒子（步骤 4）：自顶部落向磨盘料床 -->
      ${feedDots}
      <!-- 顶部加压弹簧（1）+ 压杆 -->
      ${springs}
      ${door}
      <!-- 顶盖（可拆上盖）+ 螺栓 -->
      <rect x="${F(cx-capHW)}" y="${F(capTop)}" width="${F(capHW*2)}" height="${F(capBot-capTop)}" rx="${F(1.2*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1.1"/>
      ${capBolts}
      <!-- 进料口（顶部料斗，梯形）+ 深色腔 + 端口法兰 -->
      <polygon points="${F(cx-hopperTopHW)},${F(hopperTop)} ${F(cx+hopperTopHW)},${F(hopperTop)} ${F(cx+hopperBotHW)},${F(hopperBot)} ${F(cx-hopperBotHW)},${F(hopperBot)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1.1"/>
      <polygon points="${F(cx-hopperTopHW+inset)},${F(hopperTop+inset)} ${F(cx+hopperTopHW-inset)},${F(hopperTop+inset)} ${F(cx+hopperBotHW-inset*0.6)},${F(hopperBot)} ${F(cx-hopperBotHW+inset*0.6)},${F(hopperBot)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
      ${feedFlange}
      <!-- 底部传动装置（步骤 3）：主电机 → 联轴器 → 减速机 → 中心轴 -->
      ${drive}
      <!-- 出料接管（步骤 3）：右下侧，端口朝右；出料粒子（步骤 4）沿管腔流出 -->
      ${discharge}
      ${disFlow}
      `;
    }
};
