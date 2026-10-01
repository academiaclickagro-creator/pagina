# Configuración de Agentes del Proyecto Click Agro

Este repositorio cuenta con agentes especializados y protocolos automatizados para asegurar la máxima calidad de software:

## 1. Agente de Funcionalidad (`code-functionality-verifier`)
* **Objetivo:** Comprobar integridad de sintaxis, flujo de datos, APIs serverless (`/api/`), validación de formularios, llamadas asíncronas y manejo de excepciones.
* **Comando de Verificación:** `npm run verify` o `node scripts/verify-functionality.mjs`
* **Skill Asociada:** [.agents/skills/code-functionality-verifier/SKILL.md](file:///.agents/skills/code-functionality-verifier/SKILL.md)

## 2. Agente de Optimización (`code-performance-optimizer`)
* **Objetivo:** Diagnosticar peso de assets, bloqueo de renderizado por scripts, debounce en eventos, eficiencia de consultas Supabase y Core Web Vitals.
* **Comando de Auditoría:** `npm run audit` o `node scripts/audit-optimization.mjs`
* **Skill Asociada:** [.agents/skills/code-performance-optimizer/SKILL.md](file:///.agents/skills/code-performance-optimizer/SKILL.md)

## Instrucciones para el Asistente Antigravity
Al realizar cambios en cualquier archivo `.js`, `.html` o endpoint:
1. Asegurar que el código respete las reglas descritas en [.agents/rules/quality-and-optimization.md](file:///.agents/rules/quality-and-optimization.md).
2. Ejecutar `node scripts/verify-functionality.mjs` para certificar que no se hayan introducido errores de sintaxis ni enlaces rotos.
3. Verificar que las consultas a base de datos y eventos de interfaz estén optimizados.
