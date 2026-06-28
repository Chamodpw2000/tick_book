// import prismaPkg from "@prisma/client";
// import "dotenv/config";
// import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// const { PrismaClient } = prismaPkg;
// const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

// export const prisma = new PrismaClient({
//   adapter,
// });

// export const connectPrisma = async () => {
//   await prisma.$connect();
// };

// export const disconnectPrisma = async () => {
//   await prisma.$disconnect();
// };
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

// Parse your string safely
const dbUrl = new URL(process.env.DATABASE_URL);

// Initialize with a clean configuration object
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || "3306"),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
});

export const prisma = new PrismaClient({ adapter });

export const connectPrisma = async () => {
  await prisma.$connect();
};

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};