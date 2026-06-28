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
import "dotenv/config";

// Initialize natively without any extra wrapper configuration blocks
export const prisma = new PrismaClient();

export const connectPrisma = async () => {
  await prisma.$connect();
};

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};
