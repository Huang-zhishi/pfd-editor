/* ============================================================
 * PFD Editor · 组件模板：switchValve
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.switchValve。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属阀体 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   阀体 = 单条闭合路径（进料立管 + 菱形分料腔 + 左右斜分支 + 左右出口管），
 *   一次描边、接缝不互相穿插；内腔为同拓扑按壁厚法向内缩的另一条闭合路径。
 *   几何全部由 ports 反推：进料立管中心线 0.5w、管口顶沿 y = 0；
 *   左 / 右出口管中心线 0.3w / 0.7w、管口底沿 y = h。
 * ============================================================ */

TEMPLATES.switchValve = {
    name: '固体三通阀', category: '风机泵阀',
    defaultSize: { w: 120, h: 150 },
    ports: [{id:'inlet',x:.5,y:0,dir:'up'},{id:'outletA',x:.3,y:1,dir:'down'},{id:'outletB',x:.7,y:1,dir:'down'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'sv_metal_'+uid, clipId = 'sv_clip_'+uid;
      const f = n => Number(n).toFixed(2);
      /* 指示色兜底（p 可能为 null）；props 只读、不再写回 / 变异 */
      const c = (p && p.color) || '#9C99FF';

      /* ---------- 几何：全部由三个端口反推 ---------- */
      const cx = w*0.5;                    // 进料立管中心线（inlet x = 0.5）
      const outAX = w*0.3, outBX = w*0.7;  // 左右出口管中心线（outletA / B x = 0.3 / 0.7）
      // 定尺封顶部件：极小尺寸下同步变薄变小，不随单一方向拉长而变粗
      const wall  = Math.max(1.2, Math.min(3, Math.min(w,h)*0.03));  // 阀壁厚
      const inW   = Math.max(5, Math.min(h*0.12, w*0.20));           // 进料立管外径
      const outW  = inW;                                             // 出口管外径（与进料同口径：固体换向阀两路进出口同规格）
      /* 菱形分料腔：半宽明显小于两出口间距，斜分支才能向外斜张；
         取窄了菱形会容不下立管（k*hw < 立管内半宽），故留 inW*0.58 下限。 */
      const hw    = Math.max(inW*0.58, Math.min(w*0.20, h*0.075));   // 菱形半宽
      const dh    = Math.max(2, h*0.135);                            // 菱形半高
      /* 菱形纵向位置：与「进料立管长度 / 斜腿岔开角」是一组此消彼长 ——
         横对角线（= 斜腿起点 splitY）越靠下，斜腿竖直跨度越短、两腿越岔开，
         但立管（0 → midY）就越长。折中取 splitY = 0.47h，并把菱形本身拉高
         （dh 加大使上顶点 midY = splitY - dh 自动上移），立管直段就只占
         约 1/3 高度，同时斜腿岔开角不受影响（它只由 splitY 决定）。 */
      const midY  = Math.max(inW*0.5, h*0.47 - dh);                  // 菱形上顶点（= 立管下端）
      const splitY = midY + dh;                                      // 菱形横对角线（左右顶点）
      const botY   = splitY + dh;                                    // 菱形下顶点
      /* 出口竖直段只留「端面法兰 + 封堵叉」所需的最小长度，其余高度全部让给
         斜分支 —— 竖直段越长，下部看起来越像两根直管，整体就越不倾斜。 */
      const stemH = Math.max(2.5, outW*0.95, h*0.14);
      const pipeTopY = h - stemH;

      /* ---------- 接管三件套：管壁 / 管腔见 bodyPath，端面法兰在此 ----------
         法兰 = 端面口沿（横跨管口的金属条），顶 / 底沿严格压在端口坐标上，
         宽度按对应管径悬出定尺，不随另一个方向拉长而变粗。 */
      const flH = Math.max(1.6, Math.min(4, Math.min(w,h)*0.035));   // 法兰厚度
      const flW = d => Math.max(1.5, Math.min(4, d*0.18));           // 法兰单侧悬出宽度
      const flange = (mx, mw, top, over) => {
        const ew = mw + over*2;
        const y = top ? 0 : h - flH;
        return `<rect x="${f(mx-ew/2)}" y="${f(y)}" width="${f(ew)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      };
      // 悬出量按管径定尺，并受「组件边缘 / 相邻出口管之间的净空」让位约束
      const ovIn  = Math.max(0.8, Math.min(flW(inW), cx - inW/2 - 0.2));
      const ovOut = Math.max(0.8, Math.min(flW(outW), (outBX - outAX - outW)/2 - 0.2));
      const inFlange  = flange(cx,   inW,  true,  ovIn);   // 进料口端面法兰：顶沿 y = 0
      const outFlangeA = flange(outAX, outW, false, ovOut); // 左出口端面法兰：底沿 y = h
      const outFlangeB = flange(outBX, outW, false, ovOut); // 右出口端面法兰：底沿 y = h

      /* ---------- 阀体轮廓：一条闭合路径 ----------
         inset = 0 为外壳（金属渐变），inset = wall 为同拓扑内腔。
         菱形是平行四边形，四条边沿法向内缩 inset 后仍是相似菱形（缩放比 k），
         故用内切圆半径 inR 等距缩放即可得到严格法向内缩，无需逐边求交。 */
      const inR = (hw*dh)/Math.sqrt(hw*hw + dh*dh);
      // 内腔菱形的缩放比（= 沿法向内缩 wall 后的相似菱形）
      const kIn = Math.max(0.18, Math.min(0.92, (inR-wall)/inR));
      const bodyPts = inset => {
        const k   = inset<=0 ? 1 : kIn;
        const xIn = Math.max(0.6, inW/2 - inset);     // 立管半宽（内缩后）
        const xOut= Math.max(0.6, outW/2 - inset);    // 出口管半宽（内缩后）
        const ty = splitY - k*dh, by = splitY + k*dh; // 菱形上 / 下顶点 y
        const lx = cx - k*hw,     rx = cx + k*hw;     // 菱形左 / 右顶点 x
        const t  = Math.min(1, xIn/(k*hw));           // 立管壁与菱形斜边的交点参数
        const yIn = ty + (splitY-ty)*t;
        return [
          [cx-xIn,0], [cx-xIn,yIn], [lx,splitY], [outAX-xOut,pipeTopY], [outAX-xOut,h],
          [outAX+xOut,h], [outAX+xOut,pipeTopY], [cx,by], [outBX-xOut,pipeTopY], [outBX-xOut,h],
          [outBX+xOut,h], [outBX+xOut,pipeTopY], [rx,splitY], [cx+xIn,yIn], [cx+xIn,0]
        ];
      };
      const bodyPath = inset => 'M ' + bodyPts(inset).map(q=>`${f(q[0])} ${f(q[1])}`).join(' L ') + ' Z';
      const innerPts = bodyPts(wall);
      const pip = (px,py) => {
        let inside = false;
        for(let i=0,j=innerPts.length-1;i<innerPts.length;j=i++){
          const [xi,yi] = innerPts[i], [xj,yj] = innerPts[j];
          if(((yi>py) !== (yj>py)) && (px < (xj-xi)*(py-yi)/(yj-yi)+xi)) inside = !inside;
        }
        return inside;
      };

      /* ---------- 状态件：翻板 / 封堵叉 / 执行器（指示色 c） ----------
         props 只读：controlMode / switchValve 归一为局部量，不写回。 */
      const controlMode = (p && p.controlMode==='auto') ? 'auto' : 'manual';
      const active = (p && (p.switchValve===0 || p.switchValve===1)) ? p.switchValve : 0;
      const pvY = splitY;                                         // 翻板轴心 = 菱形腔中心
      /* 翻板压向「未选中出口」的喉口：角度与长度都由轴心 → 出口管口中心的连线推导
         （active=0 走 A 路 → 压向右侧 B 出口；active=1 反之）。 */
      const lodX = active===0 ? outBX : outAX;
      const flapAng = Math.atan2(lodX - cx, pipeTopY - pvY);
      const flapWid = Math.max(1.2, Math.min(3, inW*0.12));
      const fNX = Math.cos(flapAng)*flapWid, fNY = -Math.sin(flapAng)*flapWid;
      const hubR = Math.max(1.4, Math.min(3.4, inW*0.14));
      /* 翻板 = 轴端宽、自由端收窄的楔形板（自由端落在出口喉口）；自由端与轴端都
         必须落在内腔内 —— 喉口处通道最窄，故长度按 0.82 逐档回退直到四点全进腔，
         回退到 2.5 以下说明腔体已容不下翻板，整段省略（极小尺寸守卫）。 */
      let flapLen = Math.max(3, Math.hypot(lodX - cx, pipeTopY - pvY)*0.88);
      let flap = '';
      for(let i=0;i<8;i++){
        const tipX = cx + Math.sin(flapAng)*flapLen, tipY = pvY + Math.cos(flapAng)*flapLen;
        const pX = fNX*0.45, pY = fNY*0.45, tX = fNX*0.25, tY = fNY*0.25;
        const quad = [[cx+pX,pvY+pY],[tipX+tX,tipY+tY],[tipX-tX,tipY-tY],[cx-pX,pvY-pY]];
        if(quad.every(q=>pip(q[0],q[1]))){
          flap =
            `<polygon points="${quad.map(q=>`${f(q[0])},${f(q[1])}`).join(' ')}" fill="${c}" opacity="0.85" stroke="${c}" stroke-width="0.9"/>` +
            `<circle cx="${f(cx)}" cy="${f(pvY)}" r="${f(hubR)}" fill="#12162b" stroke="${c}" stroke-width="1.1"/>`;
          break;
        }
        flapLen *= 0.82;
        if(flapLen < 2.5) break;
      }
      /* 封堵叉：标记未选中（被翻板压住）出口 —— 位置由该出口管中心线推导，
         居中在管腔竖直段内（竖直段已缩短，故按可用半高再夹一次尺寸），
         不与翻板叠压。 */
      const stemRoom = Math.max(0, (h - flH - pipeTopY)/2 - 0.25);
      const xr = Math.max(0.6, Math.min(4.5, outW*0.28, outW/2 - wall - 0.25, stemRoom));
      const blockAt = mx => {
        const by = (pipeTopY + h - flH)/2;
        return `<line x1="${f(mx-xr)}" y1="${f(by-xr)}" x2="${f(mx+xr)}" y2="${f(by+xr)}" stroke="#FF5555" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>` +
               `<line x1="${f(mx+xr)}" y1="${f(by-xr)}" x2="${f(mx-xr)}" y2="${f(by+xr)}" stroke="#FF5555" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>`;
      };
      const block = blockAt(active===0 ? outBX : outAX);
      /* 执行器：坐落在菱形右侧顶点之外的净空里，尺寸受该处可用宽度封顶；
         活塞位置与指向箭头表示翻板当前压向哪一路。可用宽度不足时整段省略。 */
      const avail = w - 0.5 - (cx + hw);
      const actGap = Math.max(1.2, Math.min(4, hw*0.10));
      const actW0 = Math.max(3, Math.min(8, hw*0.30));
      const actH0 = Math.max(8, Math.min(26, dh*1.6));
      const kA = Math.min(1, Math.max(0, (avail - actGap)/(actW0*1.05)));
      const actW = actW0*kA, actH = Math.max(6, actH0*Math.max(0.7, kA));
      const actX = cx + hw + actGap + actW/2, actY = splitY - actH/2;
      const tri = Math.min(actW*0.55, actH*0.22);
      const actDir = active===0 ? 1 : -1;
      const actuator = (avail - actGap) < 5 ? '' :
        `<rect x="${f(actX-actW/2)}" y="${f(actY)}" width="${f(actW)}" height="${f(actH)}" rx="1.4" fill="#252a44" stroke="#6a7192" stroke-width="0.9"/>` +
        `<rect x="${f(actX-actW/2+0.9)}" y="${f(active===0 ? actY+0.9 : actY+actH*0.58)}" width="${f(actW-1.8)}" height="${f(actH*0.32)}" fill="${c}" opacity="0.85"/>` +
        `<line x1="${f(cx+hw)}" y1="${f(splitY)}" x2="${f(actX-actW/2)}" y2="${f(splitY)}" stroke="#8e96b6" stroke-width="1"/>` +
        `<polygon points="${f(actX-tri*actDir)},${f(actY-tri*1.85)} ${f(actX+tri*actDir)},${f(actY-tri*1.1)} ${f(actX-tri*actDir)},${f(actY-tri*0.35)}" fill="${c}" opacity="0.75"/>`;
      /* AUTO 标签：归位到组件内（原 y=-1 越界 1px），贴在进料法兰之下、
         立管右侧的净空里；净空不足时省略。 */
      const badgeH = Math.max(7, Math.min(11, h*0.06));
      const badgeX = cx + inW/2 + 2, badgeW = w - 2 - badgeX, badgeY = flH + 1;
      const autoBadge = (controlMode!=='auto' || badgeW < 18) ? '' :
        `<g><rect x="${f(badgeX)}" y="${f(badgeY)}" width="${f(badgeW)}" height="${f(badgeH)}" rx="2.5" fill="#00E5FF" opacity="0.18"/>` +
        `<text x="${f(badgeX+badgeW/2)}" y="${f(badgeY+badgeH*0.76)}" font-size="${f(Math.min(8.5, badgeH*0.82))}" font-weight="700" font-family="inherit" fill="#00E5FF" text-anchor="middle">AUTO</text></g>`;

      /* ---------- 物料流：立管 → 菱形腔 → 选中出口管 三段 ----------
         路径端点全部由端口与内腔推导；粒子受内腔 clipPath 约束（见 <defs>），
         不会飘到阀体外。编辑态由 editor.js stripSMIL() 剥离动画，
         故静态 cx/cy 也要沿路径均匀铺开，剥离后仍看得出料位分布。 */
      const thrX = active===0 ? outAX : outBX;
      const pR = Math.max(0.8, Math.min(2.5, inW*0.10));
      const tyI = splitY - kIn*dh, byI = splitY + kIn*dh;         // 内腔菱形上 / 下顶点 y
      const pStartY = Math.max(pR + 0.5, Math.min(flH + 2, tyI*0.5));
      const pEndY   = Math.max(pipeTopY + 2, h - flH - pR - 0.5);
      const kx = [cx, cx, cx, thrX, thrX];
      const ky = [pStartY, splitY, byI, pipeTopY, pEndY];
      const kt = [0, 0.28, 0.42, 0.75, 1];
      const ptAt = t => {
        for(let i=1;i<kt.length;i++){
          if(t <= kt[i] || i === kt.length-1){
            const u = (t - kt[i-1])/(kt[i] - kt[i-1]);
            return [kx[i-1] + (kx[i]-kx[i-1])*u, ky[i-1] + (ky[i]-ky[i-1])*u];
          }
        }
        return [kx[kt.length-1], ky[kt.length-1]];
      };
      const pathLen = kt.reduce((s,_,i)=> i ? s + Math.hypot(kx[i]-kx[i-1], ky[i]-ky[i-1]) : 0, 0);
      const pCount = Math.max(3, Math.min(8, Math.round(pathLen/26)));
      const pDur   = Math.max(1.2, Math.min(3, pathLen/68));
      let particles = '';
      for(let i=0;i<pCount;i++){
        const [sx, sy] = ptAt((i+0.5)/pCount);
        const ph = f(-(pDur*i/pCount));
        particles += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${f(pR)}" fill="${c}" opacity="0.55">` +
          `<animate attributeName="cx" values="${kx.map(f).join(';')}" keyTimes="${kt.join(';')}" dur="${f(pDur)}s" begin="${ph}s" repeatCount="indefinite"/>` +
          `<animate attributeName="cy" values="${ky.map(f).join(';')}" keyTimes="${kt.join(';')}" dur="${f(pDur)}s" begin="${ph}s" repeatCount="indefinite"/>` +
          `<animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.08;0.9;1" dur="${f(pDur)}s" begin="${ph}s" repeatCount="indefinite"/>` +
          `</circle>`;
      }

      return `
        <defs>
          <clipPath id="${clipId}"><path d="${bodyPath(wall)}"/></clipPath>
          <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
        </defs>
        <path d="${bodyPath(0)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <path d="${bodyPath(wall)}" fill="#12162b" stroke="#6a7192" stroke-width="0.9"/>
        ${inFlange}
        ${outFlangeA}
        ${outFlangeB}
        ${flap}
        ${block}
        ${actuator}
        ${autoBadge}
        <g clip-path="url(#${clipId})">${particles}</g>
      `;
    }
};