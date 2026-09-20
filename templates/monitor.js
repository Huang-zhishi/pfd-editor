/* ============================================================
 * PFD Editor · 组件模板：monitor
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.monitor。
 * ============================================================ */

TEMPLATES.monitor = {
    name: '监控器', category: '通用与标注',
    defaultSize: { w: 150, h: 21 },
    ports: [],
    render: (w,h,p)=>{
      const c = p.color || '#00E5FF';
      const tags = Array.isArray(p.monitorTags) ? p.monitorTags : [];
      const ROW = 17;
      let body = '';
      if(!tags.length){
        body = `<text x="${w/2}" y="13.5" text-anchor="middle" fill="#5a608a" font-size="8.5" font-family="inherit">未绑定测点</text>`;
      } else {
        // 不展示名称，仅居中展示数值+单位符号（详细信息走悬浮面板/详情抽屉）
        tags.forEach((t,i)=>{
          // baseline 14.5：数值字号 11、无下伸部，视觉中心对齐行中心（行高 17 + 上下各 2px 留白 → 行中心 10.5）
          const y = 14.5 + i*ROW;
          body += `
      <text x="${w/2}" y="${y}" text-anchor="middle" font-family="inherit"><tspan class="mon-value" data-i="${i}" fill="${c}" font-size="11" font-weight="700" style="font-variant-numeric:tabular-nums">--</tspan><tspan class="mon-unit" data-i="${i}" fill="#8a90c4" font-size="7.5"> </tspan></text>`;
        });
      }
      return `
      <rect x="0" y="0" width="${w}" height="${h}" rx="6" class="mon-panel" fill="#0c0f24f2" stroke="${c}" stroke-width="1.2"/>
      ${body}
    `;
    }
};
