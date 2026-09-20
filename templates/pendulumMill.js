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
 *   磨辊公转 + 自转、联轴器刻线、落料 / 出料粒子用 SMIL 动画驱动，
 *   编辑态由 editor.js stripSMIL() 自动剥离；绑定 runTag 时由
 *   refreshPendulumMillRun() 注入 props._run 切换运行 / 停止。
 * ============================================================ */

TEMPLATES.pendulumMill = {
    name: '斜摆瀑料磨粉机', category: '设备',
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

      /* ---- 梅花架（中心毂 + 十字摆臂 + 吊点销）---- */
      const spiderH = clamp(h*0.026, 5, 12);
      const armH    = clamp(h*0.018, 3, 9);
      const spider = `
      <rect x="${F(cx-shaftHW*1.9)}" y="${F(spiderY-spiderH/2)}" width="${F(shaftHW*3.8)}" height="${F(spiderH)}" rx="${F(1.5*K)}" fill="url(#${metalId})" stroke="#5b6280" stroke-width="0.9"/>
      ${[-1,1].map(sgn=>{
        const x0 = cx + sgn*shaftHW*1.4, x1 = cx + sgn*(armX + rollHW*0.35);
        return `<rect x="${F(Math.min(x0,x1))}" y="${F(spiderY-armH/2)}" width="${F(Math.abs(x1-x0))}" height="${F(armH)}" rx="${F(armH*0.35)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>`;
      }).join('')}
      ${[-1,1].map(sgn=>`<circle cx="${F(cx+sgn*armX)}" cy="${F(pivotY)}" r="${F(clamp(2.1*K,1.2,3.4))}" fill="#2a2f45" stroke="#8e96b6" stroke-width="0.7"/>`).join('')}`;

      /* ---- 斜摆磨辊（剖视可见左右各一，绕吊点向外下倾斜；辊套 + 磨辊轴 + 轴承座）---- */
      const roller = sgn=>{
        const px = cx + sgn*armX, py = pivotY;
        const deg = -sgn*18;                            // 左辊 +18°（下端向左外摆），右辊 -18°
        const sleeveBot = rollGapTop + rollLen;
        return `<g transform="translate(${F(px)},${F(py)}) rotate(${deg})">
          <rect x="${F(-rollHW*0.42)}" y="0" width="${F(rollHW*0.84)}" height="${F(sleeveBot+clamp(h*0.018,2,7))}" rx="${F(rollHW*0.3)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.8"/>
          <rect x="${F(-rollHW)}" y="${F(rollGapTop)}" width="${F(rollHW*2)}" height="${F(rollLen)}" rx="${F(rollHW*0.45)}" fill="url(#${rollId})" stroke="#5b6280" stroke-width="1"/>
          <line x1="${F(-rollHW)}" y1="${F(rollGapTop+rollLen*0.28)}" x2="${F(rollHW)}" y2="${F(rollGapTop+rollLen*0.28)}" stroke="#3a4060" stroke-width="0.7" opacity="0.8"/>
          <line x1="${F(-rollHW)}" y1="${F(rollGapTop+rollLen*0.72)}" x2="${F(rollHW)}" y2="${F(rollGapTop+rollLen*0.72)}" stroke="#3a4060" stroke-width="0.7" opacity="0.8"/>
          <rect x="${F(-rollHW*1.15)}" y="${F(rollGapTop+rollLen*0.06)}" width="${F(rollHW*2.3)}" height="${F(clamp(h*0.014,2,5))}" rx="${F(1.2*K)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.6"/>
          <rect x="${F(-rollHW*1.15)}" y="${F(rollGapTop+rollLen*0.86)}" width="${F(rollHW*2.3)}" height="${F(clamp(h*0.014,2,5))}" rx="${F(1.2*K)}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.6"/>
          <line x1="${F(-rollHW*0.58)}" y1="${F(rollGapTop)}" x2="${F(-rollHW*0.58)}" y2="${F(sleeveBot)}" stroke="#e8edf8" stroke-width="0.9" opacity="0.5"/>
        </g>`;
      };
      const rollers = roller(-1)+roller(1);

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
      </defs>
      ${foundation}
      <!-- 机壳一体轮廓 + 深色内腔 -->
      <polygon points="${shellPath}" fill="url(#${shellId})" stroke="#6a7192" stroke-width="1.3"/>
      <polygon points="${cavityPath}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      <!-- 磨环（6）+ 磨盘 / 底盘（7）+ 铲刀 -->
      ${ring}
      ${disc}
      ${scraper}
      <!-- 中心轴（2）+ 梅花架 + 斜摆磨辊（3/5）-->
      ${shaft}
      ${spider}
      ${rollers}
      <!-- 顶部加压弹簧（1）+ 压杆 -->
      ${springs}
      ${door}
      <!-- 顶盖（可拆上盖）+ 螺栓 -->
      <rect x="${F(cx-capHW)}" y="${F(capTop)}" width="${F(capHW*2)}" height="${F(capBot-capTop)}" rx="${F(1.2*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1.1"/>
      ${capBolts}
      <!-- 进料口（顶部料斗，梯形）+ 深色腔 -->
      <polygon points="${F(cx-hopperTopHW)},${F(hopperTop)} ${F(cx+hopperTopHW)},${F(hopperTop)} ${F(cx+hopperBotHW)},${F(hopperBot)} ${F(cx-hopperBotHW)},${F(hopperBot)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1.1"/>
      <polygon points="${F(cx-hopperTopHW+inset)},${F(hopperTop+inset)} ${F(cx+hopperTopHW-inset)},${F(hopperTop+inset)} ${F(cx+hopperBotHW-inset*0.6)},${F(hopperBot)} ${F(cx-hopperBotHW+inset*0.6)},${F(hopperBot)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
      `;
    }
};
