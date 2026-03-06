# FightStats v0.2 — Guía de actualización manual

## Flujo por evento nuevo

### Antes del evento (análisis previo)
1. Crea `data/events/ufc-XXXX.json` copiando la estructura de un evento existente
2. Rellena los datos de los peleadores y el output de Nivarax
3. Deja `result: null` en todas las peleas
4. Añade la entrada del evento en `data/index.json` con `status: "upcoming"`

### Después del evento (resultados)
1. En el JSON del evento, rellena `result` en cada pelea con `winner`, `method` y `round`
2. Cambia `status` del evento a `"completed"` en el JSON del evento y en `index.json`
3. Añade cada pelea al `track_record` en `data/stats.json`
4. Actualiza `global.total_fights`, `global.correct_predictions`, `global.accuracy` y `global.last_updated` en `stats.json`
5. Haz git push

---

## Campos obligatorios en cada pelea (events/*.json)

- `fighter_a.name`, `fighter_b.name` — nombres completos
- `fighter_a.record`, `fighter_b.record` — formato "W-L"
- `nivarax.probability_a`, `nivarax.probability_b` — suman 100
- `nivarax.advantage_score` — número entre -2.0 y 2.0 (positivo favorece A)
- `nivarax.risk_a.score`, `nivarax.risk_b.score` — entre 0 y 0.5
- `nivarax.key_factors` — array de 2-4 strings explicativos

## Flags disponibles para risk y degradation

**Risk flags:**
- `long_layoff` — más de 365 días inactivo
- `very_long_layoff` — más de 540 días inactivo
- `low_ufc_experience` — menos de 4 peleas en UFC
- `high_finish_dependency` — más del 85% de victorias por finalización
- `moderate_finish_dependency` — más del 70% por finalización

**Degradation flags:**
- `severe_recent_decline` — 4+ derrotas en últimas 5 peleas
- `moderate_recent_decline` — 3 derrotas en últimas 5 peleas

---

## status posibles en index.json

- `"completed"` — evento terminado, resultados visibles
- `"upcoming"` — análisis visible, sin resultados
- `"premium"` — muestra candado con CTA a Ko-fi (sin datos en el JSON)
