// trackrecord.js — Página de historial de predicciones

// FLAG_LABELS se declara en event.js (scope global compartido)

async function renderTrackRecord() {
  const container = document.getElementById('track-record-content');
  container.innerHTML = '<div class="loading">Cargando historial</div>';

  let data;
  try {
    const res = await fetch('data/stats.json');
    if (!res.ok) throw new Error('Error al cargar stats.json');
    data = await res.json();
  } catch (e) {
    container.innerHTML = `
      <div class="error-state">
        <p>No se pudo cargar el historial. Intenta recargar la página.</p>
      </div>`;
    return;
  }

  const { global: g, track_record } = data;
  const correct = track_record.filter(r => r.correct).length;

  container.innerHTML = `
    <div class="track-header">
      <h2>Track Record</h2>
      <p>Todas las predicciones de Nivarax publicadas, con resultados verificables.</p>
    </div>

    <div class="accuracy-strip">
      <div>
        <div class="accuracy-main">
          <span class="accuracy-num">${g.accuracy.toFixed(1)}</span>
          <span class="accuracy-pct">%</span>
        </div>
        <div class="accuracy-label">Accuracy global</div>
      </div>
      <div class="accuracy-sub">
        <div>${correct} correctas de ${g.total_fights} predicciones</div>
        <div style="margin-top:4px;opacity:0.6;">Actualizado: ${formatDate(g.last_updated)}</div>
      </div>
    </div>

    <div class="track-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Pelea</th>
            <th>Evento</th>
            <th>Pick Nivarax</th>
            <th>Prob.</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          ${track_record.map(r => renderRow(r)).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Click en fila → navegar al evento
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
    ? '<span class="result-pending">Pendiente</span>'
    : r.correct
      ? '<span class="result-correct">✓ Correcto</span>'
      : '<span class="result-incorrect">✗ Incorrecto</span>';

  return `
    <tr data-event-id="${r.event_id || ''}">
      <td>${formatDate(r.date)}</td>
      <td class="fight-name">${r.fighter_a} vs. ${r.fighter_b}</td>
      <td class="event-cell">${r.event}</td>
      <td class="pick-cell">${pick}</td>
      <td class="prob-cell">${prob.toFixed(1)}%</td>
      <td class="result-cell">${resultLabel}</td>
    </tr>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
