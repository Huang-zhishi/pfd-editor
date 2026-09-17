/* ============================================================
 * PFD Editor · 组件模板：tubeCooler
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.tubeCooler。
 * ============================================================ */

TEMPLATES.tubeCooler = {
    name: '回转滚筒冷却机', category: '设备',
    defaultSize: { w: 300, h: 140 },
    ports: [
      {id:'inlet',x:0,y:.5,dir:'left'},
      {id:'outlet',x:1,y:.5,dir:'right'},
      {id:'airIn',x:.9,y:1,dir:'down'},
      {id:'airOut',x:.1,y:0,dir:'up'}
    ],
    render: (w,h,p)=>{
      const c = p.color;
      const rotDur = 4;
      const cy = h*0.5;
      const drumH = h*0.4;
      const R = drumH/2;
      const endBoxW = w*0.05;
      const drumL = endBoxW + 8;
      const drumR = w - endBoxW - 8;
      const drumW = drumR - drumL;
      const drumCx = (drumL + drumR)/2;
      const drumTop = cy - R;
      const baseY = h - 6;
      const clipId = `clip_drum_${Math.random().toString(36).substr(2,6)}`;
      const clipIdInner = `clip_inner_${Math.random().toString(36).substr(2,6)}`;
      const drumShadeId = `drum_shade_${Math.random().toString(36).substr(2,6)}`;

      // 1. 底座（精细双层）
      const tire1X = drumL + drumW*0.25;
      const tire2X = drumL + drumW*0.75;
      const tireW = 16;
      const baseH = 14;
      const base1 = `<rect x="${tire1X-30}" y="${baseY-baseH}" width="60" height="${baseH}" rx="2" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <rect x="${tire1X-28}" y="${baseY-baseH+2}" width="56" height="${baseH-4}" fill="#12102a" opacity="0.6"/>
        <rect x="${tire1X-32}" y="${baseY}" width="64" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;
      const base2 = `<rect x="${tire2X-30}" y="${baseY-baseH}" width="60" height="${baseH}" rx="2" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <rect x="${tire2X-28}" y="${baseY-baseH+2}" width="56" height="${baseH-4}" fill="#12102a" opacity="0.6"/>
        <rect x="${tire2X-32}" y="${baseY}" width="64" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;

      // 2. 双托轮（精细：带辐条反向旋转）
      const trunnionR = 10;
      const drawTrunnionPair = (tx)=>{
        const contactAngle = 30 * Math.PI/180;
        const trunnionCY = baseY - baseH - trunnionR;
        const offset = (R + tireW/2 + 2) * Math.sin(contactAngle) * 0.85;
        const drawWheel = (wx, wy, dir)=>{
          let spokes = '';
          for(let i=0; i<6; i++){
            const sa = i*60*Math.PI/180;
            spokes += `<line x1="${wx}" y1="${wy}" x2="${wx+Math.cos(sa)*trunnionR*0.6}" y2="${wy+Math.sin(sa)*trunnionR*0.6}" stroke="${c}" stroke-width="1" opacity="0.4"/>`;
          }
          return `<g>
            <animateTransform attributeName="transform" type="rotate" from="${dir>0?0:360} ${wx} ${wy}" to="${dir>0?360:0} ${wx} ${wy}" dur="${rotDur*0.8}s" repeatCount="indefinite"/>
            <circle cx="${wx}" cy="${wy}" r="${trunnionR}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
            <circle cx="${wx}" cy="${wy}" r="${trunnionR*0.3}" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
            ${spokes}
            <circle cx="${wx}" cy="${wy}" r="2.5" fill="${c}" opacity="0.7"/>
          </g>`;
        };
        return drawWheel(tx-offset, trunnionCY, 1) + drawWheel(tx+offset, trunnionCY, -1);
      };
      const trunnions = drawTrunnionPair(tire1X) + drawTrunnionPair(tire2X);

      // 3. ClipPath
      const clipDef = `<clipPath id="${clipId}"><rect x="${drumL}" y="${drumTop}" width="${drumW}" height="${drumH}" rx="${R*0.3}" ry="${R}"/></clipPath>`;
      const clipDefInner = `<clipPath id="${clipIdInner}"><rect x="${drumL+3}" y="${drumTop+3}" width="${drumW-6}" height="${drumH-6}" rx="${R*0.25}" ry="${R-3}"/></clipPath>`;
      const drumShade = `<linearGradient id="${drumShadeId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a1835" stop-opacity="1"/>
        <stop offset="15%" stop-color="#262450" stop-opacity="1"/>
        <stop offset="45%" stop-color="#353370" stop-opacity="1"/>
        <stop offset="55%" stop-color="#353370" stop-opacity="1"/>
        <stop offset="85%" stop-color="#262450" stop-opacity="1"/>
        <stop offset="100%" stop-color="#1a1835" stop-opacity="1"/>
      </linearGradient>`;

      // 4. 筒体壁（圆柱明暗渐变+两端圆形封头椭圆）
      const drumBody = `<rect x="${drumL}" y="${drumTop}" width="${drumW}" height="${drumH}" rx="${R*0.3}" ry="${R}" fill="url(#${drumShadeId})" stroke="${c}" stroke-width="2"/>
        <ellipse cx="${drumL}" cy="${cy}" rx="${R*0.4}" ry="${R}" fill="#1f1d40" stroke="${c}" stroke-width="1.5" opacity="0.6"/>
        <ellipse cx="${drumR}" cy="${cy}" rx="${R*0.4}" ry="${R}" fill="#1f1d40" stroke="${c}" stroke-width="1.5" opacity="0.6"/>
        <rect x="${drumL+2}" y="${drumTop+1}" width="${drumW-4}" height="${drumH-2}" rx="${R*0.28}" ry="${R-1}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;

      // 5. 环形焊缝（固定椭圆，就是用户说的"一排孔"）
      let weldRings = '';
      for(let i=1; i<=7; i++){
        const wx = drumL + (drumW * i / 8);
        weldRings += `<ellipse cx="${wx}" cy="${cy}" rx="3" ry="${R-1}" fill="none" stroke="${c}" stroke-width="1" opacity="0.35"/>`;
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
        return `<rect x="${drumL+6}" y="${yVals[0]}" width="${drumW-12}" height="${sw}" rx="${sw/2}" fill="${color}" clip-path="url(#${clipId})">
          <animate attributeName="y" values="${yVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opVals.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </rect>`;
      };
      rotMarks += makeStrip(0, 6, '#ffffff', 0.9);    // 白色粗主带（更宽更亮）
      rotMarks += makeStrip(0.25, 2.5, '#fff', 0.3);   // 白色副带
      rotMarks += makeStrip(0.5, 4, c, 0.6);           // 配色主副带
      rotMarks += makeStrip(0.75, 2.5, '#fff', 0.3);   // 白色副带

      // 6b. 焊缝环上的螺栓点（随筒体滚动的小亮点，让"滚"更明显）
      let ringBolts = '';
      for(let ri=1; ri<=7; ri++){
        const wx = drumL + (drumW * ri / 8);
        for(let i=0; i<4; i++){
          const phase = i/4;
          const delay = -(phase*rotDur).toFixed(2);
          let cyv=[], opv=[];
          for(let k=0; k<=16; k++){
            const ang = ((k/16)+phase)*2*Math.PI;
            const front = Math.cos(ang);
            cyv.push((cy + (R-3)*Math.sin(ang)).toFixed(1));
            opv.push(front > 0 ? (0.3 + 0.5*front).toFixed(2) : '0');
          }
          ringBolts += `<circle cx="${wx.toFixed(1)}" cy="${cyv[0]}" r="1.5" fill="${c}" clip-path="url(#${clipId})" opacity="${opv[0]}">
            <animate attributeName="cy" values="${cyv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle>`;
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
          const outerR = R - 2;
          const innerR = outerR - flightLen;
          const y1 = cy + outerR*sinA;
          const bendAng = ang + 0.3;
          const y2 = cy + innerR*Math.sin(bendAng);
          fy1.push(y1.toFixed(1));
          fy2.push(y2.toFixed(1));
          fOp.push(cosA > 0 ? (0.25 + 0.35*cosA).toFixed(2) : '0');
        }
        const fx = drumCx + (fi%3-1)*(drumW*0.15);
        flights += `<line x1="${fx.toFixed(1)}" x2="${fx.toFixed(1)}" y1="${fy1[0]}" y2="${fy2[0]}" stroke="${c}" stroke-width="2" stroke-linecap="round" clip-path="url(#${clipIdInner})" opacity="${fOp[0]}">
          <animate attributeName="y1" values="${fy1.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="${fy2.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </line>`;
      }
      // 扬料板在筒壁上的固定点（小方点，铆接感）
      let flightPivots = '';
      for(let fi=0; fi<flightCount; fi++){
        for(let ri=1; ri<=3; ri++){
          const wx = drumL + drumW*0.25 + drumW*0.5*(ri-1)/2;
          const phase = fi/flightCount + (ri*0.05);
          const delay = -(phase*rotDur).toFixed(2);
          let py=[], pOp=[];
          for(let k=0; k<=24; k++){
            const ang = ((k/24)+phase)*2*Math.PI;
            py.push((cy + (R-2)*Math.sin(ang)).toFixed(1));
            pOp.push(Math.cos(ang) > 0 ? '0.5' : '0.08');
          }
          flightPivots += `<rect x="${wx-1}" y="${py[0]-1}" width="1.5" height="1.5" fill="${c}" clip-path="url(#${clipId})" opacity="${pOp[0]}">
            <animate attributeName="y" values="${py.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${pOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </rect>`;
        }
      }

      // 7. 滚带（大齿圈样式：带齿动画）
      const drawTire = (tx)=>{
        const tTeethCount = 36;
        const tGearR = R + tireW/2;
        const tToothH = 5;
        const tOuterRx = tireW/2;
        const tInnerRx = tOuterRx - 3;
        const tToothRx = tInnerRx;
        const tireBody = `<ellipse cx="${tx}" cy="${cy}" rx="${tOuterRx}" ry="${tGearR}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
          <ellipse cx="${tx}" cy="${cy}" rx="${tInnerRx}" ry="${tGearR-6}" fill="#12102a" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`;
        let tireTeeth = '';
        for(let i=0; i<tTeethCount; i++){
          const phase = i/tTeethCount;
          const delay = -(phase*rotDur).toFixed(2);
          let tPts=[], tOp=[];
          for(let k=0; k<=16; k++){
            const ang = ((k/16)+phase)*2*Math.PI;
            const sinA=Math.sin(ang), cosA=Math.cos(ang);
            const rx=tToothRx, ry=tGearR, rx2=tToothRx+1, ry2=tGearR+tToothH;
            tPts.push(`${(tx+(rx+1)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)} ${(tx+rx2*cosA).toFixed(1)},${(cy+ry2*sinA).toFixed(1)} ${(tx+(rx-1)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)}`);
            tOp.push(cosA > 0 ? '0.85' : '0.2');
          }
          tireTeeth += `<polygon fill="#252545" stroke="${c}" stroke-width="0.5" clip-path="url(#${clipId})" points="${tPts[0]}">
            <animate attributeName="points" values="${tPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${tOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          </polygon>`;
        }
        return tireBody + tireTeeth;
      };
      const tires = drawTire(tire1X) + drawTire(tire2X);

      // 8. 大齿圈（精细：齿动画，取消虚线环）
      const gearX = tire2X - 25;
      const gearR = R + 10;
      const gTeethCount = 36;
      const gearBody = `<ellipse cx="${gearX}" cy="${cy}" rx="7" ry="${gearR}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
        <ellipse cx="${gearX}" cy="${cy}" rx="4" ry="${gearR-6}" fill="#12102a" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`;
      let gearTeeth = '';
      for(let i=0; i<gTeethCount; i++){
        const phase = i/gTeethCount;
        const delay = -(phase*rotDur).toFixed(2);
        const toothH = 5;
        let tPts=[], tOp=[];
        for(let k=0; k<=16; k++){
          const ang = ((k/16)+phase)*2*Math.PI;
          const sinA=Math.sin(ang), cosA=Math.cos(ang);
          const rx=4, ry=gearR, rx2=5, ry2=gearR+toothH;
          tPts.push(`${(gearX+(rx+1)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)} ${(gearX+rx2*cosA).toFixed(1)},${(cy+ry2*sinA).toFixed(1)} ${(gearX+(rx-1)*cosA).toFixed(1)},${(cy+ry*sinA).toFixed(1)}`);
          tOp.push(cosA > 0 ? '0.85' : '0.2');
        }
        gearTeeth += `<polygon fill="#252545" stroke="${c}" stroke-width="0.5" clip-path="url(#${clipId})" points="${tPts[0]}">
          <animate attributeName="points" values="${tPts.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${tOp.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </polygon>`;
      }
      const girthGear = gearBody + gearTeeth;

      // 9. 小齿轮+减速机+电机（精细完整）
      const pinionR = 8;
      const pTeethCount = 14;
      const pinionX = gearX + 6;
      const pinionY = cy + gearR*0.7;
      let pinionTeeth = '';
      for(let i=0; i<pTeethCount; i++){
        const a = i*360/pTeethCount*Math.PI/180;
        pinionTeeth += `<line x1="${pinionX+Math.cos(a)*(pinionR-1)}" y1="${pinionY+Math.sin(a)*(pinionR-1)}" x2="${pinionX+Math.cos(a)*(pinionR+3)}" y2="${pinionY+Math.sin(a)*(pinionR+3)}" stroke="${c}" stroke-width="1.2" opacity="0.7"/>`;
      }
      const reducerX = pinionX + 18;
      const reducerY = pinionY + 8;
      const motorX = reducerX + 18;
      const motorY = reducerY + 4;
      const drive = `<g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${pinionX} ${pinionY}" to="${-gTeethCount/pTeethCount*360} ${pinionX} ${pinionY}" dur="${rotDur}s" repeatCount="indefinite"/>
          <circle cx="${pinionX}" cy="${pinionY}" r="${pinionR}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
          <circle cx="${pinionX}" cy="${pinionY}" r="${pinionR*0.3}" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
          ${pinionTeeth}
          <circle cx="${pinionX}" cy="${pinionY}" r="2" fill="${c}" opacity="0.8"/>
        </g>
        <rect x="${reducerX-11}" y="${reducerY-13}" width="22" height="26" rx="3" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <rect x="${reducerX-9}" y="${reducerY-11}" width="18" height="22" fill="#12102a" opacity="0.5"/>
        <rect x="${motorX}" y="${motorY-11}" width="24" height="22" rx="4" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <rect x="${motorX+3}" y="${motorY-9}" width="16" height="18" fill="url(#gEquip)" opacity="0.5"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${motorX+24} ${motorY}" to="360 ${motorX+24} ${motorY}" dur="0.8s" repeatCount="indefinite"/>
          <line x1="${motorX+24}" y1="${motorY}" x2="${motorX+28}" y2="${motorY}" stroke="${c}" stroke-width="2"/>
          <line x1="${motorX+24}" y1="${motorY}" x2="${motorX+24}" y2="${motorY+4}" stroke="${c}" stroke-width="2"/>
        </g>
        <text x="${motorX+12}" y="${motorY+4}" text-anchor="middle" fill="${c}" font-size="6" opacity="0.6">M</text>
        <rect x="${pinionX+pinionR}" y="${pinionY+pinionR+2}" width="${motorX+24-(pinionX+pinionR)+2}" height="5" rx="1" fill="#12102a" stroke="${c}" stroke-width="0.8"/>`;

      // 10. 进出料箱（精细）
      const inBox = `<path d="M 0 ${cy-R+6} L ${drumL} ${cy-R+2} L ${drumL} ${cy+R-2} L 0 ${cy+R-6} Z" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
        <rect x="0" y="${cy-drumH*0.2}" width="${endBoxW+4}" height="${drumH*0.4}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <rect x="0" y="${cy-drumH*0.2-3}" width="5" height="${drumH*0.4+6}" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <ellipse cx="${drumL}" cy="${cy}" rx="5" ry="${R-4}" fill="#080614" stroke="${c}" stroke-width="1.2"/>`;
      const outBox = `<path d="M ${drumR} ${cy-R+2} L ${w} ${cy-R+6} L ${w} ${cy+R-6} L ${drumR} ${cy+R-2} Z" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
        <rect x="${w-endBoxW-4}" y="${cy-drumH*0.2}" width="${endBoxW+4}" height="${drumH*0.4}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <rect x="${w-5}" y="${cy-drumH*0.2-3}" width="5" height="${drumH*0.4+6}" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <ellipse cx="${drumR}" cy="${cy}" rx="5" ry="${R-4}" fill="#080614" stroke="${c}" stroke-width="1.2"/>`;

      // 11. 物料床+冷却粒子（扬料板带起物料抛落雨幕+冷空气粒子）
      const materialBed = `<path d="M ${drumL+12} ${cy+R-8} Q ${drumCx} ${cy+R-3} ${drumR-12} ${cy+R-8} L ${drumR-12} ${cy+R-2} L ${drumL+12} ${cy+R-2} Z" fill="${c}" opacity="0.25"/>
        <path d="M ${drumL+12} ${cy+R-8} Q ${drumCx} ${cy+R-3} ${drumR-12} ${cy+R-8}" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.5"/>`;

      let particles = '';
      // 11a. 物料粒子：被扬料板带起→顶点→抛落（雨幕效果）
      const matParticleCount = 28;
      for(let i=0; i<matParticleCount; i++){
        const phase = i/matParticleCount;
        const delay = -(phase*rotDur).toFixed(2);
        const col = i % 5;
        const row = Math.floor(i/5);
        const px = drumL + 25 + col*((drumW-50)/4) + (row%2)*12;
        const liftH = R * (0.5 + (i*37 % 10)/10 * 0.25);
        const scatterX = ((i*73 % 10) - 5) * 0.03 * R;
        let cxv=[], cyv=[], opv=[], rv=[];
        for(let k=0; k<=32; k++){
          const t = k/32, rt = (t+phase)%1;
          let x, y, op, r;
          if(rt < 0.35){
            const la = (rt/0.35)*Math.PI - Math.PI/2;
            x = px + 4*Math.cos(la);
            y = cy + R*0.85*Math.sin(la);
            op = 0.6 + 0.4*Math.cos(la*0.5);
            r = 2.2;
          } else if(rt < 0.75){
            const ft = (rt-0.35)/0.4;
            const startAng = 0.7*Math.PI - Math.PI/2;
            const sx = px + 4*Math.cos(startAng);
            const sy = cy + R*0.85*Math.sin(startAng);
            const endX = px + scatterX;
            const endY = cy + R - 10;
            x = sx + (endX - sx)*ft;
            y = sy + (endY - sy)*ft - liftH*Math.sin(ft*Math.PI)*0.4;
            op = 0.8;
            r = 2;
          } else {
            const ft = (rt-0.75)/0.25;
            x = px + scatterX*0.3;
            y = cy + R - 8 - (1-ft)*3;
            op = 0.3 * (1-ft);
            r = 2*(1-ft*0.5);
          }
          cxv.push(x.toFixed(1));
          cyv.push(y.toFixed(1));
          opv.push(op.toFixed(2));
          rv.push(r.toFixed(1));
        }
        particles += `<circle cx="${cxv[0]}" cy="${cyv[0]}" r="${rv[0]}" fill="${c}" clip-path="url(#${clipIdInner})" opacity="${opv[0]}">
          <animate attributeName="cx" values="${cxv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${cyv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${rv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 11b. 冷却空气粒子：小而亮，逆向流动（从airIn到airOut方向，即从右到左+向上飘）
      const airParticleCount = 16;
      for(let i=0; i<airParticleCount; i++){
        const phase = i/airParticleCount;
        const delay = -(phase*rotDur*1.5).toFixed(2);
        const startX = drumR - 15 - ((i*47 % 10)/10)*20;
        const wiggleA = 4 + (i*13 % 6);
        const wiggleB = 3 + (i*29 % 5);
        let axv=[], ayv=[], aop=[];
        for(let k=0; k<=40; k++){
          const t = k/40, rt = (t+phase)%1;
          const x = startX - (drumW-40)*rt + Math.sin(rt*Math.PI*3)*wiggleA;
          const y = cy + R*0.3 - R*0.6*rt + Math.cos(rt*Math.PI*4)*wiggleB;
          const fadeIn = rt < 0.1 ? rt*10 : 1;
          const fadeOut = rt > 0.85 ? (1-rt)*6.7 : 1;
          const op = fadeIn * fadeOut * 0.55;
          axv.push(x.toFixed(1));
          ayv.push(y.toFixed(1));
          aop.push(op.toFixed(2));
        }
        particles += `<circle cx="${axv[0]}" cy="${ayv[0]}" r="1.5" fill="#7ec8ff" clip-path="url(#${clipIdInner})" opacity="${aop[0]}">
          <animate attributeName="cx" values="${axv.join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ayv.join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${aop.join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
        // 冷空气尾迹小点
        particles += `<circle cx="${(parseFloat(axv[0])-2).toFixed(1)}" cy="${(parseFloat(ayv[0])+1).toFixed(1)}" r="0.8" fill="#a8ddff" clip-path="url(#${clipIdInner})" opacity="${(parseFloat(aop[0])*0.5).toFixed(2)}">
          <animate attributeName="cx" values="${axv.map(v=>(parseFloat(v)-2).toFixed(1)).join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ayv.map(v=>(parseFloat(v)+1).toFixed(1)).join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${aop.map(v=>(parseFloat(v)*0.4).toFixed(2)).join(';')}" dur="${rotDur*1.5}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 12. 风管（精细）
      const airInX = w*0.88, airOutX = w*0.12;
      const airDucts = `<path d="M ${airInX-12} ${cy+R+4} L ${airInX+12} ${cy+R+4} L ${airInX+8} ${cy+R+14} L ${airInX-8} ${cy+R+14} Z" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        <rect x="${airInX-5}" y="${cy+R+14}" width="10" height="${baseY-cy-R-20}" fill="url(#gEquip)" stroke="${c}" stroke-width="1"/>
        <rect x="${airInX-7}" y="${baseY-3}" width="14" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <path d="M ${airOutX-12} ${cy-R-4} L ${airOutX+12} ${cy-R-4} L ${airOutX+8} ${cy-R-14} L ${airOutX-8} ${cy-R-14} Z" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        <rect x="${airOutX-5}" y="5" width="10" height="${cy-R-19}" fill="url(#gEquip)" stroke="${c}" stroke-width="1"/>
        <rect x="${airOutX-7}" y="0" width="14" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;

      // 12b. 散热热气：从筒体顶部上升（热空气从被冷却物料表面向上散发）
      let heatWaves = '';
      const hwCount = 12;
      for(let i=0; i<hwCount; i++){
        const phase = i/hwCount;
        const hwDur = 4 + (i%4)*0.8;
        const delay = -(phase*hwDur).toFixed(2);
        const baseX = drumL + 20 + ((drumW-40) * (i/(hwCount-1)));
        const sway = 4 + (i*19 % 5);
        let hx=[], hy=[], hr=[], ho=[];
        for(let k=0; k<=24; k++){
          const t = k/24;
          const y = drumTop - 2 - 28*t;
          const x = baseX + Math.sin(t*Math.PI*2 + phase*Math.PI*4)*sway;
          const r = 1.5 + 5*t;
          const op = t < 0.2 ? t/0.2*0.25 : (t > 0.75 ? (1-t)/0.25*0.25 : 0.25);
          hx.push(x.toFixed(1));
          hy.push(y.toFixed(1));
          hr.push(r.toFixed(1));
          ho.push(op.toFixed(2));
        }
        heatWaves += `<circle cx="${hx[0]}" cy="${hy[0]}" r="${hr[0]}" fill="#b0c4ff" opacity="${ho[0]}">
          <animate attributeName="cx" values="${hx.join(';')}" dur="${hwDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${hy.join(';')}" dur="${hwDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${hr.join(';')}" dur="${hwDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${ho.join(';')}" dur="${hwDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 13. 铭牌
      const nameplate = `<rect x="${drumCx-32}" y="${baseY-16}" width="64" height="12" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${drumCx}" y="${baseY-7}" text-anchor="middle" fill="${c}" font-size="6" opacity="0.75">回转滚筒冷却机</text>`;

      return `
        <defs>${clipDef}${clipDefInner}${drumShade}</defs>
        ${base1}${base2}
        ${trunnions}
        ${airDucts}
        ${heatWaves}
        ${inBox}${outBox}
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
