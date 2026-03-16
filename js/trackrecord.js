// trackrecord.js — Prediction history page (i18n-aware)

async function renderTrackRecord() {
  const container = document.getElementById('track-record-content');
  container.innerHTML = `<div class="loading">${t('tr_loading')}</div>`;

  let data;
  try {
    const res = await fetch(localizeDataPath('data/stats.json'));
    if (!res.ok) throw new Error('Error loading stats.json');
    data = await res.json();
  } catch (e) {
    container.innerHTML = `
      <div class="error-state">
        <p>${t('tr_error')}</p>
      </div>`;
    return;
  }

  const { global: g, track_record } = data;
  const correct = track_record.filter(r => r.correct).length;

  container.innerHTML = `
    <div class="track-header">
      <h2>${t('tr_title')}</h2>
      <p>${t('tr_desc')}</p>
    </div>

    <div class="accuracy-strip">
      <div>
        <div class="accuracy-main">
          <span class="accuracy-num">${g.accuracy.toFixed(1)}</span>
          <span class="accuracy-pct">%</span>
        </div>
        <div class="accuracy-label">${t('stat_accuracy')}</div>
      </div>
      <div class="accuracy-sub">
        <div>${t('tr_correct_of', { correct: correct, total: g.total_fights })}</div>
        <div style="margin-top:4px;opacity:0.6;">${t('tr_updated', { date: formatDateTR(g.last_updated) })}</div>
      </div>
    </div>

    <div class="track-table-wrap">
      <table>
        <thead>
          <tr>
            <th>${t('tr_th_date')}</th>
            <th>${t('tr_th_fight')}</th>
            <th>${t('tr_th_event')}</th>
            <th>${t('tr_th_pick')}</th>
            <th>${t('tr_th_prob')}</th>
            <th>${t('tr_th_result')}</th>
          </tr>
        </thead>
        <tbody>
          ${track_record.map(r => renderRow(r)).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Click on row → navigate to event
  container.querySelectorAll('tbody tr[data-event-id]').forEach(row => {
    row.addEventListener('click', () => {
      const eventId = row.dataset.eventId;
      if (eventId) navigate('event', eventId);
    });
  });
}

function renderRow(r) {
  const pick = r.nivarax_pick === 'fighter_a' ? r.fighter_a : r.fighter_b;
  const prob = r.nivarax_pick === 'fighter_a' ? r.probability_a : r.probability_b;
  const resultLabel = r.result == null
    ? `<span class="result-pending">${t('tr_result_pending')}</span>`
    : r.correct
      ? `<span class="result-correct">${t('tr_result_correct')}</span>`
      : `<span class="result-incorrect">${t('tr_result_incorrect')}</span>`;

  return `
    <tr data-event-id="${r.event_id || ''}">
      <td>${formatDateTR(r.date)}</td>
      <td class="fight-name">${r.fighter_a} vs. ${r.fighter_b}</td>
      <td class="event-cell">${r.event}</td>
      <td class="pick-cell">${pick}</td>
      <td class="prob-cell">${prob.toFixed(1)}%</td>
      <td class="result-cell">${resultLabel}</td>
    </tr>
  `;
}

function formatDateTR(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(getDateLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
}
