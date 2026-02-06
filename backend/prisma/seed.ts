import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { icd10Codes } from './seed-data/icd10-codes';
import { medications } from './seed-data/medications';
import { labTests } from './seed-data/lab-tests';
import {
  specialties,
  defaultServicePrices,
  defaultClinicSettings,
  defaultTemplates,
} from './seed-data/specialties';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Check if already seeded
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@medpulse.com' },
  });

  if (existingAdmin) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  // Seed Specialties
  console.log('Seeding specialties...');
  const specialtyMap: Record<string, string> = {};
  for (const spec of specialties) {
    const created = await prisma.specialty.create({
      data: {
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        isActive: true,
      },
    });
    specialtyMap[spec.name] = created.id;

    // Create specialty fields
    for (const field of spec.fields) {
      await prisma.specialtyField.create({
        data: {
          specialtyId: created.id,
          fieldName: field.fieldName,
          fieldType: field.fieldType as any,
          options: field.options ? field.options : undefined,
          isRequired: field.isRequired,
          sortOrder: field.sortOrder,
        },
      });
    }
  }

  // Seed Users
  console.log('Seeding users...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@medpulse.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+1 (555) 000-0001',
      isActive: true,
    },
  });

  const drSmith = await prisma.user.create({
    data: {
      email: 'dr.smith@medpulse.com',
      password: doctorPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'DOCTOR',
      specialtyId: specialtyMap['Cardiology'],
      phone: '+1 (555) 000-0002',
      isActive: true,
    },
  });

  const drJones = await prisma.user.create({
    data: {
      email: 'dr.jones@medpulse.com',
      password: doctorPassword,
      firstName: 'Sarah',
      lastName: 'Jones',
      role: 'DOCTOR',
      specialtyId: specialtyMap['General Medicine'],
      phone: '+1 (555) 000-0003',
      isActive: true,
    },
  });

  const drPatel = await prisma.user.create({
    data: {
      email: 'dr.patel@medpulse.com',
      password: doctorPassword,
      firstName: 'Raj',
      lastName: 'Patel',
      role: 'DOCTOR',
      specialtyId: specialtyMap['Psychiatry'],
      phone: '+1 (555) 000-0004',
      isActive: true,
    },
  });

  const drWilson = await prisma.user.create({
    data: {
      email: 'dr.wilson@medpulse.com',
      password: doctorPassword,
      firstName: 'Emily',
      lastName: 'Wilson',
      role: 'DOCTOR',
      specialtyId: specialtyMap['Pediatrics'],
      phone: '+1 (555) 000-0005',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'nurse.johnson@medpulse.com',
      password: staffPassword,
      firstName: 'Mary',
      lastName: 'Johnson',
      role: 'NURSE',
      phone: '+1 (555) 000-0010',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'reception@medpulse.com',
      password: staffPassword,
      firstName: 'Lisa',
      lastName: 'Brown',
      role: 'RECEPTIONIST',
      phone: '+1 (555) 000-0020',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'lab@medpulse.com',
      password: staffPassword,
      firstName: 'Mike',
      lastName: 'Davis',
      role: 'LAB_TECH',
      phone: '+1 (555) 000-0030',
      isActive: true,
    },
  });

  // Seed ICD-10 Codes
  console.log('Seeding ICD-10 codes...');
  for (const code of icd10Codes) {
    await prisma.iCD10Code.create({
      data: {
        code: code.code,
        description: code.description,
        category: code.category,
      },
    });
  }

  // Seed Medications
  console.log('Seeding medications...');
  for (const med of medications) {
    await prisma.medication.create({
      data: {
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        form: med.form,
        strengths: med.strengths,
        contraindications: med.contraindications,
        sideEffects: med.sideEffects,
        isActive: true,
      },
    });
  }

  // Seed Lab Tests
  console.log('Seeding lab test definitions...');
  for (const test of labTests) {
    await prisma.labTestDefinition.create({
      data: {
        name: test.name,
        category: test.category,
        unit: test.unit,
        normalRangeMin: test.normalRangeMin,
        normalRangeMax: test.normalRangeMax,
        normalRangeText: test.normalRangeText,
        sampleType: test.sampleType,
        isActive: true,
      },
    });
  }

  // Seed Default Templates
  console.log('Seeding consultation templates...');
  for (const template of defaultTemplates) {
    const specId = specialtyMap[template.specialtyName];
    if (specId) {
      await prisma.consultationTemplate.create({
        data: {
          name: template.name,
          specialtyId: specId,
          fields: template.fields,
          isDefault: template.isDefault,
          isActive: true,
        },
      });
    }
  }

  // Seed Service Prices
  console.log('Seeding service prices...');
  for (const price of defaultServicePrices) {
    const specId = price.specialtyName ? specialtyMap[price.specialtyName] : null;
    await prisma.servicePrice.create({
      data: {
        name: price.name,
        category: price.category,
        price: price.price,
        specialtyId: specId,
        isActive: true,
      },
    });
  }

  // Seed Clinic Settings
  console.log('Seeding clinic settings...');
  for (const setting of defaultClinicSettings) {
    await prisma.clinicSetting.create({
      data: {
        key: setting.key,
        value: setting.value,
        group: setting.group,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
