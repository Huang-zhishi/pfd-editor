/* ============================================================
 * PFD Editor · 组件模板：weighFeeder
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.weighFeeder。
 * ============================================================ */

TEMPLATES.weighFeeder = {
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
};
