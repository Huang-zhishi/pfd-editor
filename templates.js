/* ============================================================
 * PFD Editor · 组件模板库（templates.js）
 *    定义全部设备组件的 SVG 绘制模板，与编辑器逻辑解耦。
 *    本文件必须先于 editor.js 加载（render 函数在运行期才被调用，
 *    其中引用的工具函数由 editor.js 提供，经全局作用域解析）。
 *
 *    每个模板: { name, category, icon, defaultSize, ports, render(w,h,p) }
 *      - name/category/icon  面板显示用
 *      - defaultSize         拖入画布时的初始尺寸
 *      - ports: [{id, x, y, dir}]  x,y 为 0-1 相对坐标, dir 为出向
 *      - render(w,h,p)       返回内部 SVG 字符串（不含外层 <g>）
 *    新增组件：在 TEMPLATES 中按上述契约追加一项即可，
 *    组件面板（editor.js buildPalette）会按 category 自动归组。
 * ============================================================ */
'use strict';

const TEMPLATES = {
  silo: {
    name: '料仓', category: '设备',
    defaultSize: { w: 90, h: 150 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'side',x:1,y:.4,dir:'right'}],
    render: (w,h,p)=>{
      const hop=new Path2D();
      return `
      <rect x="0" y="0" width="${w}" height="${h*0.72}" rx="3" class="equip-body" stroke="${p.color}"/>
      <rect x="0" y="0" width="${w}" height="${h*0.14}" rx="3" fill="#252545" stroke="${p.color}" stroke-width="1"/>
      <polygon points="0,${h*0.72} ${w},${h*0.72} ${w*0.78},${h*0.92} ${w*0.22},${h*0.92}" class="equip-body" stroke="${p.color}"/>
      <rect x="${w*0.35}" y="${h*0.92}" width="${w*0.3}" height="${h*0.08}" class="equip-body" stroke="${p.color}"/>
      <rect x="${w*0.08}" y="${h*0.16}" width="${w*0.84}" height="6" rx="2" fill="#1a1a30"/>
      <rect x="${w*0.08}" y="${h*0.16}" width="${w*0.84*0.7}" height="6" rx="2" fill="${p.color}" opacity="0.6"/>`;
    }
  },
  tubeCooler: {
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
  },
  desulfTower: {
    name: '工业脱硫塔', category: '设备',
    defaultSize: { w: 120, h: 280 },
    ports: [
      {id:'gasIn',x:0,y:.74,dir:'left'},
      {id:'gasOut',x:.5,y:0,dir:'up'},
      {id:'slurryOut',x:.5,y:1,dir:'down'},
      {id:'sprayIn',x:1,y:.52,dir:'right'},
      {id:'overflow',x:0,y:.86,dir:'left'}
    ],
    render: (w,h,p)=>{
      const c = p.color;
      const cx = w/2;
      const tw = w*0.58;
      const tx = (w - tw)/2;
      const r = tw/2;
      // ── 垂直布局（全部在 0~h 范围内，排气蒸汽除外）──
      const capPeakY = 0;           // 防雨帽顶点（刚好在组件顶部边界）
      const stackOpenY = h*0.035;   // 烟囱顶部开口
      const stackBotY = h*0.437;    // 烟囱直管底部（= topY - 锥形过渡0.02h）
      const topY = h*0.457;         // 塔体顶部（塔身:烟囱 = 15:20）
      const botY = h*0.80;          // 塔体底部（锥顶开始）
      const coneBotY = h*0.88;      // 锥底结束
      const baseBotY = h*0.94;      // 底座结束
      const nameBotY = h*0.99;      // 铭牌底部
      const tH = botY - topY;
      const clipId = `clip_tower_${Math.random().toString(36).substr(2,6)}`;
      const sprayDur = 2.5;
      const gasDur = 3;

      // 烟囱尺寸
      const stackW = tw*0.30;
      const stackBaseW = tw*0.42;
      const stackH = stackBotY - stackOpenY;
      const capH = h*0.038;
      const capR = stackW*0.75;

      // 1. 底座 + 锥底 + 塔体 + 顶帽
      const coneH = coneBotY - botY;
      const baseH = baseBotY - coneBotY;
      const nameH = nameBotY - baseBotY;

      const cone = `<polygon points="${tx},${botY} ${tx+tw},${botY} ${cx+r*0.3},${coneBotY} ${cx-r*0.3},${coneBotY}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
        <line x1="${tx+2}" y1="${botY+2}" x2="${cx-r*0.3+2}" y2="${coneBotY-1}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      const base = `<rect x="${cx-r*0.6}" y="${coneBotY}" width="${r*1.2}" height="${baseH}" rx="2" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <rect x="${cx-r*0.7}" y="${baseBotY-2}" width="${r*1.4}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;
      const body = `<rect x="${tx}" y="${topY}" width="${tw}" height="${tH}" fill="url(#gEquip)" stroke="${c}" stroke-width="2"/>
        <rect x="${tx+2}" y="${topY+1}" width="${tw-4}" height="${tH-2}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      const topCap = `<ellipse cx="${cx}" cy="${topY}" rx="${r}" ry="${h*0.03}" fill="#252545" stroke="${c}" stroke-width="1.5"/>
        <ellipse cx="${cx}" cy="${topY+2}" rx="${r-3}" ry="${h*0.022}" fill="#1a1835" opacity="0.6"/>`;

      // 2. 排气烟囱（锥形过渡+直管+法兰+防雨帽）
      const coneTopY = topY - h*0.02;
      const stackCone = `<polygon points="${cx-stackBaseW/2},${coneTopY} ${cx+stackBaseW/2},${coneTopY} ${cx+stackW/2},${stackBotY} ${cx-stackW/2},${stackBotY}" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <line x1="${cx-stackBaseW/2+2}" y1="${coneTopY+1}" x2="${cx-stackW/2+2}" y2="${stackBotY-1}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      const stackBody = `<rect x="${cx-stackW/2}" y="${stackOpenY}" width="${stackW}" height="${stackBotY-stackOpenY}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.5"/>
        <rect x="${cx-stackW/2+1}" y="${stackOpenY+1}" width="${stackW-2}" height="${stackBotY-stackOpenY-2}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      // 三道法兰环
      const flanges = [0.2, 0.55, 0.9].map(frac=>{
        const fy = stackOpenY + (stackBotY - stackOpenY)*(1-frac);
        return `<rect x="${cx-stackW/2-4}" y="${fy-3}" width="${stackW+8}" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
          <circle cx="${cx-stackW/2-1}" cy="${fy-0.5}" r="1.2" fill="${c}" opacity="0.5"/>
          <circle cx="${cx+stackW/2+1}" cy="${fy-0.5}" r="1.2" fill="${c}" opacity="0.5"/>`;
      }).join('');
      // 防雨帽（蘑菇形，顶点在y=0边界）
      const capY = capPeakY + capH*0.5;
      const rainCap = `<path d="M ${cx-capR} ${capY+2} Q ${cx} ${capPeakY} ${cx+capR} ${capY+2}" fill="#252545" stroke="${c}" stroke-width="1.3"/>
        <path d="M ${cx-capR*0.85} ${capY+3} Q ${cx} ${capPeakY+capH*0.3} ${cx+capR*0.85} ${capY+3}" fill="#1a1835" opacity="0.6"/>
        <line x1="${cx-stackW/2+3}" y1="${capY+1}" x2="${cx-stackW/2+3}" y2="${stackOpenY+2}" stroke="${c}" stroke-width="1.2"/>
        <line x1="${cx+stackW/2-3}" y1="${capY+1}" x2="${cx+stackW/2-3}" y2="${stackOpenY+2}" stroke="${c}" stroke-width="1.2"/>
        <line x1="${cx}" y1="${capY+1}" x2="${cx}" y2="${stackOpenY+2}" stroke="${c}" stroke-width="1.2"/>`;
      // 烟囱开口（在防雨帽下方）
      const stackTop = `<ellipse cx="${cx}" cy="${stackOpenY}" rx="${stackW/2}" ry="2.5" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <ellipse cx="${cx}" cy="${stackOpenY-1}" rx="${stackW/2-2}" ry="1.2" fill="#060515" opacity="0.8"/>`;

      const topPipe = stackCone + stackBody + flanges + stackTop + rainCap;

      // 2b. 排气特效（从烟囱口冒出，向上飘——允许超出组件顶部）
      const exhaustStartY = stackOpenY;
      let exhaustSteam = '';
      const steamCount = 10;
      for(let i=0; i<steamCount; i++){
        const phase = i/steamCount;
        const dur = 3.5 + (i%4)*0.6;
        const delay = -(phase*dur).toFixed(2);
        const seed = (i*37)%10;
        const baseX = cx - stackW*0.25 + (seed/10)*stackW*0.5;
        const sway = 4 + (i*19%5);
        const dir = i%2?1:-1;
        // 外层烟
        let sx=[], sy=[], sr=[], so=[];
        for(let k=0; k<=24; k++){
          const t = k/24;
          const y = exhaustStartY - h*0.20*t;
          const x = baseX + Math.sin(t*Math.PI*2 + phase*Math.PI*3)*sway + dir*t*sway*0.5;
          const r = 2.5 + t*8;
          const op = t < 0.1 ? t/0.1*0.28 : (t > 0.75 ? (1-t)/0.25*0.28 : 0.28);
          sx.push(x.toFixed(1)); sy.push(y.toFixed(1)); sr.push(r.toFixed(1)); so.push(op.toFixed(2));
        }
        exhaustSteam += `<circle cx="${sx[0]}" cy="${sy[0]}" r="${sr[0]}" fill="#dce5ff" opacity="${so[0]}">
          <animate attributeName="cx" values="${sx.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${sy.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${sr.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${so.join(';')}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
        // 内层烟
        let sx2=[], sy2=[], sr2=[], so2=[];
        for(let k=0; k<=24; k++){
          const t = k/24;
          const y = exhaustStartY - h*0.18*t - 2;
          const x = baseX - 1 + Math.sin(t*Math.PI*2 + phase*Math.PI*3 + 0.7)*(sway-1) + dir*t*sway*0.3;
          const r = 1.2 + t*5;
          const op = t < 0.08 ? t/0.08*0.18 : (t > 0.7 ? (1-t)/0.3*0.18 : 0.18);
          sx2.push(x.toFixed(1)); sy2.push(y.toFixed(1)); sr2.push(r.toFixed(1)); so2.push(op.toFixed(2));
        }
        exhaustSteam += `<circle cx="${sx2[0]}" cy="${sy2[0]}" r="${sr2[0]}" fill="#eef2ff" opacity="${so2[0]}">
          <animate attributeName="cx" values="${sx2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${sy2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${sr2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${so2.join(';')}" dur="${(dur*0.9).toFixed(2)}s" begin="${(delay-0.4).toFixed(2)}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 3. 烟气入口（左侧，端口y:.74）
      const gasInY = h*0.74;
      const gasInH = h*0.065;
      const gasInPipe = `<path d="M 0 ${gasInY-gasInH/2} L ${tx} ${gasInY-gasInH/2+2} L ${tx} ${gasInY+gasInH/2-2} L 0 ${gasInY+gasInH/2} Z" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
        <rect x="0" y="${gasInY-gasInH/2-3}" width="7" height="${gasInH+6}" rx="1.5" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <line x1="9" y1="${gasInY-gasInH/2+2}" x2="${tx-2}" y2="${gasInY-gasInH/2+4}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <circle cx="0" cy="${gasInY}" r="2" fill="${c}" opacity="0.3"/>`;

      // 4. 喷淋液入口管（右侧，端口y:.34）
      const sprayInY = h*0.52;
      const sprayPipeW = w*0.22;
      const sprayPipeH = h*0.05;
      const sprayInPipe = `<rect x="${tx+tw}" y="${sprayInY-sprayPipeH/2}" width="${sprayPipeW}" height="${sprayPipeH}" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>
        <rect x="${tx+tw+sprayPipeW-3}" y="${sprayInY-sprayPipeH/2-3}" width="6" height="${sprayPipeH+6}" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;

      // 5. 溢流口（左侧，端口y:.86，锥底位置）
      const overflowY = h*0.86;
      const overflowH = h*0.042;
      const coneT = (overflowY - botY) / coneH;
      const overflowWallX = cx - r + (r - r*0.3) * coneT;
      const overflowPipe = `<rect x="0" y="${overflowY-overflowH/2}" width="${overflowWallX}" height="${overflowH}" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        <rect x="0" y="${overflowY-overflowH/2-3}" width="7" height="${overflowH+6}" rx="1.5" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <circle cx="0" cy="${overflowY}" r="2" fill="${c}" opacity="0.3"/>`;

      // 6. 喷淋层（3层，分布在塔体内）
      let sprayLayers = '';
      let droplets = '';
      const sprayFracs = [0.18, 0.38, 0.58];  // 相对塔体
      const dropColors = ['#7ec8ff', '#9ad4ff', '#b0ddff'];
      sprayFracs.forEach((frac, li)=>{
        const sy = topY + tH*frac;
        sprayLayers += `<rect x="${tx+2}" y="${sy-2}" width="${tw-4}" height="4" rx="2" fill="#252545" stroke="${c}" stroke-width="0.8"/>`;
        const nozzleCount = 5;
        for(let ni=0; ni<nozzleCount; ni++){
          const nx = tx + 8 + ni*((tw-16)/(nozzleCount-1));
          sprayLayers += `<circle cx="${nx}" cy="${sy+2}" r="2.5" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
            <circle cx="${nx}" cy="${sy+3}" r="1" fill="${c}" opacity="0.5"/>`;
          const dropCount = 3;
          for(let di=0; di<dropCount; di++){
            const phase = (di/dropCount + li*0.15 + ni*0.07);
            const delay = -(phase*sprayDur).toFixed(2);
            const seed = (ni*7 + di*13 + li*3)%10;
            const dx = nx + ((di%2?1:-1)*(2+seed*0.5)-3);
            const fallDist = tH*0.10;
            const endY = sy + fallDist;
            let dy=[], dr=[], do_=[];
            for(let k=0; k<=14; k++){
              const t = k/14;
              dy.push((sy+4+(endY-sy-4)*t).toFixed(1));
              dr.push((1+t*1.2).toFixed(1));
              do_.push(t<0.1?t/0.1*0.65:(t>0.85?(1-t)/0.15*0.65:0.65).toFixed(2));
            }
            droplets += `<circle cx="${dx.toFixed(1)}" cy="${dy[0]}" r="${dr[0]}" fill="${dropColors[li]}" clip-path="url(#${clipId})" opacity="${do_[0]}">
              <animate attributeName="cy" values="${dy.join(';')}" dur="${sprayDur}s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="r" values="${dr.join(';')}" dur="${sprayDur}s" begin="${delay}s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="${do_.join(';')}" dur="${sprayDur}s" begin="${delay}s" repeatCount="indefinite"/>
            </circle>`;
          }
        }
      });

      // 7. 除雾器（顶部，塔内最上方）
      const demistY = topY + 6;
      const demistH = h*0.05;
      let demister = `<rect x="${tx+3}" y="${demistY}" width="${tw-6}" height="${demistH}" fill="#0d0b20" stroke="${c}" stroke-width="0.8" opacity="0.8"/>`;
      for(let gi=0; gi<8; gi++){
        const gx = tx+4+gi*((tw-8)/7);
        demister += `<line x1="${gx.toFixed(1)}" y1="${demistY+1}" x2="${(gx+3.5).toFixed(1)}" y2="${demistY+demistH-1}" stroke="${c}" stroke-width="0.8" opacity="0.4"/>`;
      }

      // 8. 烟气上升粒子
      let gasParticles = '';
      const gasCount = 8;
      for(let i=0; i<gasCount; i++){
        const phase = i/gasCount;
        const delay = -(phase*gasDur).toFixed(2);
        const startX = tx+tw*0.2+(i%5)*(tw*0.6/4);
        let gx=[], gy=[], gop=[], gr=[];
        for(let k=0; k<=20; k++){
          const t = k/20;
          const y = gasInY-(gasInY-(topY+demistH+8))*t;
          const x = startX+Math.sin(t*Math.PI*3+phase*Math.PI*2)*6+(i%2?1:-1)*t*4;
          const r = 1.2+t*0.8;
          const op = t<0.15?t/0.15*0.45:(t>0.8?(1-t)/0.2*0.45:0.45);
          gx.push(x.toFixed(1)); gy.push(y.toFixed(1)); gop.push(op.toFixed(2)); gr.push(r.toFixed(1));
        }
        gasParticles += `<circle cx="${gx[0]}" cy="${gy[0]}" r="${gr[0]}" fill="#c8b8ff" clip-path="url(#${clipId})" opacity="${gop[0]}">
          <animate attributeName="cx" values="${gx.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${gy.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="r" values="${gr.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${gop.join(';')}" dur="${gasDur}s" begin="${delay}s" repeatCount="indefinite"/>
        </circle>`;
      }

      // 9. 浆液池液面（波纹动画，在锥底上方）
      const liquidY = botY - h*0.03;
      let fillVals=[], strokeVals=[];
      for(let k=0; k<=12; k++){
        let sPts=[], fPts=[];
        for(let si=0; si<=20; si++){
          const x = tx+4+si*((tw-8)/20);
          const y = liquidY+Math.sin(si*0.5+k*0.5)*2;
          sPts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
          fPts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        strokeVals.push(`M ${tx+4} ${liquidY+1} ${sPts.join(' ')}`);
        fillVals.push(`M ${tx+4} ${liquidY+1} ${fPts.join(' ')} L ${tx+tw-4} ${botY-2} L ${tx+4} ${botY-2} Z`);
      }
      const liquid = `<path d="${fillVals[0]}" fill="${c}" opacity="0.2" clip-path="url(#${clipId})">
          <animate attributeName="d" values="${fillVals.join(';')}" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="${strokeVals[0]}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4" clip-path="url(#${clipId})">
          <animate attributeName="d" values="${strokeVals.join(';')}" dur="3s" repeatCount="indefinite"/>
        </path>`;

      // 10. 人孔
      const manholeY = topY + tH*0.5;
      const manholes = `<ellipse cx="${tx+tw+2}" cy="${manholeY}" rx="5" ry="7" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        <circle cx="${tx+tw+2}" cy="${manholeY}" r="2" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <circle cx="${tx+tw+2}" cy="${manholeY}" r="1" fill="${c}" opacity="0.3"/>`;

      // 11. 环箍（3道，在塔体上）
      let bands = '';
      [0.2, 0.5, 0.8].forEach(frac=>{
        const by = topY+tH*frac;
        bands += `<rect x="${tx-1}" y="${by-2}" width="${tw+2}" height="4" rx="1" fill="#252545" stroke="${c}" stroke-width="0.6" opacity="0.7"/>`;
      });

      // 12. 铭牌（在底座下方，h范围内）
      const nameY = baseBotY + 2;
      const nameplate = `<rect x="${cx-28}" y="${nameY}" width="56" height="${nameBotY-nameY-2}" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${cx}" y="${nameY+(nameBotY-nameY-2)/2+3}" text-anchor="middle" fill="${c}" font-size="6" opacity="0.75">脱硫塔</text>`;

      // 13. 外部循环管（从溢流口沿外壁向上到喷淋层）
      const extPipe = `<path d="M ${overflowWallX} ${overflowY} L ${tx-9} ${overflowY} L ${tx-9} ${sprayInY} L ${tx+tw} ${sprayInY}" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.5"/>
        <path d="M ${overflowWallX} ${overflowY} L ${tx-9} ${overflowY} L ${tx-9} ${sprayInY} L ${tx+tw} ${sprayInY}" fill="none" stroke="#1a1835" stroke-width="1.5"/>
        <rect x="${tx+tw-2}" y="${sprayInY-3}" width="4" height="6" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>`;

      const clipDef = `<clipPath id="${clipId}"><rect x="${tx}" y="${topY}" width="${tw}" height="${tH}"/></clipPath>`;

      return `
        <defs>${clipDef}</defs>
        ${base}
        ${cone}
        ${gasInPipe}
        ${overflowPipe}
        ${extPipe}
        ${body}
        <g clip-path="url(#${clipId})">
          ${liquid}
          ${demister}
          ${sprayLayers}
          ${droplets}
          ${gasParticles}
        </g>
        ${bands}
        ${topCap}
        ${topPipe}
        ${exhaustSteam}
        ${sprayInPipe}
        ${manholes}
        ${nameplate}
      `;
    }
  },
  valve: {
    name: '气密阀', category: '阀门管件',
    defaultSize: { w: 45, h: 35 },
    ports: [{id:'in',x:0,y:.5,dir:'left'},{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const c = p.color;
      const cx = w/2;
      const cy = h/2;
      const bodyW = w*0.35;
      const bodyH = h*0.7;
      const flangeT = h*0.08;
      const pipeW = w*0.25;

      const flangeBolt = (bx,by)=>`<circle cx="${bx}" cy="${by}" r="2" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/><circle cx="${bx}" cy="${by}" r="0.8" fill="${c}" opacity="0.4"/>`;

      // 左管道 + 法兰
      const leftPipe = `
        <rect x="0" y="${cy-pipeW/2}" width="${w/2-bodyW/2-flangeT}" height="${pipeW}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <rect x="0" y="${cy-pipeW/2+2}" width="${w/2-bodyW/2-flangeT-4}" height="${pipeW-4}" fill="#0f0e22" opacity="0.4"/>
        <!-- 法兰 -->
        <rect x="${w/2-bodyW/2-flangeT}" y="${cy-pipeW/2-flangeT}" width="${flangeT+2}" height="${pipeW+flangeT*2}" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <!-- 密封圈 -->
        <circle cx="${w/2-bodyW/2-flangeT/2}" cy="${cy}" r="${pipeW/2-2}" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>
        <!-- 螺栓 -->
        ${flangeBolt(w/2-bodyW/2-flangeT/2, cy-pipeW/2-flangeT/2)}
        ${flangeBolt(w/2-bodyW/2-flangeT/2, cy+pipeW/2+flangeT/2)}`;

      // 右管道 + 法兰
      const rightPipe = `
        <rect x="${w/2+bodyW/2+flangeT}" y="${cy-pipeW/2}" width="${w/2-bodyW/2-flangeT}" height="${pipeW}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <rect x="${w/2+bodyW/2+flangeT+2}" y="${cy-pipeW/2+2}" width="${w/2-bodyW/2-flangeT-4}" height="${pipeW-4}" fill="#0f0e22" opacity="0.4"/>
        <rect x="${w/2+bodyW/2-2}" y="${cy-pipeW/2-flangeT}" width="${flangeT+2}" height="${pipeW+flangeT*2}" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <circle cx="${w/2+bodyW/2+flangeT/2}" cy="${cy}" r="${pipeW/2-2}" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>
        ${flangeBolt(w/2+bodyW/2+flangeT/2, cy-pipeW/2-flangeT/2)}
        ${flangeBolt(w/2+bodyW/2+flangeT/2, cy+pipeW/2+flangeT/2)}`;

      // 阀体（球形/菱形）
      const body = `
        <polygon points="${cx-bodyW/2},${cy-bodyH/2} ${cx+bodyW/2},${cy-bodyH/2} ${cx+bodyW/2+4},${cy} ${cx+bodyW/2},${cy+bodyH/2} ${cx-bodyW/2},${cy+bodyH/2} ${cx-bodyW/2-4},${cy}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.5"/>
        <!-- 阀体内部深色层 -->
        <polygon points="${cx-bodyW/2+4},${cy-bodyH/2+3} ${cx+bodyW/2-4},${cy-bodyH/2+3} ${cx+bodyW/2+2},${cy} ${cx+bodyW/2-4},${cy+bodyH/2-3} ${cx-bodyW/2+4},${cy+bodyH/2-3} ${cx-bodyW/2-2},${cy}" fill="#0a0818" opacity="0.5"/>
        <!-- 密封等级 -->
        <text x="${cx}" y="${cy+2}" text-anchor="middle" fill="${c}" font-size="7" font-weight="600" opacity="0.6">PN16</text>`;

      // 阀瓣
      const stemH = h*0.35;
      const stemW = w*0.08;
      const stemX = cx - stemW/2;
      const stemTopY = cy - bodyH/2 - 4;
      const wheelR = w*0.14;
      const wheelCX = cx;
      const wheelCY = stemTopY - wheelR - 2;

      // 手轮
      let wheelSpokes = '';
      for(let i=0; i<5; i++){
        const a = i * 36 * Math.PI / 180;
        wheelSpokes += `<line x1="${wheelCX}" y1="${wheelCY}" x2="${wheelCX+Math.cos(a)*wheelR*0.7}" y2="${wheelCY+Math.sin(a)*wheelR*0.7}" stroke="${c}" stroke-width="1.5"/>`;
      }

      const wheel = `
        <circle cx="${wheelCX}" cy="${wheelCY}" r="${wheelR}" fill="none" stroke="${c}" stroke-width="2"/>
        <circle cx="${wheelCX}" cy="${wheelCY}" r="${wheelR*0.25}" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        ${wheelSpokes}
        <!-- 手轮把手 -->
        <circle cx="${wheelCX}" cy="${wheelCY-wheelR}" r="3" fill="#0d0b20" stroke="${c}" stroke-width="1"/>`;

      // 阀杆
      const stem = `
        <rect x="${stemX}" y="${stemTopY}" width="${stemW}" height="${stemH}" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <rect x="${stemX+1}" y="${stemTopY+1}" width="${stemW-2}" height="${stemH-2}" fill="url(#gEquip)" opacity="0.7"/>`;

      // 填料压盖
      const packing = `
        <rect x="${cx-bodyW/4}" y="${cy-bodyH/2-2}" width="${bodyW/2}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>`;

      // 阀体连接螺栓
      const bodyBolts = `
        ${flangeBolt(cx-bodyW/2+4, cy-bodyH/2+4)}
        ${flangeBolt(cx+bodyW/2-4, cy-bodyH/2+4)}
        ${flangeBolt(cx-bodyW/2+4, cy+bodyH/2-4)}
        ${flangeBolt(cx+bodyW/2-4, cy+bodyH/2-4)}`;

      return `
        ${leftPipe}
        ${rightPipe}
        ${body}
        ${bodyBolts}
        ${stem}
        ${packing}
        ${wheel}
      `;
    }
  },
  pump: {
    name: '工业抽水泵', category: '阀门管件',
    defaultSize: { w: 120, h: 90 },
    ports: [{id:'in',x:0,y:.5,dir:'left'},{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const c = p.color;
      const bolt = (bx,by,r=1.8)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/><circle cx="${bx}" cy="${by}" r="${r*0.4}" fill="${c}" opacity="0.5"/>`;
      const cx = w/2, cy = h*0.5;
      const R = h*0.38;
      const gaugeCx = cx, gaugeR = 4.5, gaugeCy = cy - R - gaugeR - 1;
      const flangeW = 9;
      // 叶轮片
      const blades = Array.from({length:6}).map((_,i)=>{ const a=i*60*Math.PI/180; return `<line x1="${cx+Math.cos(a)*R*0.34}" y1="${cy+Math.sin(a)*R*0.34}" x2="${cx+Math.cos(a)*R*0.62}" y2="${cy+Math.sin(a)*R*0.62}" stroke="${c}" stroke-width="1.2" opacity="0.5"/>`; }).join('');
      return `
        <!-- 蜗壳（居中对称） -->
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="#1a1835" stroke="${c}" stroke-width="1.6"/>
        <circle cx="${cx}" cy="${cy}" r="${R*0.78}" fill="none" stroke="${c}" stroke-width="1" opacity="0.4"/>
        <circle cx="${cx}" cy="${cy}" r="${R*0.3}" fill="#252545" stroke="${c}" stroke-width="1"/>
        <!-- 叶轮（旋转） -->
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="3s" repeatCount="indefinite"/>
          ${blades}
          <circle cx="${cx}" cy="${cy}" r="${R*0.12}" fill="${c}" opacity="0.7"/>
        </g>
        <!-- 顶部压力表（居中，无文字） -->
        <rect x="${gaugeCx-3}" y="${gaugeCy+gaugeR}" width="6" height="3" fill="#151330" stroke="${c}" stroke-width="0.5"/>
        <circle cx="${gaugeCx}" cy="${gaugeCy}" r="${gaugeR}" fill="#0d0b20" stroke="${c}" stroke-width="1.2"/>
        <circle cx="${gaugeCx}" cy="${gaugeCy}" r="${gaugeR*0.8}" fill="#151330" stroke="${c}" stroke-width="0.7"/>
        <line x1="${gaugeCx}" y1="${gaugeCy}" x2="${gaugeCx+Math.cos(0.6)*gaugeR*0.6}" y2="${gaugeCy+Math.sin(0.6)*gaugeR*0.6}" stroke="${c}" stroke-width="1.2"/>
        <circle cx="${gaugeCx}" cy="${gaugeCy}" r="1.4" fill="${c}"/>
        <!-- 吸入管 in（左，贯穿蜗壳直通泵内，直连泵体） -->
        <rect x="0" y="${cy-3}" width="${cx-R*0.4}" height="6" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="0" y="${cy-5}" width="${flangeW}" height="10" rx="1" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        <rect x="0" y="${cy-5}" width="${flangeW}" height="2" fill="rgba(255,255,255,0.06)"/>
        ${bolt(2,cy-3,1)}${bolt(2,cy+3,1)}
        <!-- 排出管 out（右，贯穿蜗壳直通泵内，直连泵体） -->
        <rect x="${cx+R*0.4}" y="${cy-3}" width="${w-(cx+R*0.4)}" height="6" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="${w-flangeW}" y="${cy-5}" width="${flangeW}" height="10" rx="1" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        <rect x="${w-flangeW}" y="${cy-5}" width="${flangeW}" height="2" fill="rgba(255,255,255,0.06)"/>
        ${bolt(w-2,cy-3,1)}${bolt(w-2,cy+3,1)}
        <!-- 水流粒子：进口 4 颗流入泵内 -->
        ${[0,0.25,0.5,0.75].map((ph)=>{
          const travel = cx - R*0.5 - 3;
          return `<g><circle cx="3" cy="${cy}" r="1.8" fill="#6ecbf5" opacity="0.85">
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0 0;${travel} 0;${travel} 0" keyTimes="0;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
          </circle></g>`;
        }).join('')}
        <!-- 水流粒子：出口 4 颗从泵内流出 -->
        ${[0,0.25,0.5,0.75].map((ph)=>{
          const start = cx + R*0.5;
          const travel = (w-3) - start;
          return `<g><circle cx="${start}" cy="${cy}" r="1.8" fill="#6ecbf5" opacity="0.85">
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate" values="0 0;${travel} 0;${travel} 0" keyTimes="0;0.8;1" dur="2.4s" begin="${ph*2.4}s" repeatCount="indefinite"/>
          </circle></g>`;
        }).join('')}
      `;
    }
  },
  motor: {
    name: '电机', category: '阀门管件',
    defaultSize: { w: 50, h: 50 },
    ports: [{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>`
      <circle cx="${w/2}" cy="${h/2}" r="${w*0.42}" class="equip-body" stroke="${p.color}"/>
      <text x="${w/2}" y="${h/2+5}" text-anchor="middle" fill="${p.color}" font-size="${w*0.4}" font-weight="700" font-family="inherit">M</text>`
  },
  instrument: {
    name: '仪表', category: '仪表',
    defaultSize: { w: 44, h: 44 },
    ports: [{id:'port',x:.5,y:1,dir:'down'}],
    render: (w,h,p)=>`
      <circle cx="${w/2}" cy="${h/2}" r="${w*0.44}" class="equip-body" stroke="${p.color}"/>
      <text x="${w/2}" y="${h/2+4}" text-anchor="middle" fill="${p.color}" font-size="${w*0.3}" font-weight="700" font-family="inherit">${(p.tag||'??').slice(0,2)}</text>`
  },
  box: {
    name: '通用方框', category: '通用',
    defaultSize: { w: 100, h: 80 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>`<rect x="0" y="0" width="${w}" height="${h}" rx="4" class="equip-body" stroke="${p.color}"/>`
  },
  circle: {
    name: '通用圆罐', category: '通用',
    defaultSize: { w: 90, h: 90 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>`<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" class="equip-body" stroke="${p.color}"/>`
  },
  hopper: {
    name: '漏斗', category: '通用',
    defaultSize: { w: 90, h: 90 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'}],
    render: (w,h,p)=>`<polygon points="0,0 ${w},0 ${w*0.7},${h} ${w*0.3},${h}" class="equip-body" stroke="${p.color}"/>`
  },
  heater: {
    name: '加热炉/燃烧炉', category: '设备',
    defaultSize: { w: 100, h: 140 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'fuel',x:0,y:.8,dir:'left'}],
    render: (w,h,p)=>`
      <rect x="0" y="${h*0.15}" width="${w}" height="${h*0.7}" rx="3" class="equip-body" stroke="${p.color}"/>
      <polygon points="${w*0.15},${h*0.15} ${w*0.85},${h*0.15} ${w*0.7},0 ${w*0.3},0" class="equip-body" stroke="${p.color}"/>
      <rect x="0" y="${h*0.85}" width="${w}" height="${h*0.15}" fill="#252545" stroke="${p.color}"/>
      <path d="M ${w*0.3} ${h*0.5} q ${w*0.1} -${h*0.15} ${w*0.2} 0 q ${w*0.1} ${h*0.15} ${w*0.2} 0" fill="none" stroke="${p.color}" stroke-width="2"/>
      <!-- 动态火焰 -->
      <g>
        <path d="M ${w*0.5} ${h*0.82} Q ${w*0.38} ${h*0.7} ${w*0.5} ${h*0.58} Q ${w*0.62} ${h*0.7} ${w*0.5} ${h*0.82}" fill="#FF6B3D" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.35;0.85" dur="0.5s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="0.6s" repeatCount="indefinite"/>
        </path>
        <path d="M ${w*0.38} ${h*0.82} Q ${w*0.28} ${h*0.73} ${w*0.38} ${h*0.65} Q ${w*0.46} ${h*0.73} ${w*0.38} ${h*0.82}" fill="#FF9A3D" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.4s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.5s" repeatCount="indefinite"/>
        </path>
        <path d="M ${w*0.62} ${h*0.82} Q ${w*0.72} ${h*0.73} ${w*0.62} ${h*0.65} Q ${w*0.54} ${h*0.73} ${w*0.62} ${h*0.82}" fill="#FFAA00" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.6s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.7s" repeatCount="indefinite"/>
        </path>
      </g>
      <path d="M ${w*0.3} ${h*0.7} q ${w*0.1} -${h*0.1} ${w*0.2} 0 q ${w*0.1} ${h*0.1} ${w*0.2} 0" fill="none" stroke="#FF6B3D" stroke-width="2" opacity="0.3"/>`
  },
  blower: {
    name: '离心风机/鼓风机', category: '设备',
    defaultSize: { w: 150, h: 130 },
    ports: [{id:'in',x:0,y:.56,dir:'left'},{id:'out',x:.52,y:0,dir:'up'}],
    render: (w,h,p)=>{
      const c = p.color;
      const cx = w*0.52;
      const cy = h*0.56;
      const R = Math.min(w,h)*0.32;
      const inDia = w*0.20;
      const outW = w*0.30;
      const outH = h*0.24;
      const outX = cx - outW/2;
      const outY = h*0.09;
      const inX = w*0.03;
      const inY = cy;
      const impellerR = R*0.70;
      const hubR = R*0.20;

      // 蜗壳型线（蜗牛形 - 4段等距扩张近似）
      const volutePoints = [];
      const segments = 72;
      for(let i=0; i<=segments; i++){
        const angle = (i/segments) * Math.PI * 1.85 - Math.PI*0.25;
        const seg4 = Math.floor(i/(segments/4));
        const t4 = (i%(segments/4))/(segments/4);
        const r = R * (1 + (seg4 + t4)*0.11);
        volutePoints.push({x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r});
      }
      const tongueX = cx - R*0.08;
      const tongueY = cy + R*0.05;
      const volutePathD = [
        `M ${outX} ${outY}`,
        `L ${outX} ${outY+outH}`,
        `Q ${cx-R*0.25} ${cy+R*0.15} ${tongueX} ${tongueY}`,
        ...volutePoints.map(pt=>`L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`),
        `Q ${cx+R*0.3} ${cy-R*0.1} ${outX+outW} ${outY+outH}`,
        `L ${outX+outW} ${outY}`,
        'Z'
      ].join(' ');

      // 进风口（收敛集风器 + 法兰）
      const inlet = `
        <path d="M ${inX} ${inY-inDia/2} Q ${inX+R*0.3} ${inY-inDia*0.15} ${cx-R*0.62} ${inY-inDia*0.32} L ${cx-R*0.62} ${inY+inDia*0.32} Q ${inX+R*0.3} ${inY+inDia*0.15} ${inX} ${inY+inDia/2} Z" fill="#1a1835" stroke="${c}" stroke-width="1.3"/>
        <rect x="${inX-4}" y="${inY-inDia/2-3}" width="5" height="${inDia+6}" rx="1" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>`;

      // 出风口（加大直管段 + 法兰）
      const outlet = `
        <rect x="${outX}" y="${outY}" width="${outW}" height="${outH}" fill="#1a1835" stroke="${c}" stroke-width="1.5"/>
        <rect x="${outX-6}" y="${outY-5}" width="${outW+12}" height="6" rx="1" fill="#1a1835" stroke="${c}" stroke-width="1.2"/>`;

      // 叶轮（后弯式离心叶片，连续旋转）
      const bladeCount = 8;
      let blades = '';
      for(let i=0; i<bladeCount; i++){
        const angle = (i/bladeCount) * Math.PI*2;
        const b1a = angle + 0.15, b2a = angle + 0.65, b3a = angle + 0.75, b4a = angle + 0.08;
        blades += `<polygon points="${(cx+Math.cos(b1a)*hubR).toFixed(1)},${(cy+Math.sin(b1a)*hubR).toFixed(1)} ${(cx+Math.cos(b2a)*impellerR).toFixed(1)},${(cy+Math.sin(b2a)*impellerR).toFixed(1)} ${(cx+Math.cos(b3a)*impellerR*0.97).toFixed(1)},${(cy+Math.sin(b3a)*impellerR*0.97).toFixed(1)} ${(cx+Math.cos(b4a)*hubR*1.05).toFixed(1)},${(cy+Math.sin(b4a)*hubR*1.05).toFixed(1)}" fill="${c}" opacity="0.4" stroke="${c}" stroke-width="0.5"/>`;
      }
      const impeller = `
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="0.5s" repeatCount="indefinite"/>
          <circle cx="${cx}" cy="${cy}" r="${impellerR}" fill="#0f0d24" stroke="${c}" stroke-width="0.8" opacity="0.9"/>
          ${blades}
          <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="#1a1835" stroke="${c}" stroke-width="1"/>
        </g>`;

      return `
        <!-- 蜗壳后壁（深色底） -->
        <path d="${volutePathD}" fill="#0d0b20" stroke="${c}" stroke-width="1.8"/>
        <!-- 叶轮室 -->
        <circle cx="${cx}" cy="${cy}" r="${R*0.76}" fill="#0a0818" opacity="0.85"/>
        ${inlet}
        ${outlet}
        <!-- 蜗壳外壳 -->
        <path d="${volutePathD}" fill="url(#gEquip)" opacity="0.55" stroke="none"/>
        <path d="${volutePathD}" fill="none" stroke="${c}" stroke-width="1.6"/>
        ${impeller}
      `;
    }
  },
  rotaryKiln: {
    name: '回转窑/旋转煅烧窑', category: '设备',
    defaultSize: { w: 380, h: 180 },
    ports: [
      // 进料口贴窑尾罩左壁（罩壁绝对位置 = w*0.12 - 24，按默认尺寸 w=380 折算为 0.057）
      {id:'inlet',x:.057,y:.44,dir:'left'},
      {id:'outlet',x:1,y:.76,dir:'right'},
      {id:'fuel',x:1,y:.55,dir:'right'},
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

      // 1. 混凝土基础底座（托轮/传动下方4个墩）
      let foundations = '';
      const foundXs = [
        {x:h_drumL+h_drumW*0.22, w:44},
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
      const tailHoodW=24, tailHoodX=h_drumL;
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
      const headHoodW=28, headHoodX=h_drumR;
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

      // 13. 燃烧器/喷煤管（长度自适应到右边缘，小车在地面轨道上支撑）
      const burnerX=headHoodX+headHoodW+6;
      const burnerLen=w-burnerX-4;
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
        <!-- 燃烧器主体管 -->
        <rect x="${burnerX-5}" y="${h_cy-5}" width="${burnerLen}" height="10" rx="2" fill="url(#gEquip)" stroke="${c}" stroke-width="1"/>
        <rect x="${burnerX+burnerLen-1}" y="${h_cy-7}" width="5" height="14" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        ${boltPair(burnerX+burnerLen+1.5, h_cy, 10, 1.2)}
        <ellipse cx="${burnerX-3}" cy="${h_cy}" rx="3" ry="6" fill="#151330" stroke="${c}" stroke-width="0.8"/>
        <circle cx="${burnerX+burnerLen*0.35}" cy="${h_cy}" r="2.5" fill="#0d0b20" stroke="${c}" stroke-width="0.5"/>`;

      // 14. 火焰
      const flameStartX = headHoodX+headHoodW-8;
      let flames = '';
      for(let fi=0;fi<3;fi++){
        const fBaseY=h_cy+(fi-1)*3, fDelay=-(fi*0.4).toFixed(2);
        let fl=[], ft=[], fr=[], fo=[];
        for(let k=0;k<=16;k++){
          const t=k/16;
          fl.push((flameStartX-t*80-Math.sin(t*4+fi)*4).toFixed(1));
          ft.push((fBaseY+Math.sin(t*3+fi*1.5)*4*(1-t*0.5)).toFixed(1));
          fr.push((6-t*4).toFixed(1)); fo.push((0.8-t*0.6).toFixed(2));
        }
        flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.7}" fill="#ff8020" opacity="${fo[0]}" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${fl.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ft.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${fr.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fo.join(';')}" dur="1.8s" begin="${fDelay}s" repeatCount="indefinite"/>
        </ellipse>`;
      }
      for(let fi=0;fi<2;fi++){
        const fBaseY=h_cy+(fi-0.5)*2, fDelay=-(fi*0.3+0.2).toFixed(2);
        let fl=[], ft=[], fr=[], fo=[];
        for(let k=0;k<=12;k++){
          const t=k/12;
          fl.push((flameStartX-t*50-Math.sin(t*5+fi)*2).toFixed(1));
          ft.push((fBaseY+Math.sin(t*4+fi)*2*(1-t*0.4)).toFixed(1));
          fr.push((3-t*2).toFixed(1)); fo.push((0.9-t*0.7).toFixed(2));
        }
        flames += `<ellipse cx="${fl[0]}" cy="${ft[0]}" rx="${fr[0]}" ry="${fr[0]*0.6}" fill="#ffdd44" opacity="${fo[0]}" clip-path="url(#${h_clipIdInner})">
          <animate attributeName="cx" values="${fl.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="${ft.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${fr.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${fo.join(';')}" dur="1.2s" begin="${fDelay}s" repeatCount="indefinite"/>
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

      // 16. 热辐射+高温带
      const heatGlow = `
        <ellipse cx="${(h_drumL+h_drumR)/2}" cy="${h_cy}" rx="${h_drumW/2-20}" ry="${h_R+2}" fill="url(#${kilnShadeId})" opacity="0.15"/>
        <rect x="${h_drumR-100}" y="${h_drumTop+5}" width="80" height="${h_R*2-10}" rx="${h_R*0.2}" ry="${h_R-5}" fill="#ff4020" opacity="0.08" clip-path="url(#${h_clipIdInner})"/>`;

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
        ${heatGlow}${drumBody}${tempOverlay}${weldRings}${tires}${h_girthGear}
        ${refractory}${flights}${materialParticles}${flames}
        ${rotMarks}${ringBolts}
        ${h_driveSystem}
        ${headHood}${burner}${instruments}${nameplate}
      `;
    }
  },
  switchValve: {
    name: '固体三通阀', category: '阀门管件',
    defaultSize: { w: 120, h: 150 },
    ports: [{id:'inlet',x:.5,y:0,dir:'up'},{id:'outletA',x:.3,y:1,dir:'down'},{id:'outletB',x:.7,y:1,dir:'down'}],
    render: (w,h,p)=>{
      // 老数据/已导出文档兼容：controlMode 默认 manual，sensorA/B 默认空串
      p.controlMode = p.controlMode || 'manual';
      p.sensorA = p.sensorA || '';
      p.sensorB = p.sensorB || '';
      const active = (p.switchValve===0 || p.switchValve===1) ? p.switchValve : 0;
      const cx = w/2;
      const topY = h*0.08;
      const splitY = h*0.42;
      const midY = h*0.35;
      const outletY = h*0.88;
      const outAX = w*0.3;
      const outBX = w*0.7;
      const bodyColor = p.color;

      const inW = w*0.22;
      const outW = w*0.2;
      const pipeThick = w*0.18;
      const splitW = w*0.5;

      const inlet = `
        <rect x="${cx-inW/2}" y="${topY}" width="${inW}" height="${midY-topY+8}" fill="url(#gEquip)" stroke="${bodyColor}" stroke-width="1.5"/>
        <rect x="${cx-inW/2+2}" y="${topY+2}" width="${inW-4}" height="${midY-topY+4}" fill="#0f0e22" opacity="0.4"/>
        <rect x="${cx-inW/2-4}" y="${topY-3}" width="${inW+8}" height="5" fill="#161534" stroke="${bodyColor}" stroke-width="1"/>`;

      const splitArea = `
        <polygon points="${cx},${midY} ${cx+splitW/2},${splitY} ${cx},${h*0.58} ${cx-splitW/2},${splitY}" fill="url(#gEquip)" stroke="${bodyColor}" stroke-width="1.5"/>
        <polygon points="${cx},${midY+4} ${cx+splitW/2-4},${splitY-2} ${cx},${h*0.55} ${cx-splitW/2+4},${splitY-2}" fill="#1a1a3a" opacity="0.6"/>`;

      const leftBranch = `
        <polygon points="${cx-splitW/2},${splitY} ${outAX-outW/2},${outletY-8} ${outAX-outW/2},${outletY} ${cx-splitW/2+pipeThick/2},${splitY+4}" fill="url(#gEquip)" stroke="${bodyColor}" stroke-width="1.5"/>
        <polygon points="${cx-splitW/2+3},${splitY+2} ${outAX-outW/2+3},${outletY-6} ${outAX-outW/2+3},${outletY-2} ${cx-splitW/2+pipeThick/2-3},${splitY+6}" fill="#0f0e22" opacity="0.4"/>`;

      const rightBranch = `
        <polygon points="${cx+splitW/2},${splitY} ${outBX+outW/2},${outletY-8} ${outBX+outW/2},${outletY} ${cx+splitW/2-pipeThick/2},${splitY+4}" fill="url(#gEquip)" stroke="${bodyColor}" stroke-width="1.5"/>
        <polygon points="${cx+splitW/2-3},${splitY+2} ${outBX+outW/2-3},${outletY-6} ${outBX+outW/2-3},${outletY-2} ${cx+splitW/2-pipeThick/2+3},${splitY+6}" fill="#0f0e22" opacity="0.4"/>`;

      const outFlangeA = `
        <rect x="${outAX-outW/2-3}" y="${outletY-2}" width="${outW+6}" height="5" fill="#161534" stroke="${bodyColor}" stroke-width="1"/>
        <rect x="${outAX-outW/2+2}" y="${outletY+3}" width="${outW-4}" height="4" fill="#0f0e22" stroke="${bodyColor}" stroke-width="0.8"/>`;

      const outFlangeB = `
        <rect x="${outBX-outW/2-3}" y="${outletY-2}" width="${outW+6}" height="5" fill="#161534" stroke="${bodyColor}" stroke-width="1"/>
        <rect x="${outBX-outW/2+2}" y="${outletY+3}" width="${outW-4}" height="4" fill="#0f0e22" stroke="${bodyColor}" stroke-width="0.8"/>`;

      const pivotX = cx;
      const pivotY = splitY - 2;
      const flapAngle = active===0 ? 35 : -35;
      const flapLen = splitW*0.38;
      const flapRad = flapAngle * Math.PI / 180;
      const flapTipX = pivotX + Math.sin(flapRad) * flapLen;
      const flapTipY = pivotY + Math.cos(flapRad) * flapLen;
      const flapW = pipeThick*0.35;
      const flapPerpX = Math.cos(flapRad) * flapW;
      const flapPerpY = -Math.sin(flapRad) * flapW;

      const flap = `
        <polygon points="${pivotX},${pivotY-flapW*0.3} ${flapTipX+flapPerpX},${flapTipY+flapPerpY} ${flapTipX-flapPerpX},${flapTipY-flapPerpY}" fill="${bodyColor}" opacity="0.85" stroke="${bodyColor}" stroke-width="1"/>
        <circle cx="${pivotX}" cy="${pivotY}" r="4" fill="#161534" stroke="${bodyColor}" stroke-width="1.2"/>
        <circle cx="${pivotX}" cy="${pivotY}" r="1.5" fill="${bodyColor}" opacity="0.6"/>`;

      const blockA = active===1 ? `
        <line x1="${cx-splitW/4}" y1="${splitY+8}" x2="${cx-splitW/4+6}" y2="${splitY+14}" stroke="#FF5555" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
        <line x1="${cx-splitW/4+6}" y1="${splitY+8}" x2="${cx-splitW/4}" y2="${splitY+14}" stroke="#FF5555" stroke-width="2" stroke-linecap="round" opacity="0.8"/>` : '';
      const blockB = active===0 ? `
        <line x1="${cx+splitW/4-6}" y1="${splitY+8}" x2="${cx+splitW/4}" y2="${splitY+14}" stroke="#FF5555" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
        <line x1="${cx+splitW/4}" y1="${splitY+8}" x2="${cx+splitW/4-6}" y2="${splitY+14}" stroke="#FF5555" stroke-width="2" stroke-linecap="round" opacity="0.8"/>` : '';

      let particles = '';
      const pCount = 4;
      const targetX = active===0 ? outAX : outBX;
      for(let i=0; i<pCount; i++){
        const delay = (i/pCount * 2.2).toFixed(2);
        particles += `
          <circle r="2.5" fill="${bodyColor}" opacity="0">
            <animate attributeName="cx" values="${cx};${cx};${targetX}" keyTimes="0;0.35;1" dur="2.2s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${topY+6};${splitY+8};${outletY}" keyTimes="0;0.35;1" dur="2.2s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="2.2s" begin="-${delay}s" repeatCount="indefinite"/>
          </circle>`;
      }

      const actX = cx + splitW/2 + 8;
      const actY = splitY - 5;
      const actuator = `
        <rect x="${actX-3}" y="${actY-12}" width="6" height="24" rx="2" fill="#161534" stroke="${bodyColor}" stroke-width="1"/>
        <rect x="${actX-2}" y="${active===0 ? actY-10 : actY+4}" width="4" height="8" fill="${bodyColor}" opacity="0.8"/>
        <line x1="${active===0 ? actX+8 : actX-8}" y1="${actY}" x2="${active===0 ? actX+14 : actX-14}" y2="${actY}" stroke="${bodyColor}" stroke-width="2" stroke-linecap="round"/>
        <polygon points="${active===0 ? `${actX+14},${actY-4} ${actX+20},${actY} ${actX+14},${actY+4}` : `${actX-14},${actY-4} ${actX-20},${actY} ${actX-14},${actY+4}`}" fill="${bodyColor}" opacity="0.6"/>`;

      // AUTO 模式标识：仅在 controlMode==='auto' 时显示在阀门顶部
      const autoBadge = (p.controlMode==='auto')
        ? `<g>
        <rect x="${cx-22}" y="-1" width="44" height="11" rx="3" fill="#00E5FF" opacity="0.18"/>
        <text x="${cx}" y="7.5" font-size="8.5" font-weight="700" font-family="inherit" fill="#00E5FF" text-anchor="middle">AUTO</text>
      </g>` : '';

      return `
        ${autoBadge}
        ${inlet}
        ${splitArea}
        ${leftBranch}
        ${rightBranch}
        ${outFlangeA}
        ${outFlangeB}
        ${flap}
        ${blockA}
        ${blockB}
        ${actuator}
        ${particles}
      `;
    }
  },
  dustCollector: {
    name: '除尘布袋', category: '设备',
    defaultSize: { w: 120, h: 180 },
    ports: [{id:'inlet',x:.5,y:0,dir:'up'},{id:'outlet',x:.5,y:1,dir:'down'},{id:'cleanGas',x:0,y:.3,dir:'left'}],
    render: (w,h,p)=>{
      const c = p.color;
      const cx = w/2;
      const edgePad = 2;
      const topY = edgePad + 8;
      const bodyTopY = h*0.16;
      const bodyBotY = h*0.55;
      const hopperTopY = bodyBotY;
      const hopperBotY = h*0.85;
      const outletY = h - edgePad - 6;
      const inletW = w*0.25;
      const outletW = w*0.16;   // 底部出料口宽度（比进气口窄，灰斗收口更尖）
      const bodyW = w*0.85;
      const wallT = w*0.05;

      // 法兰螺栓
      const bolt = (bx,by)=>`<circle cx="${bx}" cy="${by}" r="1.8" fill="#0d0b20" stroke="${c}" stroke-width="0.5"/><circle cx="${bx}" cy="${by}" r="0.7" fill="${c}" opacity="0.4"/>`;

      // 进气口法兰
      const inlet = `
        <rect x="${cx-inletW/2-wallT}" y="${topY-3}" width="${inletW+wallT*2}" height="5" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <rect x="${cx-inletW/2}" y="${topY+2}" width="${inletW}" height="${bodyTopY-topY-2}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <circle cx="${cx}" cy="${topY}" r="${inletW/2-1}" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>
        ${bolt(cx-inletW/2+3, topY-1)}
        ${bolt(cx-inletW/2+inletW/2, topY-1)}
        ${bolt(cx+inletW/2-3, topY-1)}`;

      // 脉冲清灰装置（嵌入顶部）
      const pulseW = w*0.28;
      const pulseX = cx - pulseW/2;
      const pulseY = topY + 3;
      const pulse = `
        <rect x="${pulseX}" y="${pulseY}" width="${pulseW}" height="3" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <circle cx="${pulseX+pulseW*0.25}" cy="${pulseY+1.5}" r="1.8" fill="none" stroke="${c}" stroke-width="0.5"/>
        <circle cx="${pulseX+pulseW*0.75}" cy="${pulseY+1.5}" r="1.8" fill="none" stroke="${c}" stroke-width="0.5"/>`;

      // 主箱体
      const bodyLeft = cx - bodyW/2;
      const bodyRight = cx + bodyW/2;
      const box = `
        <!-- 后壁 -->
        <rect x="${bodyLeft-wallT}" y="${bodyTopY}" width="${bodyW+wallT*2}" height="${bodyBotY-bodyTopY}" fill="#0d0b20" stroke="${c}" stroke-width="1.5"/>
        <!-- 主体 -->
        <rect x="${bodyLeft}" y="${bodyTopY}" width="${bodyW}" height="${bodyBotY-bodyTopY}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.5"/>
        <!-- 内部深色层 -->
        <rect x="${bodyLeft+3}" y="${bodyTopY+3}" width="${bodyW-6}" height="${bodyBotY-bodyTopY-6}" fill="#0a0818" opacity="0.5"/>
        <!-- 顶法兰 -->
        <rect x="${bodyLeft-wallT}" y="${bodyTopY-3}" width="${bodyW+wallT*2}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        <!-- 顶法兰螺栓 -->
        ${bolt(bodyLeft-wallT/2, bodyTopY-1)}
        ${bolt(bodyLeft+bodyW/4, bodyTopY-1)}
        ${bolt(bodyLeft+bodyW*3/4, bodyTopY-1)}
        ${bolt(bodyRight+wallT/2, bodyTopY-1)}
        <!-- 底法兰 -->
        <rect x="${bodyLeft-wallT}" y="${bodyBotY-1}" width="${bodyW+wallT*2}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        ${bolt(bodyLeft-wallT/2, bodyBotY+1)}
        ${bolt(bodyLeft+bodyW/4, bodyBotY+1)}
        ${bolt(bodyLeft+bodyW*3/4, bodyBotY+1)}
        ${bolt(bodyRight+wallT/2, bodyBotY+1)}`;

      // 内部滤袋
      const bagCount = 6;
      const bagSpacing = (bodyW - 10) / bagCount;
      let bags = '';
      for(let i=0; i<bagCount; i++){
        const bx = bodyLeft + 5 + bagSpacing*i + bagSpacing/2;
        const bagTop = bodyTopY + 6;
        const bagBot = bodyBotY - 4;
        const bagW = bagSpacing * 0.5;
        const bagLines = [];
        bagLines.push(`<line x1="${bx-bagW/2}" y1="${bagTop}" x2="${bx-bagW/2}" y2="${bagBot}" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`);
        bagLines.push(`<line x1="${bx+bagW/2}" y1="${bagTop}" x2="${bx+bagW/2}" y2="${bagBot}" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`);
        for(let j=1; j<6; j++){
          const ly = bagTop + (bagBot-bagTop)*j/6;
          bagLines.push(`<line x1="${bx-bagW/2}" y1="${ly}" x2="${bx+bagW/2}" y2="${ly}" stroke="${c}" stroke-width="0.4" opacity="0.3"/>`);
        }
        bagLines.push(`<rect x="${bx-bagW/2-1}" y="${bagTop-2}" width="${bagW+2}" height="2" rx="0.5" fill="${c}" opacity="0.4"/>`);
        bags += bagLines.join('');
      }

      // 滤袋支架
      const frame = `
        <line x1="${bodyLeft+4}" y="${bodyTopY+4}" x2="${bodyRight-4}" y2="${bodyTopY+4}" stroke="${c}" stroke-width="1" opacity="0.5"/>
        <line x1="${bodyLeft+4}" y="${bodyTopY+4}" x2="${bodyLeft+4}" y2="${bodyBotY-4}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>
        <line x1="${bodyRight-4}" y="${bodyTopY+4}" x2="${bodyRight-4}" y2="${bodyBotY-4}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>`;

      // 灰斗
      const hopperLeft = bodyLeft + bodyW*0.1;
      const hopperRight = bodyRight - bodyW*0.1;
      const hopper = `
        <polygon points="${hopperLeft-wallT},${hopperTopY} ${hopperRight+wallT},${hopperTopY} ${cx-outletW/2},${hopperBotY} ${cx+outletW/2},${hopperBotY}" fill="#0d0b20" stroke="${c}" stroke-width="1.5"/>
        <polygon points="${hopperLeft},${hopperTopY} ${hopperRight},${hopperTopY} ${cx-outletW/2+2},${hopperBotY-2} ${cx+outletW/2-2},${hopperBotY-2}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <polygon points="${hopperLeft+3},${hopperTopY+2} ${hopperRight-3},${hopperTopY+2} ${cx-outletW/2+4},${hopperBotY-4} ${cx+outletW/2-4},${hopperBotY-4}" fill="#0a0818" opacity="0.4"/>`;

      // 星型卸料阀
      const starH = h*0.05;
      const starW = outletW * 1.2;
      const starY = outletY - starH;
      const starValve = `
        <rect x="${cx-starW/2}" y="${starY}" width="${starW}" height="${starH}" rx="2" fill="url(#gEquip)" stroke="${c}" stroke-width="1"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${starY+starH/2}" to="360 ${cx} ${starY+starH/2}" dur="3s" repeatCount="indefinite"/>
          <polygon points="${cx},${starY+starH*0.15} ${cx+starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.35}" fill="${c}" opacity="0.7"/>
          <polygon points="${cx+starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.65} ${cx-starW*0.15},${starY+starH*0.45}" fill="${c}" opacity="0.6"/>
          <polygon points="${cx},${starY+starH*0.65} ${cx-starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.45}" fill="${c}" opacity="0.5"/>
          <polygon points="${cx-starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.35} ${cx+starW*0.15},${starY+starH*0.55}" fill="${c}" opacity="0.6"/>
          <circle cx="${cx}" cy="${starY+starH/2}" r="2" fill="${c}" opacity="0.8"/>
        </g>`;

      // 出料口法兰
      const outletFlange = `
        <rect x="${cx-outletW/2-wallT}" y="${starY}" width="${outletW+wallT*2}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <rect x="${cx-outletW/2}" y="${outletY}" width="${outletW}" height="${h-outletY-edgePad}" fill="url(#gEquip)" stroke="${c}" stroke-width="1"/>
        ${bolt(cx-outletW/2+3, starY+2)}
        ${bolt(cx+outletW/2-3, starY+2)}`;

      // 净化气出口
      const cleanPortY = bodyTopY + (bodyBotY-bodyTopY)*0.3;
      const cleanPort = `
        <rect x="${bodyLeft-wallT-8}" y="${cleanPortY-3}" width="8" height="6" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <circle cx="${bodyLeft-wallT-4}" cy="${cleanPortY}" r="1.5" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>`;

      // 灰尘颗粒动画
      const clipId = `clip_dust_${Math.random().toString(36).substr(2,6)}`;
      let dustParticles = '';
      for(let i=0; i<8; i++){
        const delay = (i*0.6).toFixed(2);
        const startX = bodyLeft + 10 + (i/8)*(bodyW-20);
        let pxVals = [], pyVals = [], popVals = [];
        const phases = 30;
        for(let k=0; k<=phases; k++){
          const t = k/phases;
          let y, x, op;
          if(t < 0.55){
            const bodyT = t/0.55;
            y = bodyTopY+8 + (bodyBotY-8 - (bodyTopY+8))*bodyT;
            x = startX + Math.sin(bodyT*Math.PI*2 + i)*6;
            op = bodyT < 0.15 ? bodyT/0.15*0.6 : 0.6;
          } else {
            const hopperT = (t-0.55)/0.45;
            y = bodyBotY-8 + (hopperBotY-6 - (bodyBotY-8))*hopperT;
            const currentHopperHalfW = (hopperRight - hopperLeft)/2 - ((hopperRight - hopperLeft)/2 - outletW/2 + 2)*hopperT;
            const relX = (startX - cx)/((bodyW-20)/2);
            x = cx + relX*currentHopperHalfW*0.85 + Math.sin(hopperT*Math.PI*3 + i)*2;
            op = hopperT > 0.85 ? (1-hopperT)/0.15*0.6 : 0.6;
          }
          pxVals.push(x.toFixed(1));
          pyVals.push(y.toFixed(1));
          popVals.push(op.toFixed(2));
        }
        dustParticles += `
          <circle cx="${pxVals[0]}" cy="${pyVals[0]}" r="1.3" fill="${c}" clip-path="url(#${clipId})" opacity="${popVals[0]}">
            <animate attributeName="cx" values="${pxVals.join(';')}" dur="4.5s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${pyVals.join(';')}" dur="4.5s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${popVals.join(';')}" dur="4.5s" begin="-${delay}s" repeatCount="indefinite"/>
          </circle>`;
      }

      // 脉冲喷吹动画
      let pulseDust = '';
      for(let i=0; i<3; i++){
        const delay = (i*0.4).toFixed(2);
        const offset = (i-1)*6;
        pulseDust += `
          <circle cx="${cx+offset}" cy="${bodyTopY+6}" r="1" fill="#fff" clip-path="url(#${clipId})" opacity="0">
            <animate attributeName="cy" values="${bodyTopY+6};${bodyTopY+18};${bodyTopY+6}" keyTimes="0;0.5;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cx" values="${cx+offset};${cx+offset+(i-1)*8};${cx+offset}" keyTimes="0;0.5;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.6;0" keyTimes="0;0.3;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/>
          </circle>`;
      }

      // 铭牌
      const nameplate = `
        <rect x="${bodyRight-28}" y="${bodyTopY+8}" width="24" height="10" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${bodyRight-16}" y="${bodyTopY+16}" text-anchor="middle" fill="${c}" font-size="5" opacity="0.6">MC-3000</text>`;

      // clipPath：主体矩形 + 漏斗区域
      const clipDef = `<clipPath id="${clipId}">
        <rect x="${bodyLeft+1}" y="${bodyTopY+1}" width="${bodyW-2}" height="${bodyBotY-bodyTopY-2}"/>
        <polygon points="${hopperLeft+1},${hopperTopY} ${hopperRight-1},${hopperTopY} ${cx+outletW/2-3},${hopperBotY-3} ${cx-outletW/2+3},${hopperBotY-3}"/>
      </clipPath>`;

      return `
        <defs>${clipDef}</defs>
        ${inlet}
        ${pulse}
        <!-- 1. 设备后壁 -->
        <rect x="${bodyLeft-wallT}" y="${bodyTopY}" width="${bodyW+wallT*2}" height="${bodyBotY-bodyTopY}" fill="#0d0b20" stroke="${c}" stroke-width="1.5"/>
        <polygon points="${hopperLeft-wallT},${hopperTopY} ${hopperRight+wallT},${hopperTopY} ${cx-outletW/2},${hopperBotY} ${cx+outletW/2},${hopperBotY}" fill="#0d0b20" stroke="${c}" stroke-width="1.5"/>
        <!-- 2. 设备主体金属填充 -->
        <rect x="${bodyLeft}" y="${bodyTopY}" width="${bodyW}" height="${bodyBotY-bodyTopY}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.5"/>
        <polygon points="${hopperLeft},${hopperTopY} ${hopperRight},${hopperTopY} ${cx-outletW/2+2},${hopperBotY-2} ${cx+outletW/2-2},${hopperBotY-2}" fill="url(#gEquip)" stroke="${c}" stroke-width="1.2"/>
        <!-- 3. 内部深色层（覆盖主体+漏斗） -->
        <g clip-path="url(#${clipId})">
          <rect x="${bodyLeft+3}" y="${bodyTopY+3}" width="${bodyW-6}" height="${(hopperBotY-bodyTopY)-6}" fill="#0a0818" opacity="0.55"/>
        </g>
        <!-- 4. 内部内容（滤袋、支架、粒子）——带裁剪，不会溢出 -->
        <g clip-path="url(#${clipId})">
          ${frame}
          ${bags}
          ${dustParticles}
          ${pulseDust}
        </g>
        <!-- 5. 法兰和前景元素 -->
        <rect x="${bodyLeft-wallT}" y="${bodyTopY-3}" width="${bodyW+wallT*2}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        ${bolt(bodyLeft-wallT/2, bodyTopY-1)}
        ${bolt(bodyLeft+bodyW/4, bodyTopY-1)}
        ${bolt(bodyLeft+bodyW*3/4, bodyTopY-1)}
        ${bolt(bodyRight+wallT/2, bodyTopY-1)}
        <rect x="${bodyLeft-wallT}" y="${bodyBotY-1}" width="${bodyW+wallT*2}" height="4" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="1"/>
        ${bolt(bodyLeft-wallT/2, bodyBotY+1)}
        ${bolt(bodyLeft+bodyW/4, bodyBotY+1)}
        ${bolt(bodyLeft+bodyW*3/4, bodyBotY+1)}
        ${bolt(bodyRight+wallT/2, bodyBotY+1)}
        ${cleanPort}
        ${starValve}
        ${outletFlange}
        ${nameplate}
      `;
    }
  },
  screwConveyor: {
    name: '螺旋输送机', category: '设备',
    defaultSize: { w: 200, h: 90 },
    ports: [{id:'inlet',x:0.3,y:0,dir:'up'},{id:'outlet',x:1,y:0.75,dir:'right'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      // 端板/槽体几何：两端端板与槽体法兰同高（统一高度带），避免两头宽中间窄
      const endW = 24;
      const bodyX = endW+3;
      const bodyW = w-endW*2-6;
      const bodyH = h*0.38;
      const bodyY = h*0.35;
      const cy = bodyY+bodyH/2;
      const boltsTop=[], boltsBot=[];
      const boltCount=Math.max(3,Math.floor(bodyW/22));
      for(let i=0;i<boltCount;i++){
        const bx=bodyX+bodyW*(i+0.5)/boltCount;
        boltsTop.push(`<circle cx="${bx}" cy="${bodyY-3}" r="1.5" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>`);
        boltsBot.push(`<circle cx="${bx}" cy="${bodyY+bodyH+3}" r="1.5" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>`);
      }
      const reversed = p.reverse || false;
      // 螺旋叶片：沿轴向排列椭圆截面，scaleY旋转 + 相位错开 = 螺旋推进
      const bladeCount=9;
      const bladeRy=bodyH*0.42;
      const bladeRx=Math.max(3, bodyW*0.05);
      let blades='';
      for(let i=0;i<bladeCount;i++){
        const bx=bodyX+8+(i+0.5)*(bodyW-16)/bladeCount;
        // 反转时相位相反
        const phase = reversed ? (i/bladeCount*2.2) : ((bladeCount-1-i)/bladeCount*2.2);
        blades+=`<g transform="translate(${bx} ${cy})"><g><animateTransform attributeName="transform" type="scale" values="1 1;1 0.08;1 -1;1 -0.08;1 1" keyTimes="0;0.25;0.5;0.75;1" dur="2.2s" begin="-${phase.toFixed(2)}s" repeatCount="indefinite"/><ellipse cx="0" cy="0" rx="${bladeRx}" ry="${bladeRy}" fill="${p.color}" fill-opacity="0.14" stroke="${p.color}" stroke-width="2"/></g></g>`;
      }
      // 物料粒子：沿轴向流动 + 上下摆动，增强螺旋前进感
      let particles='';
      const pCount=5;
      for(let i=0;i<pCount;i++){
        const delay=(i/pCount*3).toFixed(2);
        // 反转时方向相反
        const fromX = reversed ? (bodyX+bodyW-6) : (bodyX+6);
        const toX = reversed ? (bodyX+6) : (bodyX+bodyW-6);
        particles+=`<circle r="2.2" fill="${p.color}" opacity="0"><animate attributeName="cx" from="${fromX}" to="${toX}" dur="3s" begin="-${delay}s" repeatCount="indefinite"/><animate attributeName="cy" values="${(cy-bodyH*0.18).toFixed(1)};${(cy+bodyH*0.18).toFixed(1)};${(cy-bodyH*0.18).toFixed(1)}" keyTimes="0;0.5;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.12;0.88;1" dur="3s" begin="-${delay}s" repeatCount="indefinite"/></circle>`;
      }
      // 左端板（尾部）：法兰带 + 法兰螺栓 + 加强筋 + 尾轴承座
      const bossR = Math.max(3, Math.min(6.5, bodyH*0.19));
      const bossX = endW*0.42;
      const leftPlate = `
      <rect x="0" y="${bodyY-3}" width="${endW}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="0" y="${bodyY+bodyH}" width="${endW}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="0" y="${bodyY}" width="${endW}" height="${bodyH}" rx="2" fill="#1c1b40" stroke="${p.color}" stroke-width="1.5"/>
      <rect x="${endW-4}" y="${bodyY-2}" width="4" height="${bodyH+4}" fill="#161534" stroke="${p.color}" stroke-width="1"/>
      <line x1="5" y1="${bodyY+5}" x2="${endW-8}" y2="${bodyY+5}" stroke="${p.color}" stroke-width="0.6" opacity="0.35"/>
      <line x1="5" y1="${bodyY+bodyH-5}" x2="${endW-8}" y2="${bodyY+bodyH-5}" stroke="${p.color}" stroke-width="0.6" opacity="0.35"/>
      <circle cx="4.5" cy="${bodyY-3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="${endW-7}" cy="${bodyY-3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="4.5" cy="${bodyY+bodyH+3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="${endW-7}" cy="${bodyY+bodyH+3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="${bossX.toFixed(1)}" cy="${cy}" r="${bossR.toFixed(1)}" fill="#161534" stroke="${p.color}" stroke-width="1.3"/>
      <circle cx="${bossX.toFixed(1)}" cy="${cy}" r="1.6" fill="${p.color}" opacity="0.85"/>
      <circle cx="${(bossX-bossR-2.2).toFixed(1)}" cy="${cy}" r="1" fill="none" stroke="${p.color}" stroke-width="0.7" opacity="0.7"/>
      <circle cx="${(bossX+bossR+2.2).toFixed(1)}" cy="${cy}" r="1" fill="none" stroke="${p.color}" stroke-width="0.7" opacity="0.7"/>`;
      // 右端板（驱动端）：链传动整体收进端板高度内（双链轮 + 环链 + 旋转辐条）
      const spR = Math.max(3, Math.min(6, bodyH*0.18));
      const spX = w-endW/2;
      const sp1y = bodyY+bodyH*0.28, sp2y = bodyY+bodyH*0.72;
      const chainP=`M ${spX+spR} ${sp1y.toFixed(1)} L ${spX+spR} ${sp2y.toFixed(1)} A ${spR.toFixed(1)} ${spR.toFixed(1)} 0 0 1 ${spX-spR} ${sp2y.toFixed(1)} L ${spX-spR} ${sp1y.toFixed(1)} A ${spR.toFixed(1)} ${spR.toFixed(1)} 0 0 1 ${spX+spR} ${sp1y.toFixed(1)} Z`;
      let st1='', st2='';
      for(let i=0;i<6;i++){
        const a1=i*60*Math.PI/180, a2=(i*60+30)*Math.PI/180;
        st1+=`<line x1="${(spX+Math.cos(a1)*spR*0.35).toFixed(1)}" y1="${(sp1y+Math.sin(a1)*spR*0.35).toFixed(1)}" x2="${(spX+Math.cos(a1)*(spR-1)).toFixed(1)}" y2="${(sp1y+Math.sin(a1)*(spR-1)).toFixed(1)}" stroke="${p.color}" stroke-width="1"/>`;
        st2+=`<line x1="${(spX+Math.cos(a2)*spR*0.35).toFixed(1)}" y1="${(sp2y+Math.sin(a2)*spR*0.35).toFixed(1)}" x2="${(spX+Math.cos(a2)*(spR-1)).toFixed(1)}" y2="${(sp2y+Math.sin(a2)*(spR-1)).toFixed(1)}" stroke="${p.color}" stroke-width="1"/>`;
      }
      const rightPlate = `
      <rect x="${w-endW}" y="${bodyY-3}" width="${endW}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${w-endW}" y="${bodyY+bodyH}" width="${endW}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${w-endW}" y="${bodyY}" width="${endW}" height="${bodyH}" rx="2" fill="#1c1b40" stroke="${p.color}" stroke-width="1.5"/>
      <rect x="${w-endW}" y="${bodyY-2}" width="4" height="${bodyH+4}" fill="#161534" stroke="${p.color}" stroke-width="1"/>
      <circle cx="${w-4.5}" cy="${bodyY-3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="${w-endW+7}" cy="${bodyY-3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="${w-4.5}" cy="${bodyY+bodyH+3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <circle cx="${w-endW+7}" cy="${bodyY+bodyH+3}" r="1.3" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.7"/>
      <path d="${chainP}" fill="none" stroke="${p.color}" stroke-width="1.3" opacity="0.6" stroke-dasharray="3 2"/>
      <circle cx="${spX}" cy="${sp1y.toFixed(1)}" r="${spR.toFixed(1)}" fill="#161534" stroke="${p.color}" stroke-width="1.4"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 ${spX} ${sp1y.toFixed(1)}" to="360 ${spX} ${sp1y.toFixed(1)}" dur="1.5s" repeatCount="indefinite"/>
        ${st1}
      </g>
      <circle cx="${spX}" cy="${sp2y.toFixed(1)}" r="${spR.toFixed(1)}" fill="#161534" stroke="${p.color}" stroke-width="1.4"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360 ${spX} ${sp2y.toFixed(1)}" to="0 ${spX} ${sp2y.toFixed(1)}" dur="1.5s" repeatCount="indefinite"/>
        ${st2}
      </g>`;
      return `
      ${leftPlate}
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="2" fill="url(#gEquip)" stroke="${p.color}" stroke-width="1.5"/>
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH*0.55}" fill="#0f0e22" opacity="0.75" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${bodyX-2}" y="${bodyY-3}" width="${bodyW+4}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${bodyX-2}" y="${bodyY+bodyH}" width="${bodyW+4}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      ${boltsTop.join('')}
      ${boltsBot.join('')}
      <line x1="${bodyX+4}" y1="${cy}" x2="${bodyX+bodyW-4}" y2="${cy}" stroke="${p.color}" stroke-width="1.2" opacity="0.5"/>
      ${blades}
      ${particles}
      <rect x="${w*0.3-10}" y="${bodyY-10}" width="20" height="8" fill="#0a0a1a" stroke="${p.color}" stroke-width="1.2"/>
      <rect x="${w*0.3-14}" y="${bodyY-14}" width="28" height="4" fill="#1c1b40" stroke="${p.color}" stroke-width="1"/>
      <line x1="${w*0.3-12}" y1="${bodyY-2}" x2="${w*0.3+12}" y2="${bodyY-2}" stroke="${p.color}" stroke-width="0.8" opacity="0.5" stroke-dasharray="2 2"/>
      ${rightPlate}
      <polygon points="${endW+4},${bodyY+bodyH} ${endW+4},${bodyY+bodyH+12} ${endW+12},${bodyY+bodyH+6}" fill="#1c1b40" stroke="${p.color}" stroke-width="1.2"/>
      <rect x="${endW+2}" y="${bodyY+bodyH+12}" width="10" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      `
    }
  },
  screwConveyorLite: {
    name: '螺旋输送机(简化)', category: '设备',
    defaultSize: { w: 200, h: 90 },
    ports: [{id:'inlet',x:0.3,y:0,dir:'up'},{id:'outlet',x:1,y:0.75,dir:'right'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      // 简化版：去除左右两端端板/电机/链传动，仅保留中间螺旋槽体 + 叶片旋转 + 物料流动 + 顶部进料 + 底部出料
      const bodyX = 8;
      const bodyW = w - 16;
      const bodyH = h*0.38;
      const bodyY = h*0.35;
      const cy = bodyY+bodyH/2;
      // 上下螺栓（保留，作为槽体法兰装饰）
      const boltsTop=[], boltsBot=[];
      const boltCount=Math.max(3,Math.floor(bodyW/22));
      for(let i=0;i<boltCount;i++){
        const bx=bodyX+bodyW*(i+0.5)/boltCount;
        boltsTop.push(`<circle cx="${bx}" cy="${bodyY-3}" r="1.5" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>`);
        boltsBot.push(`<circle cx="${bx}" cy="${bodyY+bodyH+3}" r="1.5" fill="none" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>`);
      }
      const reversed = p.reverse || false;
      // 数据驱动动画：绑定输送机开关 tag（runTag）时由外部注入 _run（true=运行，false=停止）；未绑定/未注入默认运行
      const runTag = (p.runTag || '').trim();
      const running = runTag ? (p._run !== false) : true;
      const clipId = 'screw_'+Math.random().toString(36).substr(2,6);
      // 方案B：斜线螺纹牙（等距平行斜线，像螺钉/绞龙的螺纹牙），整组沿轴向滑动一个螺距 = 螺旋推进
      const pitch = bodyW/3.5;               // 螺距（槽体内约 3.5 道牙）
      const skew = pitch*0.22;               // 牙的横向半宽（控制倾斜度）
      const toothStart = bodyX - pitch;      // 左冗余一道牙，滑动时始终覆盖槽体
      const toothEnd = bodyX + bodyW + pitch;
      const toothCount = Math.round((toothEnd-toothStart)/pitch);
      const sgn = reversed ? -1 : 1;         // 反向时牙面镜像
      let teeth = '';
      for(let i=0;i<=toothCount;i++){
        const x = toothStart + i*pitch;
        teeth += `<line x1="${(x-skew*sgn).toFixed(2)}" y1="${(bodyY+bodyH-2).toFixed(2)}" x2="${(x+skew*sgn).toFixed(2)}" y2="${(bodyY+2).toFixed(2)}" stroke="${p.color}" stroke-width="1.8" stroke-linecap="round"/>`;
      }
      const moveTo = reversed ? -pitch : pitch;
      // 运行态：螺纹牙 + 平移动画；停止态：静态螺纹牙（无动画，定格在停转瞬间）
      const helix = running
        ? `<g clip-path="url(#${clipId})"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="${moveTo} 0" dur="1.6s" repeatCount="indefinite"/>${teeth}</g></g>`
        : `<g clip-path="url(#${clipId})">${teeth}</g>`;
      // 物料粒子：沿轴向流动 + 上下摆动（仅在运行时流动；停止态不画，表达「无物料输送」）
      let particles='';
      if(running){
        const pCount=5;
        for(let i=0;i<pCount;i++){
          const delay=(i/pCount*3).toFixed(2);
          const fromX = reversed ? (bodyX+bodyW-6) : (bodyX+6);
          const toX = reversed ? (bodyX+6) : (bodyX+bodyW-6);
          particles+=`<circle r="2.2" fill="${p.color}" opacity="0"><animate attributeName="cx" from="${fromX}" to="${toX}" dur="3s" begin="-${delay}s" repeatCount="indefinite"/><animate attributeName="cy" values="${(cy-bodyH*0.18).toFixed(1)};${(cy+bodyH*0.18).toFixed(1)};${(cy-bodyH*0.18).toFixed(1)}" keyTimes="0;0.5;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.12;0.88;1" dur="3s" begin="-${delay}s" repeatCount="indefinite"/></circle>`;
        }
      }
      // 槽体左右端圆滑收口（替代原端板，使螺旋自然终止）
      const endCap = `
      <rect x="${bodyX-3}" y="${bodyY-3}" width="3" height="${bodyH+6}" fill="#1c1b40" stroke="${p.color}" stroke-width="0.8" opacity="0.85"/>
      <rect x="${bodyX+bodyW}" y="${bodyY-3}" width="3" height="${bodyH+6}" fill="#1c1b40" stroke="${p.color}" stroke-width="0.8" opacity="0.85"/>
      <circle cx="${bodyX}" cy="${cy}" r="2.2" fill="#161534" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>
      <circle cx="${bodyX+bodyW}" cy="${cy}" r="2.2" fill="#161534" stroke="${p.color}" stroke-width="0.8" opacity="0.6"/>`;
      // 顶部进料口 / 底部出料斜槽：必须随组件尺寸缩放，否则组件缩小时管口尺寸不变
      // 基准尺寸 defaultSize（w=200,h=90）→ 横向量按 w/200、纵向量按 h/90 等比换算
      const sW = w/200, sH = h/90;
      const cx = w*0.3;                        // 进料口中心（锚定 w*0.3，与 inlet 端口对齐）
      const inW = (20*sW).toFixed(2);          // 进料管宽
      const inH = (8*sH).toFixed(2);           // 进料管高
      const inBot = bodyY - 2*sH;              // 进料管底（与槽体顶面留 2 的间隙）
      const inTop = inBot - 8*sH;              // 进料管顶
      const colW = (28*sW).toFixed(2);         // 进料口法兰宽
      const colH = (4*sH).toFixed(2);          // 进料口法兰高
      const topInlet = `
      <rect x="${(cx-10*sW).toFixed(2)}" y="${inTop.toFixed(2)}" width="${inW}" height="${inH}" fill="#0a0a1a" stroke="${p.color}" stroke-width="1.2"/>
      <rect x="${(cx-14*sW).toFixed(2)}" y="${(inTop-4*sH).toFixed(2)}" width="${colW}" height="${colH}" fill="#1c1b40" stroke="${p.color}" stroke-width="1"/>
      <line x1="${(cx-12*sW).toFixed(2)}" y1="${inBot.toFixed(2)}" x2="${(cx+12*sW).toFixed(2)}" y2="${inBot.toFixed(2)}" stroke="${p.color}" stroke-width="0.8" opacity="0.5" stroke-dasharray="2 2"/>`;
      // 中间底部出料斜槽（基于槽体左端 + 4，尺寸同样随组件缩放）
      const bottomOutlet = `
      <polygon points="${(bodyX+4*sW).toFixed(2)},${(bodyY+bodyH).toFixed(2)} ${(bodyX+4*sW).toFixed(2)},${(bodyY+bodyH+12*sH).toFixed(2)} ${(bodyX+12*sW).toFixed(2)},${(bodyY+bodyH+6*sH).toFixed(2)}" fill="#1c1b40" stroke="${p.color}" stroke-width="1.2"/>
      <rect x="${(bodyX+2*sW).toFixed(2)}" y="${(bodyY+bodyH+12*sH).toFixed(2)}" width="${(10*sW).toFixed(2)}" height="${(3*sH).toFixed(2)}" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>`;
      return `
      <clipPath id="${clipId}"><rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="2"/></clipPath>
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="2" fill="url(#gEquip)" stroke="${p.color}" stroke-width="1.5"/>
      <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH*0.55}" fill="#0f0e22" opacity="0.75" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${bodyX-2}" y="${bodyY-3}" width="${bodyW+4}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      <rect x="${bodyX-2}" y="${bodyY+bodyH}" width="${bodyW+4}" height="3" fill="#161534" stroke="${p.color}" stroke-width="0.8"/>
      ${boltsTop.join('')}
      ${boltsBot.join('')}
      <line x1="${bodyX+4}" y1="${cy}" x2="${bodyX+bodyW-4}" y2="${cy}" stroke="${p.color}" stroke-width="1.2" opacity="0.5"/>
      ${helix}
      ${particles}
      ${topInlet}
      ${endCap}
      ${bottomOutlet}
      `
    }
  },
  weighFeeder: {
    name: '配料秤/称重料斗', category: '设备',
    defaultSize: { w: 110, h: 160 },
    ports: [{id:'inlet',x:.5,y:0,dir:'up'},{id:'outlet',x:.5,y:1,dir:'down'}],
    render: (w,h,p)=>{
      const c = p.color;
      // 尺寸参数（基于 w/h 比例，简约版）
      const inletW = w*0.30, inletH = 9;
      const inletX = (w-inletW)/2;
      const topW = w*0.56;
      const topX = (w-topW)/2;
      const topY = inletH + 3;
      const topH = h*0.26;
      const coneTopY = topY + topH;
      const coneH = h*0.26;
      const botW = w*0.16;
      const botX = (w-botW)/2;
      const coneBotY = coneTopY + coneH;
      const outletH = h - coneBotY - 6;
      const legW = 4;
      const senW = legW + 5, senH = 7;
      const senY = coneTopY - 2;
      const legX1 = topX - 6;
      const legX2 = topX + topW - legW + 6;
      const boxW = 15, boxH = 15;
      const boxX = w - boxW - 3, boxY = 4;

      return `
        <!-- 进料口 -->
        <rect x="${inletX}" y="0" width="${inletW}" height="${topY}" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="${inletX-3}" y="0" width="${inletW+6}" height="3" rx="1" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
        <!-- 料斗：圆柱筒体 + 锥体 -->
        <rect x="${topX}" y="${topY}" width="${topW}" height="${topH}" rx="3" fill="#1a1835" stroke="${c}" stroke-width="1.4"/>
        <polygon points="${topX},${coneTopY} ${topX+topW},${coneTopY} ${botX+botW},${coneBotY} ${botX},${coneBotY}" fill="#1a1835" stroke="${c}" stroke-width="1.4"/>
        <!-- 出料管 -->
        <rect x="${botX}" y="${coneBotY}" width="${botW}" height="${outletH}" fill="#151330" stroke="${c}" stroke-width="0.9"/>
        <rect x="${botX-2}" y="${h-4}" width="${botW+4}" height="3" rx="1" fill="#1a1835" stroke="${c}" stroke-width="0.7"/>
        <!-- 称重传感器（左右压式，贴料斗两侧耳座） -->
        <rect x="${legX1-(senW-legW)/2}" y="${senY}" width="${senW}" height="${senH}" rx="1.5" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        <rect x="${legX2-(senW-legW)/2}" y="${senY}" width="${senW}" height="${senH}" rx="1.5" fill="#1a1835" stroke="${c}" stroke-width="0.9"/>
        <circle cx="${legX1+legW/2}" cy="${senY+senH/2}" r="1.6" fill="${c}" opacity="0.5"/>
        <circle cx="${legX2+legW/2}" cy="${senY+senH/2}" r="1.6" fill="${c}" opacity="0.5"/>
        <!-- 称重仪表（缩小版） -->
        <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="2" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="${boxX+2}" y="${boxY+2}" width="${boxW-4}" height="7" rx="1" fill="#0a1a0a" stroke="${c}" stroke-width="0.6"/>
        <text x="${boxX+boxW/2}" y="${boxY+7}" text-anchor="middle" fill="${c}" font-size="4.5" font-family="inherit">kg</text>
        <circle cx="${boxX+boxW/2}" cy="${boxY+12}" r="1.2" fill="#33aa33" stroke="${c}" stroke-width="0.4"/>
        <path d="M ${boxX} ${boxY+boxH-1} Q ${boxX-6} ${boxY+boxH+6} ${topX+topW} ${coneTopY+coneH*0.5}" fill="none" stroke="${c}" stroke-width="0.6" stroke-dasharray="2 1.5" opacity="0.4"/>
      `;
    }
  },
  coolingPond: {
    name: '冷却水池', category: '设备',
    defaultSize: { w: 160, h: 120 },
    ports: [
      {id:'inlet',x:.5,y:0,dir:'up'},
      {id:'outlet',x:.5,y:1,dir:'down'},
      {id:'overflow',x:1,y:.4,dir:'right'}
    ],
    render: (w,h,p)=>{
      const c = p.color;
      const gid = 'water_'+Math.random().toString(36).substr(2,6);
      const clipId = 'waveclip_'+Math.random().toString(36).substr(2,6);
      const boltAt = (bx,by,r)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#0d0b20" stroke="${c}" stroke-width="0.5"/><circle cx="${bx}" cy="${by}" r="${r*0.4}" fill="${c}" opacity="0.5"/>`;
      // 池体几何
      const wall=6, rimY=16, rimBottom=h-10;
      const innerX=wall+4, innerW=w-(wall+4)*2;
      const waterY=Math.round(h*0.46), waterBottom=rimBottom-wall-2, waterH=waterBottom-waterY;
      const inletX=w*0.5, outletX=w*0.5;
      // 落水滴（进水管口→水面，持续水流）
      const waterDrops = (x,yStart,yEnd)=>{
        return Array.from({length:6}).map((_,i)=>{
          const delay = -i*0.4;
          const dur = 1.3 + (i%3)*0.15;
          return `<circle r="${1.2+(i%2)*0.5}" fill="#6FC3FF" opacity="0.9">
            <animate attributeName="cx" values="${x};${x+(i-2.5)*1.3}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${yStart};${yEnd}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle>`;
        }).join('');
      };
      // 1. 混凝土地面
      const ground = `<rect x="0" y="${h-6}" width="${w}" height="6" fill="#12102a" stroke="${c}" stroke-width="0.8"/>
        <line x1="2" y1="${h-3}" x2="${w-2}" y2="${h-3}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>`;
      // 2. 池壁（外壁+内壁表达壁厚）
      const wallBody = `
        <rect x="${wall}" y="${rimY}" width="${w-wall*2}" height="${rimBottom-rimY}" rx="3" fill="#1a1835" stroke="${c}" stroke-width="2"/>
        <rect x="${innerX}" y="${waterY-6}" width="${innerW}" height="${waterH+6}" fill="#0e1c33" stroke="${c}" stroke-width="1" opacity="0.9"/>
        <rect x="${innerX-2}" y="${waterY-6}" width="2" height="${waterH+6}" fill="rgba(255,255,255,0.04)"/>
        <rect x="${innerX+innerW}" y="${waterY-6}" width="2" height="${waterH+6}" fill="rgba(0,0,0,0.25)"/>`;
      // 3. 池顶压顶
      const rim = `<rect x="${wall-3}" y="${rimY-4}" width="${w-wall*2+6}" height="6" rx="2" fill="#151330" stroke="${c}" stroke-width="0.9"/>
        <rect x="${wall-1}" y="${rimY-2}" width="${w-wall*2+2}" height="1.5" fill="rgba(255,255,255,0.06)"/>`;
      // 4. 水面（蓝色渐变）
      const water = `
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3FA9F5" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#1E5AA8" stop-opacity="0.9"/>
        </linearGradient>
        <rect x="${innerX}" y="${waterY}" width="${innerW}" height="${waterH}" fill="url(#${gid})"/>
        <clipPath id="${clipId}"><rect x="${innerX}" y="${waterY}" width="${innerW}" height="${waterH}"/></clipPath>`;
      // 5. 动态波纹（正弦波左右往复，裁剪在水面内不溢出）
      const waveD = (phase,amp)=>{
        let d='';
        for(let i=0;i<=40;i++){
          const x = innerX + innerW*0.9*i/40;
          const y = waterY + waterH*0.5 + Math.sin(i/40*Math.PI*4+phase)*amp;
          d += (i===0?'M ':' L ')+x.toFixed(1)+' '+y.toFixed(1);
        }
        return d;
      };
      const waves = [0,0.5,1].map((ph,i)=>{
        const amp = (i===1?3:5);
        return `<path d="${waveD(ph,amp)}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="${i===1?1.2:0.8}" opacity="0.6" clip-path="url(#${clipId})">
          <animateTransform attributeName="transform" type="translate" values="0 0;${innerW*0.10} 0;0 0" dur="${3+i}s" repeatCount="indefinite"/>
        </path>`;
      }).join('');
      // 6. 水位刻度
      const scale = `<g stroke="${c}" stroke-width="0.6" opacity="0.4">
        <line x1="${innerX+2}" y1="${waterY}" x2="${innerX+8}" y2="${waterY}"/>
        <line x1="${innerX+4}" y1="${waterY+(waterH/3)}" x2="${innerX+8}" y2="${waterY+(waterH/3)}"/>
        <line x1="${innerX+4}" y1="${waterY+(2*waterH/3)}" x2="${innerX+8}" y2="${waterY+(2*waterH/3)}"/>
      </g>`;
      // 7. 进水管（顶部，法兰+阀门+落水）
      const inlet = `
        <rect x="${inletX-3}" y="0" width="6" height="${rimY}" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="${inletX-5}" y="0" width="10" height="4" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
        ${boltAt(inletX-3,2,1)}${boltAt(inletX+3,2,1)}
        <rect x="${inletX-4}" y="${rimY-5}" width="8" height="3" fill="#1a1835" stroke="${c}" stroke-width="0.7"/>
        <rect x="${inletX+4}" y="${rimY-9}" width="4" height="11" rx="2" fill="#151330" stroke="${c}" stroke-width="0.7"/>
        ${waterDrops(inletX, rimY-2, waterY)}`;
      // 8. 出水管（底部，法兰）
      const outlet = `
        <rect x="${outletX-3}" y="${rimBottom}" width="6" height="${h-rimBottom}" fill="#151330" stroke="${c}" stroke-width="1"/>
        <rect x="${outletX-5}" y="${h-4}" width="10" height="4" fill="#1a1835" stroke="${c}" stroke-width="0.8"/>
        ${boltAt(outletX-3,h-2,1)}${boltAt(outletX+3,h-2,1)}
        <rect x="${outletX-4}" y="${rimBottom}" width="8" height="3" fill="#151330" stroke="${c}" stroke-width="0.7"/>`;
      // 9. 溢流口（完全收进池壁内，不伸出设备边界）
      const overflow = `
        <rect x="${w-10}" y="${waterY}" width="10" height="8" rx="1" fill="#151330" stroke="${c}" stroke-width="0.8"/>
        <rect x="${w-10}" y="${waterY-2}" width="3" height="12" fill="#151330" stroke="${c}" stroke-width="0.8"/>`;
      // 10. 爬梯（左侧池壁）
      const ladder = `
        <g stroke="${c}" stroke-width="0.8" opacity="0.6">
          <line x1="3" y1="${rimY+4}" x2="3" y2="${rimBottom-4}"/>
          <line x1="9" y1="${rimY+4}" x2="9" y2="${rimBottom-4}"/>
          ${Array.from({length:6}).map((_,i)=>`<line x1="3" y1="${rimY+8+i*(rimBottom-rimY-12)/5}" x2="9" y2="${rimY+8+i*(rimBottom-rimY-12)/5}"/>`).join('')}
        </g>`;
      // 11. 铭牌
      const nameplate = `<rect x="${w-30}" y="${rimY+8}" width="24" height="10" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${w-18}" y="${rimY+15}" text-anchor="middle" fill="${c}" font-size="4.5" font-weight="bold" opacity="0.7">冷却水池</text>`;
      return `${ground}${wallBody}${rim}${water}${waves}${scale}${inlet}${outlet}${overflow}${ladder}${nameplate}`;
    }
  },
  text: {
    name: '文本标注', category: '通用',
    defaultSize: { w: 140, h: 40 },
    ports: [],
    render: (w,h,p)=>`<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="#12112B99" stroke="${p.color}" stroke-width="1" stroke-dasharray="4 3"/><text x="${w/2}" y="${h/2+5}" text-anchor="middle" fill="${p.color}" font-size="15" font-weight="600" font-family="inherit">${esc(p.name||'文本')}</text>`
  },
  monitor: {
    name: '监控器', category: '监控',
    defaultSize: { w: 150, h: 21 },
    ports: [],
    render: (w,h,p)=>{
      const c = p.color || '#00E5FF';
      const tags = Array.isArray(p.monitorTags) ? p.monitorTags : [];
      const ROW = 17;
      let body = '';
      if(!tags.length){
        body = `<text x="${w/2}" y="13.5" text-anchor="middle" fill="#5a608a" font-size="8.5" font-family="inherit">未绑定测点</text>`;
      } else {
        // 不展示名称，仅居中展示数值+单位符号（详细信息走悬浮面板/详情抽屉）
        tags.forEach((t,i)=>{
          // baseline 14.5：数值字号 11、无下伸部，视觉中心对齐行中心（行高 17 + 上下各 2px 留白 → 行中心 10.5）
          const y = 14.5 + i*ROW;
          body += `
      <text x="${w/2}" y="${y}" text-anchor="middle" font-family="inherit"><tspan class="mon-value" data-i="${i}" fill="${c}" font-size="11" font-weight="700" style="font-variant-numeric:tabular-nums">--</tspan><tspan class="mon-unit" data-i="${i}" fill="#8a90c4" font-size="7.5"> </tspan></text>`;
        });
      }
      return `
      <rect x="0" y="0" width="${w}" height="${h}" rx="6" class="mon-panel" fill="#0c0f24f2" stroke="${c}" stroke-width="1.2"/>
      ${body}
    `;
    }
  },
};
