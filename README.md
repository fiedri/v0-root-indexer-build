# The ROOT Indexer 🧠

**Your Second Brain for Code Resources.**  
Una plataforma minimalista y potente diseñada para que los desarrolladores guarden, organicen y recuperen instantáneamente artículos, tutoriales y documentación técnica.

---

## 🚀 Funcionalidades Principales

- **Indexación Inteligente**: Guarda cualquier URL y extrae automáticamente metadatos (títulos, descripciones y favicons).
- **Etiquetado Dinámico**: Categoriza tus recursos con etiquetas personalizadas de colores.
- **Colecciones y Roadmaps**: Agrupa links en carpetas inteligentes para crear guías de aprendizaje o bibliotecas temáticas.
- **Roadmaps Públicos**: Genera enlaces únicos para compartir tus colecciones con la comunidad (estilo compartido/público).
- **Búsqueda Instantánea**: Encuentra cualquier recurso en milisegundos mediante búsqueda de texto completo y filtros por etiquetas.
- **Estética Stark Pristine**: Interfaz limpia, enfocada 100% en la productividad y libre de distracciones.

## 🛠️ Stack Tecnológico

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Backend/DB**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, RLS)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Gestión de Estado**: [SWR](https://swr.vercel.app/)

---

## ⚙️ Configuración Local

### 1. Clonar y Dependencias
```bash
git clone <tu-repositorio>
cd root-indexer
pnpm install
```

### 2. Variables de Entorno
Crea un archivo `.env.local` en la raíz con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (requerido para borrar cuenta)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

### 3. Base de Datos (Supabase)
Ejecuta los scripts SQL en el **SQL Editor** de Supabase en este orden:
1. `scripts/001_create_schema.sql` (Esquema base)
2. `scripts/002_alter_schema.sql` (Ajustes de esquema)
3. `scripts/003_add_user_id_and_rls.sql` (Auth y Seguridad RLS)
4. `scripts/004_add_collections.sql` (Tablas de Colecciones y Roadmaps)

### 4. Ejecutar
```bash
pnpm dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🛡️ Seguridad (RLS)
El proyecto utiliza **Row Level Security (RLS)** de Supabase para asegurar que:
- Solo tú puedas ver y editar tus links y colecciones privadas.
- Los Roadmaps marcados como **públicos** puedan ser vistos por cualquier persona (incluso sin cuenta), pero no editados.

---

## ✒️ Créditos
Desarrollado con enfoque estratégico por **Friedrich Ruiz**.  
*Built for programmers, by programmers.*
