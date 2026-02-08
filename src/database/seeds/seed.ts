import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { Institution, InstitutionType, VerificationStatus } from '../../institutions/entities/institution.entity';

async function seed() {
  try {
    await dataSource.initialize();
    console.log('🔗 Database connected for seeding...');

    const userRepository = dataSource.getRepository(User);
    const institutionRepository = dataSource.getRepository(Institution);

    // Check if data already exists
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('⚠️  Database already has data. Skipping seed.');
      await dataSource.destroy();
      return;
    }

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const superAdmin = userRepository.create({
      email: 'super@neurobridge.edu',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });

    await userRepository.save(superAdmin);
    console.log('✅ Super Admin created: super@neurobridge.edu / demo123');

    // Create School Institution
    const school = institutionRepository.create({
      name: 'Oakwood Academy',
      type: InstitutionType.SCHOOL,
      email: 'admin@oakwood.edu',
      phoneNumber: '+27123456789',
      addressLine1: '123 Education Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
      verificationStatus: VerificationStatus.VERIFIED,
      specializations: ['ADHD Support', 'Autism Spectrum', 'Dyslexia'],
      supportNeeds: ['Speech Therapy', 'Occupational Therapy'],
      maxCapacity: 100,
      currentCapacity: 50,
      minAgeSupported: 6,
      maxAgeSupported: 18,
    });

    const savedSchool = await institutionRepository.save(school);
    console.log('✅ School created: Oakwood Academy');

    // Create School Admin
    const schoolAdmin = userRepository.create({
      email: 'school@oakwood.edu',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      institutionId: savedSchool.id,
    });

    await userRepository.save(schoolAdmin);
    console.log('✅ School Admin created: school@oakwood.edu / demo123');

    // Create Tutor Centre
    const tutorCentre = institutionRepository.create({
      name: 'Bright Horizons Tutoring',
      type: InstitutionType.TUTOR_CENTRE,
      email: 'admin@brighthorizons.edu',
      phoneNumber: '+27987654321',
      addressLine1: '456 Learning Avenue',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8002',
      country: 'South Africa',
      verificationStatus: VerificationStatus.VERIFIED,
      specializations: ['Reading Intervention', 'Math Support', 'Social Skills'],
      supportNeeds: ['Behavioral Support', 'Executive Function Coaching'],
      maxCapacity: 50,
      currentCapacity: 20,
      minAgeSupported: 7,
      maxAgeSupported: 16,
    });

    const savedTutorCentre = await institutionRepository.save(tutorCentre);
    console.log('✅ Tutor Centre created: Bright Horizons Tutoring');

    // Create Tutor Centre Admin
    const tutorAdmin = userRepository.create({
      email: 'tutor@brighthorizons.edu',
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Johnson',
      role: UserRole.TUTOR_CENTRE_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      institutionId: savedTutorCentre.id,
    });

    await userRepository.save(tutorAdmin);
    console.log('✅ Tutor Centre Admin created: tutor@brighthorizons.edu / demo123');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('Super Admin: super@neurobridge.edu / demo123');
    console.log('School Admin: school@oakwood.edu / demo123');
    console.log('Tutor Centre Admin: tutor@brighthorizons.edu / demo123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();