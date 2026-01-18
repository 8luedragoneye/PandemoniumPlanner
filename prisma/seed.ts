import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.signup.deleteMany();
  await prisma.role.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      name: 'Alice',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      name: 'Bob',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      username: 'charlie',
      name: 'Charlie',
      password: hashedPassword,
    },
  });

  // Create activities
  console.log('🎯 Creating activities...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(19, 0, 0, 0);

  const massupTime1 = new Date(tomorrow);
  massupTime1.setHours(17, 30, 0, 0); // 30 minutes before activity

  const activity1 = await prisma.activity.create({
    data: {
      name: 'Hellgate Run',
      date: tomorrow,
      massupTime: massupTime1,
      description: 'T6 Hellgate run in the Outlands. Need experienced players.',
      status: 'recruiting',
      zone: 'Outlands',
      minEquip: 'T6',
      creatorId: user1.id,
    },
  });

  const massupTime2 = new Date(nextWeek);
  massupTime2.setHours(18, 30, 0, 0); // 30 minutes before activity

  const activity2 = await prisma.activity.create({
    data: {
      name: 'Avalonian Raid',
      date: nextWeek,
      massupTime: massupTime2,
      description: 'Large scale Avalonian raid. All roles welcome.',
      status: 'recruiting',
      zone: 'Avalon',
      minEquip: 'T5',
      creatorId: user2.id,
    },
  });

  // Create roles
  console.log('🎭 Creating roles...');
  const tankRole = await prisma.role.create({
    data: {
      activityId: activity1.id,
      name: 'Tank',
      slots: 1,
      attributes: JSON.stringify({ armor: 'Plate', weapon: 'Mace' }),
    },
  });

  const healerRole = await prisma.role.create({
    data: {
      activityId: activity1.id,
      name: 'Healer',
      slots: 2,
      attributes: JSON.stringify({ armor: 'Cloth', weapon: 'Holy' }),
    },
  });

  const dpsRole = await prisma.role.create({
    data: {
      activityId: activity1.id,
      name: 'DPS',
      slots: 5,
      attributes: JSON.stringify({ armor: 'Leather', weapon: 'Bow' }),
    },
  });

  const tankRole2 = await prisma.role.create({
    data: {
      activityId: activity2.id,
      name: 'Tank',
      slots: 2,
      attributes: JSON.stringify({ armor: 'Plate' }),
    },
  });

  const healerRole2 = await prisma.role.create({
    data: {
      activityId: activity2.id,
      name: 'Healer',
      slots: 3,
      attributes: JSON.stringify({ armor: 'Cloth' }),
    },
  });

  const dpsRole2 = await prisma.role.create({
    data: {
      activityId: activity2.id,
      name: 'DPS',
      slots: 10,
      attributes: JSON.stringify({ armor: 'Any' }),
    },
  });

  // Create signups
  console.log('✍️ Creating signups...');
  await prisma.signup.create({
    data: {
      activityId: activity1.id,
      roleId: tankRole.id,
      playerId: user1.id,
      attributes: JSON.stringify({ ip: 1300, fame: 60000 }),
      comment: 'Experienced tank, ready to go!',
    },
  });

  await prisma.signup.create({
    data: {
      activityId: activity1.id,
      roleId: healerRole.id,
      playerId: user2.id,
      attributes: JSON.stringify({ ip: 1250, fame: 55000 }),
      comment: 'Main healer',
    },
  });

  await prisma.signup.create({
    data: {
      activityId: activity2.id,
      roleId: dpsRole2.id,
      playerId: user3.id,
      attributes: JSON.stringify({ ip: 1100 }),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`   Created ${await prisma.user.count()} users`);
  console.log(`   Created ${await prisma.activity.count()} activities`);
  console.log(`   Created ${await prisma.role.count()} roles`);
  console.log(`   Created ${await prisma.signup.count()} signups`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
