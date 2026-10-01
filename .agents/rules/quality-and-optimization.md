# Directivas de Verificación Funcional y Optimización de Código

Esta regla aplica a todo el proyecto y debe ser ejecutada por el asistente antes de finalizar cualquier modificación de código.

## 1. Agente de Verificación Funcional (QA & Integridad)
Todo cambio o adición de código debe superar las siguientes comprobaciones:
- **Sintaxis y Ejecución:** Comprobar que no haya errores de sintaxis en JavaScript (`node --check`).
- **Manejo de Errores:** Toda operación asíncrona (`fetch`, consultas Supabase, llamadas a APIs) debe contar con bloque `try...catch` adecuado y mensajes de error orientados al usuario y a logs técnicos.
- **Validación de Entradas:** Validar siempre los datos provenientes de formularios o payloads de request (tipos, longitudes, obligatoriedad, formato de email y teléfono).
- **Integridad de Referencias:** Comprobar que los IDs de elementos del DOM referenciados en JavaScript (`document.getElementById`, etc.) existan en el HTML correspondiente.
- **Códigos de Estado y Respuestas API:** En endpoints `/api/*.js`, garantizar respuestas HTTP semánticas (200, 400, 401, 404, 500) con payloads JSON estructurados `{ success, data, error }`.

## 2. Agente de Optimización de Código (Performance & Eficiencia)
El código debe cumplir con las directivas de alto rendimiento web:
- **Carga de Scripts:** Los scripts en `<head>` deben llevar `defer` o `async` para evitar bloquear el renderizado del DOM.
- **Optimización de Assets:** Imágenes y recursos multimedia deben utilizar atributos `loading="lazy"` (excepto elementos above-the-fold o hero) y dimensiones explícitas.
- **Gestión de Eventos:** Los eventos de alta frecuencia (`scroll`, `resize`, `input`, `keyup`) deben estar protegidos por funciones de `debounce` o `throttle`.
- **Interacción con Base de Datos:** Evitar consultas masivas no filtradas; utilizar proyecciones de campos específicas en lugar de traer tablas completas cuando solo se necesitan pocos campos.
- **Limpieza de Recursos:** Eliminar memory leaks asegurando que timers (`setInterval`, `setTimeout`) y event listeners dinámicos sean liberados cuando el contexto o modal se destruya.
