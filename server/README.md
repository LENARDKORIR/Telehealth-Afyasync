## Server Setup

1. Open terminal in `server`.
2. Install dependencies:
   npm install
3. Create `.env` from `.env.example` and set `DATABASE_URL`.
4. Start the server:
   npm run dev

Test endpoints:
- `GET http://localhost:8000/api/health`
- `GET http://localhost:8000/api/db-test`
