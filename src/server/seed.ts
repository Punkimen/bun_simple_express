import { prisma } from "./prisma/db";

async function seed() {
  const email = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_LOGIN and ADMIN_PASSWORD must be set in .env");
  }

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password,
    },
  });

  await prisma.category.updateMany({ data: { user_id: admin.id } });
  await prisma.transaction.updateMany({ data: { user_id: admin.id } });

  console.log("Admin created:", admin.id);
  await prisma.$disconnect();
}

seed();
