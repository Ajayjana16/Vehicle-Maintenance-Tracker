import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding relatable personal vehicle owner accounts...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const personalUsers = [
    {
      email: "alex@autopulse.me",
      name: "Alex Mercer",
      firstName: "Alex",
      lastName: "Mercer",
      passwordHash,
      emailVerified: true,
    },
    {
      email: "sarah@autopulse.me",
      name: "Sarah Chen",
      firstName: "Sarah",
      lastName: "Chen",
      passwordHash,
      emailVerified: true,
    },
    {
      email: "marcus@autopulse.me",
      name: "Marcus Vance",
      firstName: "Marcus",
      lastName: "Vance",
      passwordHash,
      emailVerified: true,
    },
  ];

  for (const u of personalUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const created = await prisma.user.create({ data: u });
      console.log(`Seeded personal owner: ${created.email} (${created.name})`);
    } else {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          passwordHash: u.passwordHash,
          name: u.name,
          firstName: u.firstName,
          lastName: u.lastName,
          emailVerified: u.emailVerified,
        },
      });
      console.log(`Updated personal owner: ${u.email}`);
    }
  }

  console.log("Personal owner accounts seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
