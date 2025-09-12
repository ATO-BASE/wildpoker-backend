import { Tournament, User, sequelize } from '../models';
import bcrypt from 'bcryptjs';

async function createSampleTournament() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if tournament with ID 1 already exists
    const existingTournament = await Tournament.findByPk(1);
    if (existingTournament) {
      console.log('✅ Tournament with ID 1 already exists');
      console.log('Tournament:', existingTournament.toJSON());
      return;
    }

    // Find the first admin user or create one
    let adminUser = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminUser) {
      console.log('⚠️ No admin user found, creating one...');
      const passwordHash = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        firstName: 'Admin',
        email: 'admin@wildpoker.com',
        password: 'admin123',
        passwordHash: passwordHash,
        role: 'admin',
        balance: '1000.00',
        country: 'US',
        avatar: '',
        status: 'active',
        isEmailVerified: true
      });
      console.log('✅ Admin user created');
    }

    // Create sample tournament
    const tournament = await Tournament.create({
      id: 1, // Force ID to be 1
      name: 'Sample Wild Poker Tournament',
      banner: '',
      theme: 'Classic',
      status: 'registering',
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      entryFee: '10.00',
      pool: '0.00',
      startingStack: 10000,
      maxPlayers: 32,
      lateRegMin: 15,
      duration: 2, // 2 hours
      repeat: 'none',
      prizeStructure: [
        { place: 1, pct: 50 },
        { place: 2, pct: 30 },
        { place: 3, pct: 20 }
      ],
      createdBy: adminUser.id
    });

    console.log('✅ Sample tournament created successfully!');
    console.log('Tournament ID:', tournament.id);
    console.log('Tournament Name:', tournament.name);
    console.log('Created By:', adminUser.username);

  } catch (error) {
    console.error('❌ Error creating sample tournament:', error);
  } finally {
    await sequelize.close();
  }
}

createSampleTournament();
