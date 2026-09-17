/* ============================================================
 * PFD Editor · 组件模板：valve
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.valve。
 * ============================================================ */

TEMPLATES.valve = {
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
};
