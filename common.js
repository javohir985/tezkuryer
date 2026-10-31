const app = document.querySelector('#app');
const ST = { yangi: 'Yangi', qabul_qilindi: 'Qabul qilindi', yolda: "Yo'lda", yetkazildi: 'Yetkazildi', rad_etildi: 'Rad etildi', bekor: 'Bekor qilindi',
  pending: 'Kutilmoqda', approved: 'Tasdiqlangan', blocked: 'Bloklangan', active: 'Faol' };
const som = n => Number(n).toLocaleString('ru-RU') + " so'm";

const api = async (u, m = 'GET', b) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', 'X-Req': '1' }, body: b ? JSON.stringify(b) : undefined, credentials: 'same-origin' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Xatolik'), { status: r.status });
  return d;
};
// Xavfsiz DOM yaratish (textContent orqali — XSS dan himoya)
const h = (t, a = {}, ...k) => {
  const e = document.createElement(t);
  for (const [x, v] of Object.entries(a)) x.startsWith('on') ? e.addEventListener(x.slice(2), v) : (e[x] = v);
  e.append(...k.flat().filter(v => v != null && v !== false));
  return e;
};
const show = (...n) => app.replaceChildren(...n);
const badge = s => h('span', { className: 'badge ' + s }, ST[s] || s);

// fields: [name, label, type('text'|'password'|'tel'|'opt'|'select'), options]
function form(fields, btn, fn) {
  const f = h('form', {}, ...fields.map(([n, l, t = 'text', o]) => h('label', {}, l,
    t === 'select'
      ? h('select', { name: n, required: true }, ...o.map(v => { const [val, lab] = Array.isArray(v) ? v : [v, v]; return h('option', { value: val }, lab); }))
      : h('input', { name: n, type: t === 'opt' ? 'text' : t, required: t !== 'opt', autocomplete: t === 'password' ? 'current-password' : 'off', maxLength: 150 }))),
    h('button', { className: 'btn' }, btn), h('p', { className: 'err' }));
  f.addEventListener('submit', async e => {
    e.preventDefault(); const er = f.querySelector('.err'); er.textContent = '';
    try { await fn(Object.fromEntries(new FormData(f)), f); } catch (x) { er.textContent = x.message; }
  });
  return f;
}
const table = (cols, rows) => rows.length
  ? h('div', { className: 'wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ...cols.map(c => h('th', {}, c[0])))),
    h('tbody', {}, ...rows.map(r => h('tr', {}, ...cols.map(c => h('td', {}, c[1](r))))))))
  : h('p', { className: 'muted' }, "Hozircha ma'lumot yo'q");
const card = (title, ...k) => h('section', { className: 'card' }, title && h('h2', {}, title), ...k);