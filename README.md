# disconnected webapplication 3

**Disconnected** web fixture for SailPoint connector demos (enterprise-style UI).

- **2,258** seeded accounts (matches discovery UI pagination: `View 1 - 25 of 2,258`, 91 pages).
- Role metadata: each **User Type** (role) defines which **areas** may be assigned.
- Persistent users and roles via Node `/api/db` (`.data/db.json`).

**GitHub:** https://github.com/anand-joshi-sp/disconnected-webapplication-3

## Render

Deploy as a **Node Web Service** from the repo above — see [DEPLOY.md](./DEPLOY.md).

```bash
npm install
npm start
```