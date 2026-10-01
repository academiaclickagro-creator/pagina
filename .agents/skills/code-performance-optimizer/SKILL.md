---
name: code-performance-optimizer
description: >-
  Audita y optimiza el rendimiento del código, consumo de recursos, velocidad de carga web, eficiencia de consultas y uso de memoria. Actívalo para diagnosticar lentitud, cuellos de botella y aplicar mejores prácticas de alto rendimiento.
---

# Agente de Optimización y Rendimiento (Performance & Optimization Agent)

Este agente se especializa en analizar y elevar al máximo la eficiencia del código, velocidad de respuesta en el cliente y servidor, y optimización de assets.

## Procedimiento de Optimización Paso a Paso

### 1. Auditoría Automática de Rendimiento
- Ejecuta el script de auditoría de rendimiento del proyecto:
  ```bash
  node scripts/audit-optimization.mjs
  ```
- Revisa el reporte generado identificando:
  - Archivos con peso excesivo.
  - Scripts en cabecera sin atributos de carga diferida (`defer` o `async`).
  - Imágenes sin `loading="lazy"` o sin dimensiones explícitas.
  - Eventos de alta frecuencia sin técnicas de `debounce` o `throttle`.

### 2. Optimización de Carga y Core Web Vitals (Frontend)
- **LCP (Largest Contentful Paint):** Pre-cargar o priorizar recursos críticos (hero banner, fuentes principales con `preconnect` o `dns-prefetch`).
- **CLS (Cumulative Layout Shift):** Reservar espacio de imágenes y banners con `width` y `height` o aspect-ratio CSS para evitar saltos de pantalla.
- **FID / INP (Interaction to Next Paint):**
  - Mover tareas computacionales pesadas fuera del hilo principal o dividirlas con `requestAnimationFrame` o `setTimeout`.
  - Evitar selectores DOM costosos repetitivos dentro de bucles; almacenar en caché las referencias DOM.

### 3. Optimización de Consultas y Base de Datos (Supabase / Backend)
- **Proyecciones de Datos:** Sustituir consultas genéricas como `.select('*')` por la lista explícita de columnas requeridas (e.g. `.select('id, nombre, estado, fecha')`).
- **Paginación e Índices:** Implementar `.range(from, to)` o límites (`.limit()`) en listados de pedidos o clientes para evitar cargar miles de registros en una sola petición.
- **Filtros en el Servidor:** Aplicar siempre los filtros en la consulta Supabase en lugar de descargar todo el set de datos y filtrar en memoria con `.filter()` de JS.

### 4. Gestión de Memoria y Ciclo de Vida
- **Event Listeners:** Si se añaden listeners a elementos generados dinámicamente, utilizar delegación de eventos en un contenedor común para no crear cientos de manejadores en memoria.
- **Timers:** Verificar que cada `setInterval` guarde su identificador y cuente con su correspondiente `clearInterval` cuando el componente o vista se desmonte o cierre.
