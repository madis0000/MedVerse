import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { LaboratoryModule } from './laboratory/laboratory.module';
import { BillingModule } from './billing/billing.module';
import { DocumentsModule } from './documents/documents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    SpecialtiesModule,
    ConsultationsModule,
    PrescriptionsModule,
    LaboratoryModule,
    BillingModule,
    DocumentsModule,
    DashboardModule,
    SettingsModule,
    NotificationsModule,
    FinanceModule,
  ],
})
export class AppModule {}
