import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

interface DailyData {
  date: Date;
  amount: number;
  patientEffective: number;
  newPatients: number;
  totalPatients: number;
}

// Month columns mapping (0-indexed)
const MONTH_COLUMNS: Record<string, number> = {
  January: 1,
  February: 8,
  March: 15,
  April: 22,
  May: 29,
  June: 36,
  July: 43,
  August: 50,
  September: 57,
  October: 64,
  November: 71,
  December: 78,
};

const MONTH_NUMBERS: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

function parseSheet(
  sheet: XLSX.WorkSheet,
  year: number,
): DailyData[] {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const results: DailyData[] = [];

  // Start from row 4 (index 4) where data begins
  for (let rowIdx = 4; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    if (!row || row.length === 0) continue;

    // Process each month
    for (const [monthName, startCol] of Object.entries(MONTH_COLUMNS)) {
      const dayNum = row[startCol + 1]; // Day number column
      const amount = row[startCol + 2]; // Amount column
      const patEff = row[startCol + 3]; // Patient Effective column
      const newPat = row[startCol + 4]; // New Patients column
      const totalPat = row[startCol + 5]; // Total Patients column

      // Skip if no valid day number or no amount
      if (
        typeof dayNum !== 'number' ||
        dayNum < 1 ||
        dayNum > 31 ||
        (amount === undefined && patEff === undefined)
      ) {
        continue;
      }

      const monthNum = MONTH_NUMBERS[monthName];
      const date = new Date(year, monthNum, dayNum);

      // Validate date
      if (isNaN(date.getTime()) || date.getMonth() !== monthNum) {
        continue;
      }

      results.push({
        date,
        amount: typeof amount === 'number' ? amount : 0,
        patientEffective: typeof patEff === 'number' ? patEff : 0,
        newPatients: typeof newPat === 'number' ? newPat : 0,
        totalPatients: typeof totalPat === 'number' ? totalPat : 0,
      });
    }
  }

  return results;
}

async function main() {
  console.log('Starting Excel data seed...');

  const filePath = path.resolve(__dirname, '../../Data/DataToSeed.xlsx');
  console.log('Reading Excel file:', filePath);

  const workbook = XLSX.readFile(filePath);
  console.log('Found sheets:', workbook.SheetNames);

  let totalRecords = 0;
  let skippedRecords = 0;

  // Get or create admin user for closedBy reference
  let adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (!adminUser) {
    console.log('No admin user found, creating one...');
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@medpulse.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
  }

  for (const sheetName of workbook.SheetNames) {
    const year = parseInt(sheetName, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      console.log(`Skipping sheet: ${sheetName} (not a valid year)`);
      continue;
    }

    console.log(`\nProcessing year: ${year}`);
    const sheet = workbook.Sheets[sheetName];
    const dailyData = parseSheet(sheet, year);
    console.log(`Found ${dailyData.length} daily records for ${year}`);

    for (const record of dailyData) {
      try {
        // Check if record already exists
        const existing = await prisma.dailyClosing.findUnique({
          where: { date: record.date },
        });

        if (existing) {
          skippedRecords++;
          continue;
        }

        // Calculate estimated payment breakdown (assume 60% cash, 25% card, 15% insurance)
        const cashAmount = record.amount * 0.6;
        const cardAmount = record.amount * 0.25;
        const insuranceAmount = record.amount * 0.15;

        await prisma.dailyClosing.create({
          data: {
            date: record.date,
            status: 'CLOSED',
            expectedCash: cashAmount,
            actualCash: cashAmount,
            expectedCard: cardAmount,
            actualCard: cardAmount,
            expectedInsurance: insuranceAmount,
            actualInsurance: insuranceAmount,
            expectedBankTransfer: 0,
            actualBankTransfer: 0,
            varianceCash: 0,
            varianceTotal: 0,
            invoiceCount: record.totalPatients,
            paymentCount: record.patientEffective,
            consultationCount: record.totalPatients,
            notes: `Imported from Excel - New patients: ${record.newPatients}`,
            closedById: adminUser.id,
            closedAt: record.date,
          },
        });

        totalRecords++;
      } catch (error) {
        console.error(`Error inserting record for ${record.date}:`, error);
        skippedRecords++;
      }
    }

    console.log(`Imported ${totalRecords} records so far, skipped ${skippedRecords}`);
  }

  console.log('\n=== Seed completed ===');
  console.log(`Total records imported: ${totalRecords}`);
  console.log(`Records skipped (duplicates): ${skippedRecords}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
