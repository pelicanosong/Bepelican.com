

# Plan Completo: Sistema de Hospedajes para Experiencias BePelican

---

## Aclaración importante

- **Artesanías** = módulo independiente, YA IMPLEMENTADO, NO se relaciona con hospedajes.
- **Hospedajes** = se vinculan SOLO con **Experiencias**. Son módulos completamente separados de artesanías.

---

## Fase 1 — Base de datos (migración SQL) ✅

**Tabla `lodgings`** — Hospedajes independientes
**Tabla `lodging_room_types`** — Tipos de habitación
**Tabla `experience_lodgings`** — Pivote experiencia ↔ hospedaje
**Extensión de `order_items`** — Campos lodging_id, lodging_room_type_id, check_in_date, check_out_date
**Storage**: Bucket público `lodgings`
**RLS**: Lectura pública de activos, CRUD admin via `has_role()`

---

## Fase 2 — Admin: CRUD de Hospedajes ✅

Pestaña "Hospedajes" en Admin.tsx con LodgingsTable y LodgingFormDialog.

---

## Fase 3 — Vincular hospedajes a experiencias ✅

Step 8 "Hospedajes" en el formulario de experiencias.

---

## Fase 4 — Frontend público ✅

LodgingOptions en detalle de experiencia. Checkout con datos de hospedaje.

---

## Fase 5 — Precios Dinámicos por Temporada ✅

**Tabla `lodging_seasons`** — Temporadas por hospedaje (name, start_date, end_date)
**Tabla `room_season_rates`** — Tarifas por room_type × temporada (pricing_mode: per_room/per_person, price)
**RPC `get_lodging_calendar_prices`** — Calcula precio por noche según temporada y modo de tarificación
**Admin**: LodgingSeasonsEditor integrado en LodgingFormDialog
**Frontend**: Calendario muestra precios por día, bloquea días sin tarifa, resumen muestra temporada

```text
lodging_seasons          room_season_rates
┌──────────────┐         ┌──────────────────┐
│ lodging_id   │◄────────│ season_id        │
│ name         │         │ room_type_id ────│──► lodging_room_types
│ start_date   │         │ pricing_mode     │
│ end_date     │         │ price            │
└──────────────┘         └──────────────────┘
```
