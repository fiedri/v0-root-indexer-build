# Master Context: The ROOT Indexer 🧠

Este documento es la fuente de verdad para el desarrollo continuo de "The ROOT Indexer". Debe ser leído al inicio de cada sesión para mantener la coherencia técnica y estética.

## 🎯 Visión del Proyecto
Un "Segundo Cerebro" minimalista para desarrolladores, enfocado en la indexación ultra-rápida de recursos técnicos con una estética "Stark Pristine" (limpia, funcional, profesional).

## 🏗️ Arquitectura Técnica
- **Frontend**: Next.js 16 (App Router) + TypeScript.
- **Backend**: Supabase (PostgreSQL + Auth + RLS).
- **Estilo**: Tailwind CSS (Mobile-First) + Shadcn/UI.
- **Branding Mandatorio**: El footer "Developed by Friedrich Ruiz" debe aparecer en: Landing Page, Login/Sign-up, y Vistas Públicas de Roadmaps. **NO** debe aparecer en el Dashboard privado.

## 📊 Esquema de Base de Datos
1.  **`links`**: Almacena URLs, títulos, descripciones y favicons. Posee RLS vinculado a `user_id`.
2.  **`tags`**: Etiquetas personalizadas por el usuario.
3.  **`link_tags`**: Relación Many-to-Many entre links y etiquetas.
4.  **`collections`**: Agrupaciones de links (Carpetas/Roadmaps).
    - `is_public`: BOOLEAN. Determina si es accesible vía link compartido.
5.  **`collection_links`**: Relación Many-to-Many entre colecciones y links.

## ✨ Funcionalidades Implementadas (Marzo 2026)
- **Extracción Élite de Metadatos**: Lógica avanzada en `/api/metadata` usando `cheerio` para obtener títulos, descripciones, favicons de alta calidad y sugerencias automáticas de etiquetas de programación (Ego Logic).
- **Sistema de Colecciones**: CRUD completo para colecciones, incluyendo la capacidad de editar el contenido y la privacidad de las mismas.
- **Modo Roadmap Público**: Ruta `/share/roadmap/[id]` para visualización anónima de colecciones marcadas como públicas.
- **UI Responsiva**: Sidebar adaptativo con menú hamburguesa (`Sheet`) y modales optimizados para móvil (anti-overflow).
- **Gestión de Etiquetas**: Capacidad de crear y eliminar etiquetas directamente desde el sidebar.
- **Eliminación de Cuenta**: Opción segura en el menú de usuario para borrar permanentemente la cuenta y todos sus datos (usando Supabase Admin API).

## 🛠️ Notas para el Desarrollador
- **Seguridad**: Siempre verificar las políticas RLS al añadir nuevas tablas. Los links en colecciones públicas deben ser visibles para usuarios anónimos.
- **UI/UX**: Mantener el enfoque en la productividad. Evitar distracciones visuales. Los diálogos deben usar scroll interno nativo para estabilidad.
- **Extracción**: La lógica de etiquetas sugeridas utiliza un diccionario expandido en `app/api/metadata/route.ts`.

---
*Documento actualizado el 14 de marzo de 2026.*
