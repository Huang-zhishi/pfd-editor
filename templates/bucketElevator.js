/* ============================================================
 * PFD Editor · 组件模板：bucketElevator
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.bucketElevator。
 *   配色与画法对齐 reactor（反应釜）：金属渐变机壳 + 深色内腔 + 法兰色系
 *     #7d849e → #d9dded → #767d97（金属渐变）
 *     #12162b（深色内腔）  #6a7192（内腔描边）  #2a2f45 / #3f445c（法兰与接管）
 *   链斗与链轮用 SMIL 动画驱动，编辑态由 editor.js stripSMIL() 自动剥离。
 * ============================================================ */

TEMPLATES.bucketElevator = {
    name: '斗式提升机', category: '输送与给料',
    defaultSize: { w: 92, h: 380 },
    ports: [
      {id:'outlet', x:.845, y:.174, dir:'down'},  // 机头下翻转卸料斗口（斗口朝下敞开），向下卸料
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
      // 机头（金属外壳 + 深色内腔）
      const headX = w*0.06, headW = w*0.88, headTop = H(0.055, 0.12), headH = H(0.17, 0.34);
      const headBot = headTop + headH;
      /* 驱动装置（机头顶部）：电机 — 联轴器（带防护罩）— 逆止器 — 减速机 — 机头主轴。
         减速机居中正对机头主轴（同 cx）坐落在机头壳顶，电机偏右，避免与出料口抢位。*/
      const driveBot = headTop, driveH = Math.min(H(0.048, 0.115), headTop*0.85);
      const driveY = driveBot - driveH, driveCY = driveY + driveH*0.5;
      const gearW = w*0.25, gearX = cx - w*0.155;        // 减速机箱体
      const motX = cx + w*0.20, motW = w*0.24;           // 电机壳体（右缘 0.94w）
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
      const door = (dx, dy)=>
        `<rect x="${f(dx)}" y="${f(dy)}" width="${f(doorW)}" height="${f(doorH)}" rx="1.2" fill="#1a1f33" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(dx+doorW*0.28)}" y1="${f(dy+1.6)}" x2="${f(dx+doorW*0.28)}" y2="${f(dy+doorH-1.6)}" stroke="#3a4060" stroke-width="1"/>` +
        `<line x1="${f(dx+doorW*0.72)}" y1="${f(dy+1.6)}" x2="${f(dx+doorW*0.72)}" y2="${f(dy+doorH-1.6)}" stroke="#3a4060" stroke-width="1"/>` +
        `<circle cx="${f(dx+doorW*0.5)}" cy="${f(dy+doorH*0.5)}" r="${f(Math.min(doorW,doorH)*0.11)}" fill="#8e96b6" opacity="0.7"/>`;
      const headDoor = door(headX+w*0.03, headTop+(headH-doorH)/2);   // 机头左侧壁（让开右侧出料口与中部链轮）
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
      /* 出料口（机头 · 向下卸料）：与进料斗用完全相同的一套画法（梯形斗体 + 深色内腔 + 斗口口沿），
         只是整体上下翻转：收口端朝上、贴机头底壁的卸料口，斗口朝下敞口，物料靠重力向下卸出。*/
      const lampCX = w*0.845;                            // 与 outlet 端口同轴
      const outThroatY = headBot;                        // 收口端（贴机头底壁）
      const outMouthY  = headBot + headH*0.76;           // 斗口端（朝下敞开），斗身高度与进料斗一致
      const outMouthW  = w*0.195, outThroatW = w*0.075;  // 斗口宽 / 收口宽（与进料斗同宽）
      const outMouthL  = lampCX-outMouthW*0.5, outMouthR = lampCX+outMouthW*0.5;
      const outThroatL = lampCX-outThroatW*0.5, outThroatR = lampCX+outThroatW*0.5;
      const outLip = H(0.012, 0.024), outWall = w*0.020;
      const outletHopper =
        `<rect x="${f(lampCX-w*0.014)}" y="${f(headBot-outWall*0.9)}" width="${f(w*0.028)}" height="${f(outWall*1.8)}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>` +
        `<polygon points="${f(outMouthL)},${f(outMouthY)} ${f(outMouthR)},${f(outMouthY)} ${f(outThroatR)},${f(outThroatY)} ${f(outThroatL)},${f(outThroatY)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>` +
        `<polygon points="${f(outMouthL+outWall)},${f(outMouthY-outLip)} ${f(outMouthR-outWall)},${f(outMouthY-outLip)} ${f(outThroatR-outWall)},${f(outThroatY+outWall*0.6)} ${f(outThroatL+outWall)},${f(outThroatY+outWall*0.6)}" fill="#12162b" stroke="#6a7192" stroke-width="0.7"/>` +
        `<rect x="${f(outMouthL)}" y="${f(outMouthY-outLip)}" width="${f(outMouthW)}" height="${f(outLip)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
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
      <rect x="${f(headX)}" y="${f(headTop)}" width="${f(headW)}" height="${f(headH)}" rx="2" fill="url(#${metalId})" stroke="#3f445c" stroke-width="0.8"/>
      <rect x="${f(headX+2)}" y="${f(headTop+2)}" width="${f(headW-4)}" height="${f(headH-4)}" rx="1" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
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
      ${outletHopper}
      ${drive}
      ${foundation}
      `;
    }
};
