/* ============================================================
 * PFD Editor · 组件模板：text
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.text。
 * ============================================================ */

TEMPLATES.text = {
    name: '文本标注', category: '通用与标注',
    defaultSize: { w: 140, h: 40 },
    ports: [],
    render: (w,h,p)=>`<rect x="0" y="0" width="${w}" height="${h}" rx="3" fill="#12112B99" stroke="${p.color}" stroke-width="1" stroke-dasharray="4 3"/><text x="${w/2}" y="${h/2+5}" text-anchor="middle" fill="${p.color}" font-size="15" font-weight="600" font-family="inherit">${esc(p.name||'文本')}</text>`
};
