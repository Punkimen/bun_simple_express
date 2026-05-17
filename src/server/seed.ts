import { prisma } from "./prisma/db";
import { passwordController } from "./modules/auth/libs/passwordHasher";
async function seed() {
  const email = process.env.ADMIN_LOGIN;
  const password = await passwordController.hash(process.env.ADMIN_PASSWORD);
  console.log(process.env.ADMIN_PASSWORD)
console.log(password, email)
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
