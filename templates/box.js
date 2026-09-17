/* ============================================================
 * PFD Editor · 组件模板：box
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.box。
 * ============================================================ */

TEMPLATES.box = {
    name: '通用方框', category: '通用',
    defaultSize: { w: 100, h: 80 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>`<rect x="0" y="0" width="${w}" height="${h}" rx="4" class="equip-body" stroke="${p.color}"/>`
};
