/* ============================================================
 * PFD Editor · 组件模板：rotaryKiln
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.rotaryKiln。
 * ============================================================ */

TEMPLATES.rotaryKiln = {
    name: '回转窑/旋转煅烧窑', category: '设备',
    defaultSize: { w: 380, h: 180 },
    ports: [
      // 进料口贴窑尾罩左壁、垂直居中（罩壁 = h_drumL - tailHoodW = w*0.12 - w*(24/380) → 比例恒为 0.057）
      {id:'inlet',x:.057,y:.55,dir:'left'},
      {id:'outlet',x:1,y:.76,dir:'right'},
      // 燃烧器喷煤管口（管长减半后的管端法兰外沿，比例恒为 0.9713）
      {id:'fuel',x:.9713,y:.55,dir:'right'},
      {id:'flueGas',x:.1,y:.22,dir:'up'}
    ],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      const rotDur = 6;
      // 端口锚点比例常量（须与文件顶部 ports 定义同步；改动任一处必须同步另一处）
      const drumCYRatio = 0.55;    // 筒体轴线 y / inlet·fuel 端口 y
      const tailWallRatio = 0.057; // 窑尾罩左壁 x / inlet 端口 x
      const outletCYRatio = 0.76;  // 出料管中心 y / outlet 端口 y
      const fuelXRatio = 0.9713;   // 燃烧器端法兰外沿 x / fuel 端口 x
      const flueXRatio = 0.1;      // 烟气管中心 x / flueGas 端口 x
      const flueTopRatio = 0.22;   // 烟气管顶法兰上沿 y / flueGas 端口 y
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      // 水平筒体参数
      const h_drumL = w*0.12;
      const h_drumR = w*0.84;
      const h_drumW = h_drumR - h_drumL;
      const h_cy = h*drumCYRatio;
      const h_R = h*0.16;
      const h_drumTop = h_cy - h_R;
      const h_clipId = `clip_kiln_${Math.random().toString(36).substr(2,6)}`;
      const h_clipIdInner = `clip_kiln_in_${Math.random().toString(36).substr(2,6)}`;
      const kilnShadeId = `kiln_shade_${Math.random().toString(36).substr(2,6)}`;
      const kilnTempGradId = `kiln_temp_${Math.random().toString(36).substr(2,6)}`;
      const kilnTempBaseId = `kiln_tempbase_${Math.random().toString(36).substr(2,6)}`;
      const rkMetalId = `rk_metal_${Math.random().toString(36).substr(2,6)}`;
      const rkMetalVId = `rk_metalv_${Math.random().toString(36).substr(2,6)}`;
      const baseY = h*0.94;

      // —— 定尺封顶块（步骤 4）：F 格式化 / K 机宽高缩放系数 / 细部定尺常量 ——
      // 原则：细部尺寸 = clamp(比例 × 特征尺寸, 下限, 定尺上限) → 放大不增粗、缩小不越界
      const F = v => (+v).toFixed(2);
      const K = clamp(Math.min(w/380, h/180), 0.3, 2.4);   // 机宽高综合缩放系数（默认 380×180 → 1）
      const tubeInset   = clamp(h_R*0.14, 2, 6);           // 内层 clip 内缩
      const drumInset   = clamp(h_R*0.10, 1.5, 3.5);       // 筒体高光内缩
      const tireW       = clamp(h_R*0.56, 5, 24);          // 轮带环厚
      const toothH      = clamp(h_R*0.14, 2, 7);           // 轮带 / 齿圈齿高
      const tireGearR   = h_R + clamp(h_R*0.17, 3, 9);     // 轮带齿顶半径
      const girthR      = h_R + clamp(h_R*0.28, 4, 12);    // 大齿圈齿顶半径
      const girthW      = clamp(h_R*0.49, 5, 22);          // 大齿圈环厚
      const weldRx      = clamp(h_R*0.09, 1.2, 4);         // 焊缝环短半径
      const weldSw      = clamp(K*0.9, 0.5, 1.4);          // 焊缝环线宽
      const stripMargin = clamp(h_drumW*0.03, 3, 12);      // 旋转标记带左右缩进
      const matInset    = clamp(h_drumW*0.055, 5, 20);     // 物料颗粒 / 耐火砖横向缩进
      const trunnionR   = clamp(h_R*0.31, 3, 14);          // 托轮半径
      const pinionR     = clamp(h_R*0.24, 3, 12);          // 小齿轮半径
      // 基础墩定尺与基线（竖向封顶：墩顶不高于 baseY，墩高不低于下限）
      const fGap = clamp(h_R*0.97, 5, 40);
      const fH   = clamp(h_R*0.47, 3, 18);
      const fTop = Math.min(h_cy + h_R + fGap, baseY - fH);

      const bolt = (bx,by,r=1.5)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#8e96b6" stroke="#5b6280" stroke-width="0.5"/><circle cx="${bx}" cy="${by}" r="${r*0.4}" fill="#0c1020" opacity="0.45"/>`;
      const boltPair = (bx,by,dist=5,r=1.3)=>bolt(bx,by-dist/2,r)+bolt(bx,by+dist/2,r);

      // 1. 混凝土基础底座（减速机/电机/托轮下方3个墩）
      // 窑尾侧托轮组已移除，其下方底座墩一并删除，避免留下悬空的孤立底座
      let foundations = '';
      const foundXs = [
        {x:h_drumL+h_drumW*0.42, w:clamp(h_drumW*0.1316, 10, 36)},
        {x:h_drumL+h_drumW*0.55, w:clamp(h_drumW*0.1608, 12, 44)},
        {x:h_drumL+h_drumW*0.72, w:clamp(h_drumW*0.1608, 12, 44)}
      ];
      foundXs.forEach(({x:fx,w:fW})=>{
        const fIn = Math.min(clamp(K*2, 1, 4), Math.max(1, fW/2-3));
        const fLine1 = fTop + clamp(fH*0.42, 1, 8);
        const fLine2 = fTop + clamp(fH*0.76, 1.5, 14);
        const fBoltX = Math.min(clamp(K*5, 3, 6), fW/2-1.5);
        const fBoltY = baseY - clamp(K*2, 1, 3);
        const fBoltR = clamp(K*1.2, 0.7, 1.5);
        foundations += `
          <rect x="${F(fx-fW/2)}" y="${F(fTop)}" width="${F(fW)}" height="${F(baseY-fTop)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="0.8"/>
          <rect x="${F(fx-fW/2+fIn)}" y="${F(fTop+fIn)}" width="${F(fW-2*fIn)}" height="${F(baseY-fTop-2*fIn)}" fill="#12162b" opacity="0.5"/>
          <line x1="${F(fx-fW/2+fIn*2)}" y1="${F(fLine1)}" x2="${F(fx+fW/2-fIn*2)}" y2="${F(fLine1)}" stroke="#5b6280" stroke-width="0.4" opacity="0.5"/>
          <line x1="${F(fx-fW/2+fIn*2)}" y1="${F(fLine2)}" x2="${F(fx+fW/2-fIn*2)}" y2="${F(fLine2)}" stroke="#5b6280" stroke-width="0.4" opacity="0.35"/>
          ${bolt(F(fx-fW/2+fBoltX), F(fBoltY), F(fBoltR))}
          ${bolt(F(fx+fW/2-fBoltX), F(fBoltY), F(fBoltR))}`;
      });

      // 2. 托轮组（2组）
      const h_tire1X = h_drumL + h_drumW*0.22;
      const h_tire2X = h_drumL + h_drumW*0.72;
      const drawTrunnionSet = (tx)=>{
        const contactAngle = 30*Math.PI/180;
        const trunnionOffset = (h_R + clamp(h_R*0.28, 3, 10)) * Math.sin(contactAngle) * 0.85;
        const trunnionCY = h_cy + h_R + clamp(h_R*0.35, 4, 14);
        const bearW = clamp(trunnionR*1.56, 6, 20);
        const bearH = clamp(trunnionR*0.89, 3, 12);
        const bearIn = Math.min(clamp(bearW*0.14, 1.2, 3), bearW/2-1);
        const bearBoltR = clamp(K*1.1, 0.6, 1.4);
        const bearBaseOut = clamp(K*2, 1, 3);
        const drawWheel = (wx, wy, dir)=>{
          let spokes = '';
          for(let i=0;i<5;i++){
            const sa=i*72*Math.PI/180;
            spokes += `<line x1="${F(wx)}" y1="${F(wy)}" x2="${F(wx+Math.cos(sa)*trunnionR*0.55)}" y2="${F(wy+Math.sin(sa)*trunnionR*0.55)}" stroke="#9aa2bc" stroke-width="0.9" opacity="0.5"/>`;
          }
          return `<g>
            <animateTransform attributeName="transform" type="rotate" from="${dir>0?0:360} ${wx} ${wy}" to="${dir>0?360:0} ${wx} ${wy}" dur="${rotDur*1.2}s" repeatCount="indefinite"/>
            <circle cx="${wx}" cy="${wy}" r="${F(trunnionR)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.3"/>
            <circle cx="${wx}" cy="${wy}" r="${F(trunnionR*0.25)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
            ${spokes}
            <circle cx="${wx}" cy="${wy}" r="${F(clamp(trunnionR*0.22, 1, 2.6))}" fill="${c}" opacity="0.6"/>
          </g>
          <rect x="${F(wx-bearW/2)}" y="${F(wy+trunnionR)}" width="${F(bearW)}" height="${F(bearH)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="0.9"/>
          ${bolt(F(wx-bearW/2+bearIn), F(wy+trunnionR+bearH/2), F(bearBoltR))}
          ${bolt(F(wx+bearW/2-bearIn), F(wy+trunnionR+bearH/2), F(bearBoltR))}
          <rect x="${F(wx-bearW/2-bearBaseOut)}" y="${F(wy+trunnionR+bearH)}" width="${F(bearW+2*bearBaseOut)}" height="${F(clamp(bearH*0.5, 2, 6))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;
        };
        return drawWheel(tx-trunnionOffset, trunnionCY, 1) + drawWheel(tx+trunnionOffset, trunnionCY, -1);
      };
      // 按需求移除窑尾侧（左侧）托轮组，仅保留窑头侧一组
      const trunnions = drawTrunnionSet(h_tire2X);

      // 3. 挡轮
      const h_thrustX = h_drumL + h_drumW*0.42;
      const thrustR = clamp(h_R*0.24, 2.5, 10);
      const thrustOff = clamp(h_R*0.42, 5, 20);
      const thrustPedW = clamp(h_R*0.48, 7, 20);
      const thrustPedH = clamp(h_R*0.28, 4, 12);
      const thrustPedX = h_thrustX + thrustOff - thrustPedW/2;
      const thrustPedY = h_cy + thrustPedH*0.9;
      const thrustBaseW = thrustPedW + clamp(K*4, 2, 6);
      const h_thrustWheel = `
        <g>
          <circle cx="${F(h_thrustX+thrustOff)}" cy="${F(h_cy)}" r="${F(thrustR)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.2"/>
          <circle cx="${F(h_thrustX+thrustOff)}" cy="${F(h_cy)}" r="${F(clamp(thrustR*0.45, 1.2, 4))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
          <rect x="${F(thrustPedX)}" y="${F(thrustPedY)}" width="${F(thrustPedW)}" height="${F(thrustPedH)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="0.8"/>
          ${bolt(F(thrustPedX+thrustPedW*0.3), F(thrustPedY+thrustPedH*0.6), F(clamp(K, 0.8, 1.3)))}
          ${bolt(F(thrustPedX+thrustPedW*0.7), F(thrustPedY+thrustPedH*0.6), F(clamp(K, 0.8, 1.3)))}
          <rect x="${F(thrustPedX-clamp(K*2,1,3))}" y="${F(thrustPedY+thrustPedH)}" width="${F(thrustBaseW)}" height="${F(clamp(thrustPedH*0.5, 2, 6))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
        </g>`;

      // 4. 渐变和ClipPath
      // 局部金属渐变（基准色系）：metal 横向（立式件：基础墩 / 罩体 / 减速机 / 电机）
      // metalV 竖向（横向筒体 / 横向管：筒体圆柱明暗 / 燃烧器管 / 出料管）
      const metalDef = `<linearGradient id="${rkMetalId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7d849e"/>
        <stop offset="50%" stop-color="#d9dded"/>
        <stop offset="100%" stop-color="#767d97"/>
      </linearGradient>`;
      const metalVDef = `<linearGradient id="${rkMetalVId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7d849e"/>
        <stop offset="50%" stop-color="#d9dded"/>
        <stop offset="100%" stop-color="#767d97"/>
      </linearGradient>`;
      const drumShade = `<linearGradient id="${kilnShadeId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7d849e"/>
        <stop offset="50%" stop-color="#d9dded"/>
        <stop offset="100%" stop-color="#767d97"/>
      </linearGradient>`;
      // 温度渐变（测温点 → 颜色锚点，从左到右）
      const tempPoints = (p && p.tempPoints && p.tempPoints.length) ? p.tempPoints : [];
      // 无实时数据时的占位色：沿筒体方向的暖色坡（暗红→亮橙），替代原先的淡紫默认色（在亮金属筒体上会泛白成雾）
      const tempCold = [122, 26, 8], tempHot = [255, 191, 92];
      const tempGrad = tempPoints.length ? `<linearGradient id="${kilnTempGradId}" x1="0" y1="0" x2="1" y2="0" class="kiln-temp-grad">${tempPoints.map((pt,i)=>{
        const f = tempPoints.length > 1 ? i/(tempPoints.length-1) : 0;
        const col = 'rgb(' + tempCold.map((v,j)=>Math.round(v+(tempHot[j]-v)*f)).join(',') + ')';
        return `<stop class="kiln-temp-stop" data-kidx="${i}" offset="${(f*100).toFixed(1)}%" stop-color="${col}"/>`;
      }).join('')}</linearGradient>` : '';
      // 温度区底衬：暗色柱面渐变，为温度色提供高对比背景（直接叠在亮金属筒体上会泛白起雾）
      const tempBaseDef = tempPoints.length ? `<linearGradient id="${kilnTempBaseId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#160b08"/>
        <stop offset="50%" stop-color="#2e160c"/>
        <stop offset="100%" stop-color="#160b08"/>
      </linearGradient>` : '';
      const tempBase = tempPoints.length ? `<rect x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}" fill="url(#${kilnTempBaseId})" clip-path="url(#${h_clipId})"/>` : '';
      const tempOverlay = tempPoints.length ? `<rect class="kiln-temp-overlay" x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}" fill="url(#${kilnTempGradId})" opacity="0.82" clip-path="url(#${h_clipId})"/>` : '';
      const clipDef = `<clipPath id="${h_clipId}"><rect x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}"/></clipPath>`;
      const clipDefInner = `<clipPath id="${h_clipIdInner}"><rect x="${F(h_drumL+tubeInset)}" y="${F(h_drumTop+tubeInset)}" width="${F(h_drumW-2*tubeInset)}" height="${F(h_R*2-2*tubeInset)}" rx="${F(h_R*0.2)}" ry="${F(Math.max(1,h_R-tubeInset))}"/></clipPath>`;

      // 5. 筒体主体
      const drumBody = `
        <rect x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}" fill="url(#${kilnShadeId})" stroke="#3f445c" stroke-width="1.8"/>
        <rect x="${F(h_drumL+drumInset)}" y="${F(h_drumTop+drumInset)}" width="${F(h_drumW-2*drumInset)}" height="${F(h_R*0.4)}" rx="${F(h_R*0.2)}" ry="${F(h_R*0.4)}" fill="#5b6280" opacity="0.35"/>
        <ellipse cx="${h_drumL}" cy="${h_cy}" rx="${h_R*0.3}" ry="${h_R}" fill="#12162b" stroke="#6a7192" stroke-width="1.2" opacity="0.7"/>
        <ellipse cx="${h_drumR}" cy="${h_cy}" rx="${h_R*0.3}" ry="${h_R}" fill="#12162b" stroke="#6a7192" stroke-width="1.2" opacity="0.7"/>`;

      // 6. 轮带（齿轮转盘样式：带齿旋转动画）
      const tTeethCount = 40;
      const tGearR = tireGearR;
      const tToothH = toothH;
      const tOuterRx = tireW/2+1;
      const tInnerRx = Math.max(1, tireW/2-2);
      const drawTire = (tx)=>{
        let tTeeth='';
        for(let i=0;i<tTeethCount;i++){
          const phase=i/tTeethCount, delay=-(phase*rotDur).toFixed(2);
          let tPts=[], tOp=[];
          for(let k=0;k<=12;k++){
            const ang=((k/12)+phase)*2*Math.PI, cosA=Math.cos(ang), sinA=Math.sin(ang);
            const rx=tOuterRx, ry=tGearR;
            tPts.push(`${(tx+(rx+1)*cosA).toFixed(1)},${(h_cy+ry*sinA).toFixed(1)} ${(tx+(rx+tToothH+1)*cosA).toFixed(1)},${(h_cy+(ry+tToothH)*sinA).toFixed(1)} ${(tx+(rx-1)*cosA).toFixed(1)},${(h_cy+ry*sinA).toFixed(1)}`);
            tOp.push(cosA>0?'0.75':'0.1');
          }
          tTeeth += `<polygon fill="#0c1020" stroke="#3f445c" stroke-width="0.4" points="${tPts[0]}" opacity="${tOp[0]}" clip-path="url(#${h_clipId})">
            <animate attributeName="points" values="${tPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${tOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </polygon>`;
        }
        return `<ellipse cx="${tx}" cy="${h_cy}" rx="${F(tOuterRx)}" ry="${F(tGearR)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.4"/>
          <ellipse cx="${tx}" cy="${h_cy}" rx="${F(tInnerRx)}" ry="${F(Math.max(1,tGearR-tireW*0.31))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7" opacity="0.5"/>
          <ellipse cx="${tx}" cy="${F(h_cy - h_R*0.7)}" rx="${F(tInnerRx)}" ry="${F(h_R*0.2)}" fill="#5b6280" opacity="0.4"/>
          ${tTeeth}`;
      };
      const tires = drawTire(h_tire1X) + drawTire(h_tire2X);

      // 7. 焊缝环
      let weldRings = '';
      for(let i=1;i<=9;i++){
        const wx = h_drumL + h_drumW*i/10;
        weldRings += `<ellipse cx="${F(wx)}" cy="${F(h_cy)}" rx="${F(weldRx)}" ry="${F(Math.max(1,h_R-weldSw))}" fill="none" stroke="${c}" stroke-width="${F(weldSw)}" opacity="0.3"/>`;
      }

      // 8. 旋转标记带
      let rotMarks = '';
      const makeKilnStrip = (phase, sw, color, opFront)=>{
        const delay = -(phase*rotDur).toFixed(2);
        let yVals=[], opVals=[];
        for(let k=0;k<=20;k++){
          const ang=((k/20)+phase)*2*Math.PI, front=Math.cos(ang);
          yVals.push((h_cy+h_R*Math.sin(ang)-sw/2).toFixed(1));
          opVals.push(front>0.1?(opFront*front+0.05).toFixed(2):'0');
        }
        return `<rect x="${F(h_drumL+stripMargin)}" y="${yVals[0]}" width="${F(h_drumW-2*stripMargin)}" height="${F(sw)}" rx="${F(sw/2)}" fill="${color}" clip-path="url(#${h_clipId})">
          <animate attributeName="y" values="${yVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </rect>`;
      };
      rotMarks += makeKilnStrip(0, clamp(h_R*0.17, 1.2, 7), c, 0.4);
      rotMarks += makeKilnStrip(0.35, clamp(h_R*0.07, 0.8, 3), '#d9dded', 0.25);
      rotMarks += makeKilnStrip(0.65, clamp(h_R*0.10, 1, 4), c, 0.4);
      rotMarks += makeKilnStrip(0.85, clamp(h_R*0.05, 0.6, 2.5), c, 0.3);

      // 焊缝螺栓点
      let ringBolts = '';
      for(let ri=1;ri<=9;ri++){
        const wx=h_drumL+h_drumW*ri/10;
        for(let i=0;i<4;i++){
          const phase=i/4, delay=-(phase*rotDur).toFixed(2);
          let cyv=[], opv=[];
          for(let k=0;k<=16;k++){
            const ang=((k/16)+phase)*2*Math.PI, front=Math.cos(ang);
            cyv.push((h_cy+(h_R-clamp(h_R*0.07,0.6,2.5))*Math.sin(ang)).toFixed(1));
            opv.push(front>0?(0.2+0.4*front).toFixed(2):'0');
          }
          ringBolts += `<circle cx="${wx.toFixed(1)}" cy="${cyv[0]}" r="${F(clamp(K*1.2,0.7,1.6))}" fill="${c}" clip-path="url(#${h_clipId})" opacity="${opv[0]}">
            <animate attributeName="cy" values="${cyv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle>`;
        }
      }

      // 9. 耐火砖衬里
      const refractory = `
        <rect x="${F(h_drumL+tubeInset)}" y="${F(h_drumTop+tubeInset)}" width="${F(h_drumW-2*tubeInset)}" height="${F(h_R*2-2*tubeInset)}" rx="${F(h_R*0.2)}" ry="${F(Math.max(1,h_R-tubeInset))}" fill="none" stroke="#8B4513" stroke-width="${F(clamp(h_R*0.1,2,4))}" opacity="0.3" clip-path="url(#${h_clipIdInner})"/>
        ${Array.from({length:8}).map((_,i)=>{
          const wx=h_drumL+tubeInset*2+i*(h_drumW-4*tubeInset)/7;
          return `<ellipse cx="${wx.toFixed(1)}" cy="${h_cy}" rx="${F(clamp(h_R*0.07,1,2.5))}" ry="${F(Math.max(1,h_R-tubeInset*1.5))}" fill="none" stroke="#6B3510" stroke-width="0.8" opacity="0.25" clip-path="url(#${h_clipIdInner})"/>`;
        }).join('')}`;

      // 扬料板
      let flights = '';
      const flightInset = clamp(h_R*0.17, 2, 8);
      for(let fi=0;fi<10;fi++){
        const phase=fi/10, delay=-(phase*rotDur).toFixed(2);
        let fy1=[], fy2=[], fOp=[];
        for(let k=0;k<=20;k++){
          const ang=((k/20)+phase)*2*Math.PI;
          fy1.push((h_cy+(h_R-flightInset)*Math.sin(ang)).toFixed(1));
          fy2.push((h_cy+(h_R-flightInset-h_R*0.3)*Math.sin(ang+0.25)).toFixed(1));
          fOp.push(Math.cos(ang)>0?(0.2+0.3*Math.cos(ang)).toFixed(2):'0');
        }
        const fx=h_drumL+h_drumW*0.3+(fi%3-1)*(h_drumW*0.15);
        flights += `<line x1="${fx.toFixed(1)}" x2="${fx.toFixed(1)}" y1="${fy1[0]}" y2="${fy2[0]}" stroke="#9aa2bc" stroke-width="${F(clamp(K*2,1.2,3))}" stroke-linecap="round" clip-path="url(#${h_clipIdInner})" opacity="${fOp[0]}">
          <animate attributeName="y1" values="${fy1.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="${fy2.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </line>`;
      }

      // 10. 大齿圈（48齿）
      const gearTeeth=48, h_gearX=h_drumL+h_drumW*0.35, h_gearR=girthR, h_gearW=girthW;
      let h_gearTeeth='';
      for(let i=0;i<gearTeeth;i++){
        const phase=i/gearTeeth, delay=-(phase*rotDur).toFixed(2);
        let gPts=[], gOp=[];
        for(let k=0;k<=12;k++){
          const ang=((k/12)+phase)*2*Math.PI, rx=h_gearW/2, ry=h_gearR, cosA=Math.cos(ang);
          gPts.push(`${(h_gearX+(rx+1)*cosA).toFixed(1)},${(h_cy+ry*Math.sin(ang)).toFixed(1)} ${(h_gearX+(rx+toothH+1)*cosA).toFixed(1)},${(h_cy+(ry+toothH)*Math.sin(ang)).toFixed(1)} ${(h_gearX+(rx-1)*cosA).toFixed(1)},${(h_cy+ry*Math.sin(ang)).toFixed(1)}`);
          gOp.push(cosA>0?'0.75':'0.1');
        }
        h_gearTeeth += `<polygon fill="#0c1020" stroke="#3f445c" stroke-width="0.4" points="${gPts[0]}" opacity="${gOp[0]}" clip-path="url(#${h_clipId})">
          <animate attributeName="points" values="${gPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${gOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </polygon>`;
      }
      const h_girthGear = `
        <ellipse cx="${h_gearX}" cy="${h_cy}" rx="${F(h_gearW/2)}" ry="${F(h_gearR)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.3"/>
        <ellipse cx="${h_gearX}" cy="${h_cy}" rx="${F(Math.max(1,h_gearW/2-3))}" ry="${F(Math.max(1,h_gearR-5))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7" opacity="0.5"/>
        ${h_gearTeeth}`;

      // 11. 窑尾罩（左端）
      // 罩左壁 = w*tailWallRatio（令 inlet 端口严格贴合罩壁），罩宽由筒体左端反推
      const tailHoodW=h_drumL-w*tailWallRatio, tailHoodX=h_drumL;
      // 进料管：水平管从左边缘接入烟室左侧壁
      const inletPipeCY = h_cy - h_R*0.72;
      const inletPipeH = clamp(h_R*0.49, 6, 20);
      const inletPipeY = inletPipeCY - inletPipeH/2;
      const inletPipeEndX = tailHoodX - tailHoodW + clamp(K*1, 0.5, 2); // 右端接烟室左壁
      // 烟气管：垂直管从烟室顶面接出，高度为烟室顶到包围盒顶部的一半（法兰位于 h*0.22）
      const fluePipeW = clamp(h_R*0.42, 6, 18);
      const fluePipeCX = w*flueXRatio;
      const fluePipeX = fluePipeCX - fluePipeW/2;
      // 烟室顶面斜边：从(tailHoodX-tailHoodW, h_cy-h_R*0.85)到(tailHoodX, h_cy-h_R*1.1)
      const hoodTopLx = tailHoodX-tailHoodW, hoodTopLy = h_cy-h_R*0.85;
      const hoodTopRx = tailHoodX, hoodTopRy = h_cy-h_R*1.1;
      const hoodTopSlope = (hoodTopRy-hoodTopLy)/(hoodTopRx-hoodTopLx);
      const hoodYat = (x)=> hoodTopLy + hoodTopSlope*(x-hoodTopLx);
      const flueBaseL = fluePipeX-clamp(K*4, 2, 5), flueBaseR = fluePipeX+fluePipeW+clamp(K*4, 2, 5);
      const flueBaseLy = hoodYat(flueBaseL), flueBaseRy = hoodYat(flueBaseR);
      const flueBaseY = Math.max(flueBaseLy, flueBaseRy) + clamp(K*7, 3, 12); // 垂直管底（锥座顶）
      const flueTopY = h*flueTopRatio;  // 管顶法兰上沿 = flueGas 端口 y
      const flueFlangeW = clamp(K*20, 12, 28), flueFlangeH = clamp(K*5, 3, 7);
      const tailHood = `
        <path d="M ${tailHoodX} ${h_cy-h_R*1.1} L ${tailHoodX-tailHoodW} ${h_cy-h_R*0.85} L ${tailHoodX-tailHoodW} ${h_cy+h_R*0.85} L ${tailHoodX} ${h_cy+h_R*1.1} Z" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.3"/>
        <path d="M ${tailHoodX-3} ${h_cy-h_R*1.0} L ${tailHoodX-tailHoodW+2} ${h_cy-h_R*0.8} L ${tailHoodX-tailHoodW+2} ${h_cy+h_R*0.8} L ${tailHoodX-3} ${h_cy+h_R*1.0} Z" fill="#12162b" opacity="0.5"/>
        <!-- 烟气出口管（锥形底座贴合烟室斜面焊接，垂直管到半高法兰） -->
        <path d="M ${flueBaseL} ${flueBaseLy} L ${fluePipeX} ${flueBaseY} L ${fluePipeX} ${flueTopY+flueFlangeH} L ${fluePipeX+fluePipeW} ${flueTopY+flueFlangeH} L ${fluePipeX+fluePipeW} ${flueBaseY} L ${flueBaseR} ${flueBaseRy} Z" fill="url(#${rkMetalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(fluePipeX+clamp(K*2,1,3))}" y="${F(flueTopY+flueFlangeH+clamp(K*3,1.5,5))}" width="${F(clamp(K*3,1.5,4))}" height="${F(Math.max(0,flueBaseY-flueTopY-flueFlangeH-2*clamp(K*3,1.5,5)))}" fill="#5b6280" opacity="0.35"/>
        <!-- 顶部法兰 -->
        <rect x="${F(fluePipeCX-flueFlangeW/2)}" y="${F(flueTopY)}" width="${F(flueFlangeW)}" height="${F(flueFlangeH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${boltPair(fluePipeCX, flueTopY+flueFlangeH/2, flueFlangeW*0.6, clamp(K,0.7,1.2))}
        <!-- 注：左端水平进料管与端部喇叭口已按需求移除；inletPipe* 参数仅用于下方罩内溜槽引导线定位 -->
        <!-- 内部溜槽引导线 -->
        <path d="M ${F(inletPipeEndX+clamp(K*3,1,5))} ${F(inletPipeY+inletPipeH-clamp(K*2,1,3))} L ${F(tailHoodX-clamp(K*6,2,10))} ${F(h_cy+h_R*0.15)}" fill="none" stroke="#5b6280" stroke-width="0.7" opacity="0.4"/>
        ${Array.from({length:8}).map((_,i)=>`<line x1="${F(tailHoodX)}" y1="${F(h_cy-h_R+i*(h_R*2/7))}" x2="${F(tailHoodX-clamp(K*6,2,10))}" y2="${F(h_cy-h_R+i*(h_R*2/7)+1)}" stroke="#5b6280" stroke-width="0.6" opacity="0.4"/>`).join('')}
        <rect x="${F(tailHoodX-tailHoodW+clamp(K*5,3,7))}" y="${F(h_cy-clamp(K*6,3,8))}" width="${F(clamp(K*10,6,14))}" height="${F(clamp(K*12,7,16))}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        ${bolt(F(tailHoodX-tailHoodW+clamp(K*5,3,7)+clamp(K*2,1,3)), F(h_cy-clamp(K*4,2,5)), clamp(K,0.7,1.2))}${bolt(F(tailHoodX-tailHoodW+clamp(K*5,3,7)+clamp(K*8,5,11)), F(h_cy-clamp(K*4,2,5)), clamp(K,0.7,1.2))}
        ${bolt(F(tailHoodX-tailHoodW+clamp(K*5,3,7)+clamp(K*2,1,3)), F(h_cy+clamp(K*4,2,5)), clamp(K,0.7,1.2))}${bolt(F(tailHoodX-tailHoodW+clamp(K*5,3,7)+clamp(K*8,5,11)), F(h_cy+clamp(K*4,2,5)), clamp(K,0.7,1.2))}
        <!-- 检修门把手 -->
        <rect x="${F(tailHoodX-tailHoodW+clamp(K*5,3,7)+clamp(K*10,6,14)*0.82)}" y="${F(h_cy-clamp(K*2.5,1.5,3.5))}" width="${F(clamp(K*1.6,1,2.2))}" height="${F(clamp(K*5,3,7))}" rx="0.8" fill="#9aa2bc" opacity="0.8"/>`;

      // 12. 窑头罩（右端）+ 出料溜槽
      // 罩宽按 w 比例化（默认尺寸 w=380 时外观不变），保证燃烧器管口比例恒定
      const headHoodW=w*(28/380), headHoodX=h_drumR;
      // 出料溜管：从窑头罩底部斜45°接出，末段水平到右边缘端口
      const outletPipeCY = h*outletCYRatio;
      const outletPipeH = clamp(h_R*0.42, 6, 18);
      const outletPipeY = outletPipeCY - outletPipeH/2;
      // 窑头罩底边参数
      const hoodBotLx = headHoodX, hoodBotLy = h_cy+h_R*1.1;
      const hoodBotRx = headHoodX+headHoodW, hoodBotRy = h_cy+h_R*0.8;
      const hoodBotSlope = (hoodBotRy-hoodBotLy)/(hoodBotRx-hoodBotLx);
      const hoodBotYat = (x)=> hoodBotLy + hoodBotSlope*(x-hoodBotLx);
      // 溜槽开口在罩底
      const chuteOpenL = headHoodX+headHoodW-clamp(K*12, 6, 18);
      const chuteOpenR = headHoodX+headHoodW-clamp(K*1, 0.5, 2);
      const chuteOpenLy = hoodBotYat(chuteOpenL);
      const chuteOpenRy = hoodBotYat(chuteOpenR);
      // 斜溜段到水平管转接点
      const chuteElbowX = headHoodX+headHoodW+clamp(K*18, 10, 26);
      const chuteElbowY = outletPipeY;
      // 水平管长度
      const horizPipeLen = w - chuteElbowX;
      const outletFlangeW = clamp(K*5, 3, 7);
      const headHood = `
        <path d="M ${headHoodX} ${h_cy-h_R*1.1} L ${headHoodX+headHoodW} ${h_cy-h_R*0.8} L ${headHoodX+headHoodW} ${h_cy+h_R*0.8} L ${headHoodX} ${h_cy+h_R*1.1} Z" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.3"/>
        <path d="M ${headHoodX+3} ${h_cy-h_R*1.0} L ${headHoodX+headHoodW-2} ${h_cy-h_R*0.75} L ${headHoodX+headHoodW-2} ${h_cy+h_R*0.75} L ${headHoodX+3} ${h_cy+h_R*1.0} Z" fill="#12162b" opacity="0.5"/>
        <circle cx="${F(headHoodX+headHoodW/2)}" cy="${F(h_cy-h_R*0.2)}" r="${F(clamp(K*4,2,6))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.8"/>
        <circle cx="${F(headHoodX+headHoodW/2)}" cy="${F(h_cy-h_R*0.2)}" r="${F(clamp(K*2.5,1.5,4))}" fill="#ff6020" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.2s" repeatCount="indefinite"/></circle>
        <!-- 观察孔铰链把手 -->
        <line x1="${F(headHoodX+headHoodW/2+clamp(K*4.5,2,6))}" y1="${F(h_cy-h_R*0.2)}" x2="${F(headHoodX+headHoodW/2+clamp(K*7,3.5,9))}" y2="${F(h_cy-h_R*0.2)}" stroke="#9aa2bc" stroke-width="0.8" stroke-linecap="round"/>
        ${Array.from({length:8}).map((_,i)=>`<line x1="${F(headHoodX)}" y1="${F(h_cy-h_R+i*(h_R*2/7))}" x2="${F(headHoodX+clamp(K*6,2,10))}" y2="${F(h_cy-h_R+i*(h_R*2/7)+1)}" stroke="#5b6280" stroke-width="0.6" opacity="0.4"/>`).join('')}
        <!-- 燃烧器接口（窑头罩正面中心） -->
        <rect x="${F(headHoodX+headHoodW)}" y="${F(h_cy-h_R*0.35)}" width="${F(clamp(K*6,3,9))}" height="${F(h_R*0.7)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <!-- 斜溜槽：从罩底开口斜向下到弯头 -->
        <path d="M ${chuteOpenL} ${chuteOpenLy} L ${chuteOpenR} ${chuteOpenRy} L ${F(chuteElbowX+clamp(K*2,1,3))} ${chuteElbowY} L ${F(chuteElbowX+clamp(K*2,1,3))} ${F(chuteElbowY+outletPipeH)} L ${F(chuteOpenL-clamp(K*4,2,6))} ${F(chuteOpenLy+outletPipeH-clamp(K*2,1,3))} Z" fill="url(#${rkMetalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <!-- 水平出料管（弯头到右边缘） -->
        <rect x="${chuteElbowX}" y="${outletPipeY}" width="${horizPipeLen}" height="${outletPipeH}" fill="url(#${rkMetalVId})" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(chuteElbowX+clamp(K*2,1,3))}" y="${F(outletPipeY+clamp(K*2,1,3))}" width="${F(Math.max(0,horizPipeLen-clamp(K*5,3,7)))}" height="${F(clamp(K*2,1,2.5))}" fill="#5b6280" opacity="0.3"/>
        <!-- 端部法兰 -->
        <rect x="${F(w-outletFlangeW)}" y="${F(outletPipeY-clamp(K*2,1,3))}" width="${F(outletFlangeW)}" height="${F(outletPipeH+2*clamp(K*2,1,3))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        ${boltPair(w-outletFlangeW/2, outletPipeY+outletPipeH/2, outletPipeH-clamp(K*2,1,3), clamp(K,0.7,1.2))}`;

      // 13. 燃烧器/喷煤管（管长取原设计的 1/2，小车在地面轨道上支撑）
      const burnerX=headHoodX+headHoodW+w*(6/380);   // 管身左端（对接窑头罩）
      const burnerEndX=w*fuelXRatio;                 // 管端法兰外沿 = fuel 端口 x
      const burnerLen=burnerEndX-burnerX;            // 管长由端口锚点反推（默认尺寸≈原设计的 1/2）
      // 燃烧器管径 / 端法兰 / 小车定尺（clamp 比例 × 特征尺寸）
      const burnerR   = clamp(h_R*0.17, 3, 8);
      const burnFlW   = clamp(K*5, 3, 7);
      const burnFlH   = clamp(burnerR*2.8, 6, 16);
      const carX = burnerX + burnerLen - clamp(K*8, 4, 12);
      const carY = baseY - clamp(K*22, 10, 34);
      const carHalf = clamp(K*9, 5, 15), carWheelR = clamp(K*3, 1.6, 5);
      const trackHalf = clamp(K*16, 8, 26), trackY = carY + clamp(K*8, 4, 12);
      const trackH = clamp(K*3, 1.5, 5), carH = clamp(K*4, 2, 7);
      const colHalf = clamp(K*2, 1, 3.5), colTop = h_cy + clamp(K*5, 2, 8);
      const burnerCar = `
        <!-- 轨道 -->
        <rect x="${F(carX-trackHalf)}" y="${F(trackY)}" width="${F(trackHalf*2)}" height="${F(trackH)}" rx="1" fill="#0c1020" stroke="#6a7192" stroke-width="0.5"/>
        <!-- 移动小车 -->
        <rect x="${F(carX-carHalf)}" y="${F(carY)}" width="${F(carHalf*2)}" height="${F(carH)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.6"/>
        <circle cx="${F(carX-carHalf*0.55)}" cy="${F(carY+carH)}" r="${F(carWheelR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <circle cx="${F(carX+carHalf*0.55)}" cy="${F(carY+carH)}" r="${F(carWheelR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <circle cx="${F(carX-carHalf*0.55)}" cy="${F(carY+carH)}" r="${F(clamp(K,0.6,1.5))}" fill="${c}" opacity="0.4"/>
        <circle cx="${F(carX+carHalf*0.55)}" cy="${F(carY+carH)}" r="${F(clamp(K,0.6,1.5))}" fill="${c}" opacity="0.4"/>
        <!-- 支撑立柱 -->
        <rect x="${F(carX-colHalf)}" y="${F(colTop)}" width="${F(colHalf*2)}" height="${F(Math.max(1,carY-colTop))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>`;
      const burner = `
        <!-- 燃烧器主体管（管体延至端部法兰，管端法兰外沿即 fuel 端口） -->
        <rect x="${F(burnerX-burnerR)}" y="${F(h_cy-burnerR)}" width="${F(burnerLen+burnerR)}" height="${F(burnerR*2)}" rx="${F(clamp(burnerR*0.4,1,3))}" fill="url(#${rkMetalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${F(burnerEndX-burnFlW)}" y="${F(h_cy-burnFlH/2)}" width="${F(burnFlW)}" height="${F(burnFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        ${boltPair(F(burnerEndX-burnFlW/2), F(h_cy), F(burnFlH*0.72), F(clamp(K*1.2,0.7,1.5)))}
        <ellipse cx="${F(burnerX-burnerR*0.6)}" cy="${F(h_cy)}" rx="${F(burnerR*0.6)}" ry="${F(burnerR*1.2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
        <circle cx="${F(burnerX+burnerLen*0.35)}" cy="${F(h_cy)}" r="${F(clamp(K*2.5,1.5,4))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.5"/>`;

      // 14. 火焰（焰长/焰径随筒体尺寸缩放，外橙焰 + 内黄焰 + 焰芯三层叠加）
      const flameStartX = h_drumR - h_drumW*0.02;   // 焰根：筒体右端（窑头侧）内侧
      const flameLen = h_drumW*0.42;                // 火焰总长
      const flameR = h_R*0.48;                      // 焰根半径
      let flames = '';
      // 外焰（橙红）
      for(let fi=0;fi<3;fi++){
        const fBaseY=h_cy+(fi-1)*h_R*0.1, fDelay=-(fi*0.4).toFixed(2);
        let fl=[], ft=[], fr=[], fo=[];
        for(let k=0;k<=16;k++){
          const t=k/16;
          fl.push((flameStartX-t*flameLen-Math.sin(t*4+fi)*flameLen*0.04).toFixed(1));
          ft.push((fBaseY+Math.sin(t*3+fi*1.5)*flameR*0.4*(1-t*0.5)).toFixed(1));
          fr.push((flameR-t*flameR*0.7).toFixed(1)); fo.push((0.85-t*0.68).toFixed(2));
        }
        flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.7}" fill="#ff6a10" opacity="${fo[0]}" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${fl.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ft.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${fr.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fo.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }
      // 内焰（亮黄）
      for(let fi=0;fi<2;fi++){
        const fBaseY=h_cy+(fi-0.5)*h_R*0.08, fDelay=-(fi*0.3+0.2).toFixed(2);
        let fl=[], ft=[], fr=[], fo=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          fl.push((flameStartX-t*flameLen*0.72-Math.sin(t*5+fi)*flameLen*0.03).toFixed(1));
          ft.push((fBaseY+Math.sin(t*4+fi)*flameR*0.25*(1-t*0.4)).toFixed(1));
          fr.push((flameR*0.55-t*flameR*0.38).toFixed(1)); fo.push((0.95-t*0.7).toFixed(2));
        }
        flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.6}" fill="#ffdd44" opacity="${fo[0]}" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${fl.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ft.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${fr.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fo.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }
      // 焰芯（近白，跳动最快）
      {
        const fDelay='-0.1';
        let fl=[], ft=[], fr=[], fo=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          fl.push((flameStartX-t*flameLen*0.42-Math.sin(t*6)*flameLen*0.02).toFixed(1));
          ft.push((h_cy+Math.sin(t*4)*flameR*0.12).toFixed(1));
          fr.push((flameR*0.3-t*flameR*0.22).toFixed(1)); fo.push((1-t*0.75).toFixed(2));
        }
        flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.75}" fill="#fff6c8" opacity="${fo[0]}" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${fl.join(';')}" dur="1.1s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ft.join(';')}" dur="1.1s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${fr.join(';')}" dur="1.1s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fo.join(';')}" dur="1.1s" begin="${fDelay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }

      // 15. 物料颗粒
      const matAmp = clamp(K*2, 1, 4), matR0 = clamp(K*1.2, 0.8, 2), matRd = clamp(K*0.4, 0.25, 0.8);
      let materialParticles = '';
      for(let i=0;i<12;i++){
        const delay=-(i/12*8).toFixed(2);
        let px=[], py=[], pR=[];
        for(let k=0;k<=32;k++){
          const t=k/32, x=h_drumL+matInset+t*(h_drumW-2*matInset);
          const rotPhase=(t*3.5)%1;
          let bedY;
          if(rotPhase<0.55) bedY=h_cy+h_R*0.55;
          else if(rotPhase<0.85){const lt=(rotPhase-0.55)/0.3; bedY=h_cy+h_R*0.55-h_R*0.5*Math.sin(lt*Math.PI);}
          else{const ft=(rotPhase-0.85)/0.15; bedY=h_cy+h_R*0.55-h_R*0.3+ft*h_R*0.3;}
          px.push(x.toFixed(1)); py.push((bedY+Math.sin(t*8+i)*matAmp).toFixed(1)); pR.push((matR0+Math.sin(t*6)*matRd).toFixed(1));
        }
        materialParticles += `<circle cx="${px[0]}" cy="${py[0]}" r="${pR[0]}" fill="${c}" opacity="0.7" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${px.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${py.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${pR.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 16. 热辐射+高温带（须绘制在筒体之上才可见：窑头红热段 + 焰根辉光）
      const heatGlow = `
        <rect x="${h_drumR-h_drumW*0.42}" y="${F(h_drumTop+tubeInset)}" width="${h_drumW*0.37}" height="${F(h_R*2-2*tubeInset)}" rx="${F(h_R*0.2)}" ry="${F(Math.max(1,h_R-tubeInset))}" fill="#ff4a10" opacity="0.18" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="opacity" values="0.12;0.26;0.12" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <ellipse cx="${flameStartX}" cy="${h_cy}" rx="${flameR*1.2}" ry="${flameR*0.95}" fill="#ffa040" opacity="0.35" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="opacity" values="0.2;0.45;0.2" dur="1.1s" repeatCount="indefinite"/>
        </ellipse>`;

      // 17. 传动系统（小齿轮+减速机+电机）
      const h_pinionR=pinionR, h_pinionY=h_cy;
      const driveGap   = clamp(K*2, 1, 3);          // 齿圈外缘 → 小齿轮
      const reducerGap = clamp(K*6, 3, 9);          // 小齿轮轴 → 减速机
      const driveDrop  = clamp(K*15, 8, 24);        // 传动轴线相对筒体中心的抬高
      const h_pinionX=h_gearX+h_gearW/2+h_pinionR+driveGap;
      const h_reducerW=clamp(K*28, 14, 46), h_reducerH=clamp(K*22, 12, 38);
      const h_reducerX=h_pinionX+h_pinionR+reducerGap;
      const h_motorGap=clamp(K*2,1,3);
      const h_motorX=h_reducerX+h_reducerW+h_motorGap;
      // 横向封顶（步骤 4.4）：电机右沿不越出画布
      const h_motorW=Math.min(clamp(K*34, 18, 56), Math.max(8, (w-1)-h_motorX));
      const h_motorH=clamp(K*20, 11, 34);
      // 竖向封顶（步骤 4.3）：驱动底座底沿夹在基础线内
      const driveBaseH=clamp(K*5, 3, 8);
      const h_reducerY=Math.min(h_pinionY-h_reducerH/2+h_R+driveDrop, baseY-h_reducerH-driveBaseH);
      const h_motorY  =Math.min(h_pinionY-h_motorH/2+h_R+driveDrop, baseY-h_motorH-driveBaseH);
      const pinBoltR=clamp(K,0.6,1.3), pinBoltOff=clamp(pinionR*0.57,2,6);
      const capR=clamp(K*4,2.5,7), driveBoltR=clamp(K*1.1,0.6,1.4);
      const h_driveSystem = `
        <g>
          <animateTransform attributeName="transform" type="rotate" from="360 ${F(h_pinionX)} ${F(h_pinionY)}" to="0 ${F(h_pinionX)} ${F(h_pinionY)}" dur="${(rotDur/(h_gearR/h_pinionR)).toFixed(2)}s" repeatCount="indefinite"/>
          <circle cx="${F(h_pinionX)}" cy="${F(h_pinionY)}" r="${F(h_pinionR)}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.3"/>
          <circle cx="${F(h_pinionX)}" cy="${F(h_pinionY)}" r="${F(h_pinionR*0.28)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
          ${Array.from({length:6}).map((_,i)=>{const sa=i*60*Math.PI/180;return `<line x1="${F(h_pinionX)}" y1="${F(h_pinionY)}" x2="${F(h_pinionX+Math.cos(sa)*h_pinionR*0.7)}" y2="${F(h_pinionY+Math.sin(sa)*h_pinionR*0.7)}" stroke="#9aa2bc" stroke-width="0.8" opacity="0.4"/>`;}).join('')}
        </g>
        <rect x="${F(h_pinionX-h_pinionR)}" y="${F(h_pinionY+h_pinionR)}" width="${F(h_pinionR*2)}" height="${F(clamp(pinionR*1.14,5,14))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${bolt(F(h_pinionX-pinBoltOff), F(h_pinionY+h_pinionR+pinBoltOff), F(pinBoltR))}${bolt(F(h_pinionX+pinBoltOff), F(h_pinionY+h_pinionR+pinBoltOff), F(pinBoltR))}
        <rect x="${F(h_reducerX)}" y="${F(h_reducerY)}" width="${F(h_reducerW)}" height="${F(h_reducerH)}" rx="${F(clamp(K*3,1.5,5))}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.1"/>
        <line x1="${F(h_pinionX+h_pinionR)}" y1="${F(h_pinionY)}" x2="${F(h_reducerX)}" y2="${F(h_reducerY+h_reducerH/2)}" stroke="#9aa2bc" stroke-width="1.3"/>
        <!-- 联轴器护罩（小齿轮轴 → 减速机输入端） -->
        <rect x="${F(h_reducerX-clamp(K*7,4,10))}" y="${F(h_reducerY+h_reducerH/2-clamp(h_R*0.22,2.5,5))}" width="${F(clamp(K*8,5,12))}" height="${F(clamp(h_R*0.44,5,10))}" rx="1.2" fill="#5b6280" opacity="0.45" stroke="#9aa2bc" stroke-width="0.5"/>
        <circle cx="${F(h_reducerX+h_reducerW/2)}" cy="${F(h_reducerY+h_reducerH/2)}" r="${F(capR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <text x="${F(h_reducerX+h_reducerW/2)}" y="${F(h_reducerY+h_reducerH/2+clamp(K*2,1,3))}" text-anchor="middle" fill="${c}" font-size="${F(clamp(K*3.8,3,6))}" opacity="0.6">ZSY</text>
        <rect x="${F(h_reducerX-clamp(K*3,1.5,5))}" y="${F(h_reducerY+h_reducerH)}" width="${F(h_reducerW+2*clamp(K*3,1.5,5))}" height="${F(driveBaseH)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
        ${bolt(F(h_reducerX+clamp(K*1,0.6,1.5)), F(h_reducerY+h_reducerH+driveBaseH*0.5), F(driveBoltR))}${bolt(F(h_reducerX+h_reducerW-clamp(K*1,0.6,1.5)), F(h_reducerY+h_reducerH+driveBaseH*0.5), F(driveBoltR))}
        <rect x="${F(h_motorX)}" y="${F(h_motorY)}" width="${F(h_motorW)}" height="${F(h_motorH)}" rx="${F(clamp(K*4,2.5,7))}" fill="url(#${rkMetalId})" stroke="#3f445c" stroke-width="1.2"/>
        <ellipse cx="${F(h_motorX+h_motorW)}" cy="${F(h_motorY+h_motorH/2)}" rx="${F(h_motorH/2+clamp(K*2,1,3))}" ry="${F(h_motorH/2+clamp(K*1,0.6,2))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        ${Array.from({length:4}).map((_,i)=>{const va=-Math.PI/2+(i-1.5)*0.4;const vrad=clamp(h_motorH/2-3,1,12);const vx=h_motorX+h_motorW+Math.cos(va)*vrad;const vy=h_motorY+h_motorH/2+Math.sin(va)*vrad;return `<circle cx="${F(vx)}" cy="${F(vy)}" r="${F(clamp(K,0.7,1.4))}" fill="#0c1020" opacity="0.5"/>`;}).join('')}
        <line x1="${F(h_reducerX+h_reducerW)}" y1="${F(h_reducerY+h_reducerH/2)}" x2="${F(h_motorX)}" y2="${F(h_motorY+h_motorH/2)}" stroke="#9aa2bc" stroke-width="1.3"/>
        ${Array.from({length:5}).map((_,i)=>{const mo=clamp(K*4,2,6);const mx=h_motorX+mo+i*((h_motorW-2*mo)/4);const mvs=clamp(K*3,1.5,4);return `<line x1="${F(mx)}" y1="${F(h_motorY+mvs)}" x2="${F(mx)}" y2="${F(h_motorY+h_motorH-mvs)}" stroke="#5b6280" stroke-width="0.4" opacity="0.3"/>`;}).join('')}
        <rect x="${F(h_motorX+h_motorW*0.35)}" y="${F(h_motorY-clamp(K*6,3,9))}" width="${F(h_motorW*0.28)}" height="${F(clamp(K*7,4,11))}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <rect x="${F(h_motorX)}" y="${F(h_motorY+h_motorH)}" width="${F(h_motorW)}" height="${F(driveBaseH)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>
        ${bolt(F(h_motorX+clamp(K*4,2,6)), F(h_motorY+h_motorH+driveBaseH*0.5), F(driveBoltR))}${bolt(F(h_motorX+h_motorW-clamp(K*4,2,6)), F(h_motorY+h_motorH+driveBaseH*0.5), F(driveBoltR))}`;

      // 18. 测温点
      const instR=clamp(K*2.5,1.5,4), instGap=clamp(K*2,1.2,3.5), instStem=clamp(K*4,2,6);
      const instruments = [0.25,0.5,0.75].map(t=>{
        const tx=h_drumL+h_drumW*t;
        return `<circle cx="${F(tx)}" cy="${F(h_drumTop-instGap)}" r="${F(instR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/><line x1="${F(tx)}" y1="${F(h_drumTop)}" x2="${F(tx)}" y2="${F(h_drumTop-instStem)}" stroke="#9aa2bc" stroke-width="0.6"/>`;
      }).join('')+`<circle cx="${F(headHoodX+headHoodW-clamp(K*5,3,7))}" cy="${F(h_cy-h_R*0.7)}" r="${F(clamp(K*2,1.3,3.5))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>`;

      // 19. 烟气粒子（自顶部法兰上沿向上飘散，顶封顶：不越 y=0）
      let flueParticles = '';
      const flueStartY = flueTopY;
      const flueRise = Math.max(4, flueStartY - clamp(K*8, 4, 12));
      const flueAmp = clamp(K*4, 2, 7), flueR0 = clamp(K*2, 1.2, 3);
      for(let i=0;i<6;i++){
        const delay=-(i*0.7).toFixed(2), sx=fluePipeCX;
        let spx=[], spy=[], spr=[], spo=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          spx.push((sx+Math.sin(t*3+i)*flueAmp).toFixed(1)); spy.push((Math.max(1, flueStartY-t*flueRise)).toFixed(1));
          spr.push((flueR0+t*flueR0).toFixed(1)); spo.push((0.4-t*0.3).toFixed(2));
        }
        flueParticles += `<ellipse cx="${spx[0]}" cy="${spy[0]}" rx="${spr[0]}" ry="${spr[0]*1.3}" fill="${c}" opacity="${spo[0]}">
          <animate attributeName="cx" values="${spx.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${spy.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${spr.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${spo.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }

      // 20. 铭牌（保留原设计；尺寸随画布 clamp，锚到筒体左段下方以避开传动 / 基础墩；底沿不越基础线）
      const plateFs = clamp(h*0.022, 3, 6.5);
      const plateW  = clamp(Math.min(plateFs*8, w*0.35), 20, 60);
      const plateH  = clamp(plateFs*3.5, 8, 20);
      const plateX  = clamp(h_drumL + h_drumW*0.16 - plateW/2, 1, Math.max(1, w-plateW-1));
      const plateY  = clamp(baseY - plateH - clamp(K*4, 2, 6), 1, Math.max(1, h-plateH-1));
      const plateCX = plateX + plateW/2;
      const nameplate = `
        <rect x="${F(plateX)}" y="${F(plateY)}" width="${F(plateW)}" height="${F(plateH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <rect x="${F(plateX+1)}" y="${F(plateY+1)}" width="${F(plateW-2)}" height="${F(plateH-2)}" fill="#12162b"/>
        <text x="${F(plateCX)}" y="${F(plateY+plateH*0.42)}" text-anchor="middle" fill="${c}" font-size="${F(plateFs)}" font-weight="bold" opacity="0.8">Φ3.5×54m</text>
        <text x="${F(plateCX)}" y="${F(plateY+plateH*0.82)}" text-anchor="middle" fill="${c}" font-size="${F(plateFs*0.8)}" opacity="0.6">回转窑</text>
        <circle cx="${F(plateX+plateW*0.12)}" cy="${F(plateY+plateH*0.25)}" r="${F(clamp(plateH*0.06,0.6,1.2))}" fill="${c}" opacity="0.5"/>
        <circle cx="${F(plateX+plateW*0.88)}" cy="${F(plateY+plateH*0.25)}" r="${F(clamp(plateH*0.06,0.6,1.2))}" fill="${c}" opacity="0.5"/>`;

      return `
        ${metalDef}${metalVDef}${drumShade}${tempGrad}${tempBaseDef}${clipDef}${clipDefInner}
        ${foundations}
        ${tailHood}${flueParticles}
        ${trunnions}${h_thrustWheel}
        ${burnerCar}
        ${drumBody}${tempBase}${tempOverlay}${weldRings}${tires}${h_girthGear}
        ${heatGlow}${refractory}${flights}${materialParticles}${flames}
        ${rotMarks}${ringBolts}
        ${h_driveSystem}
        ${headHood}${burner}${instruments}${nameplate}
      `;
    }
};
