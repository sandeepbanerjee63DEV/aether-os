import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // No demo data — use the app or admin tools to create users, leads, and workflows.
  console.log("Seed skipped: no demo data. Create records via the application.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
