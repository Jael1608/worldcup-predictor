# Quiniela Mundial 2026

Aplicación web responsive para una quiniela privada de hasta 20 amigos. Cada jugador inicia sesión, predice una única vez el resultado de cada partido antes de su inicio y consulta posiciones e historial. El administrador gestiona usuarios, partidos, resultados e importaciones JSON.

## Requisitos

- Node.js 20 o superior
- npm

## Backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

La API queda disponible en `http://localhost:3001/api`.

Variables de entorno:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-secret"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Comandos Prisma útiles:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

## Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`.

## Publicar En Render

La aplicación puede publicarse con un repositorio de GitHub y dos servicios de Render:

- Un **Web Service** para `backend`.
- Un **Static Site** para `frontend`.

Antes de comenzar, sube el proyecto a GitHub:

```bash
cd worldcup-predictor
git init
git add .
git commit -m "Preparar Quiniela Mundial 2026"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/worldcup-predictor.git
git push -u origin main
```

### Backend

En Render crea un **Web Service** conectado al repositorio:

| Opción | Valor |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && npm start` |
| Health Check Path | `/api/health` |

No agregues `npx prisma migrate deploy` al build command: el disco persistente se monta al iniciar el servicio, no durante la compilación.

Variables de entorno:

```env
DATABASE_URL=file:/var/data/worldcup.db
JWT_SECRET=una-clave-larga-y-privada
FRONTEND_URL=https://TU-FRONTEND.onrender.com
```

Adjunta un disco persistente al Web Service con mount path `/var/data`. SQLite guarda toda la información en ese disco. Cuando el backend termine de publicar por primera vez, abre su **Shell** en Render y ejecuta una sola vez:

```bash
npm run prisma:seed
```

### Frontend

En Render crea un **Static Site** conectado al mismo repositorio:

| Opción | Valor |
| --- | --- |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Configura:

```env
VITE_API_URL=https://TU-BACKEND.onrender.com/api
```

Para que React Router funcione al recargar una página, agrega en **Redirects/Rewrites**:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | `Rewrite` |

Después de conocer la URL definitiva del frontend, confirma que `FRONTEND_URL` del backend tenga exactamente esa URL y vuelve a desplegar el backend.

## Limpiar Datos De Prueba

Desde la carpeta `backend`, elimina solamente las predicciones y conserva usuarios y fixture:

```bash
npm run db:clear-predictions
```

Para restaurar completamente el entorno de pruebas, eliminando predicciones, partidos y usuarios creados manualmente:

```bash
npm run db:reset-test-data
```

El reinicio completo vuelve a crear `admin`, `joel`, `adan`, `dani` y los 104 partidos oficiales. No ejecutes este comando en producción si deseas conservar apuestas reales.

## Usuarios de prueba

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin` | `admin123` |
| Jugador | `joel` | `123456` |
| Jugador | `adan` | `123456` |
| Jugador | `dani` | `123456` |

El seed crea los 104 partidos del fixture oficial FIFA actualizado el 10 de abril de 2026:

- 72 partidos de fase de grupos con selecciones, sedes y horarios confirmados.
- 32 partidos eliminatorios con sus cruces oficiales por posición o ganador.

Los horarios publicados por FIFA están expresados en Eastern Time (`ET`) y se guardan como instantes ISO para que el navegador los muestre en la zona horaria local. Los cruces eliminatorios quedan visibles, pero no admiten predicciones hasta que el administrador reemplace sus participantes por las selecciones clasificadas.

## Reglas de puntos

- Resultado exacto: 3 puntos.
- Ganador correcto o empate correcto sin resultado exacto: 1 punto.
- Resultado incorrecto: 0 puntos.

Las predicciones quedan bloqueadas al guardarse y el backend rechaza apuestas duplicadas o posteriores al inicio del partido.

## Importar partidos

El panel admin permite restaurar el fixture oficial versionado con el botón **Importar fixture oficial**. La fuente incorporada se encuentra en `backend/src/data/official-fixtures.ts`.

Desde el panel admin se puede pegar un JSON con este formato:

```json
{
  "matches": [
    {
      "externalId": "match-001",
      "homeTeam": "Alemania",
      "awayTeam": "Curazao",
      "matchDate": "2026-06-15T18:00:00.000Z",
      "stage": "GROUP",
      "groupName": "Grupo A",
      "venue": "Estadio X"
    }
  ]
}
```

Cuando `externalId` ya existe, se actualizan los datos básicos. La carga JSON continúa disponible como respaldo manual.

Fuente oficial:

- [FIFA World Cup 26 match schedule, 10 April 2026](https://digitalhub.fifa.com/asset/4b5d4417-3343-4732-9cdf-14b6662af407/FWC26-Match-Schedule_English.pdf)
- [Página oficial de fixtures FIFA](https://www.fifa.com/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums)
