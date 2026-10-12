/* ============================================================
 * PFD Editor · 组件模板：signal（开关信号 / 状态指示牌）
 *   绑定单个开关量 / 状态位号，按“0=关、非 0=开”显示：
 *     值 0        → 关（灰灯）
 *     值非 0      → 开（绿灯 + 辉光）
 *     未绑定/无数据 → --（暗灯）
 *   牌内显示自定义名称（组件「名称」字段），鼠标悬浮显示所绑位号。
 *
 *   对外契约（须与 editor.js refreshSignalState() 同步，改动类名/结构要一起改）：
 *     class="sig-box"   指示牌底板（描边随状态变色）
 *     class="sig-lamp"  指示灯（fill 随状态变色）
 *     class="sig-glow"  指示灯辉光（开时 opacity>0）
 *     class="sig-state" 右侧状态文字（开 / 关 / --）
 *   数据源：props.signalTag（单个位号）  props.name（牌内名称）
 *   端口：无（纯状态指示，不接工艺管线）
 * ============================================================ */

TEMPLATES.signal = {
    name: '开关信号', category: '通用与标注',
    defaultSize: { w: 120, h: 30 },
    ports: [],
    render: (w,h,p)=>{
      const esc = s => String(s==null?'':s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      const label = (p && p.name) || '开关信号';
      const tag = (p && p.signalTag) || '';
      const hh = Math.max(12, h);
      const fs = Math.max(7, Math.min(16, hh*0.36));
      const lampR = Math.max(2, Math.min(6, hh*0.18));
      const pad = Math.max(4, Math.min(10, hh*0.26));
      const lampCx = pad + lampR;
      const cy = h/2;
      const nameX = lampCx + lampR + pad*0.7;
      const stateX = w - pad;
      const F = v => (+v).toFixed(2);
      return `
        <title>${esc(tag ? ('位号：' + tag) : '未绑定位号')}</title>
        <rect class="sig-box" x="0.75" y="0.75" width="${F(Math.max(1,w-1.5))}" height="${F(Math.max(1,h-1.5))}" rx="${F(Math.min(6,h*0.16))}" fill="#0c0f24f2" stroke="#3a4166" stroke-width="1.3"/>
        <circle class="sig-glow" cx="${F(lampCx)}" cy="${F(cy)}" r="${F(lampR*2.0)}" fill="#3ddc84" opacity="0"/>
        <circle class="sig-lamp" cx="${F(lampCx)}" cy="${F(cy)}" r="${F(lampR)}" fill="#5a608a" stroke="#2a2f45" stroke-width="0.8"/>
        <text class="sig-name" x="${F(nameX)}" y="${F(cy+fs*0.35)}" fill="#d7dcff" font-size="${F(fs)}" font-family="inherit">${esc(label)}</text>
        <text class="sig-state" x="${F(stateX)}" y="${F(cy+fs*0.35)}" text-anchor="end" fill="#8a90c4" font-size="${F(fs)}" font-weight="700" font-family="inherit">--</text>
      `;
    }
};
