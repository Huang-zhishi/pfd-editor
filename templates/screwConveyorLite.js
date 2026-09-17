/* ============================================================
 * PFD Editor · 组件模板：screwConveyorLite
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.screwConveyorLite。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属槽壁 / 端板 / 斗体）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   槽体 = 金属外壳 + 深色内腔（螺旋在腔内可见），槽身加长时把合法兰自动增多；
 *   螺旋牙用 SMIL 平移动画驱动，编辑态由 editor.js stripSMIL() 自动剥离；
 *   绑定 runTag 时由 refreshScrewConveyorRun() 注入 props._run 切换运行/停止。
 * ============================================================ */

TEMPLATES.screwConveyorLite = {
    name: '螺旋输送机(简化)', category: '设备',
    defaultSize: { w: 250, h: 60 },
    ports: [{id:'inlet',x:0.3,y:0,dir:'up'},{id:'outlet',x:1,y:0.75,dir:'right'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'scl_clip_'+uid, metalId = 'scl_metal_'+uid, metalVId = 'scl_metalv_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      // 槽体：横向长条。槽身加长时只有中间槽体变长，端板、进料斗、出料接管都是定尺部件
      const bodyX = 8, bodyW = w - 16;
      const bodyH = h*0.38, bodyY = h*0.35;
      const cy = bodyY + bodyH/2;
      const reversed = p.reverse || false;
      // 数据驱动动画：绑定输送机开关 tag（runTag）时由外部注入 _run（true=运行，false=停止）；未绑定/未注入默认运行
      const runTag = (p.runTag || '').trim();
      const running = runTag ? (p._run !== false) : true;

      // 槽壁厚 / 法兰条厚：按槽高封顶，组件缩小时同步变薄，不随槽身拉长变粗
      const wall = Math.max(1.1, Math.min(2.2, bodyH*0.16));
      const flH  = Math.max(1.2, Math.min(2.6, bodyH*0.12));
      const innerTop = bodyY + wall, innerBot = bodyY + bodyH - wall;

      // 螺旋牙：螺距约等于槽径（实机单头螺旋的常用螺距），槽内恒保持 5~16 道牙
      const pitch = Math.max(bodyW/16, Math.min(bodyW/4, bodyH*1.05));
      const skew  = pitch*0.38;                 // 牙的横向半宽（控制螺旋升角）
      const sgn   = reversed ? -1 : 1;          // 反向时牙面镜像
      const toothStart = bodyX - pitch;          // 左右各冗余一道牙，滑动时始终覆盖槽体
      const toothEnd = bodyX + bodyW + pitch;
      const toothCount = Math.round((toothEnd-toothStart)/pitch);
      const flightW = Math.max(0.9, Math.min(1.8, bodyH*0.10));
      let teeth = '';
      for(let i=0;i<=toothCount;i++){
        const x = toothStart + i*pitch;
        teeth += `<line x1="${f(x-skew*sgn)}" y1="${f(innerBot)}" x2="${f(x+skew*sgn)}" y2="${f(innerTop)}" stroke="#9aa2bc" stroke-width="${f(flightW)}" stroke-linecap="round"/>`;
      }
      // 螺旋轴：贯穿槽体的中心管，与螺纹牙一起构成"螺旋"读数
      const shaftW = Math.max(1, Math.min(2.4, bodyH*0.13));
      const shaft = `<line x1="${f(bodyX)}" y1="${f(cy)}" x2="${f(bodyX+bodyW)}" y2="${f(cy)}" stroke="#6a7192" stroke-width="${f(shaftW)}"/>`;
      const moveTo = reversed ? -pitch : pitch;
      // 运行态：螺旋牙沿轴向平移一个螺距（螺旋推进）；停止态：静态牙（定格在停转瞬间）
      const helix = running
        ? `<g clip-path="url(#${clipId})">${shaft}<g><animateTransform attributeName="transform" type="translate" from="0 0" to="${f(moveTo)} 0" dur="1.6s" repeatCount="indefinite"/>${teeth}</g></g>`
        : `<g clip-path="url(#${clipId})">${shaft}${teeth}</g>`;

      // 两端端板（金属）+ 带座轴承：螺旋轴两端各一只，端板把深色内腔封住
      const epW = Math.max(3, Math.min(6, bodyH*0.24));
      const hubR = Math.max(1.5, Math.min(4.5, bodyH*0.20));
      const endPlate = ex =>
        `<rect x="${f(ex)}" y="${f(bodyY)}" width="${f(epW)}" height="${f(bodyH)}" rx="2" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<circle cx="${f(ex+epW*0.5)}" cy="${f(cy)}" r="${f(hubR)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>` +
        `<circle cx="${f(ex+epW*0.5)}" cy="${f(cy)}" r="${f(hubR*0.34)}" fill="${c}" opacity="0.9"/>`;
      const endPlates = endPlate(bodyX) + endPlate(bodyX+bodyW-epW);

      // 槽体上下边缘法兰条（槽盖 / 槽底把合面）
      const edgeFl =
        `<rect x="${f(bodyX-2)}" y="${f(bodyY-flH*0.5)}" width="${f(bodyW+4)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
        `<rect x="${f(bodyX-2)}" y="${f(bodyY+bodyH-flH*0.5)}" width="${f(bodyW+4)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      /* 标准节之间的把合法兰：槽身加长后标准节自动增多（单节约 1.9 槽径），
         法兰宽度按槽高封顶，不随槽身变长而变粗。*/
      const nSec = Math.max(3, Math.round(bodyW/(bodyH*1.9)));
      const jointW = Math.max(1.4, Math.min(3.2, bodyH*0.15));
      let joints = '';
      for(let i=1;i<nSec;i++){
        const jx = bodyX + bodyW*i/nSec;
        joints += `<rect x="${f(jx-jointW*0.5)}" y="${f(bodyY-flH*0.5)}" width="${f(jointW)}" height="${f(bodyH+flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      }

      /* 进料斗（槽体上方 · 流入式喂料）：梯形斗体，斗口朝上敞开、上宽下窄收口到槽顶法兰面，
         物料从上方倒入斗内、沿斗壁下滑收口后从槽顶喂入——即实机的"流入式喂料"，不是管道接管进料。
         画法与槽体统一：金属渐变斗体 + 深色内腔 + 斗口口沿。斗口顶沿锚在 inlet 端口（w*0.3, 0）。*/
      const inCX = w*0.3;
      const mouthY = 0;
      const mouthW = Math.max(6, Math.min(w*0.16, bodyH*1.5));
      const throatW = mouthW*0.42;
      const throatY = bodyY - flH*0.5;                    // 斗口收口落在槽顶法兰面上
      const inWall = Math.max(0.8, Math.min(1.6, bodyH*0.09));
      const mL = inCX-mouthW*0.5, mR = inCX+mouthW*0.5;
      const tL = inCX-throatW*0.5, tR = inCX+throatW*0.5;
      const opW = throatW*0.55;                            // 槽顶进料口（穿过法兰与槽壁）
      const inletHopper =
        `<rect x="${f(inCX-opW*0.5)}" y="${f(throatY)}" width="${f(opW)}" height="${f(bodyY+wall-throatY)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>` +
        `<polygon points="${f(mL)},${f(mouthY)} ${f(mR)},${f(mouthY)} ${f(tR)},${f(throatY)} ${f(tL)},${f(throatY)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<polygon points="${f(mL+inWall)},${f(mouthY+flH)} ${f(mR-inWall)},${f(mouthY+flH)} ${f(tR-inWall)},${f(throatY-inWall*0.7)} ${f(tL+inWall)},${f(throatY-inWall*0.7)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        `<rect x="${f(mL)}" y="${f(mouthY)}" width="${f(mouthW)}" height="${f(flH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      // 右端出料接管：水平接管，与 outlet 端口（w, 0.75h）同轴，管腔朝右敞开
      const outCY = h*0.75;
      const outH  = Math.max(3.2, Math.min(bodyH*0.55, h*0.14));
      const outXL = bodyX + bodyW;                         // 接管根部（贴右端板）
      const outLen = Math.max(4, w - outXL);               // 接管长度（伸到组件右缘，与端口对齐）
      const outWall = Math.max(0.8, Math.min(1.6, outH*0.18));
      const outTop = outCY - outH*0.5 - 1.2, outHH = outH + 2.4;
      const outlet =
        `<rect x="${f(outXL)}" y="${f(outTop)}" width="${f(outLen)}" height="${f(outHH)}" rx="0.8" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<rect x="${f(outXL+outWall)}" y="${f(outTop+outWall)}" width="${f(outLen-outWall)}" height="${f(outHH-outWall*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        `<rect x="${f(w-2.2)}" y="${f(outTop)}" width="2.2" height="${f(outHH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;

      return `
      <defs>
        <clipPath id="${clipId}"><rect x="${f(bodyX+epW)}" y="${f(innerTop)}" width="${f(bodyW-epW*2)}" height="${f(innerBot-innerTop)}"/></clipPath>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      <rect x="${f(bodyX)}" y="${f(bodyY)}" width="${f(bodyW)}" height="${f(bodyH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(bodyX+wall)}" y="${f(innerTop)}" width="${f(bodyW-wall*2)}" height="${f(innerBot-innerTop)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      ${endPlates}
      ${helix}
      ${edgeFl}
      ${joints}
      ${inletHopper}
      ${outlet}
      `
    }
};
