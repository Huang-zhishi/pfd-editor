/* ============================================================
 * PFD Editor · 组件模板：vrm（立式磨煤机 / 立磨）
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.vrm。
 *   工艺：原煤经侧向喂料管落到旋转磨盘中央 → 被离心甩到盘缘料床 → 磨辊碾压粉碎；
 *         热风经喷口环（风环）切向上升、托起料床并把细粉吹向顶部选粉机分选；
 *         合格细粉随气流从顶部颈管送出（gasOut），粗粉被笼式转子拦截落回磨盘重磨。
 *   结构特征：竖直主轴 + 立式减速机（区别于卧式磨机的水平传动轴）；
 *             料床碾压（无卸料篦板）；料床是水平平铺的等厚料层，两磨辊向盘心靠拢、盘面水平躺压在料床上；
 *             机座近等宽微收；底部无出口（已被减速机占用）。
 *   配色：外壳沿用金属渐变机壳 + 深色内腔；p.color 落在转动件高亮上
 *         （笼式转子叶片、磨辊辊套与转印刻线、盘面高光线、联轴器、电机铭牌）。
 *   磨盘 / 磨辊 / 转子 / 气固两相粒子均用 SMIL 动画驱动，
 *   编辑态由 editor.js stripSMIL() 自动剥离，运行态才注入。
 * ============================================================ */

TEMPLATES.vrm = {
    name: '立式磨煤机', category: '粉磨与分级',
    defaultSize: { w: 150, h: 272 },
    ports: [
      {id:'feed',   x:0,   y:.248, dir:'left'},   // 原煤入口（侧向喂料，插在下锥段）
      {id:'gasOut', x:.5,  y:0,    dir:'up'},     // 成品气粉出口（顶部颈管）
      {id:'hotAir', x:0,   y:.672, dir:'left'},   // 热风入口（与喷口环同高）
      {id:'reject', x:.90, y:.683, dir:'right'}   // 吐渣口（难磨物外排）
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const c = (p && p.color) || '#9C99FF';
      const shellId = 'vrm_shell_'+uid, metalId = 'vrm_metal_'+uid, baseId = 'vrm_base_'+uid;
      const rollId = 'vrm_roll_'+uid, rollBodyId = 'vrm_rollbody_'+uid, glossId = 'vrm_gloss_'+uid;
      const cx = w/2, F = v=>(+v).toFixed(2);
      const K = w/150;                        // 线宽等细部缩放基准（默认尺寸 150×272 下 = 1）
      /* ---- 纵向锚点：自上而下首尾相接，各段无悬空缝隙 ---- */
      const neckH    = h*0.040;               // 出口颈管
      const plateH   = h*0.015;               // 顶法兰（选粉机段与筒体的可拆分段界面）
      const classTop = h*0.055;               // 选粉机段顶
      const classBot = h*0.235;               // 选粉机段底
      const coneBot  = h*0.330;               // 下锥底 = 研磨区筒体顶（喂料插入段）
      const grindBot = h*0.620;               // 研磨区筒体底
      const windBot  = h*0.700;               // 风箱底 = 机壳底法兰
      const gearBot  = h*0.850;               // 减速机底
      const baseBot  = h*0.950;               // 机座底
      const slabBot  = h*0.962;               // 基础底板底
      /* ---- 研磨区内部锚点 ---- */
      const damTop   = h*0.545;               // 挡料圈顶
      const tableY   = h*0.575;               // 磨盘盘面
      const tableBot = h*0.600;               // 磨盘体底
      const nozTop   = h*0.600;               // 喷口环顶
      const nozBot   = h*0.655;               // 喷口环底 = 风箱顶
      const rollCY   = h*0.496;               // 磨辊中心
      const rotorTop = h*0.100, rotorBot = h*0.190;   // 笼式转子上下环
      const motCY    = h*0.800;               // 主电机轴心（= 减速机输入轴心）
      /* ---- 横向半宽 / 半径 ---- */
      const neckHW = w*0.075, plateHW = w*0.170;
      const classHW = w*0.235, grindHW = w*0.300, windHW = w*0.280;
      const gearHW = w*0.155;
      const baseTopHW = w*0.300, baseBotHW = w*0.278, slabHW = w*0.330;
      const tableR = w*0.220, damR0 = w*0.198, damR1 = w*0.219;
      const rollR = w*0.100, rollDX = w*0.132, rotorR = w*0.135;
      const inset = w*0.020;                  // 壁厚
      /* ---- 磨辊姿态：两辊向盘心靠拢，辊是立起来的圆盘（盘面朝观察者），盘缘最低点压在平料床上 ----
              盘面近正圆（本视角只轻微压扁），盘身沿横向错开一层 => 可见的盘缘厚度 ---- */
      const ROLL_RY = rollR*0.90;             // 盘面短半轴（近正圆，仅留轻微透视压扁）
      const ROLL_T  = rollR*0.34;             // 盘身厚度（横向错开的盘缘侧壁）
      const ROLL_SINK = 2.2*K;                // 辊压入料床的深度（只切于床面会显得悬空）
      /* ---- 外壳一体轮廓 + 内腔（同一套顶点的内外两条折线）---- */
      const shellPath = [
        [cx-classHW, classTop], [cx-classHW, classBot], [cx-grindHW, coneBot],
        [cx-grindHW, grindBot], [cx-windHW, nozBot],    [cx-windHW, windBot],
        [cx+windHW, windBot],   [cx+windHW, nozBot],    [cx+grindHW, grindBot],
        [cx+grindHW, coneBot],  [cx+classHW, classBot], [cx+classHW, classTop]
      ].map(pt=>`${F(pt[0])},${F(pt[1])}`).join(' ');
      const cavityPath = [
        [cx-classHW+inset, classTop+inset], [cx-classHW+inset, classBot],
        [cx-grindHW+inset, coneBot],        [cx-grindHW+inset, nozBot],
        [cx-windHW+inset, nozBot],          [cx-windHW+inset, windBot-inset],
        [cx+windHW-inset, windBot-inset],   [cx+windHW-inset, nozBot],
        [cx+grindHW-inset, nozBot],         [cx+grindHW-inset, coneBot],
        [cx+classHW-inset, classBot],       [cx+classHW-inset, classTop+inset]
      ].map(pt=>`${F(pt[0])},${F(pt[1])}`).join(' ');

      let s = `
      <defs>
        <linearGradient id="${shellId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#8e96b6"/><stop offset="0.30" stop-color="#e8edf8"/>
          <stop offset="0.58" stop-color="#c2cae2"/><stop offset="1" stop-color="#4f5778"/>
        </linearGradient>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#2b3050"/><stop offset="0.36" stop-color="#6a7192"/><stop offset="1" stop-color="#2b3050"/>
        </linearGradient>
        <linearGradient id="${baseId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a1f33"/><stop offset="1" stop-color="#0d1020"/>
        </linearGradient>
        <!-- 磨辊立体：盘面是平的辊套端面，用斜向线性渐变表现平面受光（左上亮、右下暗）；
             不用径向渐变（径向会让盘面看起来是凹/凸的球面）；盘身沿横向错开一层做盘缘厚度 -->
        <linearGradient id="${rollId}" x1="0.06" y1="0" x2="0.72" y2="1">
          <stop offset="0" stop-color="#f2f5fd"/><stop offset="0.34" stop-color="#dde4f3"/>
          <stop offset="0.70" stop-color="#c0c8de"/><stop offset="1" stop-color="#98a1bf"/>
        </linearGradient>
        <radialGradient id="${glossId}" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.60"/>
          <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.14"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${rollBodyId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6b769f"/><stop offset="0.45" stop-color="#3b4468"/><stop offset="1" stop-color="#1d2338"/>
        </linearGradient>
      </defs>
      <!-- 出口颈管 -->
      <rect x="${F(cx-neckHW)}" y="0" width="${F(neckHW*2)}" height="${F(neckH)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <!-- 顶法兰：选粉机段与筒体的可拆分段界面 -->
      <rect x="${F(cx-plateHW)}" y="${F(neckH)}" width="${F(plateHW*2)}" height="${F(plateH)}" rx="1" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <!-- 外壳一体轮廓 -->
      <polygon points="${shellPath}" fill="url(#${shellId})" stroke="#6a7192" stroke-width="1.2"/>
      <!-- 内腔 -->
      <polygon points="${cavityPath}" fill="#0c1020" stroke="#3a4060" stroke-width="0.8"/>
      <!-- 筒体环向分段焊缝（选粉机段可整体吊出） -->
      <line x1="${F(cx-classHW+inset)}" y1="${F(rotorTop-2*K)}" x2="${F(cx+classHW-inset)}" y2="${F(rotorTop-2*K)}" stroke="#3a4060" stroke-width="0.9" stroke-dasharray="4 3"/>
      <line x1="${F(cx-classHW+inset)}" y1="${F(rotorBot+2*K)}" x2="${F(cx+classHW-inset)}" y2="${F(rotorBot+2*K)}" stroke="#3a4060" stroke-width="0.9" stroke-dasharray="4 3"/>
      <!-- 机壳底法兰 -->
      <rect x="${F(cx-windHW-3.5*K)}" y="${F(windBot-2.6*K)}" width="${F((windHW+3.5*K)*2)}" height="${F(2.6*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      `;
      /* ---- 选粉机笼式转子：上下环 + 竖向叶片 ---- */
      let vanes = '';
      const VANE_N = 12;
      for(let i=0;i<VANE_N;i++){
        const vx = cx - rotorR + (rotorR*2)*(i+0.5)/VANE_N;
        vanes += `<line x1="${F(vx)}" y1="${F(rotorTop+4*K)}" x2="${F(vx)}" y2="${F(rotorBot)}" stroke="${c}" stroke-width="1.3" opacity="0.85"/>`;
      }
      const ring = y => `<rect x="${F(cx-rotorR)}" y="${F(y)}" width="${F(rotorR*2)}" height="${F(4*K)}" rx="${F(1.4*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>`;
      /* ---- 磨盘：盘面 + 盘体；挡料圈在两侧（辊在挡料圈内侧的料床上碾压）---- */
      const tablePath = `${F(cx-tableR)},${F(tableY)} ${F(cx+tableR)},${F(tableY)} ${F(cx+tableR*0.94)},${F(tableBot)} ${F(cx-tableR*0.94)},${F(tableBot)}`;
      const dam = sgn => `<rect x="${F(sgn<0 ? cx-damR1 : cx+damR0)}" y="${F(damTop)}" width="${F(damR1-damR0)}" height="${F(tableY-damTop)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>`;

      s += `
      <!-- 选粉机中心轴 + 上轴承座（驱动形式未定，本图仅画转子与轴） -->
      <rect x="${F(cx-2*K)}" y="${F(h*0.0588)}" width="${F(4*K)}" height="${F(rotorBot+4*K-h*0.0588)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.8"/>
      <rect x="${F(cx-6.5*K)}" y="${F(h*0.0544)}" width="${F(13*K)}" height="${F(h*0.0169)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <!-- 笼式转子：上环 / 叶片 / 下环 -->
      ${ring(rotorTop)}
      ${vanes}
      ${ring(rotorBot)}
      <!-- 磨盘 + 挡料圈 -->
      ${dam(-1)}${dam(1)}
      <polygon points="${tablePath}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1.1"/>
      <line x1="${F(cx-tableR*0.92)}" y1="${F(tableY)}" x2="${F(cx+tableR*0.92)}" y2="${F(tableY)}" stroke="${c}" stroke-width="1.4" opacity="0.75"/>
      <!-- 竖直主轴：盘心直下 → 立式减速机（VRM 最标志性的一条竖线） -->
      <rect x="${F(cx-9*K)}" y="${F(tableBot)}" width="${F(18*K)}" height="${F(h*0.012)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <rect x="${F(cx-2*K)}" y="${F(tableBot+h*0.012)}" width="${F(4*K)}" height="${F(windBot-tableBot-h*0.012)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.8"/>
      `;
      /* ---- 料床：挡料圈内侧平铺的等厚物料层 —— VRM 靠“料床碾压”，不是卸料篦板 ---- */
      const BED_H = h*0.028;                          // 料床厚度（全宽等厚，床面水平）
      const bedX = t => cx - tableR*0.90 + tableR*1.80*t;
      const bedTop = tableY - BED_H;                  // 料床面：一条水平平面
      let bedDots = '';
      for(let i=0;i<26;i++){
        const t = i/25;
        bedDots += `<circle cx="${F(bedX(t))}" cy="${F(bedTop-1.4*K)}" r="${F(1.25*K)}" fill="#FFB03A" opacity="0.7"/>`;
      }

      s += `
      <!-- 料床：水平平铺的等厚料层（辊盘平压在床面上） -->
      <polygon points="${F(cx-tableR*0.90)},${F(tableY)} ${F(cx+tableR*0.90)},${F(tableY)} ${F(cx+tableR*0.90)},${F(bedTop)} ${F(cx-tableR*0.90)},${F(bedTop)}" fill="#FFB03A" opacity="0.30"/>
      ${bedDots}
      `;

      /* ---- 磨辊 ×2 + 摇臂 + 液压缸 ----
         两辊向盘心靠拢、辊是立起来的圆盘（盘面朝观察者），盘缘最低点压入平料床，由磨盘拖动自转
         （本图两辊同向转）；盘身沿横向错开一个厚度 = 可见的盘缘侧壁，盘面斜向受光 + 窄反光条体现立体。 */
      const rollSide = sgn => {
        const xr = cx + sgn*rollDX;
        const yr = bedTop + ROLL_SINK - ROLL_RY;           // 辊心：盘缘最低点压入平料床 ROLL_SINK（不悬空）
        const xp = cx + sgn*w*0.405, yp = h*0.418;         // 摇臂支点
        const xw = cx + sgn*grindHW;                       // 研磨区筒壁
        const yw = yr + (yp-yr)*(xw-xr)/(xp-xr);           // 摇臂穿壁处
        const rr = rollR, rb = ROLL_RY, rt = ROLL_T;
        const xb = xr + sgn*rt;                            // 盘身背面（盘缘）圆心：沿横向错开一个厚度
        let ticks = '';
        for(let i=0;i<8;i++){
          const ang = (i+0.5)*Math.PI/4, ca = Math.cos(ang), sa = Math.sin(ang);
          ticks += `<line x1="${F(xr+ca*rr*0.50)}" y1="${F(yr+sa*rr*0.50)}" x2="${F(xr+ca*rr*0.78)}" y2="${F(yr+sa*rr*0.78)}" stroke="${c}" stroke-width="1.3" opacity="0.85"/>`;
        }
        const squash = `matrix(1,0,0,${F(rb/rr)},0,${F(yr*(1-rb/rr))})`;   // 端面坐标系：把圆压成椭圆
        const Ax = xw + sgn*4.5*K, Ay = h*0.347;           // 缸座（坐于锥体外的筒壁）
        const Qx = xr + 0.76*(xp-xr), Qy = yr + 0.76*(yp-yr);   // 顶推点（辊与支点之间）
        const clen = Math.hypot(Qx-Ax, Qy-Ay), cang = Math.atan2(Qy-Ay, Qx-Ax)*180/Math.PI;
        return `
      <!-- 辊下接触阴影：立起的盘缘压在料床上 -->
      <ellipse cx="${F(xr+sgn*rt*0.5)}" cy="${F(bedTop)}" rx="${F(rr*0.92)}" ry="${F(1.7*K)}" fill="#000" opacity="0.30"/>
      <!-- 摇臂支座（斜撑焊于筒壁） -->
      <line x1="${F(xw)}" y1="${F(h*0.365)}" x2="${F(xp)}" y2="${F(yp)}" stroke="#2b3050" stroke-width="${F(4*K)}" stroke-linecap="round"/>
      <!-- 缸座 + 液压缸（缸筒 / 活塞杆） -->
      <rect x="${F(Math.min(xw,Ax)-1.5*K)}" y="${F(Ay-2.2*K)}" width="${F(Math.abs(Ax-xw)+3*K)}" height="${F(4.4*K)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <g transform="translate(${F(Ax)},${F(Ay)}) rotate(${F(cang)})">
        <rect x="0" y="${F(-4.2*K)}" width="${F(clen*0.58)}" height="${F(8.4*K)}" rx="${F(1.6*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
        <rect x="${F(clen*0.58)}" y="${F(-1.9*K)}" width="${F(clen*0.42)}" height="${F(3.8*K)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.7"/>
      </g>
      <!-- 摇臂：辊心 → 支点，穿壁处留密封开口 -->
      <line x1="${F(xr)}" y1="${F(yr)}" x2="${F(xp)}" y2="${F(yp)}" stroke="#2b3050" stroke-width="${F(5.5*K)}" stroke-linecap="round"/>
      <line x1="${F(xr)}" y1="${F(yr)}" x2="${F(xp)}" y2="${F(yp)}" stroke="#8e96b6" stroke-width="1.1" opacity="0.5"/>
      <rect x="${F(xw-1.6*K)}" y="${F(yw-3.4*K)}" width="${F(3.2*K)}" height="${F(6.8*K)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.8"/>
      <circle cx="${F(xp)}" cy="${F(yp)}" r="${F(3.4*K)}" fill="#2b3050" stroke="#8e96b6" stroke-width="1"/>
      <circle cx="${F(Qx)}" cy="${F(Qy)}" r="${F(2.1*K)}" fill="#0c1020" stroke="#8e96b6" stroke-width="0.9"/>
      <!-- 磨辊：立起的圆盘 —— 盘身背面（盘缘厚度）+ 盘面（平面斜向渐变）+ 分度圈 + 转印刻线（看转向） + 反光条 + 辊芯 -->
      <ellipse cx="${F(xb)}" cy="${F(yr)}" rx="${F(rr)}" ry="${F(rb)}" fill="url(#${rollBodyId})" stroke="#4a5480" stroke-width="1"/>
      <ellipse cx="${F(xr)}" cy="${F(yr)}" rx="${F(rr)}" ry="${F(rb)}" fill="url(#${rollId})" stroke="${c}" stroke-width="1.2"/>
      <ellipse cx="${F(xr)}" cy="${F(yr)}" rx="${F(rr*0.74)}" ry="${F(rb*0.74)}" fill="none" stroke="#8e96b6" stroke-width="0.9" opacity="0.45"/>
      <g transform="${squash}"><g>${ticks}
        <animateTransform attributeName="transform" type="rotate" from="0 ${F(xr)} ${F(yr)}" to="360 ${F(xr)} ${F(yr)}" dur="6s" repeatCount="indefinite"/>
      </g></g>
      <ellipse cx="${F(xr-rr*0.44)}" cy="${F(yr-rb*0.06)}" rx="${F(rr*0.13)}" ry="${F(rb*0.62)}" fill="url(#${glossId})" transform="rotate(-14 ${F(xr)} ${F(yr)})"/>
      <ellipse cx="${F(xr)}" cy="${F(yr)}" rx="${F(rr*0.30)}" ry="${F(rb*0.30)}" fill="#1b2038" stroke="#8e96b6" stroke-width="0.9"/>
      <circle cx="${F(xr-rr*0.10)}" cy="${F(yr-rb*0.12)}" r="${F(1.1*K)}" fill="#e6ecfb" opacity="0.75"/>
      `;
      };
      s += rollSide(-1) + rollSide(1);
      /* ---- 风室（环形压力风箱）：绕主轴一圈，剖面上即盘下这一整条腔 ---- */
      const plenTop = nozBot, plenBot = windBot - inset;
      /* ---- 喷口环（风环）：环形导叶通道（左右各一），上通研磨区、下接风室 ----
         热风经导叶切向进入研磨区，托起料床并把成品粉带向选粉机。 */
      const noz = sgn => {
        const x0 = cx + sgn*tableR*0.94, x1 = cx + sgn*(grindHW-inset);
        let nv = '';
        for(let i=0;i<4;i++){
          const xa = x0 + sgn*(1.6*K + i*2.7*K);
          nv += `<line x1="${F(xa)}" y1="${F(nozBot-0.8*K)}" x2="${F(xa+sgn*2.2*K)}" y2="${F(nozTop+1.2*K)}" stroke="#6a7192" stroke-width="1"/>`;
        }
        return `<rect x="${F(Math.min(x0,x1))}" y="${F(nozTop)}" width="${F(Math.abs(x1-x0))}" height="${F(nozBot-nozTop)}" fill="#141330" stroke="#6a7192" stroke-width="0.9"/>${nv}`;
      };
      /* ---- 热风入口（左）：法兰 + 方管，从机壳底法兰高度切向送进风室 ---- */
      const airCY = h*0.6724;                       // 与 hotAir 端口同高
      const airTop = airCY - h*0.0158, airH = h*0.0316;
      const airIn = `
      <rect x="${F(w*0.0033)}" y="${F(airTop)}" width="${F(w*0.24)}" height="${F(airH)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.9"/>
      <rect x="${F(w*0.0033)}" y="${F(airTop-h*0.0081)}" width="${F(w*0.0227)}" height="${F(h*0.0478)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
      <rect x="${F(w*0.2147)}" y="${F(airTop-h*0.0081)}" width="${F(w*0.026)}" height="${F(h*0.0478)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>`;
      /* ---- 吐渣口（右）：磨盘甩出的难磨物经喷口环外侧斜槽排出，槽内示意的碎石 ---- */
      const rejectOut = `
      <rect x="${F(w*0.7747)}" y="${F(h*0.6235)}" width="${F(w*0.026)}" height="${F(h*0.0426)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
      <g transform="translate(${F(w*0.7467)},${F(h*0.6415)}) rotate(26)">
        <rect x="0" y="${F(-h*0.0191)}" width="${F(w*0.1733)}" height="${F(h*0.0382)}" rx="${F(2*K)}" fill="#12112B" stroke="#6a7192" stroke-width="0.9"/>
        <circle cx="${F(w*0.0533)}" cy="0" r="${F(w*0.014)}" fill="#6a7192" opacity="0.85"/>
        <circle cx="${F(w*0.10)}" cy="${F(h*0.0063)}" r="${F(w*0.0113)}" fill="#6a7192" opacity="0.7"/>
        <circle cx="${F(w*0.14)}" cy="${F(-h*0.0044)}" r="${F(w*0.0127)}" fill="#6a7192" opacity="0.8"/>
      </g>`;
      s += `
      <!-- 风室（环形风箱）+ 主轴穿过风室（重绘一段保持竖线连续）+ 轴封盒 -->
      <rect x="${F(cx-windHW+inset)}" y="${F(plenTop)}" width="${F((windHW-inset)*2)}" height="${F(plenBot-plenTop)}" fill="#191834" stroke="#3a4060" stroke-width="0.8"/>
      <rect x="${F(cx-2*K)}" y="${F(plenTop)}" width="${F(4*K)}" height="${F(plenBot-plenTop)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.7"/>
      <rect x="${F(cx-7*K)}" y="${F(plenTop+2*K)}" width="${F(14*K)}" height="${F(5*K)}" rx="${F(1.2*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
      <!-- 喷口环（左右） -->
      ${noz(-1)}${noz(1)}
      ${airIn}
      ${rejectOut}
      `;
      /* ---- 立式减速机（输入轴水平、输出轴竖直）+ 主电机 ----
         VRM 传动链：主电机 —— 联轴器 —— 立式减速机 —— 磨盘。 */
      const gear = `
      <!-- 减速机顶法兰（与机壳底法兰把合） -->
      <rect x="${F(cx-w*0.18)}" y="${F(windBot)}" width="${F(w*0.36)}" height="${F(h*0.0125)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <circle cx="${F(cx-w*0.14)}" cy="${F(windBot+h*0.0063)}" r="${F(1.1*K)}" fill="#0c1020"/>
      <circle cx="${F(cx-w*0.0467)}" cy="${F(windBot+h*0.0063)}" r="${F(1.1*K)}" fill="#0c1020"/>
      <circle cx="${F(cx+w*0.0467)}" cy="${F(windBot+h*0.0063)}" r="${F(1.1*K)}" fill="#0c1020"/>
      <circle cx="${F(cx+w*0.14)}" cy="${F(windBot+h*0.0063)}" r="${F(1.1*K)}" fill="#0c1020"/>
      <!-- 减速机箱体：两段把合面 -->
      <rect x="${F(cx-gearHW)}" y="${F(windBot+h*0.0125)}" width="${F(gearHW*2)}" height="${F(gearBot-windBot-h*0.0125)}" fill="#252a44" stroke="#6a7192" stroke-width="1.1"/>
      <line x1="${F(cx-gearHW)}" y1="${F(h*0.755)}" x2="${F(cx+gearHW)}" y2="${F(h*0.755)}" stroke="#6a7192" stroke-width="0.8" stroke-dasharray="4 3"/>
      <line x1="${F(cx-gearHW)}" y1="${F(h*0.815)}" x2="${F(cx+gearHW)}" y2="${F(h*0.815)}" stroke="#6a7192" stroke-width="0.8" stroke-dasharray="4 3"/>
      <line x1="${F(cx-gearHW+2*K)}" y1="${F(windBot+5*K)}" x2="${F(cx-gearHW+2*K)}" y2="${F(gearBot-2*K)}" stroke="#8e96b6" stroke-width="1" opacity="0.35"/>
      <!-- 输入轴轴承座（水平输入，与主电机同高） -->
      <rect x="${F(cx-gearHW-w*0.0367)}" y="${F(motCY-h*0.0294)}" width="${F(w*0.0433)}" height="${F(h*0.0588)}" rx="${F(1.5*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>`;
      const motor = `
      <!-- 主电机：横置，轴心 0.80h，与减速机输入轴同高 -->
      <rect x="${F(w*0.0933)}" y="${F(h*0.7596)}" width="${F(w*0.0533)}" height="${F(h*0.0735)}" rx="${F(2*K)}" fill="#252a44" stroke="#6a7192" stroke-width="0.9"/>
      <line x1="${F(w*0.1067)}" y1="${F(h*0.7684)}" x2="${F(w*0.1067)}" y2="${F(h*0.8235)}" stroke="#6a7192" stroke-width="0.9"/>
      <line x1="${F(w*0.1267)}" y1="${F(h*0.7684)}" x2="${F(w*0.1267)}" y2="${F(h*0.8235)}" stroke="#6a7192" stroke-width="0.9"/>
      <rect x="${F(w*0.1467)}" y="${F(motCY-w*0.0867)}" width="${F(w*0.1733)}" height="${F(w*0.1733)}" rx="${F(2*K)}" fill="#2f3550" stroke="#6a7192" stroke-width="1.1"/>
      <line x1="${F(w*0.1533)}" y1="${F(motCY-w*0.0767)}" x2="${F(w*0.3133)}" y2="${F(motCY-w*0.0767)}" stroke="#8e96b6" stroke-width="1" opacity="0.35"/>
      <rect x="${F(w*0.20)}" y="${F(motCY-w*0.1213)}" width="${F(w*0.08)}" height="${F(w*0.0347)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
      <text x="${F(w*0.2333)}" y="${F(motCY+h*0.0147)}" text-anchor="middle" font-family="sans-serif" font-size="${F(w*0.08)}" fill="${c}" opacity="0.85">M</text>
      <rect x="${F(w*0.1667)}" y="${F(motCY+w*0.0867)}" width="${F(w*0.04)}" height="${F(w*0.032)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
      <rect x="${F(w*0.26)}" y="${F(motCY+w*0.0867)}" width="${F(w*0.04)}" height="${F(w*0.032)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
      <!-- 联轴器：电机轴 → 减速机输入轴 -->
      <rect x="${F(w*0.32)}" y="${F(motCY-w*0.04)}" width="${F(w*0.04)}" height="${F(w*0.08)}" rx="${F(1.5*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <rect x="${F(w*0.32)}" y="${F(motCY-w*0.02)}" width="${F(w*0.0533)}" height="${F(w*0.04)}" fill="#2b3050" stroke="#6a7192" stroke-width="0.7"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 ${F(w*0.34)} ${F(motCY)}" to="360 ${F(w*0.34)} ${F(motCY)}" dur="1.8s" repeatCount="indefinite"/>
        <line x1="${F(w*0.34-w*0.018)}" y1="${F(motCY)}" x2="${F(w*0.34+w*0.018)}" y2="${F(motCY)}" stroke="${c}" stroke-width="1.1" opacity="0.9"/>
        <line x1="${F(w*0.34)}" y1="${F(motCY-w*0.018)}" x2="${F(w*0.34)}" y2="${F(motCY+w*0.018)}" stroke="${c}" stroke-width="1.1" opacity="0.9"/>
      </g>`;
      s += gear + motor;
      /* ---- 机座：近乎等宽（顶半宽 0.300w → 底半宽 0.278w，只微收）----
         这是 VRM 与“大梯形底架”的卧式磨机最直观的区别之一。
         电机基础墩并入机座基础，为让开墩身，基础底板向左外扩一块。 */
      const pedL = w*0.1067, pedR = w*0.3267, pedTop = motCY + h*0.0654;
      let pedHatch = '';
      for(let i=0;i<4;i++){
        const hx = pedL + w*0.0533 + i*w*0.04667;
        pedHatch += `<line x1="${F(hx)}" y1="${F(pedTop+1.5*K)}" x2="${F(hx-7*K)}" y2="${F(baseBot-1.5*K)}" stroke="#8e96b6" stroke-width="0.7" opacity="0.22"/>`;
      }
      let louvre = '';
      for(let i=0;i<4;i++){
        const ly = h*0.878 + i*h*0.0154;
        louvre += `<line x1="${F(cx+18*K)}" y1="${F(ly)}" x2="${F(cx+30*K)}" y2="${F(ly)}" stroke="#6a7192" stroke-width="1.4" opacity="0.55"/>`;
      }
      s += `
      <!-- 机座本体 -->
      <polygon points="${F(cx-baseTopHW)},${F(gearBot)} ${F(cx+baseTopHW)},${F(gearBot)} ${F(cx+baseBotHW)},${F(baseBot)} ${F(cx-baseBotHW)},${F(baseBot)}" fill="url(#${baseId})" stroke="#6a7192" stroke-width="1.3"/>
      <!-- 机座顶板（与减速机底把合） -->
      <rect x="${F(cx-baseTopHW)}" y="${F(gearBot)}" width="${F(baseTopHW*2)}" height="${F(2.4*K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>
      <line x1="${F(cx-baseTopHW+3*K)}" y1="${F(gearBot+4*K)}" x2="${F(cx-baseTopHW+3*K)}" y2="${F(baseBot-2*K)}" stroke="#8e96b6" stroke-width="1" opacity="0.3"/>
      <!-- 侧面检修门 -->
      <rect x="${F(cx-15*K)}" y="${F(h*0.877)}" width="${F(30*K)}" height="${F(h*0.052)}" rx="${F(1.6*K)}" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>
      <line x1="${F(cx-6*K)}" y1="${F(h*0.877+2.5*K)}" x2="${F(cx-6*K)}" y2="${F(h*0.929-2.5*K)}" stroke="#3a4060" stroke-width="1"/>
      <line x1="${F(cx+6*K)}" y1="${F(h*0.877+2.5*K)}" x2="${F(cx+6*K)}" y2="${F(h*0.929-2.5*K)}" stroke="#3a4060" stroke-width="1"/>
      <circle cx="${F(cx-2*K)}" cy="${F(h*0.903)}" r="${F(K)}" fill="#8e96b6" opacity="0.7"/>
      <!-- 通风百叶 -->
      ${louvre}
      <!-- 电机基础墩（与机座基础连成一体） -->
      <rect x="${F(pedL)}" y="${F(pedTop)}" width="${F(pedR-pedL)}" height="${F(baseBot-pedTop)}" fill="url(#${baseId})" stroke="#6a7192" stroke-width="1.1"/>
      ${pedHatch}
      <!-- 基础底板：主体对称 0.330w，左侧外扩一块承电机墩 -->
      <rect x="${F(cx-slabHW)}" y="${F(baseBot)}" width="${F(slabHW*2)}" height="${F(slabBot-baseBot)}" fill="url(#${baseId})" stroke="#6a7192" stroke-width="1.1"/>
      <rect x="${F(w*0.0933)}" y="${F(baseBot)}" width="${F(w*0.08)}" height="${F(slabBot-baseBot)}" fill="url(#${baseId})" stroke="#6a7192" stroke-width="1.1"/>
      <line x1="${F(cx-slabHW)}" y1="${F(baseBot)}" x2="${F(cx+slabHW)}" y2="${F(baseBot)}" stroke="#8e96b6" stroke-width="1" opacity="0.35"/>
      <!-- 地脚螺栓 -->
      <circle cx="${F(w*0.12)}" cy="${F(baseBot+(slabBot-baseBot)/2)}" r="${F(1.3*K)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
      <circle cx="${F(w*0.8133)}" cy="${F(baseBot+(slabBot-baseBot)/2)}" r="${F(1.3*K)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
      `;
      /* ---- 侧向喂料管：斜插下锥段并伸入筒体指向磨盘中心，管内落料约 1/3 处起笔，物料沿管轴出管口后滑落入盘心 ---- */
      const feedY0 = h*0.248;                 // 与 feed 端口同高
      const feedAng = 24.5;                   // 下倾角
      const feedLen = 66*K;                   // 管长（外端在筒外，内端伸入筒体研磨腔、管口对准磨盘中心）
      const fCos = Math.cos(feedAng*Math.PI/180), fSin = Math.sin(feedAng*Math.PI/180);
      const fx0 = 1.6*K + feedLen/3*fCos, fy0 = feedY0 + feedLen/3*fSin;            // 轨迹起点：管内约 1/3 管长处
      const fx1 = 1.6*K + (feedLen-3*K)*fCos, fy1 = feedY0 + (feedLen-3*K)*fSin;    // 沿管轴走到管口内缘
      const fx2 = 1.6*K + (feedLen+13*K)*fCos, fy2 = feedY0 + (feedLen+13*K)*fSin;  // 出管切向控制点
      const tX = cx, tY = bedTop - 1.2*K;                        // 落点：磨盘中心（料层表面）
      const mx = tX, my = tY - 26*K;                             // 下滑段控制点：经两辊之间的空档竖直落入盘心
      let flaps = '';
      for(let i=0;i<2;i++){
        const fx = (9 + i*7.5)*K;
        flaps += `<line x1="${F(fx)}" y1="${F(-4.5*K)}" x2="${F(fx)}" y2="${F(4.5*K)}" stroke="#8e96b6" stroke-width="1.6" opacity="0.75"/>`;
      }
      s += `
      <!-- 喂料管（斜插伸入筒体）+ 双翻板锁风阀 -->
      <g transform="translate(${F(1.6*K)},${F(feedY0)}) rotate(${feedAng})">
        <rect x="0" y="${F(-4.5*K)}" width="${F(feedLen)}" height="${F(9*K)}" fill="#252a44" stroke="#6a7192" stroke-width="1.1"/>
        <rect x="0" y="${F(-6*K)}" width="${F(3.6*K)}" height="${F(12*K)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
        <rect x="${F(feedLen-3.6*K)}" y="${F(-6*K)}" width="${F(3.6*K)}" height="${F(12*K)}" rx="${F(K)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>
        ${flaps}
        <line x1="${F(4*K)}" y1="${F(-2.6*K)}" x2="${F(24*K)}" y2="${F(-2.6*K)}" stroke="#8e96b6" stroke-width="0.9" opacity="0.3"/>
      </g>
      <!-- 落料轨迹（粒子动画，见下方 feedFlow，非构件故不画管线实体） -->
      `;
      /* ---- 落料粒子：管内约 1/3 管长处起笔 → 沿管轴出管口 → 经两辊空档竖直落入磨盘中心料层
         （与 bedFlow/prodFlow 同款 SMIL 关键帧：编辑态被 stripSMIL 剥离后只留沿轨迹的静态点位，
         运行态沿 keyTimes 均匀插值输送，末端随空档竖直下落到盘心） ---- */
      const feedPath = [];
      for(let i=0;i<=4;i++){                                       // 段一：管内沿管轴输送
        const u = feedLen/3 + (feedLen*2/3 - 3*K)*i/4;
        feedPath.push([1.6*K + u*fCos, feedY0 + u*fSin]);
      }
      for(let i=1;i<=12;i++){                                      // 段二：出管口后沿三次曲线滑落入盘心
        const t = i/12, mt = 1 - t;
        feedPath.push([
          mt*mt*mt*fx1 + 3*mt*mt*t*fx2 + 3*mt*t*t*mx + t*t*t*tX,
          mt*mt*mt*fy1 + 3*mt*mt*t*fy2 + 3*mt*t*t*my + t*t*t*tY
        ]);
      }
      const feedKX = feedPath.map(p=>F(p[0])).join(';');
      const feedKY = feedPath.map(p=>F(p[1])).join(';');
      let feedFlow = '';
      for(let i=0;i<7;i++){
        const p = feedPath[Math.round(i/6*(feedPath.length-1))];
        const dur = 3.0 + 0.22*i, beg = 0.4*i;
        feedFlow += `<circle cx="${F(p[0])}" cy="${F(p[1])}" r="${F(1.55*K)}" fill="#FFB03A" opacity="0.9">
          <animate attributeName="cx" values="${feedKX}" dur="${F(dur)}s" begin="${F(beg)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${feedKY}" dur="${F(dur)}s" begin="${F(beg)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.95;0.95;0.2" dur="${F(dur)}s" begin="${F(beg)}s" repeatCount="indefinite"/>
        </circle>`;
      }
      /* ---- 流线：① 盘面物料离心进辊下；② 热风沿环隙上升穿过研磨区/锥段/选粉机到颈管；
         ③ 成品细粉随气流带出；④ 粗粉被转子拦截回落盘面 ----
         ④ 条各自对应 VRM 的一条功能，故分开画。 */
      const upArrow = (x, yLow, yTip, ac, op) => `
        <line x1="${F(x)}" y1="${F(yLow)}" x2="${F(x)}" y2="${F(yTip+3.6*K)}" stroke="${ac}" stroke-width="1.4" opacity="${op}"/>
        <polygon points="${F(x-3*K)},${F(yTip+4.2*K)} ${F(x+3*K)},${F(yTip+4.2*K)} ${F(x)},${F(yTip)}" fill="${ac}" opacity="${+op+0.1}"/>`;
      let air = '';
      /* 喷口环出口 → 辊下：走外环道贴筒壁上升，正好绕开两辊（不穿辊） */
      air += upArrow(cx-w*0.2667, nozTop-2*K, tableY-6*K, '#00E5FF', 0.45);
      air += upArrow(cx+w*0.2667, nozTop-2*K, tableY-6*K, '#00E5FF', 0.45);
      air += upArrow(cx-w*0.2267, nozTop-4*K, tableY-8*K, '#00E5FF', 0.30);
      air += upArrow(cx+w*0.2267, nozTop-4*K, tableY-8*K, '#00E5FF', 0.30);
      /* 辊顶绕流后继续上升 → 锥段 → 选粉机 → 颈管 */
      air += upArrow(cx-w*0.2667, rollCY-14*K, coneBot+6*K, '#00E5FF', 0.40);
      air += upArrow(cx+w*0.2667, rollCY-14*K, coneBot+6*K, '#00E5FF', 0.40);
      air += upArrow(cx-w*0.2333, rollCY-14*K, coneBot+30*K, '#00E5FF', 0.28);
      air += upArrow(cx+w*0.2333, rollCY-14*K, coneBot+30*K, '#00E5FF', 0.28);
      air += upArrow(cx-w*0.1067, coneBot-4*K, classBot-1*K, '#00E5FF', 0.40);
      air += upArrow(cx+w*0.1067, coneBot-4*K, classBot-1*K, '#00E5FF', 0.40);
      air += upArrow(cx, classTop+30*K, classTop-4*K, '#00E5FF', 0.45);
      air += upArrow(cx, 14*K, 5*K, '#00E5FF', 0.55);
      /* 盘面物料：从中央被离心甩向盘缘（SMIL，编辑态被 stripSMIL 剥掉） */
      let bedFlow = '';
      const bedCY = tableY - 2.8*K;
      for(let i=0;i<6;i++){
        const sgn = i < 3 ? -1 : 1, k = i % 3;
        const by = bedCY - 0.6*k*K, dur = 2.8 + 0.5*k, beg = 0.45*k;
        bedFlow += `<circle cx="${F(cx)}" cy="${F(by)}" r="${F(1.5*K)}" fill="#FFB03A" opacity="0.9">
          <animate attributeName="cx" values="${F(cx)};${F(cx+sgn*tableR*0.86)}" dur="${F(dur)}s" begin="${F(beg)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.95;0.95;0.15" dur="${F(dur)}s" begin="${F(beg)}s" repeatCount="indefinite"/>
        </circle>`;
      }
      /* 成品气粉：白色细粉尘在锥段 ~ 选粉机之间被气流带出 */
      let prodFlow = '';
      const prodXF = [-0.1733, -0.1333, -0.0933, -0.0533, -0.0133, 0.0267, 0.0667, 0.1067, 0.1467];
      for(let i=0;i<prodXF.length;i++){
        const pdur = 4.6 + 0.3*(i%3), pbeg = 0.5*i;
        prodFlow += `<circle cx="${F(cx+prodXF[i]*w)}" cy="${F(coneBot-2*K)}" r="${F(1.05*K)}" fill="#FFFFFF" opacity="0.85">
          <animate attributeName="cy" values="${F(coneBot-2*K)};${F(classTop+16*K)}" dur="${F(pdur)}s" begin="${F(pbeg)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.85;0.85;0" dur="${F(pdur)}s" begin="${F(pbeg)}s" repeatCount="indefinite"/>
        </circle>`;
      }
      /* 粗粉回落：被选粉机打回盘面（走两辊之间的空档落下） */
      let coarseFall = '';
      const coarseXF = [-0.0467, 0, 0.0467];
      for(let i=0;i<coarseXF.length;i++){
        coarseFall += `<circle cx="${F(cx+coarseXF[i]*w)}" cy="${F(classTop+26*K)}" r="${F(1.3*K)}" fill="#FFB03A" opacity="0.75">
          <animate attributeName="cy" values="${F(classBot)};${F(tableY-14*K)}" dur="5.2s" begin="${F(i*1.7)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.75;0.1" dur="5.2s" begin="${F(i*1.7)}s" repeatCount="indefinite"/>
        </circle>`;
      }
      s += feedFlow + air + bedFlow + prodFlow + coarseFall;
      return s;
    }
};
