/* ============================================================
 * PFD Editor · 组件模板：switchValve
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.switchValve。
 * ============================================================ */

TEMPLATES.switchValve = {
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
};
