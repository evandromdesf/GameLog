// confirmacao antes de apagar
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// seletor de estrelas
const form = document.getElementById('review-form');
if (form) {
  const select = document.getElementById('rating-select');
  const picker = document.getElementById('star-picker');
  const msg = document.getElementById('review-msg');

  // trocar select pelas estrelas
  select.closest('label').hidden = true;
  picker.hidden = false;
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '★';
    // meia estrela x estrela cheia
    star.addEventListener('click', (e) => {
      const rect = star.getBoundingClientRect();
      const half = e.clientX - rect.left < rect.width / 2;
      select.value = i * 2 + (half ? 1 : 2);
      draw();
    });
    picker.appendChild(star);
  }

  function draw() {
    const value = Number(select.value) || 0; // 1 a 10
    picker.querySelectorAll('.star').forEach((star, i) => {
      star.classList.toggle('full', value >= i * 2 + 2);
      star.classList.toggle('half', value === i * 2 + 1);
    });
  }
  draw();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!select.value) { msg.textContent = 'Escolha uma nota.'; return; }
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': form.querySelector('[name=_csrf]').value,
        },
        body: JSON.stringify({ rating: select.value, text: form.elements.text.value }),
      });
      const data = await res.json();
      if (data.ok) location.href = form.action.replace(/\/review$/, '');
      else msg.textContent = data.message;
    } catch {
      msg.textContent = 'Erro de conexão. Tente de novo.';
    }
  });
}
