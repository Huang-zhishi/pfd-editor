/* ============================================================
 * PFD Editor · 组件模板：rotaryKiln3（3#线回转窑 · 定制）
 *   由 templates/rotaryKiln.js（回转窑/旋转煅烧窑）派生的定制组件：
 *     · 窑体沿轴向划分为 8 个温区：预热1区、预热2区、加热1~5区、冷却区
 *     · 天然气黄管【装在窑体（筒体）上，随筒体一起回转】，两组总管对角布置
 *       （相差半圈）：上管供加热 2/4 区、下管供加热 1/3/5 区；
 *       天然气经窑头侧回转接头引入。
 *     · **每个温区一对烧嘴（一双），共 10 只**，分别绑定着火信号 1~10
 *       （1,2→加热1区、3,4→加热2区 … 9,10→加热5区）；开=显火焰，关=不显
 *     · 窑体上方 11 个测温点（既驱动筒体温度色带，又显示实时读数）
 *
 *   对外契约（沿用 rotaryKiln 的测温渐变机制，供 editor.js 增量刷新）：
 *     · 火焰组 <g class="rk3-flame" data-flame="i">（i=0..9）← refreshKilnFlames 显隐
 *     · <linearGradient class="kiln-temp-grad">（x1=0,y1=0,x2=1,y2=0）
 *     · <stop class="kiln-temp-stop" data-kidx="i" offset="…%" stop-color="…">
 *     · <rect class="kiln-temp-overlay" fill="url(#温度渐变id)" clip-path=筒体clip>
 *     · 温度读数 <text class="kiln-temp-val"  data-kidx="i">   （上方 11 点）
 *   数据源：props.tempPoints = [{tag,label}]（默认 11 点）
 *           props.flameTags  = [{tag}]        （默认 10 点着火信号）
 * ============================================================ */

/* 默认测温点标签（上方：1#温度…11#温度） */
const RK3_TEMP_LABELS = ['1#温度','2#温度','3#温度','4#温度','5#温度','6#温度','7#温度','8#温度','9#温度','10#温度','11#温度'];

/* 窑尾 → 窑头：预热1/2区 → 加热1~5区 → 冷却区。f = 各温区占筒体长度的比例 */
const RK3_ZONES = [
  { n:'预热1区', f:.18 },
  { n:'预热2区', f:.29 },
  { n:'加热1区', f:.09 },
  { n:'加热2区', f:.09 },
  { n:'加热3区', f:.09 },
  { n:'加热4区', f:.09 },
  { n:'加热5区', f:.09 },
  { n:'冷却区',  f:.08 }
];

TEMPLATES.rotaryKiln3 = {
  name: '3#线回转窑',
  category: '干燥煅烧与冷却',
  defaultSize: { w: 760, h: 300 },
  ports: [
    { id:'inlet',     x:0,    y:.50, dir:'left'  },  // 进料（窑尾罩进料溜槽外端）
    { id:'outlet',    x:1,    y:.86, dir:'right' },  // 出料（窑头罩）
    { id:'flueGas',   x:.0785, y:.10, dir:'up'   },  // 烟气出口
    { id:'gasIn',     x:1,    y:.50, dir:'right' }   // 天然气入口（经窑头侧回转接头进壳装管路）
  ],
  render: (w,h,p)=>{
    const c = (p && p.color) || '#9C99FF';
    const F = v => (+v).toFixed(2);
    const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
    const K = clamp(Math.min(w/380, h/180), 0.3, 2.4);
    const xesc = s => String(s==null?'':s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const uid = Math.random().toString(36).slice(2,7);

    /* ---------- 筒体基准 ---------- */
    const drumL = w*0.10, drumR = w*0.86, drumW = drumR-drumL;
    const cy = h*0.50, R = h*0.115;
    const drumTop = cy-R, drumBot = cy+R;
    const rotDur = 6;   // 筒体回转周期（s），旋转纹理 / 托轮 / 壳装气路共用

    /* ---------- 温区累加（x0/x1/cx 为筒体相对比例；用副本避免污染模块常量） ---------- */
    const zones = RK3_ZONES.map(z=>({ n:z.n, f:z.f }));
    let cum = 0;
    zones.forEach(z=>{ z.x0 = cum; cum += z.f; z.x1 = cum; z.cx = (z.x0+z.x1)/2; });

    /* ---------- 渐变 / 裁剪 ---------- */
    const metalId = `rk3m_${uid}`, metalVId = `rk3mv_${uid}`, drumId = `rk3d_${uid}`;
    const gradId = `kiln3_temp_${uid}`;
    const clipId = `rk3c_${uid}`, clipInId = `rk3ci_${uid}`;
    const tubeInset  = clamp(R*0.14, 2, 6);
    const drumInset  = clamp(R*0.10, 1.5, 3.5);

    const metalDef = `<linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
    const metalVDef = `<linearGradient id="${metalVId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
    const drumDef = `<linearGradient id="${drumId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7d849e"/><stop offset="50%" stop-color="#d9dded"/><stop offset="100%" stop-color="#767d97"/></linearGradient>`;
    const clipDef   = `<clipPath id="${clipId}"><rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.25)}" ry="${F(R)}"/></clipPath>`;
    const clipInDef = `<clipPath id="${clipInId}"><rect x="${F(drumL+tubeInset)}" y="${F(drumTop+tubeInset)}" width="${F(drumW-2*tubeInset)}" height="${F(R*2-2*tubeInset)}" rx="${F(R*0.2)}" ry="${F(Math.max(1,R-tubeInset))}"/></clipPath>`;

    /* ---------- 温度色带（测温点 → 颜色锚点，沿用 rotaryKiln 契约） ---------- */
    const tps = (p && Array.isArray(p.tempPoints) && p.tempPoints.length)
      ? p.tempPoints
      : RK3_TEMP_LABELS.map(lb=>({ label: lb }));
    const tempCold = [122,26,8], tempHot = [255,191,92];
    const tempGrad = `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0" class="kiln-temp-grad">${tps.map((pt,i)=>{
      const f = tps.length > 1 ? i/(tps.length-1) : 0;
      const col = 'rgb(' + tempCold.map((v,j)=>Math.round(v+(tempHot[j]-v)*f)).join(',') + ')';
      return `<stop class="kiln-temp-stop" data-kidx="${i}" offset="${(f*100).toFixed(1)}%" stop-color="${col}"/>`;
    }).join('')}</linearGradient>`;
    const tempOverlay = `<rect class="kiln-temp-overlay" x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.25)}" ry="${F(R)}" fill="url(#${gradId})" opacity="0.5" clip-path="url(#${clipId})"/>`;

    /* ---------- 筒体主体 ---------- */
    const drumBody = `
      <rect x="${F(drumL)}" y="${F(drumTop)}" width="${F(drumW)}" height="${F(R*2)}" rx="${F(R*0.25)}" ry="${F(R)}" fill="url(#${drumId})" stroke="#3f445c" stroke-width="1.8"/>
      <rect x="${F(drumL+drumInset)}" y="${F(drumTop+drumInset)}" width="${F(drumW-2*drumInset)}" height="${F(R*0.4)}" rx="${F(R*0.2)}" ry="${F(R*0.4)}" fill="#5b6280" opacity="0.35"/>
      <ellipse cx="${F(drumL)}" cy="${F(cy)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2" opacity="0.7"/>
      <ellipse cx="${F(drumR)}" cy="${F(cy)}" rx="${F(R*0.3)}" ry="${F(R)}" fill="#12162b" stroke="#6a7192" stroke-width="1.2" opacity="0.7"/>`;

    /* ---------- 温区：分隔线 + 竖排双行标签 ---------- */
    let zoneLines = '', zoneLabels = '';
    const zLineW = clamp(K*1.2, 1, 2);
    zones.forEach((z,i)=>{
      if(i < zones.length-1){
        const x = drumL + drumW*z.x1;
        zoneLines += `<line x1="${F(x)}" y1="${F(drumTop)}" x2="${F(x)}" y2="${F(drumBot)}" stroke="#7a8098" stroke-width="${F(zLineW)}" opacity="0.9"/>`;
      }
      const cx = drumL + drumW*z.cx;
      const fs = clamp(R*0.32, 5, 12), lh = fs*1.12, gap = fs*0.5;
      const r1 = z.n.slice(0,2).split(''), r2 = z.n.slice(2).split('');
      const totalH = r1.length*lh + gap + r2.length*lh;
      const y0 = cy - totalH/2;
      let t = '';
      r1.forEach((ch,k)=>{ t += `<text x="${F(cx)}" y="${F(y0+fs*0.82+k*lh)}" text-anchor="middle" font-size="${F(fs)}" font-weight="bold" fill="#3a2320">${ch}</text>`; });
      const divY = y0 + r1.length*lh + gap/2;
      t += `<line x1="${F(cx-fs*0.7)}" y1="${F(divY)}" x2="${F(cx+fs*0.7)}" y2="${F(divY)}" stroke="#3a2320" stroke-width="${F(clamp(fs*0.09,0.5,1.2))}" opacity="0.85"/>`;
      r2.forEach((ch,k)=>{ t += `<text x="${F(cx)}" y="${F(y0+r1.length*lh+gap+fs*0.82+k*lh)}" text-anchor="middle" font-size="${F(fs)}" font-weight="bold" fill="#3a2320">${ch}</text>`; });
      zoneLabels += `<g clip-path="url(#${clipId})">${t}</g>`;
    });

    /* ---------- 窑尾罩（左）+ 进料 + 烟气 ---------- */
    const hoodL = w*0.057, hoodW = drumL-hoodL;
    const hoodTop = cy - R*1.28, hoodH = R*2.56, hoodBot = hoodTop+hoodH;
    const hoodIn = clamp(K*2, 1, 4);
    const chuteH = clamp(R*0.5, 6, 20);
    // 烟气上升管长度取原设计的一半（原 0.353h→0.10h，现到 0.226h），避免顶到上方测温点
    const flueCX = hoodL + hoodW/2, flueW = clamp(R*0.42, 6, 16), flueTopY = h*0.226;
    const tailHood = `
      <rect x="0" y="${F(cy-chuteH/2)}" width="${F(hoodL)}" height="${F(chuteH)}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(hoodL)}" y="${F(hoodTop)}" width="${F(hoodW)}" height="${F(hoodH)}" rx="${F(clamp(K*2,1,4))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.3"/>
      <rect x="${F(hoodL+hoodIn)}" y="${F(hoodTop+hoodIn)}" width="${F(Math.max(1,hoodW-2*hoodIn))}" height="${F(hoodH-2*hoodIn)}" rx="1" fill="#12162b" opacity="0.5"/>
      <rect x="${F(flueCX-flueW/2)}" y="${F(flueTopY)}" width="${F(flueW)}" height="${F(Math.max(1,hoodTop-flueTopY))}" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="1"/>
      <rect x="${F(flueCX-flueW*0.75)}" y="${F(flueTopY-clamp(K*3,1.5,5))}" width="${F(flueW*1.5)}" height="${F(clamp(K*3,1.5,5))}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;

    /* ---------- 窑头罩（右）+ 出料溜槽 ---------- */
    const headL = drumR, headR = w*0.95, headW = headR-headL;
    const headIn = clamp(K*2, 1, 4);
    const outletY = h*0.86, outPipeH = clamp(R*0.42, 6, 18);
    const outElbowX = w*0.965;
    const headHood = `
      <rect x="${F(headL)}" y="${F(hoodTop)}" width="${F(headW)}" height="${F(hoodH)}" rx="${F(clamp(K*2,1,4))}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.3"/>
      <rect x="${F(headL+headIn)}" y="${F(hoodTop+headIn)}" width="${F(Math.max(1,headW-2*headIn))}" height="${F(hoodH-2*headIn)}" rx="1" fill="#12162b" opacity="0.5"/>
      <path d="M ${F(headL+headW*0.22)} ${F(hoodBot)} L ${F(headL+headW*0.60)} ${F(hoodBot)} L ${F(outElbowX)} ${F(outletY-outPipeH/2)} L ${F(w)} ${F(outletY-outPipeH/2)} L ${F(w)} ${F(outletY+outPipeH/2)} L ${F(outElbowX-clamp(K*6,3,10))} ${F(outletY+outPipeH/2)} L ${F(headL+headW*0.22)} ${F(hoodBot+outPipeH)} Z" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.9"/>`;

    /* ---------- 天然气：随筒体回转的壳装管路（两组总管对角）----------
     * 2D 侧视：壳装管沿圆周随筒体转动 → 管中心高 y = cy - Rg·cosφ 正弦扫掠；
     * 前半圈（sinφ>0）在筒体正面可见，后半圈转到背面即隐去。
     * 每个接口（烧嘴）处喷火，火焰随接口一起绕圆周运动。 */
    const YEL = '#F2E27A', YEL_D = '#A98F1E';
    const pw = clamp(K*2.6, 1.8, 5);
    const GAS_R = R*1.34;                       // 壳装管安装半径
    const manifoldX = w*0.845;                  // 窑头侧回转接头 / 引出位置
    // 每个温区一对烧嘴（一双）：br[].f = 温区中心（筒体相对比例），fl = 该对两只烧嘴对应的着火信号序号-1
    // 着火信号 1,2→加热1区、3,4→加热2区 … 9,10→加热5区（对应现场“燃烧器一~五区”）
    const branchDx = clamp(drumW*0.020, 3, 12);   // 一对烧嘴的轴向半间距
    const gasGroups = [
      { off: 0.0, br: [ {f:0.605, fl:[2,3]}, {f:0.785, fl:[6,7]} ] },                      // 上管：加热2(火3,4)、加热4(火7,8)
      { off: 0.5, br: [ {f:0.515, fl:[0,1]}, {f:0.695, fl:[4,5]}, {f:0.875, fl:[8,9]} ] }   // 下管：加热1(火1,2)、加热3(火5,6)、加热5(火9,10)
    ];
    const NF = 24;                              // 关键帧数
    const gasKey = gasGroups.map(g=>{
      const yH=[], yS=[], fc=[], ov=[];
      for(let k=0;k<=NF;k++){
        const phi = (((k/NF)+g.off)%1)*2*Math.PI;
        const yh = cy - GAS_R*Math.cos(phi);
        const ys = cy - R*Math.cos(phi);
        const s = Math.sin(phi);
        yH.push(yh); yS.push(ys);
        fc.push(ys + (cy-ys)*0.20);             // 火焰往筒内偏一点
        ov.push(0.26 + (s>0 ? 0.74*Math.min(1, s*2.4) : 0));   // 背面淡显（0.26）、正面实显
      }
      return {
        yHs: yH.map(F).join(';'), ySs: yS.map(F).join(';'),
        fcs: fc.map(F).join(';'), ovs: ov.map(F).join(';'),
        yH0:F(yH[0]), yS0:F(yS[0]), fc0:F(fc[0]), ov0:ov[0].toFixed(2)
      };
    });
    const yLine = (x1,y1,x2,y2)=>`
      <line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}" stroke="${YEL_D}" stroke-width="${F(pw+1.4)}" stroke-linecap="round"/>
      <line x1="${F(x1)}" y1="${F(y1)}" x2="${F(x2)}" y2="${F(y2)}" stroke="${YEL}" stroke-width="${F(pw)}" stroke-linecap="round"/>`;
    let gas = '';
    // 固定进气（不随筒体转）：窑头侧水平引入 + 手动旋钮阀 + 回转接头
    gas += yLine(manifoldX, cy, w, cy);
    const knobCX = (manifoldX+w)/2, knobCY = cy;
    const knobR = clamp(K*4, 3, 8), knobStem = clamp(K*7, 5, 12);
    gas += `<rect x="${F(knobCX-pw*1.4)}" y="${F(knobCY-pw*1.4)}" width="${F(pw*2.8)}" height="${F(pw*2.8)}" rx="1" fill="${YEL}" stroke="${YEL_D}" stroke-width="0.7"/>`;
    gas += `<line x1="${F(knobCX)}" y1="${F(knobCY-pw*1.4)}" x2="${F(knobCX)}" y2="${F(knobCY-knobStem)}" stroke="#8e96b6" stroke-width="${F(clamp(K*1.2,0.8,1.8))}"/>`;
    gas += `<circle cx="${F(knobCX)}" cy="${F(knobCY-knobStem)}" r="${F(knobR)}" fill="#12162b" stroke="#8e96b6" stroke-width="${F(clamp(K*1.4,1,2))}"/>`;
    gas += `<line x1="${F(knobCX-knobR)}" y1="${F(knobCY-knobStem)}" x2="${F(knobCX+knobR)}" y2="${F(knobCY-knobStem)}" stroke="#8e96b6" stroke-width="${F(clamp(K*0.9,0.6,1.4))}"/>`;
    gas += `<line x1="${F(knobCX)}" y1="${F(knobCY-knobStem-knobR)}" x2="${F(knobCX)}" y2="${F(knobCY-knobStem+knobR)}" stroke="#8e96b6" stroke-width="${F(clamp(K*0.9,0.6,1.4))}"/>`;
    // 回转接头（固定进气 ↔ 旋转壳装管）
    gas += `<circle cx="${F(manifoldX)}" cy="${F(cy)}" r="${F(clamp(K*3.2,2,6))}" fill="#12162b" stroke="${YEL_D}" stroke-width="${F(clamp(K*1.2,0.8,1.8))}"/>`;
    // 两组旋转总管
    gasGroups.forEach((g,gi)=>{
      const G = gasKey[gi];
      const xL = drumL + drumW*(Math.min(...g.br.map(b=>b.f)) - 0.06) - branchDx;
      // 总管（深色描边 + 黄芯），沿圆周上下扫掠
      [[YEL_D, pw+1.4], [YEL, pw]].forEach(([col,wd])=>{
        gas += `<line x1="${F(xL)}" y1="${G.yH0}" x2="${F(manifoldX)}" y2="${G.yH0}" stroke="${col}" stroke-width="${F(wd)}" stroke-linecap="round" opacity="${G.ov0}">
          <animate attributeName="y1" values="${G.yHs}" dur="${rotDur}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="${G.yHs}" dur="${rotDur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${G.ovs}" dur="${rotDur}s" repeatCount="indefinite"/></line>`;
      });
      // 径向臂：总管 → 回转接头
      [[YEL_D, pw+1.4], [YEL, pw]].forEach(([col,wd])=>{
        gas += `<line x1="${F(manifoldX)}" y1="${G.yH0}" x2="${F(manifoldX)}" y2="${F(cy)}" stroke="${col}" stroke-width="${F(wd)}" opacity="${G.ov0}">
          <animate attributeName="y1" values="${G.yHs}" dur="${rotDur}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${G.ovs}" dur="${rotDur}s" repeatCount="indefinite"/></line>`;
      });
      // 支管（烧嘴，一双）+ 接口阀块 + 火焰；每只火焰按对应着火信号显隐
      g.br.forEach(({f,fl})=>{
        const xc = drumL + drumW*f;
        fl.forEach((fi,k)=>{
          const x = xc + (k===0 ? -branchDx : branchDx);
          gas += `<line x1="${F(x)}" y1="${G.yH0}" x2="${F(x)}" y2="${G.yS0}" stroke="${YEL}" stroke-width="${F(pw*0.9)}" stroke-linecap="round" opacity="${G.ov0}">
            <animate attributeName="y1" values="${G.yHs}" dur="${rotDur}s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="${G.ySs}" dur="${rotDur}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${G.ovs}" dur="${rotDur}s" repeatCount="indefinite"/></line>`;
          gas += `<rect x="${F(x-pw*1.3)}" y="${G.fc0}" width="${F(pw*2.6)}" height="${F(pw*1.5)}" rx="1" fill="${YEL}" stroke="${YEL_D}" stroke-width="0.6" opacity="${G.ov0}">
            <animate attributeName="y" values="${G.fcs}" dur="${rotDur}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="${G.ovs}" dur="${rotDur}s" repeatCount="indefinite"/></rect>`;
          // 火焰：外/内/焰芯同轴，整组由 refreshKilnFlames() 按着火信号显隐
          const fr0 = clamp(R*0.24, 3, 9);
          let fl3 = '';
          [[fr0, '#ff6a10', 0.85], [fr0*0.6, '#ffdd44', 0.95], [fr0*0.32, '#fff6c8', 1.0]].forEach(([rr,col,op])=>{
            fl3 += `<ellipse cx="${F(x)}" cy="${G.fc0}" rx="${F(rr)}" ry="${F(rr*1.1)}" fill="${col}" opacity="${(op*Number(G.ov0)).toFixed(2)}" clip-path="url(#${clipId})">
              <animate attributeName="cy" values="${G.fcs}" dur="${rotDur}s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="${G.ovs}" dur="${rotDur}s" repeatCount="indefinite"/></ellipse>`;
          });
          gas += `<g class="rk3-flame" data-flame="${fi}">${fl3}</g>`;
        });
      });
    });

    /* ---------- 轮带（2 道，压在托轮上方） ---------- */
    const tireXs = [0.47, 0.74].map(f=>drumL+drumW*f);
    const tireRx = clamp(R*0.15, 3, 9), tireOut = clamp(R*0.10, 2, 6);
    let tires = '';
    tireXs.forEach(tx=>{
      tires += `<ellipse cx="${F(tx)}" cy="${F(cy)}" rx="${F(tireRx)}" ry="${F(R+tireOut)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1.3"/>
        <ellipse cx="${F(tx)}" cy="${F(cy)}" rx="${F(tireRx*0.45)}" ry="${F(R+R*0.3)}" fill="#12162b" opacity="0.45"/>`;
    });

    /* ---------- 托轮组 + 轴承座（位于筒体下方） ---------- */
    const rollerCY = drumBot + R*0.30, rollerR = clamp(R*0.20, 3, 9);
    const rollOff = R*0.34, rollGap = clamp(K*2, 1, 3);
    const rollDur = (rotDur*0.45).toFixed(2);
    const drawRoller = (rx, ry, dir)=>{
      let spokes = '';
      for(let i=0;i<4;i++){
        const a = i*Math.PI/2;
        spokes += `<line x1="${F(rx)}" y1="${F(ry)}" x2="${F(rx+Math.cos(a)*rollerR*0.72)}" y2="${F(ry+Math.sin(a)*rollerR*0.72)}" stroke="#9aa2bc" stroke-width="0.8" opacity="0.5"/>`;
      }
      return `<g>
        <animateTransform attributeName="transform" type="rotate" from="${dir>0?0:360} ${F(rx)} ${F(ry)}" to="${dir>0?360:0} ${F(rx)} ${F(ry)}" dur="${rollDur}s" repeatCount="indefinite"/>
        <circle cx="${F(rx)}" cy="${F(ry)}" r="${F(rollerR)}" fill="url(#${metalId})" stroke="#3f445c" stroke-width="1"/>
        ${spokes}
        <circle cx="${F(rx)}" cy="${F(ry)}" r="${F(rollerR*0.28)}" fill="#12162b" stroke="#6a7192" stroke-width="0.6"/>
      </g>`;
    };
    let supports = '';
    tireXs.forEach(tx=>{
      const bearW = rollerR*2.4, bearH = clamp(rollerR*0.9, 3, 10), bearY = rollerCY+rollerR;
      supports += drawRoller(tx-rollOff, rollerCY, 1) + drawRoller(tx+rollOff, rollerCY, -1)
        + `<rect x="${F(tx-bearW/2)}" y="${F(bearY)}" width="${F(bearW)}" height="${F(bearH)}" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${F(tx-bearW/2-rollGap)}" y="${F(bearY+bearH)}" width="${F(bearW+2*rollGap)}" height="${F(clamp(bearH*0.5,2,5))}" fill="#0c1020" stroke="#6a7192" stroke-width="0.7"/>`;
    });

    /* ---------- 物料颗粒（筒底滚动） ---------- */
    const matInset = clamp(drumW*0.04, 5, 20);
    const matR0 = clamp(K*1.2, 0.8, 2);
    let material = '';
    for(let i=0;i<10;i++){
      const delay = -(i/10*8).toFixed(2);
      let px=[], py=[], pr=[];
      for(let k=0;k<=32;k++){
        const t=k/32, x=drumL+matInset+t*(drumW-2*matInset);
        const ph=(t*3.5)%1;
        let bedY;
        if(ph<0.55) bedY=cy+R*0.58;
        else if(ph<0.85){ const lt=(ph-0.55)/0.3; bedY=cy+R*0.58-R*0.45*Math.sin(lt*Math.PI); }
        else { const ft=(ph-0.85)/0.15; bedY=cy+R*0.58-R*0.25+ft*R*0.25; }
        px.push(x.toFixed(1)); py.push((bedY+Math.sin(t*8+i)*clamp(K*2,1,4)).toFixed(1)); pr.push((matR0+Math.sin(t*6)*clamp(K*0.4,0.25,0.8)).toFixed(1));
      }
      material += `<circle cx="${px[0]}" cy="${py[0]}" r="${pr[0]}" fill="${c}" opacity="0.7" clip-path="url(#${clipInId})">
        <animate attributeName="cx" values="${px.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
        <animate attributeName="cy" values="${py.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/>
        <animate attributeName="r" values="${pr.join(';')}" dur="8s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
    }

    /* ---------- 筒体旋转纹理 / 焊缝螺栓（模拟回转） ---------- */
    const tickCols = 12, tickLen = clamp(R*0.32, 2, 9);
    let rotMarks = '';
    [0, 0.25, 0.5, 0.75].forEach(phase=>{
      const delay = -(phase*rotDur).toFixed(2);
      for(let ci=0; ci<tickCols; ci++){
        const x = drumL + drumW*(ci+0.5)/tickCols;
        let y1v = [], y2v = [], ov = [];
        for(let k=0;k<=20;k++){
          const ang = ((k/20)+phase)*2*Math.PI, front = Math.cos(ang);
          const yc = cy + R*Math.sin(ang);
          y1v.push((yc - tickLen/2).toFixed(1));
          y2v.push((yc + tickLen/2).toFixed(1));
          ov.push(front>0.1 ? (0.34*front+0.05).toFixed(2) : '0');
        }
        rotMarks += `<line x1="${F(x-tickLen*0.32)}" y1="${y1v[0]}" x2="${F(x+tickLen*0.32)}" y2="${y2v[0]}" stroke="${c}" stroke-width="${F(clamp(K*1,0.7,1.6))}" stroke-linecap="round" opacity="${ov[0]}" clip-path="url(#${clipId})">
          <animate attributeName="y1" values="${y1v.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="${y2v.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${ov.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/></line>`;
      }
    });
    let ringBolts = '';
    [0.30, 0.60, 0.90].forEach(f=>{
      const wx = drumL + drumW*f;
      for(let i=0;i<4;i++){
        const phase = i/4, delay = -(phase*rotDur).toFixed(2);
        let cyv = [], opv = [];
        for(let k=0;k<=16;k++){
          const ang = ((k/16)+phase)*2*Math.PI, front = Math.cos(ang);
          cyv.push((cy + (R-clamp(R*0.07,0.6,2.5))*Math.sin(ang)).toFixed(1));
          opv.push(front>0 ? (0.15+0.4*front).toFixed(2) : '0');
        }
        ringBolts += `<circle cx="${F(wx)}" cy="${cyv[0]}" r="${F(clamp(K*1.3,0.8,1.8))}" fill="${c}" clip-path="url(#${clipId})" opacity="${opv[0]}">
          <animate attributeName="cy" values="${cyv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="${opv.join(';')}" dur="${rotDur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`;
      }
    });

    /* ---------- 测温点（上 11 点：标签 + 实时读数 + 引线） ---------- */
    const labelFs = clamp(h*0.036, 6, 14), valFs = clamp(h*0.038, 6, 15);
    let tempTop = '';
    tps.forEach((pt,i)=>{
      const f = tps.length > 1 ? i/(tps.length-1) : 0;
      const cx = drumL + drumW*f;
      const lab = (pt && pt.label) || RK3_TEMP_LABELS[i] || ((i+1)+'#温度');
      const val = (pt && pt.value!=null && pt.value!=='') ? pt.value : '--';
      tempTop += `<line x1="${F(cx)}" y1="${F(h*0.20)}" x2="${F(cx)}" y2="${F(drumTop)}" stroke="${c}" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.4"/>
        <text class="kiln-temp-lab" x="${F(cx)}" y="${F(h*0.115)}" text-anchor="middle" font-size="${F(labelFs)}" fill="${c}">${xesc(lab)}</text>
        <text class="kiln-temp-val" data-kidx="${i}" x="${F(cx)}" y="${F(h*0.175)}" text-anchor="middle" font-size="${F(valFs)}" font-weight="bold" fill="#e8f6ff">${xesc(val)}</text>`;
    });

    return `
      ${metalDef}${metalVDef}${drumDef}${tempGrad}${clipDef}${clipInDef}
      ${supports}
      ${drumBody}
      ${tempOverlay}
      ${rotMarks}${ringBolts}
      ${material}
      ${tires}
      ${tailHood}
      ${headHood}
      ${gas}
      ${zoneLines}${zoneLabels}
      ${tempTop}
    `;
  }
};
