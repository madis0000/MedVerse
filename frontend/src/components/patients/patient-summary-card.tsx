import { Phone, Mail, MapPin, AlertCircle, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatDate } from '@/lib/utils';
import type { Patient } from '@/types';

interface PatientSummaryCardProps {
  patient: Patient;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  REFERRED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DISCHARGED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const bloodTypeLabels: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  UNKNOWN: 'Unknown',
};

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function PatientSummaryCard({ patient }: PatientSummaryCardProps) {
  const age = calculateAge(patient.dob);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Avatar className="h-20 w-20">
              {patient.photo && <AvatarImage src={patient.photo} alt={patient.firstName} />}
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(patient.firstName, patient.lastName)}
              </AvatarFallback>
            </Avatar>
            <Badge className={statusColors[patient.status] || ''} variant="secondary">
              {patient.status}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  MRN: {patient.mrn} | {patient.gender} | {age} years old
                  {' '}({formatDate(patient.dob)})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {patient.bloodType && patient.bloodType !== 'UNKNOWN' && (
                  <span className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm font-medium">
                    <Heart className="h-3.5 w-3.5 text-red-500" />
                    {bloodTypeLabels[patient.bloodType] || patient.bloodType}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {(patient.address || patient.city) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {[patient.address, patient.city, patient.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {(patient.emergencyContactName || patient.insuranceProvider) && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patient.emergencyContactName && (
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Emergency Contact</p>
                      <p className="text-muted-foreground">
                        {patient.emergencyContactName}
                        {patient.emergencyContactPhone && ` - ${patient.emergencyContactPhone}`}
                      </p>
                    </div>
                  </div>
                )}
                {patient.insuranceProvider && (
                  <div className="flex items-start gap-2 text-sm">
                    <div className="h-4 w-4 shrink-0 mt-0.5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      i
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Insurance</p>
                      <p className="text-muted-foreground">
                        {patient.insuranceProvider}
                        {patient.insuranceNumber && ` (#${patient.insuranceNumber})`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
