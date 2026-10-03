# Zen-it-trix registration API

## Setup

1. Create a MariaDB user and database, or run `schema.sql` with an account that can create databases and tables.
2. Copy `.env.example` to `.env` and set the MariaDB credentials.
3. Install and start the API:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:4000` by default.

## Endpoints

- `GET /api/health` checks API and database connectivity.
- `POST /api/registrations` stores a registration.
- `GET /api/registrations/export` downloads all registrations as an Excel-compatible CSV file.
- `POST /api/admin/login` signs an admin in.
- `GET /api/admin/registrations` lists registrations for the admin dashboard.
- `POST /api/admin/registrations` adds an on-spot registration.
- `POST /api/admin/registrations/:id/present` marks a student present when their pass is printed.
- `GET /api/admin/registrations/:id/barcode` generates the student's pass barcode.
- `POST /api/food/login` signs a food/catering admin in.
- `GET /api/food/lookup/:code` scans/looks up a pass code and checks if food was already bought and when.
- `POST /api/food/purchase` records a food purchase/meal distribution.
- `GET /api/food/records` lists food distribution history.
- `GET /api/food/stats` returns live meal counters and statistics.
- `GET /api/food/export` exports all food distribution records to CSV.
- `GET /api/food/search-participants` searches participants by name or phone for manual lookup.

Registration fields are `fullName`, `email`, `phone`, `college`, `eventName`, and `teamSize`. The same email cannot register twice for one event.

Set `VITE_API_URL` in the frontend environment when the API is not running at `http://localhost:4000/api`.

Use the admin page's `Generate report` button to download a CSV containing registration and attendance status. Printing a single pass or four passes marks the corresponding students present. This endpoint exposes attendee data, so protect it with authentication before deploying publicly.

Open the frontend at `http://localhost:5173/#admin` for the admin registration page, or `http://localhost:5173/#food-admin` for the food catering desk scanner. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FOOD_ADMIN_USERNAME`, and `FOOD_ADMIN_PASSWORD` in `.env`.
