/* ============================================================
 * PFD Editor · 组件模板：hopper
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.hopper。
 * ============================================================ */

TEMPLATES.hopper = {
    name: '漏斗', category: '通用',
    defaultSize: { w: 90, h: 90 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'}],
    render: (w,h,p)=>`<polygon points="0,0 ${w},0 ${w*0.7},${h} ${w*0.3},${h}" class="equip-body" stroke="${p.color}"/>`
};
