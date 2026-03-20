# FightStats — Guía de actualización manual (v2.0 — Bilingüe)

## Estructura de datos bilingüe

El sitio usa un sistema i18n. Los datos de pelea existen en tres lugares:

```
data/
├── index.json              ← COMPARTIDO (ambos idiomas lo leen)
├── events/                 ← Originales (no los lee la web directamente)
├── es/
│   ├── stats.json          ← weight_class en español, key_factors en español
│   └── events/             ← JSONs con weight_class y key_factors en español
└── en/
    ├── stats.json          ← weight_class en inglés, key_factors en inglés
    └── events/             ← JSONs con weight_class y key_factors en inglés
```

**`data/index.json`** es compartido — los nombres de eventos son propios y no se traducen.
La web carga los datos desde `data/es/` o `data/en/` según el idioma activo.

---

## Flujo por evento nuevo

### Antes del evento (análisis previo)
1. Crea el JSON del evento en `data/events/ufc-XXXX.json` (fuente de verdad)
2. Rellena datos de peleadores y output de Nivarax. Deja `result: null`
3. Copia el JSON a `data/es/events/ufc-XXXX.json`:
   - `weight_class` en español (ej: "Peso Ligero")
   - `key_factors` en español
4. Copia el JSON a `data/en/events/ufc-XXXX.json`:
   - `weight_class` en inglés (ej: "Lightweight")
   - `key_factors` en inglés (traducción interpretativa, no literal)
5. Añade la entrada en `data/index.json` con `status: "upcoming"`

### Después del evento (resultados)
1. Rellena `result` en cada pelea (winner, method, round) en los **3 JSONs**:
   - `data/events/ufc-XXXX.json`
   - `data/es/events/ufc-XXXX.json`
   - `data/en/events/ufc-XXXX.json`
2. Cambia `status` a `"completed"` en los JSONs del evento y en `data/index.json`
3. Actualiza **ambos** `stats.json`:
   - `data/es/stats.json` — track_record con weight_class en español
   - `data/en/stats.json` — track_record con weight_class en inglés
4. Actualiza `global.total_fights`, `global.correct_predictions`, `global.accuracy` y `global.last_updated` en ambos stats.json
5. Haz git push

---

## Mapeo de weight_class (ES ↔ EN)

| Inglés | Español |
|--------|---------|
| Lightweight | Peso Ligero |
| Middleweight | Peso Medio |
| Bantamweight | Peso Gallo |
| Featherweight | Peso Pluma |
| Flyweight | Peso Mosca |
| Light Heavyweight | Peso Semipesado |
| Heavyweight | Peso Pesado |
| Welterweight | Peso Wélter |
| Women's Strawweight | Peso Paja Femenino |
| Women's Bantamweight | Peso Gallo Femenino |
| Women's Flyweight | Peso Mosca Femenino |
| Catchweight | Catchweight |

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
