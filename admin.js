const tabs = [['stats', 'Statistika'], ['couriers', 'Kuryerlar'], ['customers', 'Mijozlar'], ['orders', 'Buyurtmalar'], ['logs', 'Jurnal']];
let current = 'stats';

function loginView() {
  show(h('div', { className: 'login' }, card('Admin kirish', form([['login', 'Login', 'text'], ['password', 'Parol', 'password']], 'Kirish',
    async d => { await api('/api/admin/login', 'POST', d); start(); }))));
}

async function setStatus(id, status) { await api(`/api/admin/users/${id}/status`, 'POST', { status }); render(); }

const views = {
  async stats() {
    const d = await api('/api/admin/stats');
    const items = [['Mijozlar', d.customers], ['Kuryerlar', d.couriers], ['Tasdiq kutayotgan kuryerlar', d.pending],
      ['Buyurtmalar', d.orders], ['Yetkazilgan', d.delivered], ['Daromad', som(d.revenue)]];
    return card('Umumiy ko\'rsatkichlar', h('div', { className: 'stats' }, ...items.map(([l, v]) => h('div', { className: 'stat' }, h('b', {}, v), l))));
  },
  async couriers() {
    const rows = await api('/api/admin/users?role=courier');
    return card("Kuryerlar (tasdiqlanmaguncha mijozlar tanlay olmaydi)", table([['#', u => u.id], ['Ism', u => u.name], ['Telefon', u => u.phone],
      ['Transport', u => u.transport], ['Hudud', u => u.zone], ['Status', u => badge(u.status)], ["Ro'yxatdan o'tgan", u => u.created],
      ['', u => [u.status !== 'approved' && h('button', { className: 'btn small', onclick: () => setStatus(u.id, 'approved') }, 'Tasdiqlash'),
        u.status !== 'blocked' && h('button', { className: 'btn small alt', onclick: () => setStatus(u.id, 'blocked') }, 'Bloklash')]]], rows));
  },
  async customers() {
    const rows = await api('/api/admin/users?role=customer');
    return card('Mijozlar (ro\'yxatdan o\'tganlar)', table([['#', u => u.id], ['Ism / biznes', u => u.name], ['Telefon', u => u.phone],
      ['Status', u => badge(u.status)], ["Ro'yxatdan o'tgan", u => u.created],
      ['', u => u.status === 'blocked'
        ? h('button', { className: 'btn small', onclick: () => setStatus(u.id, 'active') }, 'Faollashtirish')
        : h('button', { className: 'btn small alt', onclick: () => setStatus(u.id, 'blocked') }, 'Bloklash')]], rows));
  },
  async orders() {
    const rows = await api('/api/admin/orders');
    return card('Barcha buyurtmalar', table([['#', o => o.id], ['Mijoz', o => o.customer], ['Kuryer', o => o.courier], ['Qayerdan → Qayerga', o => `${o.pickup} → ${o.dropoff}`],
      ['Hudud', o => o.zone], ['Sana', o => o.created],
      ['Status / Narx', o => {
        const sel = h('select', {}, ...Object.keys(ST).filter(k => !['pending', 'approved', 'blocked', 'active'].includes(k)).map(k => h('option', { value: k, selected: k === o.status }, ST[k])));
        const pr = h('input', { type: 'number', value: o.price, min: 0, max: 1000000 });
        return h('div', {}, sel, pr, h('button', { className: 'btn small', onclick: async () => {
          try { await api(`/api/admin/orders/${o.id}`, 'POST', { status: sel.value, price: Number(pr.value) }); render(); } catch (e) { alert(e.message); }
        } }, 'Saqlash'));
      }]], rows));
  },
  async logs() {
    const rows = await api('/api/admin/logs');
    return card('Harakatlar jurnali (oxirgi 200 ta)', table([['Vaqt', l => l.created], ['Kim', l => l.actor], ['Amal', l => l.action], ['IP', l => l.ip]], rows));
  },
};

async function render() {
  try {
    const body = await views[current]();
    show(h('header', {}, h('b', {}, '🛡️ Admin panel'), h('button', { className: 'btn small alt', onclick: async () => { await api('/api/admin/logout', 'POST'); loginView(); } }, 'Chiqish')),
      h('main', {}, h('nav', { className: 'tabs' }, ...tabs.map(([k, t]) => h('button', { className: 'btn small' + (k === current ? '' : ' alt'), onclick: () => { current = k; render(); } }, t))), body));
  } catch (e) { if (e.status === 401) loginView(); else alert(e.message); }
}

async function start() { try { await api('/api/admin/me'); render(); } catch { loginView(); } }
start();
