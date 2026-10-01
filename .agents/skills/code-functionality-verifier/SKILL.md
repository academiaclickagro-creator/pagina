---
name: code-functionality-verifier
description: >-
  Audita, prueba y valida exhaustivamente la funcionalidad del código, APIs y vistas frontend del proyecto. Actívalo cuando se necesite verificar que las funciones, formularios, endpoints y flujos de usuario operen sin errores.
---

# Agente de Verificación Funcional (Functional QA Agent)

Este agente se encarga de asegurar la robustez, integridad funcional y manejo de excepciones en todo el código del proyecto (frontend, backend serverless, base de datos y scripts de cliente).

## Procedimiento de Verificación Paso a Paso

### 1. Validación Estática y Sintáctica
- Ejecuta el script de verificación del proyecto:
  ```bash
  node scripts/verify-functionality.mjs
  ```
- Comprueba que todos los archivos `.js` y `.mjs` pasen la revisión de sintaxis (`node --check <archivo>`).
- Revisa que los archivos de configuración (`package.json`, `vercel.json`) sean JSON válidos.

### 2. Auditoría de Endpoints API y Backend (`/api/`)
Para cada función serverless en `api/`:
- **Métodos HTTP:** Verificar si valida `req.method` (e.g., solo permitir `POST` o `GET` según corresponda).
- **Manejo de Errores:** Comprobar que contenga bloques `try...catch` que retornen siempre un status HTTP descriptivo con JSON:
  ```json
  { "error": "Mensaje claro de error", "details": "..." }
  ```
- **Variables de Entorno:** Verificar que las variables requeridas (e.g. `SUPABASE_URL`, `SUPABASE_KEY`) estén presentes y se verifiquen antes de su uso.
- **Validación de Payload:** Comprobar que los campos obligatorios del cuerpo (`req.body`) se validen antes de procesar la lógica de negocio.

### 3. Auditoría de Frontend y DOM (`*.html`, `clickagro-store.js`, etc.)
- **Selectores de Elementos:** Asegurar que cada `document.getElementById('id')` o `querySelector` referencie un elemento que efectivamente existe en el markup HTML.
- **Manejo de Respuestas de Red:** En llamadas a `fetch()`, comprobar que se evalúe `response.ok` antes de invocar `response.json()`.
- **Feedback Visual:** Verificar que los formularios deshabiliten el botón de envío durante la petición y muestren estados de carga o error claros al usuario.

### 4. Pruebas Interactivas (Subagente de Navegador)
Cuando se realicen cambios en la UI o flujos de usuario críticos (ej. confirmación de pedido o acceso admin):
- Usa el `browser_subagent` para navegar a la URL local (e.g. `http://localhost:3000/admin.html`), interactuar con los campos y confirmar que no se lancen excepciones en la consola.
