# Deploy disconnected webapplication 3 on Render

This app is a **Node Web Service** (not a static site). User, role, and role-to-area metadata persist in `.data/db.json` on disk.

## Render setup

1. Create a **New Web Service** connected to this folder’s Git repository.
2. Runtime: **Node**
3. Build command: `npm install`
4. Start command: `npm start`
5. Optionally set **`DATA_DIR`** to a persistent disk mount path if you add a Render disk (recommended for production).

You can also use the included `render.yaml` blueprint.

## Local run

```bash
cd disconnected-webapplication-3
npm install
npm start
```

Open `http://localhost:3000`. Any username/password signs in (demo fixture).

## Data model

- **`areas`**: master catalog of assignable areas (Pyxis-style labels).
- **`roles`**: each role has `areaIds` — metadata defining which areas users with that **User Type** may select.
- **`users`**: saved with `roleId`, `facilityId`, and `assignedAreaIds` (must be subset of the role’s areas).
- **`/api/db`**: GET returns JSON; PUT replaces the full database (auto-save on Save).

## Connector / automation IDs

Login: `#login-username`, `#login-password`, `#login-submit`  
Users list: `#users-table`, `#filter-search`  
User form: `#field-first-name`, `#field-user-id`, `#field-user-type`, `#field-facility`, `#assigned-areas-panel`, `#btn-save-user`  
Roles: `#roles-table`, `#field-role-name`, `#role-areas-panel`, `#btn-save-role`