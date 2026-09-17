/* ============================================================
 * PFD Editor · 组件模板：silo
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.silo。
 * ============================================================ */

TEMPLATES.silo = {
    name: '料仓', category: '设备',
    defaultSize: { w: 90, h: 150 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'side',x:1,y:.4,dir:'right'}],
    render: (w,h,p)=>{
      const hop=new Path2D();
      return `
      <rect x="0" y="0" width="${w}" height="${h*0.72}" rx="3" class="equip-body" stroke="${p.color}"/>
      <rect x="0" y="0" width="${w}" height="${h*0.14}" rx="3" fill="#252545" stroke="${p.color}" stroke-width="1"/>
      <polygon points="0,${h*0.72} ${w},${h*0.72} ${w*0.78},${h*0.92} ${w*0.22},${h*0.92}" class="equip-body" stroke="${p.color}"/>
      <rect x="${w*0.35}" y="${h*0.92}" width="${w*0.3}" height="${h*0.08}" class="equip-body" stroke="${p.color}"/>
      <rect x="${w*0.08}" y="${h*0.16}" width="${w*0.84}" height="6" rx="2" fill="#1a1a30"/>
      <rect x="${w*0.08}" y="${h*0.16}" width="${w*0.84*0.7}" height="6" rx="2" fill="${p.color}" opacity="0.6"/>`;
    }
};
