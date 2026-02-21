import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('demo123456', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@moveimprove.local' },
    update: {},
    create: {
      email: 'admin@moveimprove.local',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin created:', {
    email: admin.email,
    password: 'demo123456',
  });

  // Create initial questionnaire version
  const version = await prisma.questionnaireVersion.create({
    data: {
      version: 1,
      isActive: true,
      createdBy: admin.id,
      description: 'Initial version with sample questions',
    },
  });

  console.log('✅ Version created:', version.version);

  // Create categories
  const motivationCat = await prisma.category.create({
    data: {
      versionId: version.id,
      name: 'motivation',
      label: 'Motivation & Life Stage',
      description: 'Career, family, and personal drivers',
      defaultWeight: 1.0,
      sortOrder: 1,
    },
  });

  const financialCat = await prisma.category.create({
    data: {
      versionId: version.id,
      name: 'financial',
      label: 'Financial Considerations',
      description: 'Cost, income, and economic factors',
      defaultWeight: 1.2,
      sortOrder: 2,
    },
  });

  const locationCat = await prisma.category.create({
    data: {
      versionId: version.id,
      name: 'location',
      label: 'Location & Environment',
      description: 'Climate, community, lifestyle',
      defaultWeight: 1.0,
      sortOrder: 3,
    },
  });

  console.log('✅ Categories created');

  // Create sample questions
  const q1 = await prisma.question.create({
    data: {
      versionId: version.id,
      categoryId: motivationCat.id,
      text: 'How satisfied are you with your current job/career?',
      type: 'SCALE',
      scaleMin: 1,
      scaleMax: 10,
      scaleLabels: {
        '1': 'Very Dissatisfied',
        '10': 'Very Satisfied',
      },
      allowNA: true,
      sortOrder: 1,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      versionId: version.id,
      categoryId: locationCat.id,
      text: 'How satisfied are you with your current location?',
      type: 'SCALE',
      scaleMin: 1,
      scaleMax: 10,
      allowNA: true,
      sortOrder: 2,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      versionId: version.id,
      categoryId: financialCat.id,
      text: 'How would you rate your current financial situation?',
      type: 'SCALE',
      scaleMin: 1,
      scaleMax: 10,
      allowNA: true,
      sortOrder: 3,
    },
  });

  const q4 = await prisma.question.create({
    data: {
      versionId: version.id,
      categoryId: motivationCat.id,
      text: 'Are you planning to move in the next 2 years?',
      type: 'YESNO',
      allowNA: true,
      sortOrder: 4,
    },
  });

  console.log('✅ Questions created');

  // Create scoring for questions
  await prisma.questionScoring.create({
    data: {
      questionId: q1.id,
      improveWeight: 1.0,
      moveWeight: -1.0,
      multiplier: 1.0,
      reverseScored: false,
    },
  });

  await prisma.questionScoring.create({
    data: {
      questionId: q2.id,
      improveWeight: 1.0,
      moveWeight: -1.0,
      multiplier: 1.0,
      reverseScored: false,
    },
  });

  await prisma.questionScoring.create({
    data: {
      questionId: q3.id,
      improveWeight: 1.0,
      moveWeight: -1.0,
      multiplier: 1.0,
      reverseScored: false,
    },
  });

  await prisma.questionScoring.create({
    data: {
      questionId: q4.id,
      improveWeight: 1.0,
      moveWeight: -1.0,
      multiplier: 1.0,
      reverseScored: false,
    },
  });

  console.log('✅ Question scoring created');

  // Create scoring config
  await prisma.scoringConfig.create({
    data: {
      versionId: version.id,
      equalWeighting: true,
      neutralZoneMin: -0.75,
      neutralZoneMax: 0.75,
      strongLeanThreshold: 1.5,
      moderateLeanThreshold: 0.75,
      slightLeanThreshold: 0.3,
      naHandling: 'EXCLUDE_FROM_DENOMINATOR',
    },
  });

  console.log('✅ Scoring config created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Admin Credentials:');
  console.log('   Email: admin@moveimprove.local');
  console.log('   Password: demo123456');
  console.log('\n🚀 Start the server with: npm run dev');
  console.log('   Then visit http://localhost:3000/admin/login');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
