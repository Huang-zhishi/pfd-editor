/* ============================================================
 * PFD Editor · 组件模板：valve
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.valve。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属阀体 / 接管 / 阀杆内芯）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *       #9aa2bc / #5b6280（件体明细）  #1a1f33 / #8e96b6（手轮轮心 / 把手）
 *   本模板不含任何动画。
 * ============================================================ */

TEMPLATES.valve = {
    name: '气密阀', category: '风机泵阀',
    defaultSize: { w: 45, h: 35 },
    ports: [{id:'in',x:0,y:.5,dir:'left'},{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const metalId = 'val_metal_'+uid, metalVId = 'val_metalv_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const cx = w/2;
      const cy = h/2;
      /* 定尺封顶：阀体、接管、法兰、螺栓、手轮都按阀宽 / 阀高封顶，
         放大时只有接管与阀体中段变长，法兰 / 螺栓 / 手轮等定尺件不随之变粗。*/
      const bodyW = w*0.38;
      const bodyH = h*0.54;
      const bodyHW = bodyW/2, bodyHH = bodyH/2;
      const bodyTopY = cy - bodyHH;
      const bodyBotY = cy + bodyHH;
      const peak = Math.max(1, Math.min(w*0.05, bodyW*0.20));   // 阀体左右尖顶点外凸量
      const bodyLeftX = cx - bodyHW - peak;                     // 左尖顶点（接管连接处）
      const bodyRightX = cx + bodyHW + peak;                    // 右尖顶点（接管连接处）
      const pipeH = Math.max(2.5, Math.min(bodyH*0.34, h*0.28));
      const inR = Math.max(0.8, Math.min(bodyHH*0.22, bodyHW*0.26));   // 阀体内腔留边

      const bodyBoltR = Math.max(0.6, Math.min(1.3, bodyHH*0.10));
      const bolt = (bx,by)=>`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(bodyBoltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(bodyBoltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;

      /* 左右接管统一画法 —— 对齐脱硫塔 / 除尘布袋接管：
         金属管壁（metalVId，横向管取竖向渐变）+ 深色管腔（#12162b / #6a7192）
         + 端面把合法兰（#2a2f45 / #3f445c）+ 两颗螺栓（#8e96b6）。
         管口最外端即端口锚点（左管口 x=0、右管口 x=w），端面法兰画在管口内侧。*/
      const pipeWallT = ph => Math.max(0.7, Math.min(1.8, ph*0.16));
      const pipeFlW   = ph => Math.max(1.6, Math.min(4, ph*0.34));
      const pipeBoltR = ph => Math.max(0.5, Math.min(1.1, ph*0.09));
      const makePipe = (x0, x1, cyy, ph, side)=>{
        const wl = pipeWallT(ph), flW = pipeFlW(ph), boltR = pipeBoltR(ph);
        const flH = ph + flW*0.7;
        const flX = (side === 'right') ? x1 - flW - wl*0.4 : x0 + wl*0.4;
        return `<rect x="${f(x0)}" y="${f(cyy-ph/2)}" width="${f(x1-x0)}" height="${f(ph)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
          <rect x="${f(x0)}" y="${f(cyy-ph/2+wl)}" width="${f(x1-x0)}" height="${f(ph-wl*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
          <rect x="${f(flX)}" y="${f(cyy-flH/2)}" width="${f(flW)}" height="${f(flH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
          <circle cx="${f(flX+flW/2)}" cy="${f(cyy-flH*0.28)}" r="${f(boltR)}" fill="#8e96b6" opacity="0.85"/>
          <circle cx="${f(flX+flW/2)}" cy="${f(cyy+flH*0.28)}" r="${f(boltR)}" fill="#8e96b6" opacity="0.85"/>`;
      };
      const leftPipe  = makePipe(0, bodyLeftX, cy, pipeH, 'left');
      const rightPipe = makePipe(bodyRightX, w, cy, pipeH, 'right');

      /* 阀体两侧对开把合法兰：接管进入阀体的交接处加法兰环 + 两颗螺栓 */
      const jointFlW = Math.max(1.5, Math.min(4, pipeH*0.32));
      const jointFlH = pipeH*1.5;
      const jointBoltR = Math.max(0.5, Math.min(1, jointFlH*0.10));
      const jointFlange = (jx)=>`<rect x="${f(jx-jointFlW/2)}" y="${f(cy-jointFlH/2)}" width="${f(jointFlW)}" height="${f(jointFlH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <circle cx="${f(jx)}" cy="${f(cy-jointFlH*0.32)}" r="${f(jointBoltR)}" fill="#8e96b6" opacity="0.85"/>
        <circle cx="${f(jx)}" cy="${f(cy+jointFlH*0.32)}" r="${f(jointBoltR)}" fill="#8e96b6" opacity="0.85"/>`;
      const leftJoint  = jointFlange(bodyLeftX);
      const rightJoint = jointFlange(bodyRightX);

      // 阀体（菱形）：金属壳 + 深色内腔
      const body = `
        <polygon points="${f(cx-bodyHW)},${f(bodyTopY)} ${f(cx+bodyHW)},${f(bodyTopY)} ${f(bodyRightX)},${f(cy)} ${f(cx+bodyHW)},${f(bodyBotY)} ${f(cx-bodyHW)},${f(bodyBotY)} ${f(bodyLeftX)},${f(cy)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <polygon points="${f(cx-bodyHW+inR)},${f(bodyTopY+inR)} ${f(cx+bodyHW-inR)},${f(bodyTopY+inR)} ${f(bodyRightX-inR*1.4)},${f(cy)} ${f(cx+bodyHW-inR)},${f(bodyBotY-inR)} ${f(cx-bodyHW+inR)},${f(bodyBotY-inR)} ${f(bodyLeftX+inR*1.4)},${f(cy)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>`;

      // 阀体四角连接螺栓
      const bd = Math.max(1, Math.min(Math.min(bodyHW, bodyHH)*0.26, 3));
      const bodyBolts =
        bolt(cx-bodyHW+bd, bodyTopY+bd) +
        bolt(cx+bodyHW-bd, bodyTopY+bd) +
        bolt(cx-bodyHW+bd, bodyBotY-bd) +
        bolt(cx+bodyHW-bd, bodyBotY-bd);

      /* 阀盖（填料函）：坐在阀体顶、包住阀杆根部 */
      const stemW = Math.max(1.5, Math.min(w*0.10, bodyHW*0.30));
      const bonnetW = Math.max(stemW*2.4, Math.min(bodyHW*0.9, stemW*3.2));
      const bonnetH = Math.max(1.5, Math.min(bodyHH*0.28, 3));
      const bonnet = `<rect x="${f(cx-bonnetW/2)}" y="${f(bodyTopY)}" width="${f(bonnetW)}" height="${f(bonnetH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      /* 手轮 / 阀杆顶部预留：先算阀体上方可用高度，再反推手轮半径与阀杆长度，
         关键约束 wheelCY - wheelR ≥ 0（手轮不越出画布上沿）。*/
      const topSpace = bodyTopY;
      const hPad = Math.max(1, h*0.025);
      const wheelR = Math.max(1.2, Math.min((topSpace-hPad)*0.40, w*0.15));
      const handleR = Math.max(0.7, Math.min(wheelR*0.22, 2));
      const topInset = Math.max(handleR, hPad);
      const wheelCX = cx;
      const wheelCY = topInset + wheelR;
      const wheelBot = wheelCY + wheelR;

      // 阀杆：外层杆壳（#2a2f45）+ 内芯金属渐变，下端伸入阀体
      const stemX = cx - stemW/2;
      const stemTopY = wheelCY;
      const stemBotY = bodyTopY + Math.min(bodyHH*0.30, 2.5);
      const stemH = stemBotY - stemTopY;
      const stemCoreT = Math.max(0.4, Math.min(1, stemW*0.28));
      const stem = `
        <rect x="${f(stemX)}" y="${f(stemTopY)}" width="${f(stemW)}" height="${f(stemH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(stemX+stemCoreT)}" y="${f(stemTopY+stemCoreT)}" width="${f(Math.max(0.4, stemW-stemCoreT*2))}" height="${f(Math.max(0.4, stemH-stemCoreT*2))}" fill="url(#${metalId})" opacity="0.85"/>`;

      // 填料压盖：件体色压盖本体 + 两侧压盖螺母
      const packingW = Math.min(bonnetW*1.15, bodyHW*0.95);
      const packingH = Math.max(1, Math.min(bonnetH*0.5, 2.5));
      const packingY = bodyTopY + Math.max(0, bonnetH*0.30);
      const packingNutR = Math.max(0.5, Math.min(1, packingH*0.45));
      const packing = `
        <rect x="${f(cx-packingW/2)}" y="${f(packingY)}" width="${f(packingW)}" height="${f(packingH)}" rx="${f(packingH*0.3)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.6"/>
        <circle cx="${f(cx-packingW/2+packingNutR*1.2)}" cy="${f(packingY+packingH/2)}" r="${f(packingNutR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.4"/>
        <circle cx="${f(cx+packingW/2-packingNutR*1.2)}" cy="${f(packingY+packingH/2)}" r="${f(packingNutR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.4"/>`;

      // 手轮：轮缘彩色 + 轮心 / 把手对齐门色系，5 根辐条均布整圈（360/5 = 72°）
      let wheelSpokes = '';
      for(let i=0;i<5;i++){
        const a = i*(360/5)*Math.PI/180 - Math.PI/2;
        wheelSpokes += `<line x1="${f(wheelCX)}" y1="${f(wheelCY)}" x2="${f(wheelCX+Math.cos(a)*wheelR*0.82)}" y2="${f(wheelCY+Math.sin(a)*wheelR*0.82)}" stroke="${c}" stroke-width="1"/>`;
      }
      const wheel = `
        <circle cx="${f(wheelCX)}" cy="${f(wheelCY)}" r="${f(wheelR)}" fill="none" stroke="${c}" stroke-width="1.6"/>
        <circle cx="${f(wheelCX)}" cy="${f(wheelCY)}" r="${f(Math.max(0.8, wheelR*0.26))}" fill="#1a1f33" stroke="${c}" stroke-width="0.8"/>
        ${wheelSpokes}
        <circle cx="${f(wheelCX)}" cy="${f(wheelCY-wheelR)}" r="${f(handleR)}" fill="#8e96b6" opacity="0.7" stroke="#3a4060" stroke-width="0.6"/>`;

      return `
      <defs>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
      </defs>
      ${leftPipe}
      ${rightPipe}
      ${leftJoint}
      ${rightJoint}
      ${body}
      ${bodyBolts}
      ${bonnet}
      ${stem}
      ${packing}
      ${wheel}`;
    }
};
