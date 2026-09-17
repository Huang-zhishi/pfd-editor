/* ============================================================
 * PFD Editor · 组件模板：screwConveyor
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.screwConveyor。
 * ============================================================ */

TEMPLATES.screwConveyor = {
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
};
