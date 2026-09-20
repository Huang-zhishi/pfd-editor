/* ============================================================
 * PFD Editor · 组件模板：circle
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.circle。
 * ============================================================ */

TEMPLATES.circle = {
    name: '通用圆罐', category: '通用与标注',
    defaultSize: { w: 90, h: 90 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'left',x:0,y:.5,dir:'left'},{id:'right',x:1,y:.5,dir:'right'}],
    render: (w,h,p)=>`<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" class="equip-body" stroke="${p.color}"/>`
};
