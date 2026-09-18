/* ============================================================
 * PFD Editor · 组件模板：coolingPond
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.coolingPond。
 * ============================================================ */

TEMPLATES.coolingPond = {
    name: '冷却水池', category: '设备',
    defaultSize: { w: 160, h: 120 },
    ports: [
      {id:'inlet',x:.5,y:0,dir:'up'},
      {id:'outlet',x:.5,y:1,dir:'down'},
      {id:'overflow',x:1,y:.4,dir:'right'}
    ],
    render: (w,h,p)=>{
      const c = (p && p.color) || '#9C99FF';
      const uid = Math.random().toString(36).substr(2,6);
      const gid = 'water_'+uid;
      const clipId = 'waveclip_'+uid;
      const metalId = 'pond_metal_'+uid;
      const metalVId = 'pond_metalv_'+uid;
      const boltAt = (bx,by,r)=>`<circle cx="${bx}" cy="${by}" r="${r}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/><circle cx="${bx}" cy="${by}" r="${r*0.4}" fill="#8e96b6" opacity="0.5"/>`;
      const f = n => Number(n).toFixed(2);
      const clamp = (v, lo, hi)=>Math.max(lo, Math.min(hi, v));
      /* 池体几何 —— 全部按池宽 / 池高封顶（定尺）：
         尺寸放大时只有中间段变长，池壁厚 / 压顶 / 内壁内缩 / 地面高等定尺量不随之变粗
         （替换原先固定 wall=6 / rimY=16 / rimBottom=h-10 / innerX=wall+4 / waterBottom=-wall-2）。*/
      const wall       = clamp(Math.min(w,h)*0.05, 3, 6);        // 池壁厚（默认 160×120 → 6）
      const rimH       = clamp(h*0.05, 4, 6);                    // 池顶压顶高
      const rimY       = clamp(h*0.1333, 10, 16);                // 压顶上沿（池顶 y）
      const rimBottom  = h - clamp(h*0.0833, 6, 10);             // 池底外沿
      const innerInset = clamp(Math.min(w,h)*0.0333, 2, 4);      // 内壁相对外壁再内缩
      const innerX = wall + innerInset, innerW = Math.max(1, w-(wall+innerInset)*2);
      const inletX = w*0.5, outletX = w*0.5;
      // 水面 / 水体：按池内腔高度比例铺排，矮尺寸下水体仍保留下限高度（不消失 / 不糊成一条线）
      const poolInnerTop = rimY + rimH;
      const poolInnerBot = Math.max(poolInnerTop + 1, rimBottom - wall);
      const innerSpan    = poolInnerBot - poolInnerTop;
      const waterY       = Math.round(poolInnerTop + innerSpan*0.40);             // 常水位（默认 ≈ 55）
      const waterH       = Math.max(1.5, Math.min(Math.round(innerSpan*0.57), poolInnerBot - waterY));
      const cavTop       = clamp(h*0.05, 3, 6);                  // 内腔上探（水面之上的气相空间，定尺封顶）
      const edgeW        = clamp(wall*0.33, 1, 2);               // 内腔左右侧壁亮 / 暗收边
      // 接管 / 法兰 / 螺栓定尺封顶（进 / 出水管为竖管，管身沿 y 走向、管宽沿 x 走向）
      const pipeW = clamp(w*0.0375, 3, 8);                    // 管身宽（默认 160 → 6）
      const wallT = clamp(pipeW*0.18, 0.6, 1.4);              // 管壁厚
      const flW   = clamp(pipeW*1.7, 6, 14);                  // 端面法兰宽（默认 → 约 10）
      const flH   = clamp(pipeW*0.7, 2, 5);                   // 端面法兰厚（默认 → 约 4）
      const boltR = clamp(flW*0.12, 0.6, 1.4);                // 螺栓半径
      /* 进 / 出水管统一画法 —— 对齐泵 / 阀接管：
         金属管壁（metalId：竖管取横向渐变）+ 深色管腔（#12162b / #6a7192）
         + 端面把合法兰（#2a2f45 / #3f445c）+ 两颗螺栓（#8e96b6）。
         管口最外端即端口锚点（进水管口顶边 y=0、出水管口底边 y=h），端面法兰画在管口内侧。 */
      const makeVPipe = (x, y0, y1, end)=>{
        const x0 = x - pipeW/2;
        const cavW = Math.max(0.4, pipeW - wallT*2);
        const flY = (end === 'top') ? y0 : y1 - flH;
        const boltY = flY + flH/2;
        const bX1 = x - flW*0.3, bX2 = x + flW*0.3;
        return `<rect x="${f(x0)}" y="${f(y0)}" width="${f(pipeW)}" height="${f(y1-y0)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
          <rect x="${f(x0+wallT)}" y="${f(y0)}" width="${f(cavW)}" height="${f(y1-y0)}" fill="#12162b" stroke="#6a7192" stroke-width="0.5"/>
          <rect x="${f(x-flW/2)}" y="${f(flY)}" width="${f(flW)}" height="${f(flH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
          ${boltAt(bX1, boltY, boltR)}${boltAt(bX2, boltY, boltR)}`;
      };
      // 池体接口把合法兰（竖管与池壁交接处，螺栓左右分列）
      const jFlW = pipeW + clamp(pipeW*0.8, 2, 6);
      const jFlH = clamp(pipeW*0.4, 1.6, 3);
      const jBoltR = clamp(jFlH*0.3, 0.5, 1);
      const makeJointV = (x, y)=>`<rect x="${f(x-jFlW/2)}" y="${f(y-jFlH/2)}" width="${f(jFlW)}" height="${f(jFlH)}" rx="0.8" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${boltAt(x-jFlW*0.30, y, jBoltR)}${boltAt(x+jFlW*0.30, y, jBoltR)}`;
      // 局部渐变 / 裁剪定义（须置于 <defs>，id 带 uid 后缀保证跨实例唯一）
      const defs = `
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3FA9F5" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#1E5AA8" stop-opacity="0.9"/>
        </linearGradient>
        <clipPath id="${clipId}"><rect x="${innerX}" y="${waterY}" width="${innerW}" height="${waterH}"/></clipPath>`;
      // 落水滴（进水管口→水面，持续水流）；粒半径 / 横向散开量按池宽 clamp（替换固定 1.2 / 1.5 / 1.3）
      const dropR = clamp(w*0.0075, 0.6, 1.2);
      const dropSpread = clamp(w*0.008, 0.5, 1.6);
      const dropY0 = rimY - clamp(h*0.017, 1, 2);            // 落水起点（池顶下方定尺留边）
      const waterDrops = (x,yStart,yEnd)=>{
        return Array.from({length:6}).map((_,i)=>{
          const delay = -i*0.4;
          const dur = 1.3 + (i%3)*0.15;
          return `<circle r="${f(dropR*(i%2?1.42:1))}" fill="${c}" opacity="0.9">
            <animate attributeName="cx" values="${x};${x+(i-2.5)*dropSpread}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${yStart};${yEnd}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle>`;
        }).join('');
      };
      // 1. 混凝土地面（高 / 分隔线按池高 / 池宽 clamp）
      const groundH = clamp(h*0.05, 3, 6);
      const groundX = clamp(w*0.012, 1, 3);
      const ground = `<rect x="0" y="${f(h-groundH)}" width="${w}" height="${f(groundH)}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
        <line x1="${f(groundX)}" y1="${f(h-groundH/2)}" x2="${f(w-groundX)}" y2="${f(h-groundH/2)}" stroke="#6a7192" stroke-width="0.6" opacity="0.4"/>`;
      // 2. 池壁（外壁金属渐变 + 内腔；圆角 / 描边 / 内腔上探 / 收边均定尺封顶）
      const wallRX    = clamp(wall*0.5, 1, 3);
      const wallSW    = clamp(wall*0.33, 1, 2);
      const cavInnerSW = clamp(wall*0.17, 0.5, 1);
      const wallBody = `
        <rect x="${f(wall)}" y="${f(rimY)}" width="${f(w-wall*2)}" height="${f(rimBottom-rimY)}" rx="${f(wallRX)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="${f(wallSW)}"/>
        <rect x="${f(innerX)}" y="${f(waterY-cavTop)}" width="${f(innerW)}" height="${f(waterH+cavTop)}" fill="#12162b" stroke="#6a7192" stroke-width="${f(cavInnerSW)}" opacity="0.9"/>
        <rect x="${f(innerX-edgeW)}" y="${f(waterY-cavTop)}" width="${f(edgeW)}" height="${f(waterH+cavTop)}" fill="#5b6280"/>
        <rect x="${f(innerX+innerW)}" y="${f(waterY-cavTop)}" width="${f(edgeW)}" height="${f(waterH+cavTop)}" fill="#0c1020"/>`;
      // 3. 池顶压顶（外挑 / 上沿 / 圆角 / 高光均按池壁厚或池高封顶）
      const rimOverhang = clamp(wall*0.5, 1.5, 3);
      const rimTop = rimY - clamp(h*0.033, 2.5, 4);
      const rimRX = clamp(rimH*0.33, 1, 2);
      const rimHiH = clamp(rimH*0.25, 0.8, 1.5);
      const rim = `<rect x="${f(wall-rimOverhang)}" y="${f(rimTop)}" width="${f(w-wall*2+rimOverhang*2)}" height="${f(rimH)}" rx="${f(rimRX)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${f(wall-rimOverhang*0.33)}" y="${f(rimTop+rimH*0.33)}" width="${f(w-wall*2+rimOverhang*0.66)}" height="${f(rimHiH)}" fill="#5b6280"/>`;
      // 4. 水面（蓝色渐变）
      const water = `<rect x="${innerX}" y="${waterY}" width="${innerW}" height="${waterH}" fill="url(#${gid})"/>`;
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
        // 振幅 / 线宽按水体高 waterH 比例并设上下限（替换固定 3 / 5 与 1.2 / 0.8）
        const amp = clamp(waterH*(i===1?0.064:0.106), 0.8, 6);
        const sw  = clamp(waterH*(i===1?0.0255:0.017), 0.6, 1.2);
        return `<path d="${waveD(ph,amp)}" fill="none" stroke="#d9dded" stroke-width="${f(sw)}" opacity="0.6" clip-path="url(#${clipId})">
          <animateTransform attributeName="transform" type="translate" values="0 0;${f(innerW*0.10)} 0;0 0" dur="${3+i}s" repeatCount="indefinite"/>
        </path>`;
      }).join('');
      // 6. 液位标尺（内腔左壁：主刻度 + 次刻度，起点 waterY、等分 waterH）
      const tickX = innerX + clamp(innerW*0.007, 0.5, 1);        // 刻度起点（贴内壁，定尺封顶）
      const tickLenMajor = clamp(innerW*0.16, 3, 8);
      const tickLenMinor = tickLenMajor*0.55;
      const tickSW = clamp(innerW*0.02, 0.5, 1);
      const scaleMajorN = Math.max(1, Math.min(6, Math.round(waterH/12)));   // 主刻度段数按水体高 clamp（默认 4 → 9 条）
      let scaleTicks = '';
      for(let i=0;i<=scaleMajorN;i++){
        const ty = waterY + waterH*i/scaleMajorN;
        scaleTicks += `<line x1="${f(tickX)}" y1="${f(ty)}" x2="${f(tickX+tickLenMajor)}" y2="${f(ty)}" stroke="${c}" stroke-width="${f(tickSW)}" opacity="0.7"/>`;
      }
      for(let i=0;i<scaleMajorN;i++){
        const ty = waterY + waterH*(i+0.5)/scaleMajorN;
        scaleTicks += `<line x1="${f(tickX)}" y1="${f(ty)}" x2="${f(tickX+tickLenMinor)}" y2="${f(ty)}" stroke="${c}" stroke-width="${f(tickSW*0.8)}" opacity="0.4"/>`;
      }
      const scale = `<g>${scaleTicks}</g>`;
      // 7. 进水管（顶部统一画法 + 接口法兰 + 阀门阀体 / 手轮 + 落水）
      const inletPipe = makeVPipe(inletX, 0, rimY, 'top');
      const inletJoint = makeJointV(inletX, rimY);
      // 阀体（管右侧，避开顶部法兰）+ 阀杆 + 顶置手轮
      const vbW = clamp(pipeW*0.6, 3, 6);                       // 阀体宽
      const vbH = clamp(rimY*0.55, 5, 9);                       // 阀体高
      const vbX = inletX + pipeW/2 + clamp(pipeW*0.6, 2, 5);    // 阀体左缘
      const vbY = rimY - vbH;                                   // 阀体底对齐池顶
      const stemW = clamp(vbW*0.4, 0.8, 2);
      const hPad = Math.max(1, rimY*0.06);
      const wheelR = clamp((vbY-hPad)*0.42, 0, Math.min(w*0.14, vbH*0.55));
      const wheelCX = vbX + vbW/2;
      const wheelCY = hPad + wheelR;
      const handleR = clamp(wheelR*0.24, 0.6, 1.8);
      const spokeSW = clamp(wheelR*0.35, 0.6, 1.1);             // 辐条线宽按手轮半径 clamp
      const rimSW   = clamp(wheelR*0.54, 0.8, 1.6);             // 轮缘线宽按手轮半径 clamp
      const stemEx  = clamp(h*0.004, 0.3, 0.8);                 // 阀杆插入阀体的余量（定尺封顶）
      let inletValve = `<rect x="${f(vbX)}" y="${f(vbY)}" width="${f(vbW)}" height="${f(vbH)}" rx="${f(Math.min(2, vbW*0.4))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      if(wheelR >= 1.4){
        const spokeN = wheelR >= 2.2 ? 5 : 4;
        let spokes = '';
        for(let i=0;i<spokeN;i++){
          const a = i*(360/spokeN)*Math.PI/180 - Math.PI/2;
          spokes += `<line x1="${f(wheelCX)}" y1="${f(wheelCY)}" x2="${f(wheelCX+Math.cos(a)*wheelR*0.82)}" y2="${f(wheelCY+Math.sin(a)*wheelR*0.82)}" stroke="#9aa2bc" stroke-width="${f(spokeSW)}"/>`;
        }
        inletValve += `<rect x="${f(wheelCX-stemW/2)}" y="${f(wheelCY)}" width="${f(stemW)}" height="${f(vbY-wheelCY+stemEx)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>
          <circle cx="${f(wheelCX)}" cy="${f(wheelCY)}" r="${f(wheelR)}" fill="none" stroke="#9aa2bc" stroke-width="${f(rimSW)}"/>
          <circle cx="${f(wheelCX)}" cy="${f(wheelCY)}" r="${f(Math.max(0.6, wheelR*0.26))}" fill="#5b6280" stroke="#9aa2bc" stroke-width="0.7"/>
          ${spokes}
          <circle cx="${f(wheelCX)}" cy="${f(wheelCY-wheelR)}" r="${f(handleR)}" fill="#8e96b6" opacity="0.7" stroke="#3a4060" stroke-width="0.5"/>`;
      }
      const inlet = `${inletPipe}${inletJoint}${inletValve}${waterDrops(inletX, dropY0, waterY)}`;
      // 8. 出水管（底部统一画法 + 接口法兰）
      const outlet = `${makeVPipe(outletX, rimBottom, h, 'bottom')}${makeJointV(outletX, rimBottom)}`;
      // 9. 溢流口（完全收进池壁内，不伸出设备边界）
      //    端口 overflow(1, .4, right) 锚点 = (w, 0.4h)：管口最外侧固定在 x=w，
      //    整组（短管 + 左侧封头竖板）垂直中心对齐 overflowY，须与上方 ports 定义保持同步（修 P7 错位）。
      const overflowY = h*0.4;
      const overflowW = Math.max(5, Math.min(14, w/16));                        // 管身长（定尺封顶）
      const overflowH = Math.max(4, Math.min(12, h/15));                        // 管身高（定尺封顶）
      const overflowPlateW = Math.max(2, Math.min(4, overflowW*0.3));           // 封头竖板宽
      const overflowPlateH = overflowH + Math.max(2, Math.min(6, overflowH*0.5)); // 封头竖板高
      const overflow = `
        <rect x="${w-overflowW}" y="${overflowY-overflowH/2}" width="${overflowW}" height="${overflowH}" rx="1" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${w-overflowW}" y="${overflowY-overflowPlateH/2}" width="${overflowPlateW}" height="${overflowPlateH}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      // 10. 爬梯（左侧池壁：双竖杆 + 横档，档数按池高 clamp）
      const ladderPad = clamp((rimBottom-rimY)*0.12, 2, 4);
      const railX1 = clamp(w*0.02, 2, 4);
      const railGap = clamp(w*0.04, 3, 6);
      const railX2 = railX1 + railGap;
      const rungN = Math.max(3, Math.min(8, Math.round((rimBottom-rimY)/14)));
      const rungTop = rimY + ladderPad, rungBot = rimBottom - ladderPad;
      const rungGap = (rungBot-rungTop)/Math.max(1, rungN-1);
      const rungSW = clamp(w*0.005, 0.5, 1);                 // 横档 / 竖杆线宽按池宽封顶
      const ladder = `<g stroke="${c}" stroke-width="${f(rungSW)}" opacity="0.6">
          <line x1="${f(railX1)}" y1="${f(rungTop)}" x2="${f(railX1)}" y2="${f(rungBot)}"/>
          <line x1="${f(railX2)}" y1="${f(rungTop)}" x2="${f(railX2)}" y2="${f(rungBot)}"/>
          ${Array.from({length:rungN}).map((_,i)=>`<line x1="${f(railX1)}" y1="${f(rungTop+i*rungGap)}" x2="${f(railX2)}" y2="${f(rungTop+i*rungGap)}"/>`).join('')}
        </g>`;
      // 11. 铭牌（保留文字 冷却水池；板 / 描边统到基准法兰色系 `#2a2f45` / `#3f445c`，
      //     文字用主题色 ${c}；宽 / 高 / 字号按池宽池高封顶，竖向嵌在“压顶—常水位”之间的
      //     气相空间内，极小尺寸下随气相空间收缩，不压住水体，右沿不越出内腔右壁）
      const gasTop = rimY, gasBot = waterY, gasH = Math.max(2, gasBot - gasTop);
      const plateW = clamp(w*0.15, 14, 30);
      const plateH = clamp(Math.min(h*0.083, gasH - 2), 3.5, 12);
      const plateRight = innerX + innerW - edgeW;
      const plateX = clamp(w - plateW - clamp(w*0.037, 3, 8), innerX + edgeW, Math.max(innerX + edgeW, plateRight - plateW));
      const plateY = gasTop + Math.max(0.5, (gasH - plateH)/2);
      const plateFont = clamp(Math.min(plateW*0.25, plateH*0.45), 2.6, 5.5);
      const plateSW = clamp(plateH*0.06, 0.4, 0.8);
      const nameplate = `<rect x="${f(plateX)}" y="${f(plateY)}" width="${f(plateW)}" height="${f(plateH)}" rx="1" fill="#2a2f45" stroke="#3f445c" stroke-width="${f(plateSW)}"/>
        <text x="${f(plateX+plateW/2)}" y="${f(plateY+plateH*0.72)}" text-anchor="middle" fill="${c}" font-size="${f(plateFont)}" font-weight="bold" opacity="0.7">冷却水池</text>`;
      return `<defs>${defs}</defs>${ground}${wallBody}${rim}${water}${waves}${scale}${inlet}${outlet}${overflow}${ladder}${nameplate}`;
    }
};
