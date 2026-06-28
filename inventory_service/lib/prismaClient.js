import prismaPkg from "@prisma/client";
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const { PrismaClient } = prismaPkg;

// Programmatically set allowPublicKeyRetrieval=true to support caching_sha2_password/sha256_password auth
const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.set("allowPublicKeyRetrieval", "true");

const adapter = new PrismaMariaDb(dbUrl.toString());

export const prisma = new PrismaClient({
  adapter,
});

export const connectPrisma = async () => {
  await prisma.$connect();
};

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

