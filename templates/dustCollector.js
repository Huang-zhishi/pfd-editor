/* ============================================================
 * PFD Editor · 组件模板：dustCollector
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.dustCollector。
 *   配色与画法对齐 reactor（反应釜）/ bucketElevator（斗式提升机）：
 *     本文件 <defs> 内局部金属渐变（id 带 uid 后缀，避免同页多实例 id 冲突），
 *     不再依赖外部全局 gEquip：
 *       #7d849e → #d9dded → #767d97（金属箱体 / 灰斗 / 接管）
 *       #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 * ============================================================ */

TEMPLATES.dustCollector = {
    name: '除尘布袋', category: '除尘与分离',
    defaultSize: { w: 120, h: 180 },
    ports: [{id:'inlet',x:1,y:.4,dir:'right'},{id:'outlet',x:.5,y:1,dir:'down'},{id:'cleanGas',x:1,y:.2,dir:'right'}],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'clip_dust_'+uid, metalId = 'dc_metal_'+uid, metalVId = 'dc_metalv_'+uid;
      const f = n => Number(n).toFixed(2);
      const c = (p && p.color) || '#9C99FF';
      const cx = w/2;
      const edgePad = 2;
      const bodyTopY = h*0.16;
      const bodyBotY = h*0.55;
      const hopperTopY = bodyBotY;
      const hopperBotY = h*0.85;
      const outPipeH = Math.max(4, Math.min(10, h*0.04));  // 出料短管长（定尺封顶）
      const outletY = h - edgePad - outPipeH;              // 短管下端落在下边缘留边处
      const outletW = w*0.16;   // 底部出料口宽度（比接管窄，灰斗收口更尖）
      const bodyW = w*0.70;   // 箱宽收窄，给右壁两根接管留出可见管长（顶部立管已取消）
      const wallT = w*0.05;
      const bodyH = bodyBotY - bodyTopY;
      const bodyLeft = cx - bodyW/2;
      const bodyRight = cx + bodyW/2;
      const padT = Math.max(2, Math.min(5, wallT*0.5));  // 内腔 / 花板 / 滤袋四周留边（定尺封顶）
      const innerL = bodyLeft + padT;
      const innerW = bodyW - padT*2;

      /* 定尺封顶：法兰条厚、把合法兰厚、螺栓半径都按箱高/箱宽封顶，
         箱体放大时只是箱身变长，法兰与螺栓不会跟着变粗。
         箱身加高后把合法兰自动增多（单节约 0.34 箱宽），与提升机标准节同理。*/
      const flH = Math.max(2, Math.min(4, bodyH*0.085));
      const boltR = Math.max(1, Math.min(1.9, flH*0.55));
      const nSec = Math.max(2, Math.round(bodyH/(w*0.34)));
      const jointH = Math.max(1.4, Math.min(3, bodyH*0.05));
      let joints = '';
      for(let i=1;i<nSec;i++){
        const jy = bodyTopY + bodyH*i/nSec;
        joints += `<rect x="${f(bodyLeft-wallT)}" y="${f(jy-jointH*0.5)}" width="${f(bodyW+wallT*2)}" height="${f(jointH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      }
      // 顶 / 底法兰条（把合面）
      const topFl = `<rect x="${f(bodyLeft-wallT)}" y="${f(bodyTopY-flH)}" width="${f(bodyW+wallT*2)}" height="${f(flH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;
      const botFl = `<rect x="${f(bodyLeft-wallT)}" y="${f(bodyBotY)}" width="${f(bodyW+wallT*2)}" height="${f(flH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="1"/>`;

      // 法兰螺栓
      const bolt = (bx,by)=>`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(boltR*0.4)}" fill="#8e96b6" opacity="0.9"/>`;

      /* 箱体检修门（观察滤袋 / 更换袋笼用）：门板 + 两条铰链 + 把手，
         画法沿用 bucketElevator 观察门（#1a1f33 门板 / #3a4060 铰链 / #8e96b6 把手）。
         做窄长竖向门，贴左壁下半段，让开顶法兰、把合法兰与中部袋位。*/
      const doorW = Math.max(6, Math.min(w*0.115, bodyW*0.20));
      const doorH = Math.max(8, Math.min(bodyH*0.42, doorW*3.2));
      const doorX = bodyLeft + wallT*0.35;
      const doorY = bodyTopY + bodyH*0.52;
      const door =
        `<rect x="${f(doorX)}" y="${f(doorY)}" width="${f(doorW)}" height="${f(doorH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.26)}" y1="${f(doorY+1.6)}" x2="${f(doorX+doorW*0.26)}" y2="${f(doorY+doorH-1.6)}" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(doorX+doorW*0.74)}" y1="${f(doorY+1.6)}" x2="${f(doorX+doorW*0.74)}" y2="${f(doorY+doorH-1.6)}" stroke="#3a4060" stroke-width="1"/>` +
        `<circle cx="${f(doorX+doorW*0.5)}" cy="${f(doorY+doorH*0.5)}" r="${f(Math.min(doorW,doorH)*0.13)}" fill="#8e96b6" opacity="0.75"/>`;

      /* 进气口（箱体右壁 · 中部 · 含尘气入口）：顶部立管取消后改为侧向接管，
         画法与净化气出口统一：金属渐变管壁 + 深色管腔（#12162b/#6a7192）+
         端面把合法兰（#2a2f45/#3f445c）。管径比净化气出口略粗（含尘气量大）。
         位置落在滤袋底沿以下，气流自中部进入后向上穿过滤网，再由右上出口排出。*/
      const inletPortY = h*0.4;   // 与 ports.inlet.y = 0.4 严格同轴（箱体中部）
      const ipX = bodyRight + wallT;
      const ipLen = Math.max(3.5, w - ipX);
      const ipH = Math.max(4, Math.min(h*0.04, w*0.07));
      const inletPort = `
        <rect x="${f(ipX)}" y="${f(inletPortY-ipH/2)}" width="${f(ipLen)}" height="${f(ipH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(ipX)}" y="${f(inletPortY-ipH/2+0.9)}" width="${f(ipLen)}" height="${f(ipH-1.8)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(ipX+ipLen-1.6)}" y="${f(inletPortY-ipH/2-0.8)}" width="1.6" height="${f(ipH+1.6)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;

      /* 内部滤袋：花板贴箱顶内邊，滤袋自花板下沿往下垂 ——
         整个滤网（花板 + 滤袋）只占箱体上三分之一，下方留出含尘气缓冲区，
         气流自右壁中部进入后向上穿过滤网，干净气在花板上方由右上出口排出。
         袋径 bagW 按箱宽取值并定尺封顶，袋距 ≈ 袋径的 2 倍；
         袋列数 bagCount 由可用布袋宽度反算 —— 箱体越宽袋列自动增多，
         避免大尺寸下固定 6 列被横向拉长、小尺寸下挤成一团。*/
      const tsH = Math.max(2.2, Math.min(4.5, bodyH*0.075));
      const tsY = bodyTopY + padT;
      const bagTop = tsY + tsH;
      const bagBot = Math.max(bodyTopY + bodyH/3, bagTop + 2);   // 滤网底沿 ≈ 箱体上 1/3 处
      const bagZoneL = innerL + padT*0.5;
      const bagZoneW = innerW - padT;
      const bagW0 = Math.max(2.5, Math.min(12, bodyW*0.075));       // 滤袋直径（定尺封顶）
      const bagCount = Math.max(2, Math.min(20, Math.round(bagZoneW/(bagW0*2))));
      const bagSpacing = bagZoneW / bagCount;
      const bagW = Math.min(bagW0, bagSpacing*0.62);
      const tsHolePad = bagW*0.12;
      let bags = '', tsHoles = '';
      for(let i=0; i<bagCount; i++){
        const bx = bagZoneL + bagSpacing*(i+0.5);
        tsHoles += `<rect x="${f(bx-bagW/2-tsHolePad)}" y="${f(tsY+tsH*0.22)}" width="${f(bagW+tsHolePad*2)}" height="${f(tsH*0.56)}" rx="0.4" fill="#12162b" stroke="#5b6280" stroke-width="0.4"/>`;
        const bagLines = [];
        bagLines.push(`<line x1="${f(bx-bagW/2)}" y1="${f(bagTop)}" x2="${f(bx-bagW/2)}" y2="${f(bagBot)}" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`);
        bagLines.push(`<line x1="${f(bx+bagW/2)}" y1="${f(bagTop)}" x2="${f(bx+bagW/2)}" y2="${f(bagBot)}" stroke="${c}" stroke-width="0.8" opacity="0.6"/>`);
        for(let j=1; j<6; j++){
          const ly = bagTop + (bagBot-bagTop)*j/6;
          bagLines.push(`<line x1="${f(bx-bagW/2)}" y1="${f(ly)}" x2="${f(bx+bagW/2)}" y2="${f(ly)}" stroke="${c}" stroke-width="0.4" opacity="0.3"/>`);
        }
        bags += bagLines.join('');
      }
      /* 花板（tube sheet）：滤袋悬挂固定的金属板，位于深腔顶部，板上按袋位开孔，
         滤袋从孔中垂下。件体色与提升机链斗 / 螺旋一致（#9aa2bc + #5b6280）。*/
      const tubeSheet =
        `<rect x="${f(innerL)}" y="${f(tsY)}" width="${f(innerW)}" height="${f(tsH)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.7"/>` + tsHoles;

      // 滤袋支架（笼骨吊挂）：竖直吊杆，上端吊在花板上、下端到滤袋下沿
      const frame = `
        <line x1="${f(innerL)}" y1="${f(bagTop)}" x2="${f(innerL)}" y2="${f(bagBot)}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>
        <line x1="${f(innerL+innerW)}" y1="${f(bagTop)}" x2="${f(innerL+innerW)}" y2="${f(bagBot)}" stroke="${c}" stroke-width="0.6" opacity="0.4"/>`;

      /* 灰斗（梯形斗体）：画法对齐 bucketElevator 进料斗"三件套" ——
         落料口深色收口（#0c1020 / #6a7192）+ 金属渐变斗体 + 深色内腔（#12162b / #6a7192，由内部深色层裁剪呈现）。
         斗体上口与箱底法兰（botFl）把合，下口收成窄口（outletW）经落料颈接星型卸料阀。
         斗壁厚 hopWall 取箱壁厚 wallT 的 0.9，斗体轮廓与箱体同厚，金属斗壁清晰可见。
         后壁（#2a2f45）与金属斗体分属第 1 / 第 2 层绘制，故拆成两段。*/
      const hopperLeft = bodyLeft + bodyW*0.1;
      const hopperRight = bodyRight - bodyW*0.1;
      const hopWall = Math.max(1.5, wallT*0.9);
      const hopMouthL = cx - outletW/2, hopMouthR = cx + outletW/2;
      const hopperBack =
        `<polygon points="${f(hopperLeft-wallT)},${f(hopperTopY)} ${f(hopperRight+wallT)},${f(hopperTopY)} ${f(hopMouthL)},${f(hopperBotY)} ${f(hopMouthR)},${f(hopperBotY)}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>`;
      const hopperBody =
        `<polygon points="${f(hopperLeft)},${f(hopperTopY)} ${f(hopperRight)},${f(hopperTopY)} ${f(hopMouthL+hopWall*0.7)},${f(hopperBotY-hopWall*0.7)} ${f(hopMouthR-hopWall*0.7)},${f(hopperBotY-hopWall*0.7)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.2"/>`;

      /* 星型卸料阀（灰斗下方 · 连续排灰并锁气）：
         壳体金属渐变 + 深色腔（#12162b / #6a7192）+ 两端 #2a2f45 端盖（轴承座）；
         腔内十字转子仍用 ${c} 着色并保留 3s 旋转动画。尺寸按 outletW / h 定尺封顶。*/
      const starH = Math.max(5, Math.min(h*0.055, outletW*0.85));
      const starW = outletW * 1.2;
      const starY = outletY - starH;
      const starWall = Math.max(1, Math.min(2.5, starH*0.16));   // 壳体壁厚（封顶）
      const starCapW = Math.max(1.5, Math.min(3.5, starW*0.14)); // 端盖宽（封顶）
      const starValve = `
        <rect x="${f(cx-starW/2)}" y="${f(starY)}" width="${f(starW)}" height="${f(starH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${f(cx-starW/2+starWall)}" y="${f(starY+starWall)}" width="${f(starW-starWall*2)}" height="${f(starH-starWall*2)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${starY+starH/2}" to="360 ${cx} ${starY+starH/2}" dur="3s" repeatCount="indefinite"/>
          <polygon points="${cx},${starY+starH*0.15} ${cx+starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.35}" fill="${c}" opacity="0.7"/>
          <polygon points="${cx+starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.65} ${cx-starW*0.15},${starY+starH*0.45}" fill="${c}" opacity="0.6"/>
          <polygon points="${cx},${starY+starH*0.65} ${cx-starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.45}" fill="${c}" opacity="0.5"/>
          <polygon points="${cx-starW*0.2},${starY+starH/2} ${cx},${starY+starH*0.35} ${cx+starW*0.15},${starY+starH*0.55}" fill="${c}" opacity="0.6"/>
          <circle cx="${cx}" cy="${starY+starH/2}" r="${f(Math.max(1.2, starH*0.18))}" fill="${c}" opacity="0.8"/>
        </g>
        <rect x="${f(cx-starW/2)}" y="${f(starY)}" width="${f(starCapW)}" height="${f(starH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(cx+starW/2-starCapW)}" y="${f(starY)}" width="${f(starCapW)}" height="${f(starH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

      /* 落料颈：灰斗下口到星型卸料阀上法兰之间的一段深色落料通道（对齐提升机进料斗的 #0c1020 收口），
         把灰斗收口与卸料阀连成一体，不留下悬空的断面。*/
      const neckH = Math.max(0, starY - hopperBotY);
      const hopperThroat = neckH > 0.5
        ? `<rect x="${f(hopMouthL)}" y="${f(hopperBotY)}" width="${f(outletW)}" height="${f(neckH)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`
        : '';

      // 出料口法兰 + 卸料短管（金属渐变管壁 + 深色管腔，与接管画法统一；管长 outPipeH 为定尺封顶量）
      const outWall = Math.max(1, Math.min(2.5, outletW*0.08));
      const outletFlange = `
        <rect x="${f(cx-outletW/2-wallT)}" y="${f(starY)}" width="${f(outletW+wallT*2)}" height="${f(flH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(cx-outletW/2)}" y="${f(outletY)}" width="${f(outletW)}" height="${f(outPipeH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
        <rect x="${f(cx-outletW/2+outWall)}" y="${f(outletY)}" width="${f(outletW-outWall*2)}" height="${f(outPipeH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        ${bolt(cx-outletW/2+outWall+boltR+1, starY+flH/2)}
        ${bolt(cx+outletW/2-outWall-boltR-1, starY+flH/2)}`;

      // 净化气出口接管（箱体右壁顶部，与 cleanGas 端口同轴）：金属管 + 深色管腔 + 端面法兰
      const cleanPortY = h*0.2;   // 与 ports.cleanGas.y = 0.2 严格同轴（箱体右上）
      const cpX = bodyRight + wallT;
      const cpLen = Math.max(3.5, w - cpX);
      const cpH = Math.max(4, Math.min(h*0.035, w*0.06));
      const cleanPort = `
        <rect x="${f(cpX)}" y="${f(cleanPortY-cpH/2)}" width="${f(cpLen)}" height="${f(cpH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${f(cpX)}" y="${f(cleanPortY-cpH/2+0.9)}" width="${f(cpLen)}" height="${f(cpH-1.8)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
        <rect x="${f(cpX+cpLen-1.6)}" y="${f(cleanPortY-cpH/2-0.8)}" width="1.6" height="${f(cpH+1.6)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;

      /* 灰尘颗粒动画（含尘气从滤袋间下落 → 经灰斗收口 → 进星型阀）：
         起点在箱内可用宽度上均布，纵向行程取箱内留边量，摆动幅度按袋径缩放。*/
      const dustTop = bagTop + Math.min(2, padT*0.4);
      const dustBotBody = bagBot;
      const dustBotHopper = hopperBotY - padT;
      const hopHalf = (hopperRight - hopperLeft)/2;
      const mouthHalf = outletW/2;
      const swayX = bagW*1.2;
      let dustParticles = '';
      for(let i=0; i<8; i++){
        const delay = (i*0.6).toFixed(2);
        const startX = innerL + (i/8)*innerW;
        let pxVals = [], pyVals = [], popVals = [];
        const phases = 30;
        for(let k=0; k<=phases; k++){
          const t = k/phases;
          let y, x, op;
          if(t < 0.55){
            const bodyT = t/0.55;
            y = dustTop + (dustBotBody - dustTop)*bodyT;
            x = startX + Math.sin(bodyT*Math.PI*2 + i)*swayX;
            op = bodyT < 0.15 ? bodyT/0.15*0.6 : 0.6;
          } else {
            const hopperT = (t-0.55)/0.45;
            y = dustBotBody + (dustBotHopper - dustBotBody)*hopperT;
            const currentHopperHalfW = hopHalf - (hopHalf - mouthHalf)*hopperT;
            const relX = (startX - cx)/(innerW/2);
            x = cx + relX*currentHopperHalfW*0.85 + Math.sin(hopperT*Math.PI*3 + i)*swayX*0.4;
            op = hopperT > 0.85 ? (1-hopperT)/0.15*0.6 : 0.6;
          }
          pxVals.push(x.toFixed(1));
          pyVals.push(y.toFixed(1));
          popVals.push(op.toFixed(2));
        }
        dustParticles += `
          <circle cx="${pxVals[0]}" cy="${pyVals[0]}" r="${f(Math.max(0.8, bagW*0.2))}" fill="${c}" clip-path="url(#${clipId})" opacity="${popVals[0]}">
            <animate attributeName="cx" values="${pxVals.join(';')}" dur="4.5s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${pyVals.join(';')}" dur="4.5s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${popVals.join(';')}" dur="4.5s" begin="-${delay}s" repeatCount="indefinite"/>
          </circle>`;
      }

      /* 脉冲喷吹动画（喷吹气流从花板向下冲刷滤袋）：
         横向喷射起点与行程按袋径 bagW 缩放，纵向吹扫深度按箱高封顶。*/
      const pulseReach = Math.max(6, Math.min(14, bodyH*0.1));
      const jetDustR = Math.max(0.6, bagW*0.16);
      let pulseDust = '';
      for(let i=0; i<3; i++){
        const delay = (i*0.4).toFixed(2);
        const offset = (i-1)*bagW*0.9;
        const jetX0 = cx + offset, jetX1 = cx + offset + (i-1)*bagW*1.2;
        pulseDust += `
          <circle cx="${f(jetX0)}" cy="${f(dustTop)}" r="${f(jetDustR)}" fill="#fff" clip-path="url(#${clipId})" opacity="0">
            <animate attributeName="cy" values="${f(dustTop)};${f(dustTop+pulseReach)};${f(dustTop)}" keyTimes="0;0.5;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cx" values="${f(jetX0)};${f(jetX1)};${f(jetX0)}" keyTimes="0;0.5;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.6;0" keyTimes="0;0.3;1" dur="0.8s" begin="-${delay}s" repeatCount="indefinite"/>
          </circle>`;
      }

      // clipPath：主体矩形 + 漏斗区域（漏斗边界与 hopperBody 内腔同步，避免暗层溢出斗壁）
      const hopInBot = hopperBotY - hopWall*0.7;
      const clipDef = `<clipPath id="${clipId}">
        <rect x="${bodyLeft+1}" y="${bodyTopY+1}" width="${bodyW-2}" height="${bodyBotY-bodyTopY-2}"/>
        <polygon points="${f(hopperLeft+1)},${f(hopperTopY)} ${f(hopperRight-1)},${f(hopperTopY)} ${f(hopMouthR-hopWall)},${f(hopInBot)} ${f(hopMouthL+hopWall)},${f(hopInBot)}"/>
      </clipPath>`;

      return `
        <defs>
          ${clipDef}
          <linearGradient id="${metalId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
          <linearGradient id="${metalVId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
          </linearGradient>
        </defs>
        <!-- 1. 设备后壁（箱体 + 灰斗，灰斗后壁比斗体大一圈 wallT 形成外壁） -->
        <rect x="${bodyLeft-wallT}" y="${bodyTopY}" width="${bodyW+wallT*2}" height="${bodyBotY-bodyTopY}" fill="#2a2f45" stroke="#3f445c" stroke-width="1.5"/>
        ${hopperBack}
        <!-- 2. 设备主体金属填充 -->
        <rect x="${bodyLeft}" y="${bodyTopY}" width="${bodyW}" height="${bodyBotY-bodyTopY}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.5"/>
        ${hopperBody}
        <!-- 3. 内部深色层（覆盖主体+漏斗） -->
        <g clip-path="url(#${clipId})">
          <rect x="${f(innerL)}" y="${f(bodyTopY+padT)}" width="${f(innerW)}" height="${f(hopInBot-(bodyTopY+padT))}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>
        </g>
        <!-- 4. 内部内容（花板、滤袋、支架、粒子）——带裁剪，不会溢出 -->
        <g clip-path="url(#${clipId})">
          ${tubeSheet}
          ${frame}
          ${bags}
          ${dustParticles}
          ${pulseDust}
        </g>
        <!-- 5. 箱身把合法兰、顶/底法兰条和前景元素 -->
        ${joints}
        ${topFl}
        ${bolt(bodyLeft-wallT/2, bodyTopY-flH/2)}
        ${bolt(bodyLeft+bodyW/4, bodyTopY-flH/2)}
        ${bolt(bodyLeft+bodyW*3/4, bodyTopY-flH/2)}
        ${bolt(bodyRight+wallT/2, bodyTopY-flH/2)}
        ${botFl}
        ${bolt(bodyLeft-wallT/2, bodyBotY+flH/2)}
        ${bolt(bodyLeft+bodyW/4, bodyBotY+flH/2)}
        ${bolt(bodyLeft+bodyW*3/4, bodyBotY+flH/2)}
        ${bolt(bodyRight+wallT/2, bodyBotY+flH/2)}
        ${cleanPort}
        ${inletPort}
        ${door}
        ${hopperThroat}
        ${starValve}
        ${outletFlange}
      `;
    }
};
