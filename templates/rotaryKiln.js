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
      const c = p.color;
      const rotDur = 6;
      // 水平筒体参数
      const h_drumL = w*0.12;
      const h_drumR = w*0.84;
      const h_drumW = h_drumR - h_drumL;
      const h_cy = h*0.55;
      const h_R = h*0.16;
      const h_drumTop = h_cy - h_R;
      const h_clipId = `clip_kiln_${Math.random().toString(36).substr(2,6)}`;
      const h_clipIdInner = `clip_kiln_in_${Math.random().toString(36).substr(2,6)}`;
      const kilnShadeId = `kiln_shade_${Math.random().toString(36).substr(2,6)}`;
      const kilnTempGradId = `kiln_temp_${Math.random().toString(36).substr(2,6)}`;
      const baseY = h*0.94;
      
      const bolt = (bx,by,r=1.5)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#0d0b20" stroke="${c}" stroke-width="0.5"/><circle cx="${bx}" cy="${by}" r="${r*0.4}" fill="${c}" opacity="0.5"/>`;
      const boltPair = (bx,by,dist=5,r=1.3)=>bolt(bx,by-dist/2,r)+bolt(bx,by+dist/2,r);

      // 1. 混凝土基础底座（减速机/电机/托轮下方3个墩）
      // 窑尾侧托轮组已移除，其下方底座墩一并删除，避免留下悬空的孤立底座
      let foundations = '';
      const foundXs = [
        {x:h_drumL+h_drumW*0.42, w:36},
        {x:h_drumL+h_drumW*0.55, w:44},
        {x:h_drumL+h_drumW*0.72, w:44}
      ];
      const fTop = h_cy + h_R + 28;
      foundXs.forEach(({x:fx,w:fW})=>{
        foundations += `
          <rect x="${fx-fW/2}" y="${fTop}" width="${fW}" height="${baseY-fTop}" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
          <rect x="${fx-fW/2+2}" y="${fTop+2}" width="${fW-4}" height="${baseY-fTop-4}" fill="#12102a" opacity="0.5"/>
          <line x1="${fx-fW/2+4}" y1="${fTop+10}" x2="${fx+fW/2-4}" y2="${fTop+10}" stroke="${c}" stroke-width="0.4" opacity="0.3"/>
          <line x1="${fx-fW/2+4}" y1="${fTop+20}" x2="${fx+fW/2-4}" y2="${fTop+20}" stroke="${c}" stroke-width="0.4" opacity="0.2"/>
          ${bolt(fx-fW/2+5, baseY-2, 1.2)}
          ${bolt(fx+fW/2-5, baseY-2, 1.2)}`;
      });

      // 2. 托轮组（2组）
      const trunnionR = 9;
      const h_tire1X = h_drumL + h_drumW*0.22;
      const h_tire2X = h_drumL + h_drumW*0.72;
      const drawTrunnionSet = (tx)=>{
        const contactAngle = 30*Math.PI/180;
        const trunnionOffset = (h_R + 8) * Math.sin(contactAngle) * 0.85;
        const trunnionCY = h_cy + h_R + 10;
        const drawWheel = (wx, wy, dir)=>{
          let spokes = '';
          for(let i=0;i<5;i++){
            const sa=i*72*Math.PI/180;
            spokes += `<line x1="${wx}" y1="${wy}" x2="${(wx+Math.cos(sa)*trunnionR*0.55).toFixed(1)}" y2="${(wy+Math.sin(sa)*trunnionR*0.55).toFixed(1)}" stroke="${c}" stroke-width="0.9" opacity="0.4"/>`;
          }
          const bearH = 8, bearW = 14;
          return `<g>
            <animateTransform attributeName="transform" type="rotate" from="${dir>0?0:360} ${wx} ${wy}" to="${dir>0?360:0} ${wx} ${wy}" dur="${rotDur*1.2}s" repeatCount="indefinite"/>
            <circle cx="${wx}" cy="${wy}" r="${trunnionR}" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
            <circle cx="${wx}" cy="${wy}" r="${trunnionR*0.25}" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
            ${spokes}
            <circle cx="${wx}" cy="${wy}" r="2" fill="${c}" opacity="0.6"/>
          </g>
          <rect x="${wx-bearW/2}" y="${wy+trunnionR}" width="${bearW}" height="${bearH}" fill="#151330" stroke="${c}" stroke-width="0.9"/>
          ${bolt(wx-bearW/2+2, wy+trunnionR+bearH/2, 1.1)}
          ${bolt(wx+bearW/2-2, wy+trunnionR+bearH/2, 1.1)}
          <rect x="${wx-bearW/2-2}" y="${wy+trunnionR+bearH}" width="${bearW+4}" height="4" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>`;
        };
        return drawWheel(tx-trunnionOffset, trunnionCY, 1) + drawWheel(tx+trunnionOffset, trunnionCY, -1);
      };
      // 按需求移除窑尾侧（左侧）托轮组，仅保留窑头侧一组
      const trunnions = drawTrunnionSet(h_tire2X);

      // 3. 挡轮
      const h_thrustX = h_drumL + h_drumW*0.42;
      const h_thrustWheel = `
        <g>
          <circle cx="${h_thrustX+12}" cy="${h_cy}" r="7" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
          <circle cx="${h_thrustX+12}" cy="${h_cy}" r="3" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
          <rect x="${h_thrustX+5}" y="${h_cy+7}" width="14" height="8" fill="#151330" stroke="${c}" stroke-width="0.8"/>
          ${bolt(h_thrustX+8, h_cy+11, 1)}
          ${bolt(h_thrustX+16, h_cy+11, 1)}
        </g>`;

      // 4. 渐变和ClipPath
      const drumShade = `<linearGradient id="${kilnShadeId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a1a25"/>
        <stop offset="20%" stop-color="#3d2535"/>
        <stop offset="50%" stop-color="#4a3040"/>
        <stop offset="80%" stop-color="#3d2535"/>
        <stop offset="100%" stop-color="#2a1a25"/>
      </linearGradient>`;
      // 温度渐变（测温点 → 颜色锚点，从左到右）
      const tempPoints = (p.tempPoints && p.tempPoints.length) ? p.tempPoints : [];
      const tempGrad = tempPoints.length ? `<linearGradient id="${kilnTempGradId}" x1="0" y1="0" x2="1" y2="0" class="kiln-temp-grad">${tempPoints.map((pt,i)=>`<stop class="kiln-temp-stop" data-kidx="${i}" offset="${((i/(tempPoints.length-1||1))*100).toFixed(1)}%" stop-color="#9C99FF"/>`).join('')}</linearGradient>` : '';
      const tempOverlay = tempPoints.length ? `<rect class="kiln-temp-overlay" x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}" fill="url(#${kilnTempGradId})" opacity="0.55" clip-path="url(#${h_clipId})"/>` : '';
      const clipDef = `<clipPath id="${h_clipId}"><rect x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}"/></clipPath>`;
      const clipDefInner = `<clipPath id="${h_clipIdInner}"><rect x="${h_drumL+5}" y="${h_drumTop+5}" width="${h_drumW-10}" height="${h_R*2-10}" rx="${h_R*0.2}" ry="${h_R-5}"/></clipPath>`;

      // 5. 筒体主体
      const drumBody = `
        <rect x="${h_drumL}" y="${h_drumTop}" width="${h_drumW}" height="${h_R*2}" rx="${h_R*0.25}" ry="${h_R}" fill="url(#${kilnShadeId})" stroke="${c}" stroke-width="1.8"/>
        <rect x="${h_drumL+3}" y="${h_drumTop+2}" width="${h_drumW-6}" height="${h_R*0.4}" rx="${h_R*0.2}" ry="${h_R*0.4}" fill="rgba(255,200,150,0.06)"/>
        <ellipse cx="${h_drumL}" cy="${h_cy}" rx="${h_R*0.3}" ry="${h_R}" fill="#2a1f30" stroke="${c}" stroke-width="1.2" opacity="0.7"/>
        <ellipse cx="${h_drumR}" cy="${h_cy}" rx="${h_R*0.3}" ry="${h_R}" fill="#2a1f30" stroke="${c}" stroke-width="1.2" opacity="0.7"/>`;

      // 6. 轮带（齿轮转盘样式：带齿旋转动画）
      const tireW = 16;
      const tTeethCount = 40;
      const tGearR = h_R + 5;
      const tToothH = 4;
      const tOuterRx = tireW/2+1;
      const tInnerRx = tireW/2-2;
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
          tTeeth += `<polygon fill="#252545" stroke="${c}" stroke-width="0.4" points="${tPts[0]}" opacity="${tOp[0]}" clip-path="url(#${h_clipId})">
            <animate attributeName="points" values="${tPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${tOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </polygon>`;
        }
        return `<ellipse cx="${tx}" cy="${h_cy}" rx="${tOuterRx}" ry="${tGearR}" fill="#1a1835" stroke="${c}" stroke-width="1.4"/>
          <ellipse cx="${tx}" cy="${h_cy}" rx="${tInnerRx}" ry="${tGearR-5}" fill="#12102a" stroke="${c}" stroke-width="0.7" opacity="0.5"/>
          <ellipse cx="${tx}" cy="${h_cy - h_R*0.7}" rx="${tInnerRx}" ry="${h_R*0.2}" fill="rgba(255,255,255,0.08)"/>
          ${tTeeth}`;
      };
      const tires = drawTire(h_tire1X) + drawTire(h_tire2X);

      // 7. 焊缝环
      let weldRings = '';
      for(let i=1;i<=9;i++){
        const wx = h_drumL + h_drumW*i/10;
        weldRings += `<ellipse cx="${wx}" cy="${h_cy}" rx="2.5" ry="${h_R-1}" fill="none" stroke="${c}" stroke-width="0.9" opacity="0.3"/>`;
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
        return `<rect x="${h_drumL+8}" y="${yVals[0]}" width="${h_drumW-16}" height="${sw}" rx="${sw/2}" fill="${color}" clip-path="url(#${h_clipId})">
          <animate attributeName="y" values="${yVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </rect>`;
      };
      rotMarks += makeKilnStrip(0, 5, '#e07040', 0.5);
      rotMarks += makeKilnStrip(0.35, 2, '#fff', 0.2);
      rotMarks += makeKilnStrip(0.65, 3, c, 0.4);
      rotMarks += makeKilnStrip(0.85, 1.5, '#ff9060', 0.3);

      // 焊缝螺栓点
      let ringBolts = '';
      for(let ri=1;ri<=9;ri++){
        const wx=h_drumL+h_drumW*ri/10;
        for(let i=0;i<4;i++){
          const phase=i/4, delay=-(phase*rotDur).toFixed(2);
          let cyv=[], opv=[];
          for(let k=0;k<=16;k++){
            const ang=((k/16)+phase)*2*Math.PI, front=Math.cos(ang);
            cyv.push((h_cy+(h_R-2)*Math.sin(ang)).toFixed(1));
            opv.push(front>0?(0.2+0.4*front).toFixed(2):'0');
          }
          ringBolts += `<circle cx="${wx.toFixed(1)}" cy="${cyv[0]}" r="1.3" fill="${c}" clip-path="url(#${h_clipId})" opacity="${opv[0]}">
            <animate attributeName="cy" values="${cyv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle>`;
        }
      }

      // 9. 耐火砖衬里
      const refractory = `
        <rect x="${h_drumL+4}" y="${h_drumTop+4}" width="${h_drumW-8}" height="${h_R*2-8}" rx="${h_R*0.2}" ry="${h_R-4}" fill="none" stroke="#8B4513" stroke-width="3" opacity="0.3" clip-path="url(#${h_clipIdInner})"/>
        ${Array.from({length:8}).map((_,i)=>{
          const wx=h_drumL+8+i*(h_drumW-16)/7;
          return `<ellipse cx="${wx.toFixed(1)}" cy="${h_cy}" rx="2" ry="${h_R-6}" fill="none" stroke="#6B3510" stroke-width="0.8" opacity="0.25" clip-path="url(#${h_clipIdInner})"/>`;
        }).join('')}`;

      // 扬料板
      let flights = '';
      for(let fi=0;fi<10;fi++){
        const phase=fi/10, delay=-(phase*rotDur).toFixed(2);
        let fy1=[], fy2=[], fOp=[];
        for(let k=0;k<=20;k++){
          const ang=((k/20)+phase)*2*Math.PI;
          fy1.push((h_cy+(h_R-5)*Math.sin(ang)).toFixed(1));
          fy2.push((h_cy+(h_R-5-h_R*0.3)*Math.sin(ang+0.25)).toFixed(1));
          fOp.push(Math.cos(ang)>0?(0.2+0.3*Math.cos(ang)).toFixed(2):'0');
        }
        const fx=h_drumL+h_drumW*0.3+(fi%3-1)*(h_drumW*0.15);
        flights += `<line x1="${fx.toFixed(1)}" x2="${fx.toFixed(1)}" y1="${fy1[0]}" y2="${fy2[0]}" stroke="#8B4513" stroke-width="2" stroke-linecap="round" clip-path="url(#${h_clipIdInner})" opacity="${fOp[0]}">
          <animate attributeName="y1" values="${fy1.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="${fy2.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </line>`;
      }

      // 10. 大齿圈（48齿）
      const gearTeeth=48, h_gearX=h_drumL+h_drumW*0.35, h_gearR=h_R+8, h_gearW=14;
      let h_gearTeeth='';
      for(let i=0;i<gearTeeth;i++){
        const phase=i/gearTeeth, delay=-(phase*rotDur).toFixed(2);
        let gPts=[], gOp=[];
        for(let k=0;k<=12;k++){
          const ang=((k/12)+phase)*2*Math.PI, rx=h_gearW/2, ry=h_gearR, toothH=4, cosA=Math.cos(ang);
          gPts.push(`${(h_gearX+(rx+1)*cosA).toFixed(1)},${(h_cy+ry*Math.sin(ang)).toFixed(1)} ${(h_gearX+(rx+toothH+1)*cosA).toFixed(1)},${(h_cy+(ry+toothH)*Math.sin(ang)).toFixed(1)} ${(h_gearX+(rx-1)*cosA).toFixed(1)},${(h_cy+ry*Math.sin(ang)).toFixed(1)}`);
          gOp.push(cosA>0?'0.75':'0.1');
        }
        h_gearTeeth += `<polygon fill="#252545" stroke="${c}" stroke-width="0.4" points="${gPts[0]}" opacity="${gOp[0]}" clip-path="url(#${h_clipId})">
          <animate attributeName="points" values="${gPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${gOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </polygon>`;
      }
      const h_girthGear = `
        <ellipse cx="${h_gearX}" cy="${h_cy}" rx="${h_gearW/2}" ry="${h_gearR}" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
        <ellipse cx="${h_gearX}" cy="${h_cy}" rx="${h_gearW/2-3}" ry="${h_gearR-5}" fill="#12102a" stroke="${c}" stroke-width="0.7" opacity="0.5"/>
        ${h_gearTeeth}`;

      // 11. 窑尾罩（左端）
      // 罩宽按 w 比例化（默认尺寸 w=380 时外观不变），保证左端口在任意实例尺寸下都贴合罩壁
      const tailHoodW=w*(24/380), tailHoodX=h_drumL;
      // 进料管：水平管从左边缘接入烟室左侧壁
      const inletPipeCY = h_cy - h_R*0.72;
      const inletPipeH = 14;
      const inletPipeY = inletPipeCY - inletPipeH/2;
      const inletPipeEndX = tailHoodX - tailHoodW + 1; // 右端接烟室左壁
      // 烟气管：垂直管从烟室顶面接出，高度为烟室顶到包围盒顶部的一半（法兰位于 h*0.22）
      const fluePipeW = 12;
      const fluePipeCX = w*0.1;
      const fluePipeX = fluePipeCX - fluePipeW/2;
      // 烟室顶面斜边：从(tailHoodX-tailHoodW, h_cy-h_R*0.85)到(tailHoodX, h_cy-h_R*1.1)
      const hoodTopLx = tailHoodX-tailHoodW, hoodTopLy = h_cy-h_R*0.85;
      const hoodTopRx = tailHoodX, hoodTopRy = h_cy-h_R*1.1;
      const hoodTopSlope = (hoodTopRy-hoodTopLy)/(hoodTopRx-hoodTopLx);
      const hoodYat = (x)=> hoodTopLy + hoodTopSlope*(x-hoodTopLx);
      const flueBaseL = fluePipeX-4, flueBaseR = fluePipeX+fluePipeW+4;
      const flueBaseLy = hoodYat(flueBaseL), flueBaseRy = hoodYat(flueBaseR);
      const flueBaseY = Math.max(flueBaseLy, flueBaseRy) + 7; // 垂直管底（锥座顶）
      const flueTopY = h*0.22;  // 管顶法兰上沿：烟囱高度减半（原画到 y=0 顶部）
      const tailHood = `
        <path d="M ${tailHoodX} ${h_cy-h_R*1.1} L ${tailHoodX-tailHoodW} ${h_cy-h_R*0.85} L ${tailHoodX-tailHoodW} ${h_cy+h_R*0.85} L ${tailHoodX} ${h_cy+h_R*1.1} Z" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
        <path d="M ${tailHoodX-3} ${h_cy-h_R*1.0} L ${tailHoodX-tailHoodW+2} ${h_cy-h_R*0.8} L ${tailHoodX-tailHoodW+2} ${h_cy+h_R*0.8} L ${tailHoodX-3} ${h_cy+h_R*1.0} Z" fill="#12102a" opacity="0.5"/>
        <!-- 烟气出口管（锥形底座贴合烟室斜面焊接，垂直管到半高法兰） -->
        <path d="M ${flueBaseL} ${flueBaseLy} L ${fluePipeX} ${flueBaseY} L ${fluePipeX} ${flueTopY+5} L ${fluePipeX+fluePipeW} ${flueTopY+5} L ${fluePipeX+fluePipeW} ${flueBaseY} L ${flueBaseR} ${flueBaseRy} Z" fill="#151330" stroke="${c}" stroke-width="0.9"/>
        <rect x="${fluePipeX+2}" y="${flueTopY+8}" width="3" height="${flueBaseY-flueTopY-10}" fill="rgba(255,255,255,0.05)"/>
        <!-- 顶部法兰 -->
        <rect x="${fluePipeCX-10}" y="${flueTopY}" width="20" height="5" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
        ${boltPair(fluePipeCX, flueTopY+2.5, 12, 1)}
        <!-- 注：左端水平进料管与端部喇叭口已按需求移除；inletPipe* 参数仅用于下方罩内溜槽引导线定位 -->
        <!-- 内部溜槽引导线 -->
        <path d="M ${inletPipeEndX+3} ${inletPipeY+inletPipeH-2} L ${tailHoodX-6} ${h_cy+h_R*0.15}" fill="none" stroke="${c}" stroke-width="0.7" opacity="0.4"/>
        ${Array.from({length:8}).map((_,i)=>`<line x1="${tailHoodX}" y1="${h_cy-h_R+i*(h_R*2/7)}" x2="${tailHoodX-6}" y2="${h_cy-h_R+i*(h_R*2/7)+1}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>`).join('')}
        <rect x="${tailHoodX-tailHoodW+5}" y="${h_cy-6}" width="10" height="12" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
        ${bolt(tailHoodX-tailHoodW+7, h_cy-4, 1)}${bolt(tailHoodX-tailHoodW+13, h_cy-4, 1)}
        ${bolt(tailHoodX-tailHoodW+7, h_cy+4, 1)}${bolt(tailHoodX-tailHoodW+13, h_cy+4, 1)}`;

      // 12. 窑头罩（右端）+ 出料溜槽
      // 罩宽按 w 比例化（默认尺寸 w=380 时外观不变），保证燃烧器管口比例恒定
      const headHoodW=w*(28/380), headHoodX=h_drumR;
      // 出料溜管：从窑头罩底部斜45°接出，末段水平到右边缘端口
      const outletPipeCY = h*0.76;
      const outletPipeH = 12;
      const outletPipeY = outletPipeCY - outletPipeH/2;
      // 窑头罩底边参数
      const hoodBotLx = headHoodX, hoodBotLy = h_cy+h_R*1.1;
      const hoodBotRx = headHoodX+headHoodW, hoodBotRy = h_cy+h_R*0.8;
      const hoodBotSlope = (hoodBotRy-hoodBotLy)/(hoodBotRx-hoodBotLx);
      const hoodBotYat = (x)=> hoodBotLy + hoodBotSlope*(x-hoodBotLx);
      // 溜槽开口在罩底
      const chuteOpenL = headHoodX+headHoodW-12;
      const chuteOpenR = headHoodX+headHoodW-1;
      const chuteOpenLy = hoodBotYat(chuteOpenL);
      const chuteOpenRy = hoodBotYat(chuteOpenR);
      // 斜溜段到水平管转接点
      const chuteElbowX = headHoodX+headHoodW+18;
      const chuteElbowY = outletPipeY;
      // 水平管长度
      const horizPipeLen = w - chuteElbowX;
      const headHood = `
        <path d="M ${headHoodX} ${h_cy-h_R*1.1} L ${headHoodX+headHoodW} ${h_cy-h_R*0.8} L ${headHoodX+headHoodW} ${h_cy+h_R*0.8} L ${headHoodX} ${h_cy+h_R*1.1} Z" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
        <path d="M ${headHoodX+3} ${h_cy-h_R*1.0} L ${headHoodX+headHoodW-2} ${h_cy-h_R*0.75} L ${headHoodX+headHoodW-2} ${h_cy+h_R*0.75} L ${headHoodX+3} ${h_cy+h_R*1.0} Z" fill="#12102a" opacity="0.5"/>
        <circle cx="${headHoodX+headHoodW/2}" cy="${h_cy-h_R*0.2}" r="4" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <circle cx="${headHoodX+headHoodW/2}" cy="${h_cy-h_R*0.2}" r="2.5" fill="#ff6020" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.2s" repeatCount="indefinite"/></circle>
        ${Array.from({length:8}).map((_,i)=>`<line x1="${headHoodX}" y1="${h_cy-h_R+i*(h_R*2/7)}" x2="${headHoodX+6}" y2="${h_cy-h_R+i*(h_R*2/7)+1}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>`).join('')}
        <!-- 燃烧器接口（窑头罩正面中心） -->
        <rect x="${headHoodX+headHoodW}" y="${h_cy-h_R*0.35}" width="6" height="${h_R*0.7}" fill="#151330" stroke="${c}" stroke-width="0.8"/>
        <!-- 斜溜槽：从罩底开口斜向下到弯头 -->
        <path d="M ${chuteOpenL} ${chuteOpenLy} L ${chuteOpenR} ${chuteOpenRy} L ${chuteElbowX+2} ${chuteElbowY} L ${chuteElbowX+2} ${chuteElbowY+outletPipeH} L ${chuteOpenL-4} ${chuteOpenLy+outletPipeH-2} Z" fill="#151330" stroke="${c}" stroke-width="0.9"/>
        <!-- 水平出料管（弯头到右边缘） -->
        <rect x="${chuteElbowX}" y="${outletPipeY}" width="${horizPipeLen}" height="${outletPipeH}" fill="#151330" stroke="${c}" stroke-width="0.9"/>
        <rect x="${chuteElbowX+2}" y="${outletPipeY+2}" width="${horizPipeLen-5}" height="2" fill="rgba(255,255,255,0.06)"/>
        <!-- 端部法兰 -->
        <rect x="${w-5}" y="${outletPipeY-2}" width="5" height="${outletPipeH+4}" fill="#1a1835" stroke="${c}" stroke-width="0.7"/>
        ${boltPair(w-2.5, outletPipeY+outletPipeH/2, outletPipeH-2, 1)}`;

      // 13. 燃烧器/喷煤管（管长取原设计的 1/2，小车在地面轨道上支撑）
      const burnerX=headHoodX+headHoodW+w*(6/380);   // 管身左端（对接窑头罩）
      const burnerLen=(w-burnerX+w*(5/380))/2;       // 原管一直伸到右边缘，此处取原长的一半
      const burnerEndX=burnerX+burnerLen;            // 管端（端部法兰外沿，即 fuel 端口）
      const carX = burnerX + burnerLen - 8;
      const carY = h*0.82;
      const burnerCar = `
        <!-- 轨道 -->
        <rect x="${carX-16}" y="${carY+8}" width="32" height="3" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.5"/>
        <!-- 移动小车 -->
        <rect x="${carX-9}" y="${carY}" width="18" height="4" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <circle cx="${carX-5}" cy="${carY+4}" r="3" fill="#151330" stroke="${c}" stroke-width="0.7"/>
        <circle cx="${carX+5}" cy="${carY+4}" r="3" fill="#151330" stroke="${c}" stroke-width="0.7"/>
        <circle cx="${carX-5}" cy="${carY+4}" r="1" fill="${c}" opacity="0.4"/>
        <circle cx="${carX+5}" cy="${carY+4}" r="1" fill="${c}" opacity="0.4"/>
        <!-- 支撑立柱 -->
        <rect x="${carX-2}" y="${h_cy+5}" width="4" height="${carY-h_cy-5}" fill="#151330" stroke="${c}" stroke-width="0.5"/>`;
      const burner = `
        <!-- 燃烧器主体管（管体延至端部法兰，管端法兰外沿即 fuel 端口） -->
        <rect x="${burnerX-5}" y="${h_cy-5}" width="${burnerLen+5}" height="10" rx="2" fill="url(#gEquip)" stroke="${c}" stroke-width="1"/>
        <rect x="${burnerEndX-5}" y="${h_cy-7}" width="5" height="14" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        ${boltPair(burnerEndX-2.5, h_cy, 10, 1.2)}
        <ellipse cx="${burnerX-3}" cy="${h_cy}" rx="3" ry="6" fill="#151330" stroke="${c}" stroke-width="0.8"/>
        <circle cx="${burnerX+burnerLen*0.35}" cy="${h_cy}" r="2.5" fill="#0d0b20" stroke="${c}" stroke-width="0.5"/>`;

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
      let materialParticles = '';
      for(let i=0;i<12;i++){
        const delay=-(i/12*8).toFixed(2);
        let px=[], py=[], pR=[];
        for(let k=0;k<=32;k++){
          const t=k/32, x=h_drumL+15+t*(h_drumW-30);
          const rotPhase=(t*3.5)%1;
          let bedY;
          if(rotPhase<0.55) bedY=h_cy+h_R*0.55;
          else if(rotPhase<0.85){const lt=(rotPhase-0.55)/0.3; bedY=h_cy+h_R*0.55-h_R*0.5*Math.sin(lt*Math.PI);}
          else{const ft=(rotPhase-0.85)/0.15; bedY=h_cy+h_R*0.55-h_R*0.3+ft*h_R*0.3;}
          px.push(x.toFixed(1)); py.push((bedY+Math.sin(t*8+i)*2).toFixed(1)); pR.push((1.2+Math.sin(t*6)*0.4).toFixed(1));
        }
        materialParticles += `<circle cx="${px[0]}" cy="${py[0]}" r="${pR[0]}" fill="#b08060" opacity="0.7" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${px.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${py.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${pR.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 16. 热辐射+高温带（须绘制在筒体之上才可见：窑头红热段 + 焰根辉光）
      const heatGlow = `
        <rect x="${h_drumR-h_drumW*0.42}" y="${h_drumTop+4}" width="${h_drumW*0.37}" height="${h_R*2-8}" rx="${h_R*0.2}" ry="${h_R-4}" fill="#ff4a10" opacity="0.18" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="opacity" values="0.12;0.26;0.12" dur="2.4s" repeatCount="indefinite"/>
        </rect>
        <ellipse cx="${flameStartX}" cy="${h_cy}" rx="${flameR*1.2}" ry="${flameR*0.95}" fill="#ffa040" opacity="0.35" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="opacity" values="0.2;0.45;0.2" dur="1.1s" repeatCount="indefinite"/>
        </ellipse>`;

      // 17. 传动系统（小齿轮+减速机+电机）
      const h_pinionR=7, h_pinionX=h_gearX+h_gearW/2+h_pinionR+2, h_pinionY=h_cy;
      const h_reducerW=28, h_reducerH=22, h_reducerX=h_pinionX+h_pinionR+6, h_reducerY=h_pinionY-h_reducerH/2+h_R+15;
      const h_motorW=34, h_motorH=20, h_motorX=h_reducerX+h_reducerW+2, h_motorY=h_pinionY-h_motorH/2+h_R+15;
      const h_driveSystem = `
        <g>
          <animateTransform attributeName="transform" type="rotate" from="360 ${h_pinionX} ${h_pinionY}" to="0 ${h_pinionX} ${h_pinionY}" dur="${rotDur/(h_gearR/h_pinionR)}s" repeatCount="indefinite"/>
          <circle cx="${h_pinionX}" cy="${h_pinionY}" r="${h_pinionR}" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
          <circle cx="${h_pinionX}" cy="${h_pinionY}" r="${h_pinionR*0.28}" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
          ${Array.from({length:6}).map((_,i)=>{const sa=i*60*Math.PI/180;return `<line x1="${h_pinionX}" y1="${h_pinionY}" x2="${(h_pinionX+Math.cos(sa)*h_pinionR*0.7).toFixed(1)}" y2="${(h_pinionY+Math.sin(sa)*h_pinionR*0.7).toFixed(1)}" stroke="${c}" stroke-width="0.8" opacity="0.4"/>`;}).join('')}
        </g>
        <rect x="${h_pinionX-7}" y="${h_pinionY+h_pinionR}" width="14" height="8" fill="#151330" stroke="${c}" stroke-width="0.8"/>
        ${bolt(h_pinionX-4, h_pinionY+h_pinionR+4, 1)}${bolt(h_pinionX+4, h_pinionY+h_pinionR+4, 1)}
        <rect x="${h_reducerX}" y="${h_reducerY}" width="${h_reducerW}" height="${h_reducerH}" rx="3" fill="url(#gEquip)" stroke="${c}" stroke-width="1.1"/>
        <line x1="${h_pinionX+h_pinionR}" y1="${h_pinionY}" x2="${h_reducerX}" y2="${h_reducerY+h_reducerH/2}" stroke="${c}" stroke-width="1.3"/>
        <circle cx="${h_reducerX+h_reducerW/2}" cy="${h_reducerY+h_reducerH/2}" r="4" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${h_reducerX+h_reducerW/2}" y="${h_reducerY+h_reducerH/2+2}" text-anchor="middle" fill="${c}" font-size="3.8" opacity="0.6">ZSY</text>
        <rect x="${h_reducerX-3}" y="${h_reducerY+h_reducerH}" width="${h_reducerW+6}" height="5" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
        <rect x="${h_motorX}" y="${h_motorY}" width="${h_motorW}" height="${h_motorH}" rx="4" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <ellipse cx="${h_motorX+h_motorW}" cy="${h_motorY+h_motorH/2}" rx="${h_motorH/2+2}" ry="${h_motorH/2+1}" fill="#151330" stroke="${c}" stroke-width="0.9"/>
        ${Array.from({length:4}).map((_,i)=>{const va=-Math.PI/2+(i-1.5)*0.4;const vx=h_motorX+h_motorW+Math.cos(va)*(h_motorH/2-3);const vy=h_motorY+h_motorH/2+Math.sin(va)*(h_motorH/2-3);return `<circle cx="${vx.toFixed(1)}" cy="${vy.toFixed(1)}" r="1" fill="#0d0b20" opacity="0.5"/>`;}).join('')}
        <line x1="${h_reducerX+h_reducerW}" y1="${h_reducerY+h_reducerH/2}" x2="${h_motorX}" y2="${h_motorY+h_motorH/2}" stroke="${c}" stroke-width="1.3"/>
        ${Array.from({length:5}).map((_,i)=>{const mx=h_motorX+4+i*((h_motorW-8)/4);return `<line x1="${mx}" y1="${h_motorY+3}" x2="${mx}" y2="${h_motorY+h_motorH-3}" stroke="${c}" stroke-width="0.4" opacity="0.3"/>`;}).join('')}
        <rect x="${h_motorX+h_motorW*0.35}" y="${h_motorY-6}" width="${h_motorW*0.28}" height="7" rx="1" fill="#151330" stroke="${c}" stroke-width="0.7"/>
        <rect x="${h_motorX}" y="${h_motorY+h_motorH}" width="${h_motorW}" height="5" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
        ${bolt(h_motorX+4, h_motorY+h_motorH+2.5, 1.1)}${bolt(h_motorX+h_motorW-4, h_motorY+h_motorH+2.5, 1.1)}`;

      // 18. 测温点
      const instruments = [0.25,0.5,0.75].map(t=>{
        const tx=h_drumL+h_drumW*t;
        return `<circle cx="${tx}" cy="${h_drumTop-2}" r="2.5" fill="#151330" stroke="${c}" stroke-width="0.6"/><line x1="${tx}" y1="${h_drumTop}" x2="${tx}" y2="${h_drumTop-4}" stroke="${c}" stroke-width="0.6"/>`;
      }).join('')+`<circle cx="${headHoodX+headHoodW-5}" cy="${h_cy-h_R*0.7}" r="2" fill="#151330" stroke="${c}" stroke-width="0.5"/>`;

      // 19. 烟气粒子
      let flueParticles = '';
      for(let i=0;i<6;i++){
        const delay=-(i*0.7).toFixed(2), sx=fluePipeCX;
        const flueStartY = 8;
        let spx=[], spy=[], spr=[], spo=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          spx.push((sx+Math.sin(t*3+i)*4).toFixed(1)); spy.push((flueStartY-t*25).toFixed(1));
          spr.push((2+t*2).toFixed(1)); spo.push((0.4-t*0.3).toFixed(2));
        }
        flueParticles += `<ellipse cx="${spx[0]}" cy="${spy[0]}" rx="${spr[0]}" ry="${spr[0]*1.3}" fill="#a0b0c0" opacity="${spo[0]}">
          <animate attributeName="cx" values="${spx.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${spy.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${spr.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${spo.join(';')}" dur="3s" begin="${delay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }

      // 20. 铭牌
      const nameplate = `
        <rect x="${h_gearX+25}" y="${h_cy+h_R+15}" width="32" height="14" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.7"/>
        <rect x="${h_gearX+26}" y="${h_cy+h_R+16}" width="30" height="12" fill="#151330"/>
        <text x="${h_gearX+41}" y="${h_cy+h_R+21}" text-anchor="middle" fill="${c}" font-size="4" font-weight="bold" opacity="0.8">Φ3.5×54m</text>
        <text x="${h_gearX+41}" y="${h_cy+h_R+26}" text-anchor="middle" fill="${c}" font-size="3.2" opacity="0.6">回转窑</text>
        <circle cx="${h_gearX+28}" cy="${h_cy+h_R+17.5}" r="0.8" fill="${c}" opacity="0.5"/>
        <circle cx="${h_gearX+54}" cy="${h_cy+h_R+17.5}" r="0.8" fill="${c}" opacity="0.5"/>`;

      return `
        ${drumShade}${tempGrad}${clipDef}${clipDefInner}
        ${foundations}
        ${tailHood}${flueParticles}
        ${trunnions}${h_thrustWheel}
        ${burnerCar}
        ${drumBody}${tempOverlay}${weldRings}${tires}${h_girthGear}
        ${heatGlow}${refractory}${flights}${materialParticles}${flames}
        ${rotMarks}${ringBolts}
        ${h_driveSystem}
        ${headHood}${burner}${instruments}${nameplate}
      `;
    }
};
