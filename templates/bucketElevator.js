/* ============================================================
 * PFD Editor · 组件模板：bucketElevator
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.bucketElevator。
 *   配色与画法对齐 reactor（反应釜）：金属渐变机壳 + 深色内腔 + 法兰色系
 *     #7d849e → #d9dded → #767d97（金属渐变）
 *     #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   链斗与链轮用 SMIL 动画驱动，编辑态由 editor.js stripSMIL() 自动剥离。
 *
 *   机头（罩壳）与出料口按实机设计改版：
 *     · 顶部为【椭圆拱冠】——随头轮外缘包络的弧形罩壳，不再是平口矩形；
 *       拱冠与直壁段的交线处设罩壳对接法兰（罩壳/机壳把合面）。
 *     · 出料口开在机头【出料侧直壁段】（右侧 = 空斗下行侧）上，外接一段 70° 斜置溜槽
 *       （金属槽壁 + 深色槽腔 + 槽口法兰 + 螺栓），槽根设可调喉板（长圆孔 + 锁紧螺栓）；
 *       物料绕头轮被离心抛出后由该槽接走 —— 不再是"挂在机头底壁、垂直朝下的漏斗"。
 *     · 顶部变拱冠后驱动改坐【拱顶驱动机架】（横跨足印的机架板 + 两条立筋落到拱面）。
 *   详见《斗式提升机优化计划.md》（现状读码 / 实机资料 / 方案取舍 / 实施清单）。
 * ============================================================ */

TEMPLATES.bucketElevator = {
    name: '斗式提升机', category: '输送与给料',
    defaultSize: { w: 92, h: 380 },
    ports: [
      /* outlet：机头【出料侧直壁段】外接的斜置溜槽槽口（物料绕头轮离心抛出后被该槽接走）。
         x/y 写成函数（而非固定比例）：机头是按机宽封顶的定尺部件、位置不随机身加高而变，
         只有按尺寸实算才能保证任何拉伸比下端口都落在槽口中心（几何见文件末 bucketElevatorGeom）。*/
      {id:'outlet', x:(w,h)=>bucketElevatorOutlet(w,h).x/w, y:(w,h)=>bucketElevatorOutlet(w,h).y/h, dir:'down'},
      {id:'inlet',  x:.10,  y:.84,  dir:'up'}     // 机座左上方外凸进料斗口，上方入料
    ],
    render: (w,h,p)=>{
      const uid = Math.random().toString(36).substr(2,6);
      const clipId = 'be_clip_'+uid, metalId = 'be_metal_'+uid, baseId = 'be_base_'+uid;
      const cx = w/2;
      const f = n => Number(n).toFixed(2);
      /* 整机加高时只有中间机壳（机筒）变长：机头、机座、驱动装置都是定尺部件，
         按机宽封顶，否则高度翻倍会把机头一起拉高，比例失真。
         H(高度比例量, 机宽比例量) = 取两者较小值。*/
      const H = (hr, wr) => Math.min(h*hr, w*wr);
      /* 机头（金属罩壳 + 深色内腔）：顶部为【椭圆拱冠】——随头轮外缘包络，不再是平口矩形；
         拱冠与直壁段的交线 archY 即罩壳与机壳的对接法兰位置；
         直壁段（archY→headBot）右侧开出料口、左侧开观察门。
         机头尺寸按实机比例定：宽 0.70w（= 1.46 × 机筒宽 0.48w，实机机头约为机筒的 1.3~1.5 倍）、
         高 0.40w —— 比"又宽又扁"的旧尺寸更接近方形，拱冠也更圆（矢高/半宽 ≈ 0.7）；
         同时把右侧 0.15w 让给侧置出料溜槽（出料口必须开在侧壁，且溜槽要够大）。*/
      const gm = bucketElevatorGeom(w,h);
      const { headX, headW, headTop, headH, headBot, headWallT, flatW, shoulderR,
              archRise, archY, wallH, headRX, openTopY, openBotY, mouthY, mouthL, mouthR,
              mouthCX, spoutWallT, spoutBackX } = gm;
      /* 机头顶面高度（平顶 / 圆肩），用于把驱动机架立筋落到顶面上（保证不悬空） */
      const archAt = x => bucketElevatorTopAt(gm, x);
      /* 驱动装置（机头顶部）：电机 — 联轴器（带防护罩）— 逆止器 — 减速机 — 机头主轴。
         机头顶部现在是【平顶 + 两侧圆肩】，平顶宽 0.53 × 机头宽 —— 驱动整组收在平顶宽度以内、
         直接坐在平顶（机架底板）上，两侧圆肩完整露出（照片里机头顶部也是干净的一片平顶）。*/
      const driveBot = headTop, driveH = Math.min(H(0.048, 0.115), headTop*0.85);
      const driveY = driveBot - driveH, driveCY = driveY + driveH*0.5;
      const gearW = w*0.135, gearX = cx - gearW;         // 减速机箱体（输出端 = cx，正对主轴）
      const motX = cx + w*0.012, motW = w*0.125;         // 电机壳体（紧接减速机右侧）
      // 机座（底座 + 斜底）：底边与斜底、机座矩形高度均为定尺，不随机身加高变化
      const bootX = w*0.20, bootW = w*0.60, bootBotY = h*0.99;
      const bootBotH = H(0.04, 0.085), bootRectH = H(0.16, 0.32);
      const bootTop = bootBotY - bootBotH - bootRectH;
      const bootRectBot = bootTop + bootRectH;
      // 中间机壳：机头底 → 机座顶，机身增加的高度全部由这一段承担
      const casingX = w*0.26, casingW = w*0.48, casingTop = headBot, casingBot = bootTop;
      /* 链轮与链条（上下链轮同径，链条为一条闭合环）
         链轮取到机头内腔允许的最大半径：链条间距 = 2×spR，半径越大上下行链条分得越开，
         否则两股链条挤在中线附近，看不出"上行 / 下行"两条独立边。*/
      const spR = Math.min(headH*0.36, casingW*0.31, bootRectH*0.46);
      const topSpY = headTop + headH*0.5, botSpY = bootTop + bootRectH*0.5;
      const chainL = cx - spR, chainR = cx + spR;
      const loopP = `M ${f(chainR)} ${f(topSpY)} L ${f(chainR)} ${f(botSpY)} ` +
        `A ${f(spR)} ${f(spR)} 0 0 1 ${f(chainL)} ${f(botSpY)} L ${f(chainL)} ${f(topSpY)} ` +
        `A ${f(spR)} ${f(spR)} 0 0 1 ${f(chainR)} ${f(topSpY)} Z`;
      // 料斗：左链上行（斗口朝上兜料）、右链下行（斗口倒扣卸完料），端部淡入淡出（避免循环跳变）
      const bucketW = casingW*0.30, bucketH = Math.max(3, Math.min(h*0.028, bucketW*0.42));
      /* 链条线速度统一：料斗的直线往复与链轮圆周必须同速，
         否则链轮看起来像在胶带上打滑。斗速按 9.7s 走完全程取值，约合实机 1.5 m/s。*/
      const travel = botSpY - topSpY;
      /* 机身加高后料斗按斗距加密（约 0.34 机宽一斗），与实机"料斗密集型布置"一致 */
      const perRun = Math.max(4, Math.min(12, Math.round(travel/(w*0.34))));
      const vLin = travel / 9.7;
      const bucketDur = travel / vLin;              // 料斗单向行程耗时
      const spDur = 2*Math.PI*spR / vLin;           // 链轮转一周耗时（与料斗同线速）
      /* 料斗姿态随链条换边翻转：上行侧斗口朝上（上宽下窄，兜着料上升）；
         绕过机头链轮翻到下行侧后，斗口朝下卸空（上窄下宽的正梯形），
         否则两侧斗口同向，看不出"载料上行 / 空斗下行"的区别。*/
      const bucketPath = (bx, flipped) => {
        const tw = bucketW*(flipped ? 0.32 : 0.5), bw = bucketW*(flipped ? 0.5 : 0.32);
        return `M ${f(bx-tw)} 0 L ${f(bx+tw)} 0 L ${f(bx+bw)} ${f(bucketH)} L ${f(bx-bw)} ${f(bucketH)} Z`;
      };
      /* 料斗 = 外层只承载动画、内层做静态定位：编辑态 stripSMIL() 剥掉动画后，
         内层的静态 slotY 仍让料斗等距排布可见（否则料斗会全叠在 y=0 处被 clip 裁掉）。
         运行态总位移 = 静态 slotY + 动画 (fromY-slotY → toY-slotY)，恰好落在 fromY→toY 上。*/
      const bucketFly = (bx, fromY, toY, d, slotY, flipped) =>
        `<g><animateTransform attributeName="transform" type="translate" from="0 ${f(fromY-slotY)}" to="0 ${f(toY-slotY)}" dur="${f(bucketDur)}s" begin="-${d}s" repeatCount="indefinite"/>` +
        `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur="${f(bucketDur)}s" begin="-${d}s" repeatCount="indefinite"/>` +
        `<g transform="translate(0 ${f(slotY)})"><path d="${bucketPath(bx, flipped)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.6"/></g></g>`;
      let buckets = '';
      for(let i=0;i<perRun;i++){
        const d = (i*bucketDur/perRun).toFixed(2);
        const slotY = botSpY - (i+0.5)*travel/perRun;      // 静态等距分布（左右两侧同高）
        // 左链上行 = 斗口朝上兜料；右链下行 = 翻扣卸空（正梯形）
        buckets += bucketFly(chainL, botSpY, topSpY, d, slotY, false) + bucketFly(chainR, topSpY, botSpY, d, slotY, true);
      }
      // 链轮：深色轮盘 + 旋转辐条 + 轮毂
      // 同一根闭合链条，上下链轮必须同向旋转：顺时针时轮左侧向上、右侧向下，与料斗方向一致
      const spokes = (scy)=>{
        let s = '';
        for(let i=0;i<6;i++){
          const a = i*Math.PI/3;
          s += `<line x1="${f(cx+Math.cos(a)*spR*0.32)}" y1="${f(scy+Math.sin(a)*spR*0.32)}" ` +
               `x2="${f(cx+Math.cos(a)*(spR-0.9))}" y2="${f(scy+Math.sin(a)*(spR-0.9))}" stroke="#5b6280" stroke-width="1"/>`;
        }
        return s;
      };
      const sprocket = scy =>
        `<circle cx="${f(cx)}" cy="${f(scy)}" r="${f(spR)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2"/>` +
        `<g><animateTransform attributeName="transform" type="rotate" from="0 ${f(cx)} ${f(scy)}" to="360 ${f(cx)} ${f(scy)}" dur="${f(spDur)}s" repeatCount="indefinite"/>${spokes(scy)}</g>` +
        `<circle cx="${f(cx)}" cy="${f(scy)}" r="${f(spR*0.26)}" fill="#6a7192" opacity="0.85"/>`;
      /* 机壳外表面统一走金属渐变：中间机壳保留深色内腔供链条料斗可见，
         但左右各加一条金属侧板（相当于机壳钢板壁厚），避免中间段"整段发黑"。*/
      const sideW = casingW*0.07;
      const sidePlates =
        `<rect x="${f(casingX)}" y="${f(casingTop)}" width="${f(sideW)}" height="${f(casingBot-casingTop)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.6"/>` +
        `<rect x="${f(casingX+casingW-sideW)}" y="${f(casingTop)}" width="${f(sideW)}" height="${f(casingBot-casingTop)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.6"/>`;
      /* 中间机壳标准节之间的把合法兰：机身加高后标准节自动增多（单节约 0.3 机宽），
         法兰条厚度按机宽封顶，不随机身变高而变粗。*/
      const nSec = Math.max(3, Math.round((casingBot-casingTop)/(w*0.30)));
      const jointH = H(0.014, 0.030), edgeFlH = H(0.016, 0.034);
      let joints = '';
      for(let i=1;i<nSec;i++){
        const jy = casingTop + (casingBot-casingTop)*i/nSec;
        joints += `<rect x="${f(casingX-w*0.02)}" y="${f(jy-jointH*0.5)}" width="${f(casingW+w*0.04)}" height="${f(jointH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      }
      // 观察门（机头看卸料、机座看清扫积料）：门板 + 两条铰链 + 把手，沿用 vrm 机座检修门的画法
      const doorW = w*0.14, doorH = H(0.052, 0.10);
      const door = (dx, dy, dh)=>{
        const dH = dh || doorH;
        return `<rect x="${f(dx)}" y="${f(dy)}" width="${f(doorW)}" height="${f(dH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(dx+doorW*0.28)}" y1="${f(dy+1.6)}" x2="${f(dx+doorW*0.28)}" y2="${f(dy+dH-1.6)}" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(dx+doorW*0.72)}" y1="${f(dy+1.6)}" x2="${f(dx+doorW*0.72)}" y2="${f(dy+dH-1.6)}" stroke="#3a4060" stroke-width="1"/>` +
        `<circle cx="${f(dx+doorW*0.5)}" cy="${f(dy+dH*0.5)}" r="${f(Math.min(doorW,dH)*0.11)}" fill="#8e96b6" opacity="0.7"/>`;
      };
      // 机头看卸料门：落在左侧【直壁段】内（拱冠下方、让开对接法兰与右侧出料口）
      const headDoorH = Math.max(3, Math.min(headH*0.26, wallH*0.64));
      const headDoor = door(headX+w*0.03, archY+(wallH-headDoorH)/2, headDoorH);
      const bootDoor = door(bootX+w*0.03, bootTop+(bootRectH-doorH)/2); // 机座左侧壁（让开中部下链轮）
      /* 进料口（机座 · 上方入料）：机座左壁外挂一只外凸的喇叭形进料斗，斗口朝上敞开、
         明显凸出机座轮廓，物料从上方倒入斗内，沿斗壁下滑收口后从机座左上侧壁喂入——
         即实机的"流入式喂料"，不是管道接管进料。
         画法与机壳统一：金属渐变斗体 + 深色内腔 + 把合口沿。*/
      const inMouthY  = bootTop - bootRectH*0.66;       // 斗口顶沿（明显高出机座顶面，料从上方倒入）
      const inThroatY = bootTop + bootRectH*0.10;       // 收口端（贴到机座左上侧壁上）
      const inMouthL  = w*0.005, inMouthR = bootX;      // 斗口宽度（外凸到机座左壁之外）
      const inThroatL = w*0.125, inThroatR = bootX;     // 收口窄口
      const inLip = H(0.012, 0.024), inWall = w*0.020;  // 斗口口沿厚度 / 斗壁厚
      const inletHopper =
        `<rect x="${f(bootX-w*0.010)}" y="${f(inThroatY-inWall*0.9)}" width="${f(w*0.028)}" height="${f(inWall*1.8)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>` +
        `<polygon points="${f(inMouthL)},${f(inMouthY)} ${f(inMouthR)},${f(inMouthY)} ${f(inThroatR)},${f(inThroatY)} ${f(inThroatL)},${f(inThroatY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<polygon points="${f(inMouthL+inWall)},${f(inMouthY+inLip)} ${f(inMouthR-inWall)},${f(inMouthY+inLip)} ${f(inThroatR-inWall)},${f(inThroatY-inWall*0.6)} ${f(inThroatL+inWall)},${f(inThroatY-inWall*0.6)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        `<rect x="${f(inMouthL)}" y="${f(inMouthY)}" width="${f(inMouthR-inMouthL)}" height="${f(inLip)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      /* 出料口（机头 · 侧壁斜置溜槽）：物料绕头轮被离心抛出，沿抛物线飞向机头【出料侧】
         （右侧 = 空斗下行侧）；出料口开在该侧直壁段上，外接一段斜出的溜槽把料流接走，
         槽根设可调喉板 —— 而不是"挂在机头底壁、垂直朝下的漏斗"。
         槽体形状照实机照片：槽根贴机头右壁的开口，斜向下伸到【水平槽口】、槽口朝下排料，
         槽口正好落在机头底面高度。画法与接管三件套一致：金属槽壁 + 深色槽腔 + 槽口法兰 + 螺栓。
         几何统一由 bucketElevatorGeom(w,h) 给出（端口反推也读同一份，见文件末）。*/
      const wallRX = headX + headW;                                  // 机头右壁（出料侧）
      const spoutBody =
        `<polygon points="${f(spoutBackX)},${f(openTopY)} ${f(mouthR)},${f(mouthY)} ${f(mouthL)},${f(mouthY)} ${f(spoutBackX)},${f(openBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>`;
      /* 槽腔（深色内腔）：沿槽根—槽口方向内缩一个槽壁厚，槽根与槽口敞开 ——
         槽根那段同时充当机头壁上的出料孔（压住壁线）。*/
      const spoutCavity =
        `<polygon points="${f(spoutBackX)},${f(openTopY+spoutWallT)} ${f(mouthR-spoutWallT*0.6)},${f(mouthY-spoutWallT)} ${f(mouthL+spoutWallT*0.6)},${f(mouthY-spoutWallT)} ${f(spoutBackX)},${f(openBotY-spoutWallT)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>`;
      // 槽口法兰（水平面，左右各一颗螺栓）
      const spoutFlW = Math.max(0.8, Math.min(1.6, w*0.018)), spoutFlH = Math.max(1.2, Math.min(2.4, w*0.020));
      const spoutFlange =
        `<rect x="${f(mouthL-spoutFlW)}" y="${f(mouthY)}" width="${f((mouthR-mouthL)+spoutFlW*2)}" height="${f(spoutFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
        `<circle cx="${f(mouthL-spoutFlW*0.5)}" cy="${f(mouthY+spoutFlH*0.5)}" r="${f(Math.max(0.7, w*0.014))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>` +
        `<circle cx="${f(mouthR+spoutFlW*0.5)}" cy="${f(mouthY+spoutFlH*0.5)}" r="${f(Math.max(0.7, w*0.014))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>`;
      // 可调喉板（throat plate）：贴在出料开口上沿、伸入机头内，长圆孔 + 锁紧螺栓调卸料间隙
      const tpL = w*0.085, tpH = Math.max(1.2, Math.min(2.6, w*0.020));
      const throatPlate =
        `<rect x="${f(wallRX - tpL - headWallT)}" y="${f(openTopY - tpH*0.5)}" width="${f(tpL)}" height="${f(tpH)}" fill="#9aa2bc" stroke="#5b6280" stroke-width="0.7"/>` +
        `<rect x="${f(wallRX - tpL*0.78)}" y="${f(openTopY - tpH*0.26)}" width="${f(tpL*0.44)}" height="${f(tpH*0.52)}" rx="${f(tpH*0.26)}" fill="#12162b" stroke="#5b6280" stroke-width="0.5"/>` +
        `<circle cx="${f(wallRX - tpL*0.20)}" cy="${f(openTopY)}" r="${f(Math.max(0.7, tpH*0.30))}" fill="#2a2f45" stroke="#5b6280" stroke-width="0.5"/>`;
      const outletSpout = spoutBody + spoutCavity + spoutFlange + throatPlate;
      /* 驱动装置细部（配色与画法对齐 vrm 的减速机/电机段）：
         减速机 = 箱体 + 顶盖把合面 + 两颗顶盖螺栓 + 右端输入轴轴承座；
         逆止器贴在减速机输入端上方（断电后防止料斗逆转带载下滑）；
         联轴器外加防护罩，罩内十字标记随 p.color 旋转表示转动件；
         电机 = 壳体 + 散热片 + 端盖 + M 铭牌 + 底座滑轨。*/
      const c = (p && p.color) || '#9C99FF';
      const bsW = gearW*0.34, bsH = driveH*0.40, bsX = gearX+gearW-bsW-w*0.008, bsY = driveY+driveH*0.05;
      const cplX = gearX+gearW-w*0.006, cplW = motX-cplX+w*0.012, cplCX = cplX+cplW*0.5;
      const reducer =
        `<rect x="${f(gearX)}" y="${f(driveY)}" width="${f(gearW)}" height="${f(driveH)}" rx="1.5" fill="#252a44" stroke="#6a7192" stroke-width="1"/>` +
        `<line x1="${f(gearX+1.2)}" y1="${f(driveY+driveH*0.44)}" x2="${f(gearX+gearW-1.2)}" y2="${f(driveY+driveH*0.44)}" stroke="#6a7192" stroke-width="0.7" stroke-dasharray="3 2"/>` +
        `<circle cx="${f(gearX+gearW*0.22)}" cy="${f(driveY+driveH*0.20)}" r="${f(H(0.0045, 0.0095))}" fill="#0c1020"/>` +
        `<circle cx="${f(gearX+gearW*0.56)}" cy="${f(driveY+driveH*0.20)}" r="${f(H(0.0045, 0.0095))}" fill="#0c1020"/>`;
      const backstop =
        `<rect x="${f(bsX)}" y="${f(bsY)}" width="${f(bsW)}" height="${f(bsH)}" rx="1" fill="#2a2f45" stroke="#6a7192" stroke-width="0.8"/>` +
        `<path d="M ${f(bsX+bsW*0.80)} ${f(bsY+bsH*0.5)} L ${f(bsX+bsW*0.22)} ${f(bsY+bsH*0.5)} ` +
        `M ${f(bsX+bsW*0.22)} ${f(bsY+bsH*0.5)} L ${f(bsX+bsW*0.42)} ${f(bsY+bsH*0.20)} ` +
        `M ${f(bsX+bsW*0.22)} ${f(bsY+bsH*0.5)} L ${f(bsX+bsW*0.42)} ${f(bsY+bsH*0.80)}" ` +
        `stroke="#8e96b6" stroke-width="0.7" fill="none" opacity="0.85"/>`;
      // 机头壳顶的主轴轴承座：减速机输出端坐落其上，动力由此传入机头主轴
      const shaftSeat =
        `<rect x="${f(gearX+gearW-1.2)}" y="${f(driveCY-H(0.013, 0.028))}" width="${f(w*0.05)}" height="${f(H(0.026, 0.056))}" rx="1" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>` +
        `<rect x="${f(cx-w*0.045)}" y="${f(headTop-H(0.008, 0.017))}" width="${f(w*0.09)}" height="${f(H(0.030, 0.064))}" rx="1" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>`;
      const coupling =
        `<rect x="${f(cplX)}" y="${f(driveCY-driveH*0.30)}" width="${f(cplW)}" height="${f(driveH*0.60)}" rx="1" fill="#2b3050" opacity="0.55" stroke="#6a7192" stroke-width="0.7"/>` +
        `<g><animateTransform attributeName="transform" type="rotate" from="0 ${f(cplCX)} ${f(driveCY)}" to="360 ${f(cplCX)} ${f(driveCY)}" dur="${f(spDur/6)}s" repeatCount="indefinite"/>` +
        `<line x1="${f(cplCX-w*0.022)}" y1="${f(driveCY)}" x2="${f(cplCX+w*0.022)}" y2="${f(driveCY)}" stroke="${c}" stroke-width="1" opacity="0.9"/>` +
        `<line x1="${f(cplCX)}" y1="${f(driveCY-H(0.011, 0.023))}" x2="${f(cplCX)}" y2="${f(driveCY+H(0.011, 0.023))}" stroke="${c}" stroke-width="1" opacity="0.9"/></g>`;
      const motor =
        `<rect x="${f(motX)}" y="${f(driveCY-driveH*0.44)}" width="${f(motW*0.62)}" height="${f(driveH*0.80)}" rx="1.5" fill="#2f3550" stroke="#6a7192" stroke-width="1"/>` +
        `<line x1="${f(motX+motW*0.14)}" y1="${f(driveCY-driveH*0.34)}" x2="${f(motX+motW*0.14)}" y2="${f(driveCY+driveH*0.34)}" stroke="#6a7192" stroke-width="0.8"/>` +
        `<line x1="${f(motX+motW*0.31)}" y1="${f(driveCY-driveH*0.34)}" x2="${f(motX+motW*0.31)}" y2="${f(driveCY+driveH*0.34)}" stroke="#6a7192" stroke-width="0.8"/>` +
        `<line x1="${f(motX+motW*0.48)}" y1="${f(driveCY-driveH*0.34)}" x2="${f(motX+motW*0.48)}" y2="${f(driveCY+driveH*0.34)}" stroke="#6a7192" stroke-width="0.8"/>` +
        `<rect x="${f(motX+motW*0.62)}" y="${f(driveCY-driveH*0.30)}" width="${f(motW*0.34)}" height="${f(driveH*0.52)}" rx="1.2" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.8"/>` +
        `<text x="${f(motX+motW*0.31)}" y="${f(driveCY+driveH*0.26)}" text-anchor="middle" font-family="sans-serif" font-size="${f(driveH*0.62)}" fill="${c}" opacity="0.85">M</text>` +
        `<rect x="${f(motX-motW*0.03)}" y="${f(driveCY+driveH*0.36)}" width="${f(motW*1.06)}" height="${f(driveBot-driveCY-driveH*0.36)}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.7"/>`;
      const drive = reducer + backstop + shaftSeat + coupling + motor;
      /* 驱动机架（拱顶）：顶部改拱冠后驱动无法直接坐平顶，改由一块横跨驱动足印的机架板承载，
         板两端各一条立筋落到【拱冠表面】（archAt 保证立筋不悬空）——
         对应实机的"驱动装置经机架把合在机头罩壳顶部"。*/
      const platX = gearX - w*0.02, platR = motX + motW + w*0.02;
      const platH = Math.max(1.4, Math.min(3.2, w*0.030));
      const ribW = Math.max(1.4, Math.min(3.4, w*0.032));
      const ribAt = rx0 => {
        const top = headTop + platH, bot = Math.max(top, archAt(rx0 + ribW*0.5));
        return bot - top < 0.4 ? '' :
          `<rect x="${f(rx0)}" y="${f(top)}" width="${f(ribW)}" height="${f(bot-top)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.6"/>`;
      };
      const platform =
        `<rect x="${f(platX)}" y="${f(headTop)}" width="${f(platR-platX)}" height="${f(platH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>` +
        ribAt(platX + w*0.006) + ribAt(platR - ribW - w*0.006);
      /* 罩壳对接法兰：拱冠与直壁段的交线处（拱冠随头轮包络，与机壳在此把合） */
      const hoodFlH = Math.max(1.2, Math.min(3, w*0.024));
      const hoodFlange =
        `<rect x="${f(headX-w*0.016)}" y="${f(archY-hoodFlH*0.5)}" width="${f(headW+w*0.032)}" height="${f(hoodFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
        `<circle cx="${f(headX+w*0.02)}" cy="${f(archY)}" r="${f(Math.max(0.7, w*0.013))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>` +
        `<circle cx="${f(headX+headW-w*0.02)}" cy="${f(archY)}" r="${f(Math.max(0.7, w*0.013))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.5"/>`;
      /* 机头罩壳轮廓：平顶 + 两侧圆肩 + 直壁段，一条闭合 path（外轮廓 / 内腔各一条） */
      const headPath = (x0, x1, yTop, yBot, rx, ry, flat) =>
        `M ${f(x0)} ${f(yTop+ry)} A ${f(rx)} ${f(ry)} 0 0 1 ${f((x0+x1)*0.5-flat*0.5)} ${f(yTop)}` +
        ` L ${f((x0+x1)*0.5+flat*0.5)} ${f(yTop)} A ${f(rx)} ${f(ry)} 0 0 1 ${f(x1)} ${f(yTop+ry)}` +
        ` L ${f(x1)} ${f(yBot)} L ${f(x0)} ${f(yBot)} Z`;
      const headShell = `<path d="${headPath(headX, headX+headW, headTop, headBot, shoulderR, archRise, flatW)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>`;
      const headCavity = `<path d="${headPath(headX+headWallT, headX+headW-headWallT, headTop+headWallT, headBot-headWallT, Math.max(0.5, shoulderR-headWallT), Math.max(1, archRise-headWallT), Math.max(1, flatW-headWallT*2))}" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>`;
      /* 张紧装置（机座两侧螺杆式）：底部链轮轴两端装在滑动轴承座里，靠螺杆上下调整，
         补偿链条运行一段时间后的塑性伸长（链条松弛会跳齿、料斗刮壳）。
         轴承座在机座侧壁的长圆滑槽内移动，槽中心虚线标出可调行程；
         螺杆上端由固定在机座顶的支板定位，调节螺母压紧后即可锁定行程。*/
      const tkBW = w*0.055, tkBH = H(0.032, 0.068), tkBY = botSpY - tkBH*0.5;
      const tkLX = bootX + w*0.055, tkRX = bootX + bootW - w*0.055 - tkBW;
      const scrW = w*0.016, scrTop = bootTop + H(0.006, 0.012), slotH = bootRectH*0.46;
      const takeup = bx => {
        const scx = bx + tkBW*0.5;
        return `<rect x="${f(scx-scrW*0.9)}" y="${f(botSpY-slotH*0.5)}" width="${f(scrW*1.8)}" height="${f(slotH)}" rx="${f(scrW*0.9)}" fill="#12162b" stroke="#3a4060" stroke-width="0.8"/>` +
          `<line x1="${f(scx)}" y1="${f(botSpY-slotH*0.5)}" x2="${f(scx)}" y2="${f(botSpY+slotH*0.5)}" stroke="${c}" stroke-width="0.6" stroke-dasharray="1.6 1.4" opacity="0.7"/>` +
          `<rect x="${f(scx-scrW*0.5)}" y="${f(scrTop)}" width="${f(scrW)}" height="${f(tkBY-scrTop)}" fill="#8e96b6" opacity="0.85"/>` +
          `<rect x="${f(scx-w*0.030)}" y="${f(bootTop)}" width="${f(w*0.060)}" height="${f(H(0.012, 0.026))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>` +
          `<rect x="${f(scx-scrW*1.7)}" y="${f(bootTop+bootRectH*0.16)}" width="${f(scrW*3.4)}" height="${f(H(0.010, 0.021))}" fill="#2a2f45" stroke="#6a7192" stroke-width="0.7"/>` +
          `<rect x="${f(bx)}" y="${f(tkBY)}" width="${f(tkBW)}" height="${f(tkBH)}" rx="1" fill="url(#${metalId})" stroke="#6a7192" stroke-width="0.9"/>` +
          `<circle cx="${f(scx)}" cy="${f(botSpY)}" r="${f(tkBH*0.26)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.6"/>`;
      };
      const tension = takeup(tkLX) + takeup(tkRX);
      /* 基础：机座坐在混凝土基础底板上，底板两侧各一颗地脚螺栓与预埋件把合，
         防止整机在链条交变张力下移位（螺杆张紧的前提是机座本身不动）。*/
      const slabBot = bootBotY, slabH = H(0.018, 0.042), slabY = slabBot - slabH;
      const slabX = cx - w*0.36, slabW = w*0.72;
      const foundation =
        `<rect x="${f(slabX)}" y="${f(slabY)}" width="${f(slabW)}" height="${f(slabBot-slabY)}" fill="url(#${baseId})" stroke="#6a7192" stroke-width="1"/>` +
        `<line x1="${f(slabX)}" y1="${f(slabY)}" x2="${f(slabX+slabW)}" y2="${f(slabY)}" stroke="#8e96b6" stroke-width="1" opacity="0.35"/>` +
        `<circle cx="${f(cx-w*0.30)}" cy="${f(slabY+(slabBot-slabY)*0.6)}" r="${f(Math.max(1.1,w*0.013))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>` +
        `<circle cx="${f(cx+w*0.30)}" cy="${f(slabY+(slabBot-slabY)*0.6)}" r="${f(Math.max(1.1,w*0.013))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;
      return `
      <defs>
        <clipPath id="${clipId}"><rect x="${f(casingX)}" y="${f(headTop)}" width="${f(casingW)}" height="${f(bootRectBot-headTop)}" rx="1"/></clipPath>
        <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7d849e"/><stop offset="0.42" stop-color="#d9dded"/><stop offset="1" stop-color="#767d97"/>
        </linearGradient>
        <linearGradient id="${baseId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1a1f33"/><stop offset="1" stop-color="#0d1020"/>
        </linearGradient>
      </defs>
      <!-- 1. 机头罩壳：椭圆拱冠 + 直壁段（金属外壳 / 深色内腔） -->
      ${headShell}
      ${headCavity}
      ${hoodFlange}
      ${headDoor}
      <polygon points="${f(bootX)},${f(bootRectBot)} ${f(bootX+bootW)},${f(bootRectBot)} ${f(cx+w*0.09)},${f(bootBotY)} ${f(cx-w*0.09)},${f(bootBotY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(bootX)}" y="${f(bootTop)}" width="${f(bootW)}" height="${f(bootRectH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(bootX+2)}" y="${f(bootTop+2)}" width="${f(bootW-4)}" height="${f(bootRectH-4)}" rx="1" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
      ${bootDoor}
      <rect x="${f(casingX)}" y="${f(casingTop)}" width="${f(casingW)}" height="${f(casingBot-casingTop)}" fill="#12162b" stroke="#6a7192" stroke-width="1"/>
      ${sidePlates}
      ${joints}
      <rect x="${f(casingX-w*0.03)}" y="${f(casingTop)}" width="${f(casingW+w*0.06)}" height="${f(edgeFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
      <rect x="${f(casingX-w*0.03)}" y="${f(casingBot-edgeFlH)}" width="${f(casingW+w*0.06)}" height="${f(edgeFlH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
      <g clip-path="url(#${clipId})">
        <path d="${loopP}" fill="none" stroke="#3f445c" stroke-width="1.6" opacity="0.9" stroke-dasharray="2.6 1.4"/>
        ${buckets}
      </g>
      ${sprocket(topSpY)}
      ${sprocket(botSpY)}
      ${tension}
      ${inletHopper}
      <!-- 出料口：机头侧壁斜置溜槽（槽体 / 槽腔 / 槽口法兰）+ 可调喉板 -->
      ${outletSpout}
      <!-- 驱动机架（拱顶平台 + 两条立筋） -->
      ${platform}
      ${drive}
      ${foundation}
      `;
    }
};


/* ============================================================
 * 斗式提升机 · 机头与出料溜槽几何
 *   由 render() 与端口反推共用同一份公式：机头按机宽封顶（定尺部件，不随机身加高而变），
 *   出料口开在机头出料侧直壁段上，溜槽以 78° 斜向下伸出。
 *   ⚠ 端口契约（ports[].x/y）默认是按组件 w/h 取比例的，而机头位置被机宽封顶 ——
 *     若只写死比例，拉伸机身高度时端口就会与槽口脱开（旧版端口 0.174 在 92×900 时偏差约 90px）。
 *     因此本模板把 x/y 写成函数，直接返回"槽口中心 / 组件尺寸"的比例，任何尺寸下都对齐。
 * ============================================================ */
function bucketElevatorGeom(w,h){
  const H = (hr, wr) => Math.min(h*hr, w*wr);                      // 定尺部件：取高度比例量与机宽比例量的小值
  /* 机头比例全部取自实机照片：机头宽 132 / 机筒宽 111 = 1.19 倍，机头高 148 ≈ 1.12 × 机头宽（近方形）。*/
  const headW = w*0.57;                                            // 机头宽 = 1.19 × 机筒宽（0.48w）
  const headH = w*0.64;                                            // 机头高 ≈ 1.12 × 机头宽
  const headX = w*0.5 - headW*0.5;                                 // 与机筒同轴居中
  const headTop = H(0.055, 0.12);
  const headBot = headTop + headH;
  const headWallT = Math.max(1.2, Math.min(3, w*0.022));           // 罩壳钢板厚
  /* 顶部造型（照片实测）：平顶宽 70/132 ≈ 53%，两侧圆肩高 34/148 ≈ 23%，
     肩部圆弧 rx ≈ ry（近四分之一圆）—— 即"平顶 + 两侧圆肩"，不是纯拱冠。*/
  const flatW = headW*0.53;                                        // 平顶宽
  const shoulderR = Math.max(1, (headW - flatW)*0.5);              // 肩部圆弧 rx
  const archRise = Math.max(1.5, headH*0.23);                      // 肩部圆弧 ry（= 圆肩高）
  const archY = headTop + archRise;                                // 圆肩与直壁交线（罩壳对接法兰所在）
  const wallH = Math.max(1, headBot - archY);                      // 直壁段高
  const headRX = headW*0.5;
  /* 出料开口（照片实测）：开口上沿在机头高 50% 处、下沿 86.5%，槽口落在机头底面高度。*/
  const openTopY = headTop + headH*0.50;                           // 出料开口上沿
  const openBotY = headTop + headH*0.865;                          // 出料开口下沿
  const mouthY = headBot;                                          // 槽口（水平开口、朝下排料）
  const mouthL = w*0.775;                                          // 槽口左端（让开机筒右缘 0.74w）
  const mouthR = w*0.960;                                          // 槽口右端（让开组件右缘）
  const spoutWallT = Math.max(0.7, Math.min(1.6, w*0.018));        // 槽壁厚
  const spoutBackX = headX + headW - headWallT*0.6;                // 槽根略伸进壁内，压住壁线读作"开孔"
  const mouthCX = (mouthL + mouthR)*0.5;                           // 槽口中心 = outlet 端口
  return { H, headX, headW, headTop, headH, headBot, headWallT,
           flatW, shoulderR, archRise, archY, wallH, headRX,
           openTopY, openBotY, mouthY, mouthL, mouthR, mouthCX, spoutWallT, spoutBackX };
}

/* 出料口（outlet 端口）在给定尺寸下的绝对坐标 —— 与溜槽槽口中心严格一致 */
function bucketElevatorOutlet(w,h){
  const gm = bucketElevatorGeom(w,h);
  return { x: gm.mouthCX, y: gm.mouthY };
}

/* 机头顶面高度：平顶段为 headTop，圆肩段沿肩部圆弧下降（用于把驱动机架立筋落到顶面上） */
function bucketElevatorTopAt(gm, x){
  const dx = Math.abs(x - (gm.headX + gm.headW*0.5));
  if(dx <= gm.flatW*0.5) return gm.headTop;
  const t = Math.min(1, (dx - gm.flatW*0.5)/gm.shoulderR);
  return gm.headTop + gm.archRise*(1 - Math.sqrt(Math.max(0, 1 - t*t)));
}
