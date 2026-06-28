This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Backend Services

The admin frontend depends on the following backend microservices. Each service must be started separately in its own terminal. Navigate to the project root directory first, then run:

For the Prisma-based services, run the database and client setup first before starting the dev server:

```bash
npx prisma generate
npx prisma migrate dev
```

Apply these commands inside each Prisma service directory (`event_service`, `booking_service`, `inventory_service`, and `payment_service`) before running `npm run dev`.

| Port | Service           | Command                                  |
|------|-------------------|------------------------------------------|
| 3001 | Event Service     | `cd event_service && npm run dev`        |
| 3002 | User Service      | `cd user_service && npm run dev`         |
| 3003 | Booking Service   | `cd booking_service && npm run dev`      |
| 3004 | Artist Service    | `cd artist_service && npm run dev`       |
| 3005 | Venue Service     | `cd venue_service && npm run dev`        |
| 3006 | Payment Service   | `cd payment_service && npm run dev`      |
| 3007 | Inventory Service | `cd inventory_service && npm run dev`    |

> **Note:** All backend services use `nodemon` for hot-reloading in development mode. Make sure each service's database is configured and migrated before starting.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

test users
Email	        superadmin@tickety.com
Password	    Admin@123

Email           admin@tickety.com
Password        password123