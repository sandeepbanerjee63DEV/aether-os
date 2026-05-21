/**
 * Create an admin user: npx tsx scripts/create-user.ts email@example.com password "Full Name"
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [, , email, password, ...nameParts] = process.argv;
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <password> [name]");
    process.exit(1);
  }

  const name = nameParts.join(" ") || email.split("@")[0];
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: {
      email,
      passwordHash,
      name,
      role: Role.SUPER_ADMIN,
      title: "Administrator",
    },
  });

  console.log("User ready:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
