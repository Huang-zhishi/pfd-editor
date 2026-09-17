/* ============================================================
 * PFD Editor · 组件模板：motor
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.motor。
 * ============================================================ */

TEMPLATES.motor = {
    name: '电机', category: '阀门管件',
    defaultSize: { w: 50, h: 50 },
    ports: [{id:'out',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>`
      <circle cx="${w/2}" cy="${h/2}" r="${w*0.42}" class="equip-body" stroke="${p.color}"/>
      <text x="${w/2}" y="${h/2+5}" text-anchor="middle" fill="${p.color}" font-size="${w*0.4}" font-weight="700" font-family="inherit">M</text>`
};
