import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@know.app" },
    update: {},
    create: {
      email: "admin@know.app",
      passwordHash: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Create badges
  const badges = [
    { name: "First Steps", description: "Complete your first lesson", icon: "🎯", criteriaType: "lessons_completed", criteriaValue: 1 },
    { name: "Quiz Taker", description: "Complete your first quiz", icon: "📝", criteriaType: "quizzes_completed", criteriaValue: 1 },
    { name: "Quiz Master", description: "Score 100% on any quiz", icon: "🏆", criteriaType: "perfect_quiz", criteriaValue: 1 },
    { name: "Streak Starter", description: "Maintain a 3-day streak", icon: "🔥", criteriaType: "streak", criteriaValue: 3 },
    { name: "Streak Warrior", description: "Maintain a 7-day streak", icon: "⚡", criteriaType: "streak", criteriaValue: 7 },
    { name: "Streak Legend", description: "Maintain a 30-day streak", icon: "🌟", criteriaType: "streak", criteriaValue: 30 },
    { name: "Course Complete", description: "Finish an entire course", icon: "🎓", criteriaType: "courses_completed", criteriaValue: 1 },
    { name: "Speed Learner", description: "Complete 10 lessons in one day", icon: "⚡", criteriaType: "daily_lessons", criteriaValue: 10 },
    { name: "Knowledge Seeker", description: "Start 5 different courses", icon: "📚", criteriaType: "courses_started", criteriaValue: 5 },
    { name: "Scholar", description: "Complete 3 courses", icon: "🎖️", criteriaType: "courses_completed", criteriaValue: 3 },
    { name: "Centurion", description: "Earn 1000 XP", icon: "💯", criteriaType: "xp", criteriaValue: 1000 },
    { name: "Grandmaster", description: "Reach Level 10", icon: "👑", criteriaType: "level", criteriaValue: 10 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  console.log("Seed complete: admin user + 12 badges created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
