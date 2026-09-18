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
      // 池体几何
      const wall=6, rimY=16, rimBottom=h-10;
      const innerX=wall+4, innerW=w-(wall+4)*2;
      const waterY=Math.round(h*0.46), waterBottom=rimBottom-wall-2, waterH=waterBottom-waterY;
      const inletX=w*0.5, outletX=w*0.5;
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
      // 落水滴（进水管口→水面，持续水流）
      const waterDrops = (x,yStart,yEnd)=>{
        return Array.from({length:6}).map((_,i)=>{
          const delay = -i*0.4;
          const dur = 1.3 + (i%3)*0.15;
          return `<circle r="${1.2+(i%2)*0.5}" fill="${c}" opacity="0.9">
            <animate attributeName="cx" values="${x};${x+(i-2.5)*1.3}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${yStart};${yEnd}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;1;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
          </circle>`;
        }).join('');
      };
      // 1. 混凝土地面
      const ground = `<rect x="0" y="${h-6}" width="${w}" height="6" fill="#12162b" stroke="#6a7192" stroke-width="0.8"/>
        <line x1="2" y1="${h-3}" x2="${w-2}" y2="${h-3}" stroke="#6a7192" stroke-width="0.6" opacity="0.4"/>`;
      // 2. 池壁（外壁金属渐变 + 内腔）
      const wallBody = `
        <rect x="${wall}" y="${rimY}" width="${w-wall*2}" height="${rimBottom-rimY}" rx="3" fill="url(#${metalId})" stroke="#3f445c" stroke-width="2"/>
        <rect x="${innerX}" y="${waterY-6}" width="${innerW}" height="${waterH+6}" fill="#12162b" stroke="#6a7192" stroke-width="1" opacity="0.9"/>
        <rect x="${innerX-2}" y="${waterY-6}" width="2" height="${waterH+6}" fill="#5b6280"/>
        <rect x="${innerX+innerW}" y="${waterY-6}" width="2" height="${waterH+6}" fill="#0c1020"/>`;
      // 3. 池顶压顶
      const rim = `<rect x="${wall-3}" y="${rimY-4}" width="${w-wall*2+6}" height="6" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="0.9"/>
        <rect x="${wall-1}" y="${rimY-2}" width="${w-wall*2+2}" height="1.5" fill="#5b6280"/>`;
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
        const amp = (i===1?3:5);
        return `<path d="${waveD(ph,amp)}" fill="none" stroke="#d9dded" stroke-width="${i===1?1.2:0.8}" opacity="0.6" clip-path="url(#${clipId})">
          <animateTransform attributeName="transform" type="translate" values="0 0;${innerW*0.10} 0;0 0" dur="${3+i}s" repeatCount="indefinite"/>
        </path>`;
      }).join('');
      // 6. 水位刻度
      const scale = `<g stroke="${c}" stroke-width="0.6" opacity="0.4">
        <line x1="${innerX+2}" y1="${waterY}" x2="${innerX+8}" y2="${waterY}"/>
        <line x1="${innerX+4}" y1="${waterY+(waterH/3)}" x2="${innerX+8}" y2="${waterY+(waterH/3)}"/>
        <line x1="${innerX+4}" y1="${waterY+(2*waterH/3)}" x2="${innerX+8}" y2="${waterY+(2*waterH/3)}"/>
      </g>`;
      // 7. 进水管（顶部，法兰+阀门+落水）
      const inlet = `
        <rect x="${inletX-3}" y="0" width="6" height="${rimY}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1"/>
        <rect x="${inletX-5}" y="0" width="10" height="4" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${boltAt(inletX-3,2,1)}${boltAt(inletX+3,2,1)}
        <rect x="${inletX-4}" y="${rimY-5}" width="8" height="3" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        <rect x="${inletX+4}" y="${rimY-9}" width="4" height="11" rx="2" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>
        ${waterDrops(inletX, rimY-2, waterY)}`;
      // 8. 出水管（底部，法兰）
      const outlet = `
        <rect x="${outletX-3}" y="${rimBottom}" width="6" height="${h-rimBottom}" fill="url(#${metalId})" stroke="#6a7192" stroke-width="1"/>
        <rect x="${outletX-5}" y="${h-4}" width="10" height="4" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>
        ${boltAt(outletX-3,h-2,1)}${boltAt(outletX+3,h-2,1)}
        <rect x="${outletX-4}" y="${rimBottom}" width="8" height="3" fill="#2a2f45" stroke="#3f445c" stroke-width="0.7"/>`;
      // 9. 溢流口（完全收进池壁内，不伸出设备边界）
      const overflow = `
        <rect x="${w-10}" y="${waterY}" width="10" height="8" rx="1" fill="url(#${metalVId})" stroke="#3f445c" stroke-width="0.8"/>
        <rect x="${w-10}" y="${waterY-2}" width="3" height="12" fill="#2a2f45" stroke="#3f445c" stroke-width="0.8"/>`;
      // 10. 爬梯（左侧池壁）
      const ladder = `
        <g stroke="${c}" stroke-width="0.8" opacity="0.6">
          <line x1="3" y1="${rimY+4}" x2="3" y2="${rimBottom-4}"/>
          <line x1="9" y1="${rimY+4}" x2="9" y2="${rimBottom-4}"/>
          ${Array.from({length:6}).map((_,i)=>`<line x1="3" y1="${rimY+8+i*(rimBottom-rimY-12)/5}" x2="9" y2="${rimY+8+i*(rimBottom-rimY-12)/5}"/>`).join('')}
        </g>`;
      // 11. 铭牌
      const nameplate = `<rect x="${w-30}" y="${rimY+8}" width="24" height="10" rx="1" fill="#0d0b20" stroke="${c}" stroke-width="0.6"/>
        <text x="${w-18}" y="${rimY+15}" text-anchor="middle" fill="${c}" font-size="4.5" font-weight="bold" opacity="0.7">冷却水池</text>`;
      return `<defs>${defs}</defs>${ground}${wallBody}${rim}${water}${waves}${scale}${inlet}${outlet}${overflow}${ladder}${nameplate}`;
    }
};
