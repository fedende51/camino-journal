const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@pilgrim.com' }
    });

    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email: test@pilgrim.com');
      console.log('Password: testpass123');
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@pilgrim.com',
        name: 'Test Pilgrim',
        hashedPassword,
        role: 'PILGRIM'
      }
    });

    console.log('Test user created successfully!');
    console.log('Email: test@pilgrim.com');
    console.log('Password: testpass123');
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();