// VITRUM — общий скрипт сайта

document.addEventListener('DOMContentLoaded', () => {

  // мобильное меню
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  if (burger && navLinks){
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // корзина (в памяти страницы — без localStorage)
  let cartCount = 0;
  const cartCountEl = document.querySelector('.cart-count');
  const toast = document.querySelector('.toast');
  let toastTimer;

  function showToast(text){
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name || 'товар';
      cartCount += 1;
      if (cartCountEl) cartCountEl.textContent = cartCount;
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

  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn){
    cartBtn.addEventListener('click', () => {
      showToast(cartCount > 0 ? `В корзине: ${cartCount} поз.` : 'Корзина пока пуста');
    });
  }

  // лёгкий параллакс осколков стекла в hero под курсор
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

  // появление карточек при скролле
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.card, .feat, .step').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    io.observe(el);
  });
});