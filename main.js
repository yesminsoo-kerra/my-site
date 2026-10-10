// 섭외 문의 폼: /api/inquiry 로 보낸다. 키는 브라우저에 하나도 없다.
(function () {
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');
  const consent = document.getElementById('f-consent');

  const say = (text, kind) => {
    status.textContent = text;
    status.className = 'form-status ' + (kind || '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    say('');

    const fields = ['organization', 'name', 'email', 'event_date', 'region'];
    let firstBad = null;
    for (const n of fields) {
      const el = form.elements[n];
      const bad = !el.value.trim() || (el.type === 'email' && !el.checkValidity());
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !firstBad) firstBad = el;
    }
    if (firstBad) {
      say(firstBad.type === 'email' && firstBad.value.trim() ? '이메일 주소를 다시 확인해 주세요.' : '빈칸을 모두 채워 주세요.', 'err');
      firstBad.focus();
      return;
    }
    if (!consent.checked) {
      say('개인정보 수집·이용에 동의해 주세요.', 'err');
      consent.focus();
      return;
    }

    const body = {
      organization: form.elements.organization.value,
      name: form.elements.name.value,
      email: form.elements.email.value,
      event_date: form.elements.event_date.value,
      region: form.elements.region.value,
      website: form.elements.website.value,
      consent: consent.checked,
    };

    button.disabled = true;
    say('보내는 중이에요…');
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      say('섭외 문의가 접수됐어요. 확인 후 이메일로 연락드릴게요.', 'ok');
    } catch (err) {
      say(err.message || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'err');
    } finally {
      button.disabled = false;
    }
  });
})();
