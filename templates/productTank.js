/* ============================================================
 * PFD Editor · 组件模板：productTank（成品储罐）
 *   形制（对齐现场流程图上的成品储罐）：等宽矩形罐身 + 锥底 + 底部出料接管；
 *   罐身 : 锥底高度比约 0.49 : 0.51，锥底平底宽 0.25w（均取自现场图实测比例）。
 *   细节画法沿用 silo / storageSilo / reactor 家族：
 *     罐顶法兰圈（罐顶盖板，均布螺栓）
 *     → 罐身把合法兰条（道数按罐身高自适应，两端螺栓）
 *     → 筒锥连接法兰圈（罐身/锥底焊缝处的连接法兰 + 螺栓）
 *     → 底部出料接管（金属管壁 + 深色管腔 + 端面法兰 + 螺栓）
 *     → 罐身人孔检修门（门板 + 双铰链 + 把手）
 *     → 罐身外侧爬梯（双立杆 + 横档）
 *   配色：金属 #7d849e → #d9dded(42%) → #767d97 · 深色件 #2a2f45 / #3f445c ·
 *     管腔 #12162b / #6a7192 · 螺栓高光 #8e96b6 · 爬梯 #9aa2bc · 检修门 #1a1f33 / #3a4060。
 *   渐变：罐身与锥底共用一条 gradientUnits="userSpaceOnUse" 的横向渐变（按组件宽度铺开，
 *     锥体收窄时配色走向不变，与现场图画法一致）；竖直接管另用 objectBoundingBox 渐变取圆柱面明暗。
 *   尺寸策略：法兰圈/把合条/螺栓/爬梯一律定尺封顶，组件放大只是罐身变长，五金件不会跟着变粗。
 *   端口：top(0.5w, 0) 进料 · side(w, 0.34h) 侧接 · bottom(0.5w, h) 出料（出料管端面法兰中心）
 * ============================================================ */

TEMPLATES.productTank = {
    name: '成品储罐', category: '储存与反应',
    defaultSize: { w: 110, h: 124 },
    ports: [
      {id:'top',x:.5,y:0,dir:'up'},
      {id:'side',x:1,y:.34,dir:'right'},
      {id:'bottom',x:.5,y:1,dir:'down'}
    ],
    render: (w,h,p)=>{
      const gm = productTankGeom(w,h);
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'pt_metal_'+uid, pipeVId = 'pt_pipev_'+uid;
      const f = n => Number(n).toFixed(2);
      const cx = w/2;
      const coneL = cx - gm.coneBotW/2, coneR = cx + gm.coneBotW/2;

      // 螺栓：深色六角底 + 高光内芯（与 silo / bucketElevator 同一画法）
      const bolt = (bx,by)=>
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(gm.boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>` +
        `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(gm.boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;

      // 1. 罐身（矩形段，落在罐顶法兰圈之下）与锥底：共用同一条横向金属渐变
      const body = `<rect x="0" y="${f(gm.shellTop)}" width="${f(w)}" height="${f(gm.bodyH)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>`;
      const cone = `<polygon points="0,${f(gm.bodyBot)} ${f(w)},${f(gm.bodyBot)} ${f(coneR)},${f(gm.coneBotY)} ${f(coneL)},${f(gm.coneBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>`;

      // 2. 罐顶法兰圈（兼作罐顶盖板）+ 均布螺栓
      const rim = `<rect x="0" y="0" width="${f(w)}" height="${f(gm.rimH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const rimBolts = [0.10,0.37,0.63,0.90].map(u=>bolt(w*u, gm.rimH*0.5)).join('');

      // 3. 罐身把合法兰条：道数按罐身高度自适应（罐身高则多一道），两端各一颗螺栓
      let joints = '';
      for(let i=1;i<=gm.nSec;i++){
        const jy = gm.shellTop + gm.bodyH*i/(gm.nSec+1);
        joints +=
          `<rect x="0" y="${f(jy-gm.stripH/2)}" width="${f(w)}" height="${f(gm.stripH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
          bolt(w*0.08, jy) + bolt(w*0.92, jy);
      }

      // 4. 筒锥连接法兰圈：罐身下沿与锥顶的对接法兰，压住两者的描边形成焊缝圈
      const collar = `<rect x="0" y="${f(gm.bodyBot-gm.collarH/2)}" width="${f(w)}" height="${f(gm.collarH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const collarBolts = bolt(w*0.12, gm.bodyBot) + bolt(w*0.88, gm.bodyBot);

      // 5. 底部出料接管：金属管壁 + 深色管腔 + 端面法兰 + 法兰螺栓（端口 bottom 落在法兰面中心）
      const outX = cx - gm.outW/2;
      const outWall = Math.max(0.7, Math.min(1.8, gm.outW*0.16));
      const outPipe =
        `<rect x="${f(outX)}" y="${f(gm.coneBotY)}" width="${f(gm.outW)}" height="${f(gm.outH)}" fill="url(#${pipeVId})" stroke="#3f445c" stroke-width="0.9"/>` +
        `<rect x="${f(outX+outWall)}" y="${f(gm.coneBotY)}" width="${f(Math.max(0.1, gm.outW-outWall*2))}" height="${f(Math.max(0, gm.outH-outWall*0.6))}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>` +
        `<rect x="${f(outX-gm.flW)}" y="${f(h-gm.flH)}" width="${f(gm.outW+gm.flW*2)}" height="${f(gm.flH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
        bolt(outX-gm.flW*0.2, h-gm.flH*0.5) + bolt(outX+gm.outW+gm.flW*0.2, h-gm.flH*0.5);

      // 6. 罐身人孔检修门：门板 + 两条铰链 + 把手（偏右下，让开右侧接管与把合条）
      const doorW = Math.max(4, Math.min(w*0.18, w*0.26));
      const doorH = Math.max(3, Math.min(gm.bodyH*0.45, doorW*0.85));
      const doorX = w*0.68 - doorW/2;
      const doorY = Math.max(gm.shellTop + 2, gm.bodyBot - 2 - doorH - gm.bodyH*0.08);
      const door =
        `<rect x="${f(doorX)}" y="${f(doorY)}" width="${f(doorW)}" height="${f(doorH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.26)}" y1="${f(doorY+1.4)}" x2="${f(doorX+doorW*0.26)}" y2="${f(doorY+doorH-1.4)}" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.74)}" y1="${f(doorY+1.4)}" x2="${f(doorX+doorW*0.74)}" y2="${f(doorY+doorH-1.4)}" stroke="#3a4060" stroke-width="1"/>` +
        `<circle cx="${f(doorX+doorW*0.5)}" cy="${f(doorY+doorH*0.5)}" r="${f(Math.max(0.6, Math.min(doorW,doorH)*0.13))}" fill="#8e96b6" opacity="0.75"/>`;

      // 7. 罐身外侧爬梯：双立杆 + 横档，横档数按可用高度自适应，压在把合条之上保持连续
      const railGap = Math.max(1.8, Math.min(6.5, w*0.075));
      const railW = Math.max(0.5, Math.min(1.4, w*0.011));
      const ladX = Math.max(2, w*0.075);
      const ladY0 = gm.shellTop + 2;
      const ladY1 = gm.bodyBot - 2;
      const ladLen = ladY1 - ladY0;
      let ladder = '';
      if (ladLen > railGap) {
        const nRung = Math.max(2, Math.round(ladLen/(railGap*1.7)));
        let rungs = '';
        for(let i=0;i<nRung;i++){
          const ry = ladY0 + ladLen*(i/(nRung-1));
          rungs += `<line x1="${f(ladX)}" y1="${f(ry)}" x2="${f(ladX+railGap)}" y2="${f(ry)}"/>`;
        }
        // 罐身是浅色金属面，爬梯取深一档的冷灰才能在金属高光段与暗边段都读得出来
        ladder = `<g stroke="#4a5170" stroke-width="${f(railW)}" opacity="0.75" stroke-linecap="round">
          <line x1="${f(ladX)}" y1="${f(ladY0)}" x2="${f(ladX)}" y2="${f(ladY1)}"/>
          <line x1="${f(ladX+railGap)}" y1="${f(ladY0)}" x2="${f(ladX+railGap)}" y2="${f(ladY1)}"/>
          ${rungs}
        </g>`;
      }

      return `
      <defs>
        <!-- 罐身/锥底共用：按组件宽度铺开的横向渐变（userSpaceOnUse，锥体收窄不重算配色） -->
        <linearGradient id="${metalId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f(w)}" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <!-- 竖直接管用：横向明暗取圆柱面高光（objectBoundingBox，随管径自适应） -->
        <linearGradient id="${pipeVId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      <!-- 1. 罐身 + 锥底（金属实体） -->
      ${body}
      ${cone}
      <!-- 2. 罐顶法兰圈 + 均布螺栓 -->
      ${rim}
      ${rimBolts}
      <!-- 3. 罐身把合法兰条 + 螺栓 -->
      ${joints}
      <!-- 4. 筒锥连接法兰圈 + 螺栓 -->
      ${collar}
      ${collarBolts}
      <!-- 5. 底部出料接管（管壁 / 管腔 / 端面法兰 / 螺栓） -->
      ${outPipe}
      <!-- 6. 人孔检修门 -->
      ${door}
      <!-- 7. 罐身外侧爬梯 -->
      ${ladder}`;
    }
};


/* ============================================================
 * 成品储罐（productTank）几何：相对组件 w/h 推导。
 *   纵向自上而下：罐顶法兰圈 rimH → 罐身 bodyH → 筒锥连接法兰圈 collarH → 锥底 coneH → 出料接管 outH。
 *   罐身 : 锥底 = 0.49 : 0.51（现场图实测），锥底平底宽 0.25w，出料管口径 0.14w；
 *   五金件（法兰圈、把合条、螺栓、端面法兰、焊缝圈）全部定尺封顶，放大组件只拉长罐身。
 * ============================================================ */
function productTankGeom(w,h){
  const outH    = Math.max(0, Math.min(h*0.075, 14));            // 底部出料接管总高（含端面法兰）
  const rimH    = Math.max(2.4, Math.min(6, h*0.030));           // 罐顶法兰圈厚
  const shellTop = rimH;                                         // 罐身顶（罐顶法兰下沿）
  const shellH  = Math.max(4, h - outH - rimH);                  // 罐身 + 锥底可用高
  const bodyH   = shellH*0.49;                                   // 罐身（矩形段）高
  const bodyBot = shellTop + bodyH;                              // 罐身下沿 = 锥顶（筒锥法兰圈所在）
  const coneBotY = shellTop + shellH;                            // 锥底平底（出料接管顶面）
  const coneH   = coneBotY - bodyBot;                            // 锥底高
  const coneBotW = w*0.25;                                       // 锥底平底宽
  const outW    = w*0.14;                                        // 出料管口径
  const collarH = Math.max(1.6, Math.min(3.6, shellH*0.024));     // 筒锥连接法兰圈厚
  const stripH  = Math.max(1.4, Math.min(2.8, bodyH*0.060));      // 罐身把合法兰条厚
  const nSec    = Math.max(1, Math.round(bodyH/(w*0.38)));        // 把合法兰条道数（按罐身高自适应）
  const boltR   = Math.max(0.8, Math.min(1.6, w*0.018));          // 螺栓半径
  const flH     = Math.max(1.2, Math.min(3, h*0.020));            // 端面法兰厚
  const flW     = Math.max(0.8, Math.min(2, w*0.025));            // 端面法兰单边加宽
  return {
    rimH, shellTop, shellH, bodyH, bodyBot, coneBotY, coneH, coneBotW,
    outH, outW, collarH, stripH, nSec, boltR, flH, flW
  };
}
