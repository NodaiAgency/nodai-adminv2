# Nodai Agency — Admin Panel

Panel de administración de Nodai Agency. Dark mode, conectado a Airtable.

## Requisitos previos
- Node.js v18+ instalado (descargar de https://nodejs.org)
- Cuenta de GitHub
- Cuenta de Vercel (gratis) — https://vercel.com

## Pasos para desplegar

### 1. Instalar dependencias
Abre una terminal en esta carpeta y ejecuta:
```bash
npm install
```

### 2. Probar en local
```bash
npm run dev
```
Abre http://localhost:3000 en tu navegador.
- Email: ivan@nodaiagency.com
- Contraseña: nodai2025

### 3. Conectar Airtable (opcional)
Edita el archivo `src/components/NodaiAdminPanel.js` y cambia:
- `TU_BASE_ID` → tu Base ID de Airtable (empieza por "app...")
- `TU_API_KEY` → tu Personal Access Token de Airtable

Para obtener el Base ID: https://airtable.com/api → selecciona tu base
Para crear un token: https://airtable.com/create/tokens → dale permisos de lectura

### 4. Subir a GitHub
```bash
git init
git add .
git commit -m "Nodai Admin Panel v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nodai-admin.git
git push -u origin main
```
(Crea primero el repositorio vacío en github.com)

### 5. Desplegar en Vercel
1. Ve a https://vercel.com y haz login con GitHub
2. Click en "Add New Project"
3. Importa el repositorio "nodai-admin"
4. Click en "Deploy"
5. En 1-2 minutos tendrás tu URL tipo: https://nodai-admin.vercel.app

### 6. Dominio personalizado (opcional)
En Vercel → Settings → Domains → añade tu dominio (ej: admin.nodaiagency.com)

## Credenciales por defecto
- Email: ivan@nodaiagency.com
- Contraseña: nodai2025

Cámbialas en `src/components/NodaiAdminPanel.js` → ADMIN_CREDENTIALS

## Estructura del proyecto
```
nodai-admin/
├── src/
│   ├── app/
│   │   ├── layout.js      ← Layout global (fuentes, estilos base)
│   │   └── page.js        ← Página principal
│   └── components/
│       └── NodaiAdminPanel.js  ← Todo el panel (modificar aquí)
├── package.json
├── next.config.js
└── README.md
```
