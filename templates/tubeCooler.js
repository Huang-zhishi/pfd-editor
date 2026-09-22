/* ============================================================
 * PFD Editor · 组件模板：tubeCooler
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.tubeCooler。
 * ============================================================ */

TEMPLATES.tubeCooler = {
    name: '回转滚筒冷却机', category: '干燥煅烧与冷却',
    defaultSize: { w: 300, h: 140 },
    ports: [
      {id:'inlet',x:0,y:.5,dir:'left'},
      {id:'outlet',x:1,y:.5,dir:'right'},
      {id:'airIn',x:.9,y:1,dir:'down'},
      {id:'airOut',x:.1,y:0,dir:'up'}
    ],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      // 定尺封顶：F 统一固定小数位；K 为细部（线宽 / 螺栓 / 小配件）缩放基准（默认 300×140 下 = 1）；
      // 逐量 clamp(比例量, 下限, 上限)——比例量以筒径 R / 机高 h / 机宽 w 为基准，放大不增粗、缩小不越界
      const F = v=>(+v).toFixed(2);
      const clamp = (v, lo, hi)=>Math.max(lo, Math.min(hi, v));
      const K = clamp(Math.min(w/300, h/140), 0.3, 2.4);
      const rotDur = 4;
      const cy = h*0.5;
      const drumH = h*0.4;
      const R = drumH/2;
      const endBoxW = w*0.05;
      const drumGap = clamp(w*0.025, 3, 12);
      const drumL = endBoxW + drumGap;
      const drumR = w - endBoxW - drumGap;
      const drumW = drumR - drumL;
      const drumCx = (drumL + drumR)/2;
      const drumTop = cy - R;
      // 横截面定尺件统一以筒径 R 为基准，保证与筒体同比例
      const tireW = clamp(R*0.6, 5, 26);
      const baseH = clamp(R*0.5, 4, 22);
      const trunnionR = clamp(R*0.36, 2.5, 14);
      const footH = clamp(R*0.2, 2, 7);
      const baseY = h - footH;
      // —— 细部定尺：以 K（细部基准）与筒径 R 为基准 clamp 封顶，消除固定像素偏移 ——
      //    数量类（齿数 / 粒子数 / 扬料板数）保持恒定，以保 SMIL 动画计数不随尺寸变化
      const rimT = clamp(tireW*0.2, 1.5, 4);            // 滚带 / 齿圈环厚
      const toothH = clamp(R*0.2, 2, 6);                // 齿高
      const tubeInset = clamp(R*0.1, 1.5, 3);           // 筒体裁切内缩
      const ringInset = clamp(R*0.08, 1, 3);            // 焊缝环内缩
      const weldRx = clamp(R*0.22, 1.5, 4);
      const weldSW = clamp(K*0.9, 0.5, 1.2);
      const bedDepth = clamp(R*0.3, 2.5, 9);            // 物料床厚
      const bedEdge = clamp(R*0.07, 1, 2);
      const partR = clamp(R*0.08, 1.2, 2.6);            // 粒子半径
      const nozRx = clamp(R*0.2, 2.5, 7);               // 料箱喉口椭圆
      const nozRy = R - clamp(R*0.14, 2, 5);
      const boxChamfer = clamp(R*0.22, 3, 8);
      const boxEdge = clamp(R*0.07, 1, 2);
      const endPlateW = clamp(K*4, 2, 6);
      const endFlangeW = clamp(K*5, 3, 8);
      const endFlangeT = clamp(K*3, 1.5, 6);
      const ductHalf = clamp(K*5, 3, 7), ductWallT = clamp(K*1.5, 0.8, 2);
      const ductFlangeH = clamp(K*5, 3, 6), ductFlangeHalf = clamp(K*7, 5, 9), ductBoltR = clamp(K*1.2, 0.7, 1.5);
      const ductBoltDx = clamp(ductFlangeHalf*0.57, 2, 5);
      const ductRedTop = clamp(ductHalf*2.4, 8, 14), ductRedBot = clamp(ductHalf*1.6, 6, 10);
      const ductRedLen = clamp(K*9, 5, 12), ductMinShaft = clamp(K*6, 3, 10);
      const ductGap = clamp(K*4, 2, 6);
      const trunnionGap = clamp(K*2, 1, 3.5);
      const axleSW = clamp(K*2.2, 1.4, 3);
      const trunnionDotR = clamp(trunnionR*0.25, 1, 3);
      const brgBoltDx = clamp(trunnionR*0.28, 1.2, 4);
      const brgBoltR = clamp(K*0.85, 0.5, 1.2);
      const spokeSW = clamp(K*0.9, 0.5, 1.2);
      const pivotSize = clamp(K*1.4, 1, 2);
      const flightInset = clamp(R*0.07, 1, 3);
      const stripMain = clamp(R*0.22, 3, 7);
      const stripMid = clamp(R*0.15, 2, 4.5);
      const stripThin = clamp(R*0.1, 1.5, 3);
      const stripMargin = clamp(drumW*0.05, 3, 10);
      const matMargin = clamp(drumW*0.1, 6, 25);
      const matJitter = clamp(drumW*0.05, 3, 12);
      const bedReturn = clamp(R*0.35, 6, 12);
      const airMargin = clamp(drumW*0.08, 5, 20);
      const airSpan = Math.max(0, drumW - 2*airMargin);

      const drivePlateH = clamp(K*5, 3, 6);
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = `clip_drum_${uid}`;
      const clipIdInner = `clip_inner_${uid}`;
      const drumShadeId = `drum_shade_${uid}`;
      const metalId = `tc_metal_${uid}`;
      const metalVId = `tc_metalv_${uid}`;

      // 1. 底座（精细双层）
      const tire1X = drumL + drumW*0.25;
      const tire2X = drumL + drumW*0.75;
      const baseBW = clamp(tireW*3.9, 18, 64);
      const baseInset = clamp(baseH*0.15, 1, 3);
      const footOver = clamp(K*2, 1, 4);
      const baseBoltInset = clamp(tireW*0.5, 3, 20);
      const boltR = clamp(K*1.2, 0.7, 1.5);
      // 底座地脚螺栓（位于底座踏面 / 地脚法兰；距底座中心 = 踏面半宽的一半）
      const baseBolts = (cx)=>`<circle cx="${F(cx-baseBoltInset)}" cy="${F(baseY+footH*0.5)}" r="${F(boltR)}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.3"/>
        <circle cx="${F(cx+baseBoltInset)}" cy="${F(baseY+footH*0.5)}" r="${F(boltR)}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.3"/>`;
      const base1 = `<rect x="${F(tire1X-baseBW/2)}" y="${F(baseY-baseH)}" width="${F(baseBW)}" height="${F(baseH)}" rx="${F(baseInset)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <rect x="${F(tire1X-baseBW/2+baseInset)}" y="${F(baseY-baseH+baseInset)}" width="${F(baseBW-2*baseInset)}" height="${F(baseH-2*baseInset)}" fill="#12162b" opacity="0.6"/>
        <rect x="${F(tire1X-baseBW/2-footOver)}" y="${F(baseY)}" width="${F(baseBW+2*footOver)}" height="${F(footH)}" rx="1" fill="#0c1020" stroke="#6a7192" stroke-width="0.8"/>
        ${baseBolts(tire1X)}`;
      const base2 = `<rect x="${F(tire2X-baseBW/2)}" y="${F(baseY-baseH)}" width="${F(baseBW)}" height="${F(baseH)}" rx="${F(baseInset)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <rect x="${F(tire2X-baseBW/2+baseInset)}" y="${F(baseY-baseH+baseInset)}" width="${F(baseBW-2*baseInset)}" height="${F(baseH-2*baseInset)}" fill="#12162b" opacity="0.6"/>
        <rect x="${F(tire2X-baseBW/2-footOver)}" y="${F(baseY)}" width="${F(baseBW+2*footOver)}" height="${F(footH)}" rx="1" fill="#0c1020" stroke="#6a7192" stroke-width="0.8"/>
        ${baseBolts(tire2X)}`;

      // 2. 双托轮（精细：带辐条反向旋转）
      const drawTrunnionPair = (tx)=>{
        const contactAngle = 30 * Math.PI/180;
        const trunnionCY = baseY - baseH - trunnionR;
        const offset = (R + tireW/2 + trunnionGap) * Math.sin(contactAngle) * 0.85;
        // 轴座 / 轴承座：横贯两托轮的轮轴 + 立在底座上的轴承座块（含 2 颗螺栓头）
        const brgW = trunnionR;
        const brgH = baseY - baseH - trunnionCY;
        const axle = `<line x1="${F(tx-offset)}" y1="${F(trunnionCY)}" x2="${F(tx+offset)}" y2="${F(trunnionCY)}" stroke="#3f445c" stroke-width="${F(axleSW)}"/>`;
        const bearing = `<rect x="${F(tx-brgW/2)}" y="${F(trunnionCY)}" width="${F(brgW)}" height="${F(brgH)}" rx="1.5" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
          <circle cx="${F(tx-brgBoltDx)}" cy="${F(trunnionCY+brgH*0.6)}" r="${F(brgBoltR)}" fill="#8e96b6"/>
          <circle cx="${F(tx+brgBoltDx)}" cy="${F(trunnionCY+brgH*0.6)}" r="${F(brgBoltR)}" fill="#8e96b6"/>`;
        const drawWheel = (wx, wy, dir)=>{
          let spokes = '';
          for(let i=0; i<6; i++){
            const sa = i*60*Math.PI/180;
            spokes += `<line x1="${F(wx)}" y1="${F(wy)}" x2="${F(wx+Math.cos(sa)*trunnionR*0.6)}" y2="${F(wy+Math.sin(sa)*trunnionR*0.6)}" stroke="#9aa2bc" stroke-width="${F(spokeSW)}" opacity="0.4"/>`;
          }
          return `<g>
            <animateTransform attributeName="transform" type="rotate" from="${dir>0?0:360} ${F(wx)} ${F(wy)}" to="${dir>0?360:0} ${F(wx)} ${F(wy)}" dur="${rotDur*0.8}s" repeatCount="indefinite"/>
            <circle cx="${F(wx)}" cy="${F(wy)}" r="${F(trunnionR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
            <circle cx="${F(wx)}" cy="${F(wy)}" r="${F(trunnionR*0.3)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
            ${spokes}
            <circle cx="${F(wx)}" cy="${F(wy)}" r="${F(trunnionDotR)}" fill="${c}" opacity="0.7"/>
          </g>`;
        };
        return axle + bearing + drawWheel(tx-offset, trunnionCY, 1) + drawWheel(tx+offset, trunnionCY, -1);
      };
      const trunnions = drawTrunnionPair(tire1X) + drawTrunnionPair(tire2X);

      // 3. ClipPath
      const clipDef = `<clipPath id="${clipId}"><rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(drumH)}" rx="${F(R*0.3)}" ry="${F(R)}"/></clipPath>`;
      const clipDefInner = `<clipPath id="${clipIdInner}"><rect x="${F(drumL+tubeInset)}" y="${F(drumTop+tubeInset)}" width="${F(drumW-2*tubeInset)}" height="${F(drumH-2*tubeInset)}" rx="${F(R*0.25)}" ry="${F(Math.max(0.5,R-tubeInset))}"/></clipPath>`;
      const drumShade = `<linearGradient id="${drumShadeId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7d849e" stop-opacity="1"/>
        <stop offset="15%" stop-color="#9aa2bc" stop-opacity="1"/>
        <stop offset="45%" stop-color="#d9dded" stop-opacity="1"/>
        <stop offset="55%" stop-color="#d9dded" stop-opacity="1"/>
        <stop offset="85%" stop-color="#9aa2bc" stop-opacity="1"/>
        <stop offset="100%" stop-color="#7d849e" stop-opacity="1"/>
      </linearGradient>`;
      const metalDef = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7d849e"/>
        <stop offset="45%" stop-color="#d9dded"/>
        <stop offset="100%" stop-color="#767d97"/>
      </linearGradient>`;
      const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7d849e"/>
        <stop offset="45%" stop-color="#d9dded"/>
        <stop offset="100%" stop-color="#767d97"/>
      </linearGradient>`;

      // 4. 筒体壁（圆柱明暗渐变+两端圆形封头椭圆）
      const drumBody = `<rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(drumH)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="url(#${drumShadeId})" stroke="#3f445c" stroke-width="${F(clamp(K*1.6,1.1,2.2))}"/>
        <ellipse cx="${F(drumL)}" cy="${F(cy)}" rx="${F(R*0.4)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.5" opacity="0.6"/>
        <ellipse cx="${F(drumR)}" cy="${F(cy)}" rx="${F(R*0.4)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.5" opacity="0.6"/>
        <rect x="${F(drumL+tubeInset)}" y="${F(drumTop+tubeInset)}" width="${F(drumW-2*tubeInset)}" height="${F(drumH-2*tubeInset)}" rx="${F(R*0.28)}" ry="${F(Math.max(0.5,R-tubeInset))}" fill="none" stroke="#5b6280" stroke-width="1"/>`;

      // 5. 环形焊缝（固定椭圆，就是用户说的"一排孔"）
      let weldRings = '';
      for(let i=1; i<=7; i++){
        const wx = drumL + (drumW * i / 8);
        weldRings += `<ellipse cx="${F(wx)}" cy="${F(cy)}" rx="${F(weldRx)}" ry="${F(R-ringInset)}" fill="none" stroke="${c}" stroke-width="${F(weldSW)}" opacity="0.35"/>`;
      }

      // 6. 关键：筒体表面旋转标记——重点体现"滚"
      // 6a. 1条白色粗主带（最醒目）
      let rotMarks = '';
      const makeStrip = (phase, sw, color, opFront)=>{
        const delay = -(phase*rotDur).toFixed(2);
        let yVals=[], opVals=[];
        for(let k=0; k<=20; k++){
          const ang = ((k/20)+phase)*2*Math.PI;
          const front = Math.cos(ang);
          yVals.push((cy + R*Math.sin(ang) - sw/2).toFixed(1));
          opVals.push(front > 0.1 ? (opFront*front + 0.1).toFixed(2) : '0');
        }
        /* 性能：位置动画由几何属性 y 改为 transform: translate ——
           几何属性每帧都要重算并重绘图元，transform 更便宜且后续可被合成器接管。
           注意 clip-path 必须留在外层 <g>（它按父级用户空间裁剪），否则会跟着一起平移。 */
        const _y0 = parseFloat(yVals[0]);
        const _tv = yVals.map(v => '0 ' + (parseFloat(v) - _y0).toFixed(1)).join(';');
        return `<g clip-path="url(#${clipId})"><rect x="${F(drumL+stripMargin)}" y="${yVals[0]}" width="${F(drumW-2*stripMargin)}" height="${F(sw)}" rx="${F(sw/2)}" fill="${color}">
          <animateTransform attributeName="transform" type="translate" values="${_tv}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </rect></g>`;
      };
      rotMarks += makeStrip(0, stripMain, '#d9dded', 0.9);    // 高光粗主带（更宽更亮）
      rotMarks += makeStrip(0.25, stripThin, '#d9dded', 0.3);   // 高光副带
      rotMarks += makeStrip(0.5, stripMid, c, 0.6);           // 配色主副带
      rotMarks += makeStrip(0.75, stripThin, '#d9dded', 0.3);   // 高光副带

      // 6b. 焊缝环上的螺栓点（随筒体滚动的小亮点，让"滚"更明显）
      let ringBolts = '';
      for(let ri=1; ri<=7; ri++){
        const wx = drumL + (drumW * ri / 8);
        for(let i=0; i<3; i++){
          const phase = i/3;   // 性能：每环螺栓 4→3
          const delay = -(phase*rotDur).toFixed(2);
          let cyv=[], opv=[];
          for(let k=0; k<=16; k++){
            const ang = ((k/16)+phase)*2*Math.PI;
            const front = Math.cos(ang);
            cyv.push((cy + (R-ringInset)*Math.sin(ang)).toFixed(1));
            opv.push(front > 0 ? (0.3 + 0.5*front).toFixed(2) : '0');
          }
          // 性能：cy → transform: translate（同上）
          const _cy0 = parseFloat(cyv[0]);
          const _btv = cyv.map(v => '0 ' + (parseFloat(v) - _cy0).toFixed(1)).join(';');
          ringBolts += `<g clip-path="url(#${clipId})"><circle cx="${wx.toFixed(1)}" cy="${cyv[0]}" r="${F(partR*0.7)}" fill="${c}" opacity="${opv[0]}">
            <animateTransform attributeName="transform" type="translate" values="${_btv}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle></g>`;
        }
      }

      // 6c. 内部扬料板/抄板剪影（回转滚筒最标志性结构，随筒旋转）
      let flights = '';
      const flightCount = 8;
      const flightLen = R * 0.35;
      for(let fi=0; fi<flightCount; fi++){
        const phase = fi/flightCount;
        const delay = -(phase*rotDur).toFixed(2);
        let fy1=[], fy2=[], fOp=[];
        for(let k=0; k<=24; k++){
          const ang = ((k/24)+phase)*2*Math.PI;
          const sinA = Math.sin(ang), cosA = Math.cos(ang);
          const outerR = R - flightInset;
          const innerR = outerR - flightLen;
          const y1 = cy + outerR*sinA;
          const bendAng = ang + 0.3;
          const y2 = cy + innerR*Math.sin(bendAng);
          fy1.push(y1.toFixed(1));
          fy2.push(y2.toFixed(1));
          fOp.push(cosA > 0 ? (0.25 + 0.35*cosA).toFixed(2) : '0');
        }
        const fx = drumCx + (fi%3-1)*(drumW*0.15);
        flights += `<line x1="${fx.toFixed(1)}" x2="${fx.toFixed(1)}" y1="${fy1[0]}" y2="${fy2[0]}" stroke="${c}" stroke-width="${F(clamp(K*1.8,1.2,2.4))}" stroke-linecap="round" clip-path="url(#${clipIdInner})" opacity="${fOp[0]}">
          <animate attributeName="y1" values="${fy1.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="${fy2.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </line>`;
      }
      // 扬料板在筒壁上的固定点（小方点，铆接感）
      let flightPivots = '';
      for(let fi=0; fi<flightCount; fi++){
        for(let ri=1; ri<=2; ri++){   // 性能：每块扬料板铆点 3→2
          const wx = drumL + drumW*0.25 + drumW*0.5*(ri-1)/1;
          const phase = fi/flightCount + (ri*0.06);
          const delay = -(phase*rotDur).toFixed(2);
          let py=[], pOp=[];
          for(let k=0; k<=24; k++){
            const ang = ((k/24)+phase)*2*Math.PI;
            py.push((cy + (R-flightInset)*Math.sin(ang)).toFixed(1));
            pOp.push(Math.cos(ang) > 0 ? '0.5' : '0.08');
          }
          // 性能：y → transform: translate（同上）
          const _py0 = parseFloat(py[0]);
          const _ptv = py.map(v => '0 ' + (parseFloat(v) - _py0).toFixed(1)).join(';');
          flightPivots += `<g clip-path="url(#${clipId})"><rect x="${(wx-pivotSize/2).toFixed(1)}" y="${(py[0]-pivotSize/2).toFixed(1)}" width="${F(pivotSize)}" height="${F(pivotSize)}" fill="${c}" opacity="${pOp[0]}">
            <animateTransform attributeName="transform" type="translate" values="${_ptv}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${pOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </rect></g>`;
        }
      }

      // 7. 滚带（大齿圈样式：带齿动画）
      const drawTire = (tx)=>{
        const tTeethCount = 24;   // 性能：36→24（滚带齿仅装饰，无啮合约束）
        const tGearR = R + tireW/2;
        const tToothH = toothH;
        const tOuterRx = tireW/2;
        const tInnerRx = Math.max(1.5, tOuterRx - rimT);
        const tToothRx = tInnerRx;
        const tTw = clamp(K*0.9, 0.6, 1.4);
        const tireBody = `<ellipse cx="${F(tx)}" cy="${F(cy)}" rx="${F(tOuterRx)}" ry="${F(tGearR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
          <ellipse cx="${F(tx)}" cy="${F(cy)}" rx="${F(tInnerRx)}" ry="${F(tGearR-rimT*1.5)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8" opacity="0.6"/>`;
        let tireTeeth = '';
        for(let i=0; i<tTeethCount; i++){
          const phase = i/tTeethCount;
          const delay = -(phase*rotDur).toFixed(2);
          let tPts=[], tOp=[];
          for(let k=0; k<=16; k++){
            const ang = ((k/16)+phase)*2*Math.PI;
            const sinA=Math.sin(ang), cosA=Math.cos(ang);
            const rx=tToothRx, ry=tGearR, rx2=tToothRx+tTw, ry2=tGearR+tToothH;
            tPts.push(`${(tx+(rx+tTw)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)} ${(tx+rx2*cosA).toFixed(1)},${(cy+ry2*sinA).toFixed(1)} ${(tx+(rx-tTw)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)}`);
            tOp.push(cosA > 0 ? '0.85' : '0.2');
          }
          tireTeeth += `<polygon fill="#0c1020" stroke="#3f445c" stroke-width="0.5" clip-path="url(#${clipId})" points="${tPts[0]}">
            <animate attributeName="points" values="${tPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${tOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </polygon>`;
        }
        return tireBody + tireTeeth;
      };
      const tires = drawTire(tire1X) + drawTire(tire2X);

      // 8. 大齿圈（精细：齿动画，取消虚线环）
      const gearX = tire2X - clamp(drumW*0.1, 12, 30);
      const gearToothH = toothH;
      const gearHalfW = clamp(tireW*0.42, 4, 9);
      const gearInnerHalfW = Math.max(1.5, gearHalfW - rimT);
      const gearOuterR = R + clamp(R*0.36, 5, 12);
      const gTeethCount = 24;     // 性能：36→24；小齿轮齿数同比调整以保持啮合比
      const gTw = clamp(K*0.9, 0.6, 1.4);
      const gearBody = `<ellipse cx="${F(gearX)}" cy="${F(cy)}" rx="${F(gearHalfW)}" ry="${F(gearOuterR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
        <ellipse cx="${F(gearX)}" cy="${F(cy)}" rx="${F(gearInnerHalfW)}" ry="${F(gearOuterR-rimT*1.5)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8" opacity="0.6"/>`;
      let gearTeeth = '';
      for(let i=0; i<gTeethCount; i++){
        const phase = i/gTeethCount;
        const delay = -(phase*rotDur).toFixed(2);
        let tPts=[], tOp=[];
        for(let k=0; k<=16; k++){
          const ang = ((k/16)+phase)*2*Math.PI;
          const sinA=Math.sin(ang), cosA=Math.cos(ang);
          const rx=gearInnerHalfW, ry=gearOuterR, rx2=gearInnerHalfW+gTw, ry2=gearOuterR+gearToothH;
          tPts.push(`${(gearX+(rx+gTw)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)} ${(gearX+rx2*cosA).toFixed(1)},${(cy+ry2*sinA).toFixed(1)} ${(gearX+(rx-gTw)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)}`);
          tOp.push(cosA > 0 ? '0.85' : '0.2');
        }
        gearTeeth += `<polygon fill="#0c1020" stroke="#3f445c" stroke-width="0.5" clip-path="url(#${clipId})" points="${tPts[0]}">
          <animate attributeName="points" values="${tPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${tOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </polygon>`;
      }
      const girthGear = gearBody + gearTeeth;

      // 9. 小齿轮+减速机+电机（精细完整）
      const pinionR = clamp(R*0.18, 4, 11);
      const pTeethCount = 10;     // 性能：14→10
      const pinionX = gearX + clamp(K*3, 2, 8);
      const pinionY = cy + gearOuterR*0.7;
      const pinionToothIn = clamp(K, 0.6, 1.6), pinionToothOut = clamp(K*3, 1.5, 4.5);
      let pinionTeeth = '';
      for(let i=0; i<pTeethCount; i++){
        const a = i*360/pTeethCount*Math.PI/180;
        pinionTeeth += `<line x1="${F(pinionX+Math.cos(a)*(pinionR-pinionToothIn))}" y1="${F(pinionY+Math.sin(a)*(pinionR-pinionToothIn))}" x2="${F(pinionX+Math.cos(a)*(pinionR+pinionToothOut))}" y2="${F(pinionY+Math.sin(a)*(pinionR+pinionToothOut))}" stroke="${c}" stroke-width="${F(clamp(K*1.2,0.8,1.6))}" opacity="0.7"/>`;
      }
      const reducerW = clamp(K*22, 13, 28), reducerH = clamp(K*26, 15, 32);
      const reducerX0 = pinionX + clamp(K*18, 11, 26);
      const reducerY = pinionY + clamp(K*8, 4, 10);
      const motorW = clamp(K*24, 14, 30), motorH = clamp(K*22, 13, 28);
      const motorX0 = reducerX0 + clamp(K*18, 11, 26);
      const motorY = reducerY + clamp(K*4, 2, 6);
      const motorShaftLen = clamp(K*4, 2, 6), motorSW = clamp(K*2, 1.2, 3);
      // 驱动部件靠右时整体左移，保证不越出机宽（小尺寸下尤为必要）
      const driveShift = Math.max(0, motorX0 + motorW + motorShaftLen - w*0.98);
      const reducerX = reducerX0 - driveShift;
      const motorX = motorX0 - driveShift;
      const drive = `<g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${F(pinionX)} ${F(pinionY)}" to="${-gTeethCount/pTeethCount*360} ${F(pinionX)} ${F(pinionY)}" dur="${rotDur}s" repeatCount="indefinite"/>
          <circle cx="${F(pinionX)}" cy="${F(pinionY)}" r="${F(pinionR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
          <circle cx="${F(pinionX)}" cy="${F(pinionY)}" r="${F(pinionR*0.3)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
          ${pinionTeeth}
          <circle cx="${F(pinionX)}" cy="${F(pinionY)}" r="${F(clamp(K*2,1.2,3))}" fill="${c}" opacity="0.8"/>
        </g>
        <rect x="${F(reducerX-reducerW/2)}" y="${F(reducerY-reducerH/2)}" width="${F(reducerW)}" height="${F(reducerH)}" rx="3" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <rect x="${F(reducerX-reducerW/2+2)}" y="${F(reducerY-reducerH/2+2)}" width="${F(reducerW-4)}" height="${F(reducerH-4)}" fill="#12162b" opacity="0.5"/>
        <rect x="${F(motorX)}" y="${F(motorY-motorH/2)}" width="${F(motorW)}" height="${F(motorH)}" rx="4" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>
        <rect x="${F(motorX+3)}" y="${F(motorY-motorH/2+2)}" width="${F(motorW-6)}" height="${F(motorH-4)}" fill="#12162b" opacity="0.5"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${F(motorX+motorW)} ${F(motorY)}" to="360 ${F(motorX+motorW)} ${F(motorY)}" dur="0.8s" repeatCount="indefinite"/>
          <line x1="${F(motorX+motorW)}" y1="${F(motorY)}" x2="${F(motorX+motorW+motorShaftLen)}" y2="${F(motorY)}" stroke="${c}" stroke-width="${F(motorSW)}"/>
          <line x1="${F(motorX+motorW)}" y1="${F(motorY)}" x2="${F(motorX+motorW)}" y2="${F(motorY+motorShaftLen)}" stroke="${c}" stroke-width="${F(motorSW)}"/>
        </g>
        <text x="${F(motorX+motorW/2)}" y="${F(motorY+motorH*0.18)}" text-anchor="middle" fill="${c}" font-size="${F(clamp(K*6,4,8))}" opacity="0.6">M</text>
        <rect x="${F(pinionX+pinionR)}" y="${F(pinionY+pinionR+2)}" width="${F(motorX+motorW-(pinionX+pinionR)+2)}" height="${F(drivePlateH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      // 10. 进出料箱（精细）
      const inBox = `<path d="M 0 ${F(cy-R+boxChamfer)} L ${F(drumL)} ${F(cy-R+boxEdge)} L ${F(drumL)} ${F(cy+R-boxEdge)} L 0 ${F(cy+R-boxChamfer)} Z" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
        <rect x="0" y="${F(cy-R*0.4)}" width="${F(endBoxW+endPlateW)}" height="${F(R*0.8)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>
        <rect x="0" y="${F(cy-R*0.4-endFlangeT)}" width="${F(endFlangeW)}" height="${F(R*0.8+2*endFlangeT)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>
        <ellipse cx="${F(drumL)}" cy="${F(cy)}" rx="${F(nozRx)}" ry="${F(nozRy)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>`;
      const outBox = `<path d="M ${F(drumR)} ${F(cy-R+boxEdge)} L ${w} ${F(cy-R+boxChamfer)} L ${w} ${F(cy+R-boxChamfer)} L ${F(drumR)} ${F(cy+R-boxEdge)} Z" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
        <rect x="${F(w-endBoxW-endPlateW)}" y="${F(cy-R*0.4)}" width="${F(endBoxW+endPlateW)}" height="${F(R*0.8)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>
        <rect x="${F(w-endFlangeW)}" y="${F(cy-R*0.4-endFlangeT)}" width="${F(endFlangeW)}" height="${F(R*0.8+2*endFlangeT)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>
        <ellipse cx="${F(drumR)}" cy="${F(cy)}" rx="${F(nozRx)}" ry="${F(nozRy)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>`;
      // 10b. 料箱正面检修人孔/门：人孔盖 + 上下铰链 + 把手（件体色 #9aa2bc/#5b6280），尺寸按料箱尺度 clamp，小尺寸自动省略
      const makeManhole = (fx)=>{
        const mhRx = Math.min(drumL*0.28, R*0.5);
        if(mhRx < 4) return '';
        const mhRy = mhRx*1.15;
        const sp = Math.max(0.8, mhRx*0.16);
        return `<ellipse cx="${fx}" cy="${cy}" rx="${mhRx}" ry="${mhRy}" fill="#9aa2bc" stroke="#5b6280" stroke-width="1"/>
          <ellipse cx="${fx}" cy="${cy}" rx="${mhRx*0.62}" ry="${mhRy*0.62}" fill="none" stroke="#5b6280" stroke-width="0.6" opacity="0.7"/>
          <line x1="${fx-mhRx*0.5}" y1="${cy-mhRy-2}" x2="${fx-mhRx*0.5}" y2="${cy-mhRy*0.55}" stroke="#5b6280" stroke-width="1"/>
          <line x1="${fx+mhRx*0.5}" y1="${cy-mhRy-2}" x2="${fx+mhRx*0.5}" y2="${cy-mhRy*0.55}" stroke="#5b6280" stroke-width="1"/>
          <circle cx="${fx}" cy="${cy+mhRy*0.55}" r="${sp}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.3"/>`;
      };
      const manholes = makeManhole(drumL*0.5) + makeManhole(w - drumL*0.5);

      // 11. 物料床+冷却粒子（扬料板带起物料抛落雨幕+冷空气粒子）
      const materialBed = `<path d="M ${F(drumL+matMargin)} ${F(cy+R-bedDepth)} Q ${F(drumCx)} ${F(cy+R-bedEdge)} ${F(drumR-matMargin)} ${F(cy+R-bedDepth)} L ${F(drumR-matMargin)} ${F(cy+R-bedEdge)} L ${F(drumL+matMargin)} ${F(cy+R-bedEdge)} Z" fill="${c}" opacity="0.25"/>
        <path d="M ${F(drumL+matMargin)} ${F(cy+R-bedDepth)} Q ${F(drumCx)} ${F(cy+R-bedEdge)} ${F(drumR-matMargin)} ${F(cy+R-bedDepth)}" fill="none" stroke="${c}" stroke-width="${F(clamp(K*2.5,1.5,3))}" opacity="0.5"/>`;

      let particles = '';
      // 11a. 物料粒子：被扬料板带起→顶点→抛落（雨幕效果）
      const matParticleCount = 10;   // 性能：28→18→10
      const matSpray = partR*1.8;
      for(let i=0; i<matParticleCount; i++){
        const phase = i/matParticleCount;
        const delay = -(phase*rotDur).toFixed(2);
        const col = i % 5;
        const row = Math.floor(i/5);
        const px = drumL + matMargin + col*((drumW-2*matMargin)/4) + (row%2)*matJitter;
        const liftH = R * (0.5 + (i*37 % 10)/10 * 0.25);
        const scatterX = ((i*73 % 10) - 5) * 0.03 * R;
        let cxv=[], cyv=[], opv=[], rv=[];
        for(let k=0; k<=32; k++){
          const t = k/32, rt = (t+phase)%1;
          let x, y, op, r;
          if(rt < 0.35){
            const la = (rt/0.35)*Math.PI - Math.PI/2;
            x = px + matSpray*Math.cos(la);
            y = cy + R*0.85*Math.sin(la);
            op = 0.6 + 0.4*Math.cos(la*0.5);
            r = partR;
          } else if(rt < 0.75){
            const ft = (rt-0.35)/0.4;
            const startAng = 0.7*Math.PI - Math.PI/2;
            const sx = px + matSpray*Math.cos(startAng);
            const sy = cy + R*0.85*Math.sin(startAng);
            const endX = px + scatterX;
            const endY = cy + R - bedReturn;
            x = sx + (endX - sx)*ft;
            y = sy + (endY - sy)*ft - liftH*Math.sin(ft*Math.PI)*0.4;
            op = 0.8;
            r = partR*0.9;
          } else {
            const ft = (rt-0.75)/0.25;
            x = px + scatterX*0.3;
            y = cy + R - bedEdge*4 - (1-ft)*bedEdge*1.5;
            op = 0.3 * (1-ft);
            r = partR*0.9*(1-ft*0.5);
          }
          cxv.push(x.toFixed(1));
          cyv.push(y.toFixed(1));
          opv.push(op.toFixed(2));
          rv.push(r.toFixed(1));
        }
        /* 性能：cx/cy 两个几何属性动画合并成一个 transform: translate ——
           动画数不减，但每帧不再重算并重绘图元；r / opacity 保留（后续换 CSS 引擎时可走合成层）。 */
        const _mx0 = parseFloat(cxv[0]), _my0 = parseFloat(cyv[0]);
        const _mtv = cxv.map((v, k) => (parseFloat(v) - _mx0).toFixed(1) + ' ' + (parseFloat(cyv[k]) - _my0).toFixed(1)).join(';');
        particles += `<g clip-path="url(#${clipIdInner})"><circle cx="${cxv[0]}" cy="${cyv[0]}" r="${rv[0]}" fill="${c}" opacity="${opv[0]}">
          <animateTransform attributeName="transform" type="translate" values="${_mtv}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${rv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle></g>`;
      }

      // 11b. 冷却空气粒子：小而亮，逆向流动（从airIn到airOut方向，即从右到左+向上飘）
      const airParticleCount = 6;   // 性能：16→10→6
      for(let i=0; i<airParticleCount; i++){
        const phase = i/airParticleCount;
        const delay = -(phase*rotDur*1.5).toFixed(2);
        const startX = drumR - airMargin*0.75 - ((i*47 % 10)/10)*airMargin;
        const wiggleA = clamp(K*4, 2, 8) * (1 + (i*13 % 6)*0.15);
        const wiggleB = clamp(K*3, 1.5, 6) * (1 + (i*29 % 5)*0.15);
        let axv=[], ayv=[], aop=[];
        for(let k=0; k<=40; k++){
          const t = k/40, rt = (t+phase)%1;
          const x = startX - airSpan*rt + Math.sin(rt*Math.PI*3)*wiggleA;
          const y = cy + R*0.3 - R*0.6*rt + Math.cos(rt*Math.PI*4)*wiggleB;
          const fadeIn = rt < 0.1 ? rt*10 : 1;
          const fadeOut = rt > 0.85 ? (1-rt)*6.7 : 1;
          const op = fadeIn * fadeOut * 0.55;
          axv.push(x.toFixed(1));
          ayv.push(y.toFixed(1));
          aop.push(op.toFixed(2));
        }
        // 性能：cx/cy → transform: translate（同上）
        const _ax0 = parseFloat(axv[0]), _ay0 = parseFloat(ayv[0]);
        const _atv = axv.map((v, k) => (parseFloat(v) - _ax0).toFixed(1) + ' ' + (parseFloat(ayv[k]) - _ay0).toFixed(1)).join(';');
        particles += `<g clip-path="url(#${clipIdInner})"><circle cx="${axv[0]}" cy="${ayv[0]}" r="${F(partR*0.65)}" fill="${c}" opacity="${aop[0]}">
          <animateTransform attributeName="transform" type="translate" values="${_atv}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${aop.join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle></g>`;
        // 性能：冷空气尾迹小点已移除（每粒子多 1 节点 × 2 SMIL，收益低）
      }

      // 12. 风管统一画法：金属管壁 + 深色管腔 + 变径短节 + 端面把合法兰 + 2 颗螺栓
      // airInX/airOutX 须与 ports 中 airIn(x:0.9,y:1,down) / airOut(x:0.1,y:0,up) 锚点保持同步
      const airInX = w*0.9, airOutX = w*0.1;
      const makeDuct = (x, yNear, yFar, s)=>{
        const redNearHalf = ductRedTop/2, redFarHalf = ductRedBot/2;
        const redFar = yNear + s*ductRedLen;
        const flangeY = s>0 ? yFar - ductFlangeH : yFar;
        const shaftY = s>0 ? redFar : ductFlangeH;
        // 竖直段高设下限，矮尺寸下不出现负高 / 反向
        const shaftH = s>0 ? Math.max(ductMinShaft, yFar - ductFlangeH - redFar) : Math.max(ductMinShaft, redFar - ductFlangeH);
        const flCy = flangeY + ductFlangeH/2;
        return `<path d="M ${F(x-redNearHalf)} ${F(yNear)} L ${F(x+redNearHalf)} ${F(yNear)} L ${F(x+redFarHalf)} ${F(redFar)} L ${F(x-redFarHalf)} ${F(redFar)} Z" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${F(x-ductHalf)}" y="${F(shaftY)}" width="${F(ductHalf*2)}" height="${F(shaftH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${F(x-ductHalf+ductWallT)}" y="${F(shaftY)}" width="${F((ductHalf-ductWallT)*2)}" height="${F(shaftH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>
        <rect x="${F(x-ductFlangeHalf)}" y="${F(flangeY)}" width="${F(ductFlangeHalf*2)}" height="${F(ductFlangeH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <circle cx="${F(x-ductBoltDx)}" cy="${F(flCy)}" r="${F(ductBoltR)}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.3"/>
        <circle cx="${F(x+ductBoltDx)}" cy="${F(flCy)}" r="${F(ductBoltR)}" fill="#8e96b6" stroke="#3f445c" stroke-width="0.3"/>`;
      };
      const airDucts = makeDuct(airInX, cy+R+ductGap, h, 1) + makeDuct(airOutX, cy-R-ductGap, 0, -1);

      // 13. 铭牌（保留板 + 文字 / 文案不变；板色 / 描边统到基准色系「法兰 / 接管」件色）
      //     字号按机高 clamp，板宽 / 板高 / 位置随之定尺封顶，并夹在画布内保证不越界
      const plateFs = clamp(h*0.043, 3.5, 9);
      const plateW = clamp(Math.min(plateFs*10.7, w*0.6), 24, 96);
      const plateH = clamp(plateFs*2, 7, 18);
      const plateRx = clamp(K, 0.5, 2);
      const plateX = clamp(drumCx - plateW/2, 1, Math.max(1, w - plateW - 1));
      const plateY = clamp(baseY - plateH - clamp(K*4, 2, 6), 1, Math.max(1, h - plateH - 1));
      const plateTextX = plateX + plateW/2;
      const plateTextY = plateY + plateH/2 + plateFs*0.35;
      const nameplate = `<rect x="${F(plateX)}" y="${F(plateY)}" width="${F(plateW)}" height="${F(plateH)}" rx="${F(plateRx)}" fill="#2a2f45" stroke="#3f445c" stroke-width="${F(clamp(K*0.6, 0.4, 1))}"/>
        <text x="${F(plateTextX)}" y="${F(plateTextY)}" text-anchor="middle" fill="${c}" font-size="${F(plateFs)}" opacity="0.75">回转滚筒冷却机</text>`;

      return `
        <defs>${clipDef}${clipDefInner}${drumShade}${metalDef}${metalVDef}</defs>
        ${base1}${base2}
        ${trunnions}
        ${airDucts}
        ${inBox}${outBox}${manholes}
        ${drumBody}
        <g clip-path="url(#${clipId})">
          ${weldRings}
          ${flights}
          ${flightPivots}
          ${rotMarks}
          ${ringBolts}
          ${materialBed}
          ${particles}
        </g>
        ${tires}
        ${girthGear}
        ${drive}
        ${nameplate}
      `;
    }
};
