/* ============================================================
 * PFD Editor · 组件模板：dustCollector
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.dustCollector。
 * ============================================================ */

TEMPLATES.dustCollector = {
    name: '除尘布袋', category: '设备',
    defaultSize: { w: 120, h: 180 },
    ports: [{id:'inlet',x:.5,y:0,dir:'up'},{id:'outlet',x:.5,y:1,dir:'down'},{id:'cleanGas',x:1,y:.3,dir:'right'}],
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

      // 净化气出口（改到箱体右侧，与 cleanGas 端口方向一致）
      const cleanPortY = bodyTopY + (bodyBotY-bodyTopY)*0.3;
      const cleanPort = `
        <rect x="${bodyRight+wallT}" y="${cleanPortY-3}" width="8" height="6" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.8"/>
        <circle cx="${bodyRight+wallT+4}" cy="${cleanPortY}" r="1.5" fill="none" stroke="${c}" stroke-width="0.5" opacity="0.4"/>`;

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
};
