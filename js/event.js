// event.js — Event detail view with fixture grid (i18n-aware)

function getFlagLabel(flag) {
  return t('flag_' + flag) || flag;
}

// Open detail panel state
let openFightId = null;

async function renderEvent(eventId) {
  const container = document.getElementById('event-content');
  container.innerHTML = `<div class="loading">${t('event_loading')}</div>`;

  let indexData, eventFile;
  try {
    const res = await fetch('data/index.json');
    if (!res.ok) throw new Error();
    indexData = await res.json();
    const meta = indexData.events.find(e => e.id === eventId);
    if (!meta) throw new Error();
    // Localize the event file path
    eventFile = localizeDataPath(meta.file);
  } catch {
    container.innerHTML = errorState(t('event_not_found'));
    return;
  }

  let eventData;
  try {
    const res = await fetch(eventFile);
    if (!res.ok) throw new Error();
    eventData = await res.json();
  } catch {
    container.innerHTML = errorState(t('event_load_error'));
    return;
  }

  const ev = eventData.event;

  // Group fights by section
  const sections = groupFights(eventData.fights);

  container.innerHTML = `
    <button class="back-btn" id="back-to-events">${t('back_to_events')}</button>

    <div class="event-detail-header">
      <div class="event-label">${t('event_label')}</div>
      <h2>${ev.name}</h2>
      <div class="event-meta">
        <span class="event-meta-item"><span class="icon">📅</span>${formatDate(ev.date)}</span>
        <span class="event-meta-item"><span class="icon">📍</span>${ev.location}</span>
        <span class="status-badge ${ev.status}">${t('status_' + ev.status)}</span>
      </div>
    </div>

    ${eventData.fights.length === 0
        ? `<div class="loading" style="padding:60px 0;color:var(--text-muted);">${t('event_analysis_soon')}</div>`
        : renderSections(sections, ev.status)
    }

    <!-- Detail panel -->
    <div id="fight-detail-panel" class="fight-detail-panel" style="display:none;"></div>
  `;

  document.getElementById('back-to-events').addEventListener('click', () => navigate('events'));
}

// ─────────────────────────────────────────────
// GROUP BY SECTION
// ─────────────────────────────────────────────
function groupFights(fights) {
  const ORDER = ['Main Event', 'Co-Main Event', 'Main Card', 'Prelims', 'Early Prelims'];
  const groups = {};

  fights.forEach(f => {
    const key = ORDER.includes(f.order) ? f.order : 'Main Card';
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });

  return ORDER.filter(k => groups[k]).map(k => ({ label: k, fights: groups[k] }));
}

// ─────────────────────────────────────────────
// RENDER SECTIONS
// ─────────────────────────────────────────────
function renderSections(sections, eventStatus) {
  return sections.map(s => {
    const countLabel = s.fights.length === 1
      ? t('fight_section_count_one')
      : t('fight_section_count', { count: s.fights.length });

    return `
      <div class="fixture-section">
        <div class="fixture-section-header">
          <span class="fixture-section-title">${s.label}</span>
          <span class="fixture-section-count">${countLabel}</span>
        </div>
        <div class="fixture-grid">
          ${s.fights.map(f => renderFixtureCard(f, eventStatus)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
// FIXTURE CARD
// ─────────────────────────────────────────────
function renderFixtureCard(fight, eventStatus) {
  const niv = fight.nivarax;
  const a = fight.fighter_a;
  const b = fight.fighter_b;
  const result = fight.result;
  const isCompleted = eventStatus === 'completed';
  const pickA = niv.probability_a >= niv.probability_b;

  // Result status
  let resultInfo = '';
  let cardMod = '';
  if (isCompleted && result) {
    const correct = (pickA && result.winner === 'fighter_a') || (!pickA && result.winner === 'fighter_b');
    cardMod = correct ? 'fixture-card--correct' : 'fixture-card--incorrect';
    resultInfo = `
      <div class="fixture-result">
        <span class="fixture-result-method">${result.method} R${result.round}</span>
        <span class="fixture-result-badge ${correct ? 'fx-correct' : 'fx-incorrect'}">
          ${correct ? '✓' : '✗'}
        </span>
      </div>`;
  } else {
    resultInfo = `<div class="fixture-pending">${t('fixture_pending')}</div>`;
  }

  // Mini probability bar
  const probBar = `
    <div class="fixture-probbar">
      <div class="fixture-probbar-fill" style="width:${niv.probability_a}%"></div>
    </div>`;

  return `
    <div class="fixture-card ${cardMod}" data-fight-id="${fight.id}"
         onclick="toggleFightDetail('${fight.id}', ${JSON.stringify(fight).replace(/"/g, '&quot;')}, '${eventStatus}')">

      <div class="fixture-card-inner">

        <!-- Weight class & rounds -->
        <div class="fixture-meta">
          <span>${fight.weight_class}</span>
          <span>${fight.rounds_scheduled}R</span>
        </div>

        <!-- Fighters -->
        <div class="fixture-fighters">

          <div class="fixture-fighter fixture-fighter--a">
            <div class="fixture-fighter-name ${isCompleted && result && result.winner === 'fighter_a' ? 'fx-winner' : ''}">
              ${a.name}
            </div>
            <div class="fixture-fighter-record">${a.record}</div>
          </div>

          <div class="fixture-center">
            <div class="fixture-probs">
              <span class="fixture-prob ${pickA ? 'fx-fav' : ''}">${niv.probability_a.toFixed(0)}%</span>
              <span class="fixture-prob-sep">·</span>
              <span class="fixture-prob ${!pickA ? 'fx-fav' : ''}">${niv.probability_b.toFixed(0)}%</span>
            </div>
            ${probBar}
          </div>

          <div class="fixture-fighter fixture-fighter--b">
            <div class="fixture-fighter-name ${isCompleted && result && result.winner === 'fighter_b' ? 'fx-winner' : ''}">
              ${b.name}
            </div>
            <div class="fixture-fighter-record">${b.record}</div>
          </div>

        </div>

        ${resultInfo}

      </div>

      <!-- Expand hint -->
      <div class="fixture-expand-hint" id="hint-${fight.id}">${t('fixture_see_analysis')}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// TOGGLE DETAIL PANEL
// ─────────────────────────────────────────────
function toggleFightDetail(fightId, fight, eventStatus) {
  const panel = document.getElementById('fight-detail-panel');
  const card  = document.querySelector(`[data-fight-id="${fightId}"]`);
  const hint  = document.getElementById(`hint-${fightId}`);

  // If same → close
  if (openFightId === fightId) {
    panel.style.display = 'none';
    panel.innerHTML = '';
    openFightId = null;
    card.classList.remove('fixture-card--open');
    if (hint) hint.textContent = t('fixture_see_analysis');
    return;
  }

  // Close previous
  if (openFightId) {
    const prevCard = document.querySelector(`[data-fight-id="${openFightId}"]`);
    const prevHint = document.getElementById(`hint-${openFightId}`);
    if (prevCard) prevCard.classList.remove('fixture-card--open');
    if (prevHint) prevHint.textContent = t('fixture_see_analysis');
  }

  openFightId = fightId;
  card.classList.add('fixture-card--open');
  if (hint) hint.textContent = t('fixture_close');

  // Move panel after card
  card.insertAdjacentElement('afterend', panel);
  panel.style.display = 'block';
  panel.innerHTML = renderDetailPanel(fight, eventStatus);

  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

// ─────────────────────────────────────────────
// DETAIL PANEL
// ─────────────────────────────────────────────
function renderDetailPanel(fight, eventStatus) {
  const niv = fight.nivarax;
  const a = fight.fighter_a;
  const b = fight.fighter_b;
  const result = fight.result;
  const isCompleted = eventStatus === 'completed';
  const pickA = niv.probability_a >= niv.probability_b;

  // Result block
  let resultBlock = '';
  if (isCompleted && result) {
    const correct = (pickA && result.winner === 'fighter_a') || (!pickA && result.winner === 'fighter_b');
    const winnerName = result.winner === 'fighter_a' ? a.name : b.name;
    resultBlock = `
      <div class="dp-result ${correct ? 'dp-result--correct' : 'dp-result--incorrect'}">
        <span>${correct ? t('detail_correct') : t('detail_incorrect')}</span>
        <span class="dp-result-method">${winnerName} · ${result.method} R${result.round}</span>
      </div>`;
  }

  // Advantage bar
  const adv = niv.advantage_score;
  const advPct = Math.min(Math.abs(adv) / 2.0 * 50, 50);
  const advName = adv >= 0 ? a.name.split(' ').pop() : b.name.split(' ').pop();
  const advFill = adv >= 0
    ? `<div class="adv-fill adv-fill--a" style="width:${advPct}%"></div>`
    : `<div class="adv-fill adv-fill--b" style="width:${advPct}%"></div>`;

  // Stats
  const statsDefs = [
    { label: t('stat_slpm'),           key: 'sig_strikes_landed_per_min',   pct: false },
    { label: t('stat_accuracy_label'), key: 'sig_strike_accuracy',           pct: true },
    { label: t('stat_sapm'),           key: 'sig_strikes_absorbed_per_min',  pct: false },
    { label: t('stat_defense'),        key: 'sig_strike_defense',            pct: true },
    { label: t('stat_td_accuracy'),    key: 'takedown_accuracy',             pct: true },
    { label: t('stat_td_defense'),     key: 'takedown_defense',              pct: true },
  ];

  const statsHTML = statsDefs.map(s => {
    const va = a.stats[s.key] ?? 0;
    const vb = b.stats[s.key] ?? 0;
    const max = Math.max(va, vb, 0.001);
    const dA = s.pct ? (va * 100).toFixed(0) + '%' : va.toFixed(2);
    const dB = s.pct ? (vb * 100).toFixed(0) + '%' : vb.toFixed(2);
    return `
      <div class="dp-stat-row">
        <div class="dp-stat-a">
          <span class="dp-stat-val">${dA}</span>
          <div class="dp-stat-bar dp-stat-bar--a">
            <div class="dp-stat-fill dp-stat-fill--a" style="width:${(va/max)*100}%"></div>
          </div>
        </div>
        <div class="dp-stat-label">${s.label}</div>
        <div class="dp-stat-b">
          <div class="dp-stat-bar dp-stat-bar--b">
            <div class="dp-stat-fill dp-stat-fill--b" style="width:${(vb/max)*100}%"></div>
          </div>
          <span class="dp-stat-val">${dB}</span>
        </div>
      </div>`;
  }).join('');

  // Risk
  const riskCols = [
    { name: a.name, risk: niv.risk_a, deg: niv.degradation_a },
    { name: b.name, risk: niv.risk_b, deg: niv.degradation_b },
  ].map(f => {
    const rPct = Math.min((f.risk.score / 0.5) * 100, 100);
    const dPct = Math.min((f.deg.score  / 0.35) * 100, 100);
    const chips = [
      ...f.risk.flags.map(fl => `<span class="dp-flag dp-flag--risk">${getFlagLabel(fl)}</span>`),
      ...f.deg.flags.map(fl => `<span class="dp-flag dp-flag--deg">${getFlagLabel(fl)}</span>`),
    ];
    const flagsHTML = chips.length
      ? chips.join('')
      : `<span class="dp-flag dp-flag--ok">${t('risk_no_flags')}</span>`;

    return `
      <div class="dp-risk-col">
        <div class="dp-risk-name">${f.name}</div>
        <div class="dp-risk-scores">
          <div class="dp-risk-item">
            <div class="dp-risk-label">${t('risk_uncertainty')}</div>
            <div class="dp-risk-bar"><div class="dp-risk-fill dp-risk-fill--r" style="width:${rPct}%"></div></div>
            <div class="dp-risk-num">${f.risk.score.toFixed(2)}</div>
          </div>
          <div class="dp-risk-item">
            <div class="dp-risk-label">${t('risk_degradation')}</div>
            <div class="dp-risk-bar"><div class="dp-risk-fill dp-risk-fill--d" style="width:${dPct}%"></div></div>
            <div class="dp-risk-num">${f.deg.score.toFixed(2)}</div>
          </div>
        </div>
        <div class="dp-flags">${flagsHTML}</div>
      </div>`;
  }).join('');

  return `
    <div class="detail-panel-inner">

      <!-- Header -->
      <div class="dp-header">
        <div class="dp-header-fight">
          <span class="dp-header-name">${a.name}</span>
          <span class="dp-header-vs">vs</span>
          <span class="dp-header-name">${b.name}</span>
        </div>
        <div class="dp-header-meta">${fight.weight_class} · ${fight.rounds_scheduled} rounds</div>
      </div>

      ${resultBlock}

      <!-- Probabilities -->
      <div class="dp-probs">
        <div class="dp-prob-block">
          <div class="dp-prob-name">${a.name}</div>
          <div class="dp-prob-value ${pickA ? 'dp-prob--fav' : ''}">${niv.probability_a.toFixed(1)}<span class="dp-prob-pct">%</span></div>
        </div>
        <div class="dp-prob-center">
          <div class="dp-prob-bar">
            <div class="dp-prob-fill" style="width:${niv.probability_a}%"></div>
          </div>
          <div class="dp-prob-label">Nivarax</div>
        </div>
        <div class="dp-prob-block dp-prob-block--b">
          <div class="dp-prob-name">${b.name}</div>
          <div class="dp-prob-value ${!pickA ? 'dp-prob--fav' : ''}">${niv.probability_b.toFixed(1)}<span class="dp-prob-pct">%</span></div>
        </div>
      </div>

      <!-- Advantage score -->
      <div class="dp-adv">
        <div class="dp-adv-title">
          ${t('detail_advantage')}
          <span class="dp-adv-who" style="color:${adv >= 0 ? 'var(--red)' : 'var(--text-muted)'}">
            ${advName} +${Math.abs(adv).toFixed(2)}
          </span>
        </div>
        <div class="dp-adv-bar">
          <div class="dp-adv-center"></div>
          ${advFill}
        </div>
        <div class="dp-adv-labels">
          <span>${b.name.split(' ').pop()}</span>
          <span class="dp-adv-neutral">${t('detail_neutral')}</span>
          <span>${a.name.split(' ').pop()}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="dp-section">
        <div class="dp-section-title">${t('detail_stats_title')}</div>
        <div class="dp-stats-header">
          <span>${a.name}</span>
          <span></span>
          <span>${b.name}</span>
        </div>
        ${statsHTML}
      </div>

      <!-- Risk -->
      <div class="dp-section">
        <div class="dp-section-title">${t('detail_risk_title')}</div>
        <div class="dp-risk-grid">${riskCols}</div>
      </div>

      <!-- Key factors -->
      <div class="dp-section">
        <div class="dp-section-title">${t('detail_key_factors')}</div>
        ${(niv.key_factors || []).map(f =>
          `<div class="dp-factor">▸ ${f}</div>`
        ).join('')}
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function errorState(msg) {
  return `<div class="error-state"><p>${msg}</p></div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(getDateLocale(), { day: '2-digit', month: 'long', year: 'numeric' });
}
