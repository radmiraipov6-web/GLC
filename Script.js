// GLC — общий скрипт сайта
// Корзина, мобильное меню, оформление заказа и отправка в WhatsApp

// ==== НАСТРОЙКИ ====
// Укажите реальный номер WhatsApp мастерской в международном формате,
// только цифры, без "+", пробелов и скобок. Пример: 79991234567
const WHATSAPP_NUMBER = '77086351861';

const CART_KEY = 'glc_cart_v1';

function readCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  }catch(e){
    return [];
  }
}
function writeCart(items){
  try{ localStorage.setItem(CART_KEY, JSON.stringify(items)); }catch(e){ /* хранилище недоступно */ }
}
function cartTotalCount(items){ return items.reduce((sum, i) => sum + i.qty, 0); }
function cartTotalPrice(items){ return items.reduce((sum, i) => sum + i.qty * i.price, 0); }
function formatPrice(n){ return n.toLocaleString('ru-RU') + ' ₸'; }

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- мобильное меню ---------------- */
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  if (burger && navLinks){
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      burger.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }

  /* ---------------- toast ---------------- */
  const toast = document.querySelector('.toast');
  let toastTimer;
  function showToast(text){
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---------------- разметка корзины и формы заказа (создаётся один раз) ---------------- */
  if (!document.getElementById('cartDrawer')){
    document.body.insertAdjacentHTML('beforeend', `
<div class="cart-overlay" id="cartOverlay"></div>
<aside class="cart-drawer" id="cartDrawer" aria-hidden="true">
  <div class="cart-drawer-head">
    <h3>Корзина</h3>
    <button class="cart-close" id="cartClose" type="button" aria-label="Закрыть корзину">✕</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-drawer-foot">
    <div class="cart-total-row"><span>Итого</span><span id="cartTotal">0 ₸</span></div>
    <button class="btn btn-primary cart-checkout-btn" id="cartCheckoutBtn" type="button" style="width:100%; justify-content:center;">Оформить заказ</button>
    <button class="cart-clear-btn" id="cartClearBtn" type="button">Очистить корзину</button>
  </div>
</aside>

<div class="modal-overlay" id="checkoutOverlay"></div>
<div class="modal-box" id="checkoutModal" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
  <button class="modal-close" id="checkoutClose" type="button" aria-label="Закрыть">✕</button>
  <div id="checkoutFormWrap">
    <h3 id="checkoutTitle">Оформление заказа</h3>
    <form id="checkoutForm" novalidate>
      <div class="field">
        <label for="coName">Имя</label>
        <input id="coName" type="text" placeholder="Как к вам обращаться" required>
      </div>
      <div class="field">
        <label for="coPhone">Телефон</label>
        <input id="coPhone" type="tel" placeholder="+7 (___) ___-__-__" required>
      </div>
      <div class="field">
        <label for="coComment">Комментарий</label>
        <textarea id="coComment" placeholder="Необязательно"></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">Отправить заказ</button>
    </form>
  </div>
  <div class="checkout-success" id="checkoutSuccess">
    <p>Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.</p>
    <a href="#" id="whatsappLink" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%; justify-content:center;">Отправить в WhatsApp</a>
  </div>
</div>`);
  }

  const cartOverlay      = document.getElementById('cartOverlay');
  const cartDrawer       = document.getElementById('cartDrawer');
  const cartClose        = document.getElementById('cartClose');
  const cartItemsEl      = document.getElementById('cartItems');
  const cartTotalEl      = document.getElementById('cartTotal');
  const cartClearBtn     = document.getElementById('cartClearBtn');
  const cartCheckoutBtn  = document.getElementById('cartCheckoutBtn');

  const checkoutOverlay  = document.getElementById('checkoutOverlay');
  const checkoutModal    = document.getElementById('checkoutModal');
  const checkoutClose    = document.getElementById('checkoutClose');
  const checkoutForm     = document.getElementById('checkoutForm');
  const checkoutFormWrap = document.getElementById('checkoutFormWrap');
  const checkoutSuccess  = document.getElementById('checkoutSuccess');
  const whatsappLink     = document.getElementById('whatsappLink');

  function renderCartBadges(){
    const items = readCart();
    const count = cartTotalCount(items);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
  }

  function renderCartDrawer(){
    const items = readCart();
    if (!items.length){
      cartItemsEl.innerHTML = '<p class="cart-empty">Корзина пока пуста</p>';
    } else {
      cartItemsEl.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div style="flex:1;">
            <div class="cart-item-name">${item.name}</div>
            ${(item.width || item.height) ? `<div class="cart-item-dims">${item.width || '—'} × ${item.height || '—'} мм</div>` : ''}
            <div class="cart-item-price">${formatPrice(item.price)} / м²</div>
            <div class="cart-item-qty">
              <button class="qty-btn" data-action="dec" type="button" aria-label="Уменьшить количество">−</button>
              <span>${item.qty}</span>
              <button class="qty-btn" data-action="inc" type="button" aria-label="Увеличить количество">+</button>
              <span class="cart-item-remove" data-action="remove">Удалить</span>
            </div>
          </div>
        </div>
      `).join('');
    }
    cartTotalEl.textContent = formatPrice(cartTotalPrice(items));
    renderCartBadges();
  }

  function openCart(){
    renderCartDrawer();
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('show');
    document.body.classList.add('no-scroll');
  }
  function closeCart(){
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

  document.querySelectorAll('.cart-btn').forEach(btn => btn.addEventListener('click', openCart));
  if (cartClose)   cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  if (cartItemsEl){
    cartItemsEl.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const itemEl = e.target.closest('.cart-item');
      const id = itemEl.dataset.id;
      let items = readCart();
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return;

      const action = actionEl.dataset.action;
      if (action === 'inc') items[idx].qty += 1;
      if (action === 'dec'){ items[idx].qty -= 1; if (items[idx].qty <= 0) items.splice(idx, 1); }
      if (action === 'remove') items.splice(idx, 1);

      writeCart(items);
      renderCartDrawer();
    });
  }

  if (cartClearBtn){
    cartClearBtn.addEventListener('click', () => {
      writeCart([]);
      renderCartDrawer();
      showToast('Корзина очищена');
    });
  }

  /* ---------------- заявка (форма на странице «Контакты») ---------------- */
  const inquiryForm = document.getElementById('inquiryForm');
  if (inquiryForm){
    const GLASS_PRICES = {
      'Закалённое': 3200,
      'Термоупрочнённое': 2700,
      'Осветлённое': 4100,
      'Оптивайт': 5400,
      'Серое': 3600,
      'Кристалл': 4800
    };

    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name      = (inquiryForm.querySelector('#name').value || '').trim();
      const phone     = (inquiryForm.querySelector('#phone').value || '').trim();
      const glassType = inquiryForm.querySelector('#glass-type').value;
      const width     = (inquiryForm.querySelector('#reqWidth').value || '').trim();
      const height    = (inquiryForm.querySelector('#reqHeight').value || '').trim();
      const thickness = inquiryForm.querySelector('#thickness').value;
      const purpose   = (inquiryForm.querySelector('#purpose').value || '').trim();
      const comment   = (inquiryForm.querySelector('#msg').value || '').trim();

      if (!name || !phone){
        showToast('Заполните имя и телефон');
        return;
      }

      let costText = 'Уточняется после расчёта';
      const pricePerM2 = GLASS_PRICES[glassType];
      const w = parseFloat(width);
      const h = parseFloat(height);
      if (pricePerM2 && w > 0 && h > 0){
        const areaM2 = (w / 1000) * (h / 1000);
        costText = formatPrice(Math.round(pricePerM2 * areaM2));
      }

      const dateStr = new Date().toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const lines = [
        '📩 Новая заявка с сайта GLC',
        '',
        '👤 Имя:',
        name,
        '',
        '📞 Телефон:',
        phone,
        '',
        '🪟 Тип стекла:',
        glassType || 'Не указан',
        '',
        '📏 Ширина:',
        width ? `${width} мм` : 'Не указана',
        '',
        '📐 Высота:',
        height ? `${height} мм` : 'Не указана',
        '',
        '📦 Толщина:',
        thickness || 'Не указана',
        '',
        '🏠 Назначение:',
        purpose || 'Не указано',
        '',
        '💬 Комментарий:',
        comment || '—',
        '',
        '💰 Стоимость:',
        costText,
        '',
        '📅 Дата и время:',
        dateStr
      ];

      const message = lines.join('\n');
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      const submitBtn = inquiryForm.querySelector('.btn');
      if (submitBtn) submitBtn.textContent = 'Заявка отправлена ✓';
      showToast('Открываем WhatsApp...');

      window.open(waUrl, '_blank', 'noopener');
    });
  }

  /* ---------------- добавление товара в корзину ---------------- */
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name || 'Товар';
      const price = parseInt(btn.dataset.price, 10) || 0;

      const card = btn.closest('.card');
      let width = '', height = '';
      if (card){
        const wEl = card.querySelector('[data-dim="width"]');
        const hEl = card.querySelector('[data-dim="height"]');
        width = wEl && wEl.value ? wEl.value.trim() : '';
        height = hEl && hEl.value ? hEl.value.trim() : '';
      }
      const dimsKey = (width || height) ? `${width || '—'}x${height || '—'}` : 'без размера';
      const id = `${name.trim()}__${dimsKey}`;

      let items = readCart();
      const existing = items.find(i => i.id === id);
      if (existing) existing.qty += 1;
      else items.push({ id, name, price, qty: 1, width, height });
      writeCart(items);
      renderCartBadges();

      const original = btn.textContent;
      btn.textContent = 'Добавлено ✓';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('added');
      }, 1400);
      showToast(`«${name}» добавлено в корзину`);
    });
  });

  /* ---------------- оформление заказа ---------------- */
  function openCheckout(){
    const items = readCart();
    if (!items.length){
      showToast('Сначала добавьте товар в корзину');
      return;
    }
    closeCart();
    checkoutFormWrap.style.display = '';
    checkoutSuccess.classList.remove('show');
    checkoutForm.reset();
    checkoutModal.classList.add('open');
    checkoutOverlay.classList.add('show');
    document.body.classList.add('no-scroll');
  }
  function closeCheckout(){
    checkoutModal.classList.remove('open');
    checkoutOverlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

  if (cartCheckoutBtn)  cartCheckoutBtn.addEventListener('click', openCheckout);
  if (checkoutClose)    checkoutClose.addEventListener('click', closeCheckout);
  if (checkoutOverlay)  checkoutOverlay.addEventListener('click', closeCheckout);

  if (checkoutForm){
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('coName').value.trim();
      const phone   = document.getElementById('coPhone').value.trim();
      const comment = document.getElementById('coComment').value.trim();
      if (!name || !phone){
        showToast('Заполните имя и телефон');
        return;
      }

      const items = readCart();
      const lines = [];
      lines.push('Здравствуйте! Хочу оформить заказ.');
      lines.push('');
      lines.push(`Имя: ${name}`);
      lines.push(`Телефон: ${phone}`);
      lines.push('');
      lines.push('Товары:');
      items.forEach(i => {
        const dims = (i.width || i.height) ? ` (${i.width || '—'} мм × ${i.height || '—'} мм)` : '';
        lines.push(`— ${i.name}${dims} × ${i.qty} = ${formatPrice(i.price * i.qty)}`);
      });
      lines.push('');
      lines.push(`Итого: ${formatPrice(cartTotalPrice(items))}`);
      if (comment){
        lines.push('');
        lines.push(`Комментарий: ${comment}`);
      }
      const message = lines.join('\n');
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      if (whatsappLink) whatsappLink.href = waUrl;

      checkoutFormWrap.style.display = 'none';
      checkoutSuccess.classList.add('show');

      writeCart([]);
      renderCartBadges();
    });
  }

  /* ---------------- лёгкий параллакс осколков стекла в hero ---------------- */
  const shardField = document.querySelector('.shard-field');
  if (shardField && window.matchMedia('(min-width: 860px)').matches){
    shardField.addEventListener('mousemove', (e) => {
      const rect = shardField.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      shardField.querySelectorAll('.shard').forEach((shard, i) => {
        const depth = (i + 1) * 6;
        shard.style.marginLeft = `${x * depth}px`;
        shard.style.marginTop = `${y * depth}px`;
      });
    });
  }

  /* ---------------- появление карточек при скролле ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.card, .feat, .step, .info-strip, .form-box, .location-map, .location-info').forEach((el, i) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(18px)';
    const delay = Math.min(i % 6, 5) * 0.06;
    el.style.transition = `opacity .5s ease ${delay}s, transform .5s ease ${delay}s`;
    io.observe(el);
  });

  renderCartBadges();
});