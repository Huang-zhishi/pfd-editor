/* ============================================================
 * PFD Editor · 组件模板：instrument
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.instrument。
 * ============================================================ */

/* 局部转义（审计 5.2）：标签文字来自文档 JSON，必须转义后再插入 SVG 文本。
   模板不依赖宿主全局 esc()，保证单独渲染校验时也能工作。 */
const esc2 = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

TEMPLATES.instrument = {
    name: '仪表', category: '通用与标注',
    defaultSize: { w: 44, h: 44 },
    ports: [{id:'port',x:.5,y:1,dir:'down'}],
    render: (w,h,p)=>`
      <circle cx="${w/2}" cy="${h/2}" r="${w*0.44}" class="equip-body" stroke="${p.color}"/>
      <text x="${w/2}" y="${h/2+4}" text-anchor="middle" fill="${p.color}" font-size="${w*0.3}" font-weight="700" font-family="inherit">${esc2((p.tag||'??').slice(0,2))}</text>`
};
