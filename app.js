const page = document.body.dataset.page;
let CFG;

const header = (me) => h('header', {}, h('b', {}, '🚚 Guliston Kuryer'),
  me && h('span', {}, `${me.name} (${me.role === 'courier' ? 'kuryer' : 'mijoz'}) `,
    h('button', { className: 'btn small', onclick: async () => { await api('/api/logout', 'POST'); init(); } }, 'Chiqish')));

function authView() {
  const reg = form([['name', 'Biznes / ism', 'text'], ['phone', 'Telefon (+998901234567)', 'tel'], ['password', 'Parol (10+ belgi, harf va raqam)', 'password']],
    "Ro'yxatdan o'tish", async d => { await api('/api/register', 'POST', { ...d, role: 'customer' }); alert("Tayyor! Endi kiring."); });
  const login = form([['phone', 'Telefon', 'tel'], ['password', 'Parol', 'password']], 'Kirish',
    async d => { await api('/api/login', 'POST', d); init(); });
  show(header(), h('main', { className: 'grid' },
    card('Kirish', login, h('p', {}, h('a', { href: '/courier.html' }, 'Kuryer bo\'lish →'))),
    card("Biznes uchun ro'yxatdan o'tish", reg)));
}

function courierRegView() {
  const f = form([['name', 'Ism familiya', 'text'], ['phone', 'Telefon (+998901234567)', 'tel'],
    ['transport', 'Transport', 'select', CFG.transport], ['zone', 'Asosiy hudud (Guliston)', 'select', Object.keys(CFG.zones)],
    ['password', 'Parol (10+ belgi, harf va raqam)', 'password']], "Kuryer sifatida ro'yxatdan o'tish",
    async d => { await api('/api/register', 'POST', { ...d, role: 'courier' }); show(header(), h('main', {}, card('Ariza yuborildi ✅',
      h('p', {}, "Admin arizangizni ko'rib chiqadi. Tasdiqlangandan so'ng mijozlar sizni tanlay oladi."), h('a', { href: '/' }, 'Kirish sahifasi')))); });
  show(header(), h('main', {}, card('Kuryer bo\'lish', f, h('p', {}, h('a', { href: '/' }, '← Orqaga')))));
}

async function customerView(me) {
  const couriers = await api('/api/couriers');
  const priceEl = h('p', { className: 'price' });
  const f = form([['pickup', 'Qayerdan olinadi (manzil)', 'text'], ['dropoff', 'Qayerga yetkaziladi (manzil)', 'text'],
    ['zone', 'Hudud', 'select', Object.keys(CFG.zones)],
    ['courier_id', 'Kuryer', 'select', couriers.length ? couriers.map(c => [c.id, `${c.name} — ${c.transport}, ${c.zone}`]) : [['', 'Tasdiqlangan kuryer yo\'q']]],
    ['note', 'Izoh (ixtiyoriy)', 'opt']], 'Buyurtma berish', async (d, fm) => { await api('/api/orders', 'POST', { ...d, courier_id: Number(d.courier_id) }); fm.reset(); upd(); load(); });
  const upd = () => priceEl.textContent = 'Narx: ' + som(CFG.zones[f.zone.value]);
  f.addEventListener('change', upd); upd(); f.insertBefore(priceEl, f.querySelector('button'));
  const box = h('div'); const load = async () => {
    const rows = await api('/api/orders');
    box.replaceChildren(table([['#', o => o.id], ['Qayerdan → Qayerga', o => `${o.pickup} → ${o.dropoff}`], ['Hudud', o => o.zone], ['Kuryer', o => o.courier],
      ['Narx', o => som(o.price)], ['Status', o => badge(o.status)],
      ['', o => o.status === 'yangi' && h('button', { className: 'btn small', onclick: async () => { await api(`/api/orders/${o.id}/status`, 'POST', { status: 'bekor' }); load(); } }, 'Bekor')]], rows));
  };
  show(header(me), h('main', { className: 'grid' }, card('Yangi buyurtma', f), card('Buyurtmalarim', box))); load();
}

async function courierView(me) {
  const box = h('div'); const load = async () => {
    const rows = await api('/api/orders');
    const act = (o, s, t) => h('button', { className: 'btn small', onclick: async () => { try { await api(`/api/orders/${o.id}/status`, 'POST', { status: s }); } catch (e) { alert(e.message); } load(); } }, t);
    box.replaceChildren(table([['#', o => o.id], ['Mijoz', o => `${o.customer} ${o.cphone}`], ['Qayerdan → Qayerga', o => `${o.pickup} → ${o.dropoff}`],
      ['Narx', o => som(o.price)], ['Status', o => badge(o.status)],
      ['', o => o.status === 'yangi' ? [act(o, 'qabul_qilindi', 'Qabul'), act(o, 'rad_etildi', 'Rad')] : o.status === 'qabul_qilindi' ? act(o, 'yolda', "Yo'lga chiqdim")
        : o.status === 'yolda' ? act(o, 'yetkazildi', 'Yetkazildi') : null]], rows));
  };
  show(header(me), h('main', {}, card('Mening holatim', badge(me.status), me.status !== 'approved' && h('p', { className: 'muted' }, "Admin tasdiqlamaguncha mijozlar sizni tanlay olmaydi.")),
    card('Menga biriktirilgan buyurtmalar', box))); load();
}

async function init() {
  CFG = await api('/api/zones');
  if (page === 'courier-reg') return courierRegView();
  try { const me = await api('/api/me'); me.role === 'courier' ? courierView(me) : customerView(me); } catch { authView(); }
}
init();
