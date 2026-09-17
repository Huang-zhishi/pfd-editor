/* ============================================================
 * PFD Editor · 组件模板：heater
 *   由 templates.js 拆分而来（一个设备一个文件）。
 *   TEMPLATES 容器与加载顺序见 templates.js，本文件只注册 TEMPLATES.heater。
 * ============================================================ */

TEMPLATES.heater = {
    name: '加热炉/燃烧炉', category: '设备',
    defaultSize: { w: 100, h: 140 },
    ports: [{id:'top',x:.5,y:0,dir:'up'},{id:'bottom',x:.5,y:1,dir:'down'},{id:'fuel',x:0,y:.8,dir:'left'}],
    render: (w,h,p)=>`
      <rect x="0" y="${h*0.15}" width="${w}" height="${h*0.7}" rx="3" class="equip-body" stroke="${p.color}"/>
      <polygon points="${w*0.15},${h*0.15} ${w*0.85},${h*0.15} ${w*0.7},0 ${w*0.3},0" class="equip-body" stroke="${p.color}"/>
      <rect x="0" y="${h*0.85}" width="${w}" height="${h*0.15}" fill="#252545" stroke="${p.color}"/>
      <path d="M ${w*0.3} ${h*0.5} q ${w*0.1} -${h*0.15} ${w*0.2} 0 q ${w*0.1} ${h*0.15} ${w*0.2} 0" fill="none" stroke="${p.color}" stroke-width="2"/>
      <!-- 动态火焰 -->
      <g>
        <path d="M ${w*0.5} ${h*0.82} Q ${w*0.38} ${h*0.7} ${w*0.5} ${h*0.58} Q ${w*0.62} ${h*0.7} ${w*0.5} ${h*0.82}" fill="#FF6B3D" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.35;0.85" dur="0.5s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="0.6s" repeatCount="indefinite"/>
        </path>
        <path d="M ${w*0.38} ${h*0.82} Q ${w*0.28} ${h*0.73} ${w*0.38} ${h*0.65} Q ${w*0.46} ${h*0.73} ${w*0.38} ${h*0.82}" fill="#FF9A3D" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.4s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.5s" repeatCount="indefinite"/>
        </path>
        <path d="M ${w*0.62} ${h*0.82} Q ${w*0.72} ${h*0.73} ${w*0.62} ${h*0.65} Q ${w*0.54} ${h*0.73} ${w*0.62} ${h*0.82}" fill="#FFAA00" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.6s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.7s" repeatCount="indefinite"/>
        </path>
      </g>
      <path d="M ${w*0.3} ${h*0.7} q ${w*0.1} -${h*0.1} ${w*0.2} 0 q ${w*0.1} ${h*0.1} ${w*0.2} 0" fill="none" stroke="#FF6B3D" stroke-width="2" opacity="0.3"/>`
};
