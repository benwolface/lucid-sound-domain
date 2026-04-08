const { PrismaClient } = require("@prisma/client");

// Avoid creating multiple Prisma clients in dev hot-reload.
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__lucidPrisma || new PrismaClient();

if (!globalForPrisma.__lucidPrisma) {
  globalForPrisma.__lucidPrisma = prisma;
}

module.exports = { prisma };

