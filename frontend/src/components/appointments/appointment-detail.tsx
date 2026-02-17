import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './status-badge';
import { useUpdateAppointmentStatus, useCheckIn } from '@/api/appointments';
import type { Appointment } from '@/types';

const VISIT_TYPE_KEYS: Record<string, string> = {
  FIRST_VISIT: 'appointments.types.NEW_VISIT',
  FOLLOW_UP: 'appointments.types.FOLLOW_UP',
  EMERGENCY: 'appointments.types.URGENT',
  PROCEDURE: 'appointments.types.PROCEDURE',
  TELECONSULTATION: 'appointments.types.CONSULTATION',
};

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose?: () => void;
}

export function AppointmentDetail({ appointment, onClose }: AppointmentDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const updateStatus = useUpdateAppointmentStatus();
  const checkIn = useCheckIn();

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : t('appointments.unknownPatient', 'Unknown Patient');

  const doctorName = appointment.doctor
    ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
    : t('appointments.unknownDoctor', 'Unknown Doctor');

  const specialtyName = appointment.specialty?.name || t('appointments.general', 'General');

  const handleCheckIn = () => {
    checkIn.mutate(appointment.id, {
      onSuccess: () => onClose?.(),
    });
  };

  const handleStartConsultation = () => {
    navigate(`/consultations/${appointment.id}`);
  };

  const handleMarkNoShow = () => {
    updateStatus.mutate(
      { id: appointment.id, status: 'NO_SHOW' },
      { onSuccess: () => onClose?.() },
    );
  };

  const handleCancel = () => {
    updateStatus.mutate(
      { id: appointment.id, status: 'CANCELLED' },
      { onSuccess: () => onClose?.() },
    );
  };

  const isLoading = updateStatus.isPending || checkIn.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('appointments.details', 'Appointment Details')}</CardTitle>
          <StatusBadge status={appointment.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{patientName}</p>
            {appointment.patient?.mrn && (
              <p className="text-xs text-muted-foreground">
                {t('common.mrn', 'MRN')}: {appointment.patient.mrn}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Doctor & Specialty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('appointments.doctor', 'Doctor')}</p>
            <p className="text-sm font-medium">{doctorName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('appointments.specialty', 'Specialty')}</p>
            <p className="text-sm font-medium">{specialtyName}</p>
          </div>
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('common.date', 'Date')}</p>
              <p className="text-sm font-medium">
                {format(parseISO(appointment.dateTime), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('common.time', 'Time')}</p>
              <p className="text-sm font-medium">
                {format(parseISO(appointment.dateTime), 'h:mm a')} -{' '}
                {format(parseISO(appointment.endTime), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Visit Type */}
        <div>
          <p className="text-xs text-muted-foreground">{t('appointments.visitType', 'Visit Type')}</p>
          <p className="text-sm font-medium">
            {VISIT_TYPE_KEYS[appointment.visitType]
              ? t(VISIT_TYPE_KEYS[appointment.visitType])
              : appointment.visitType}
          </p>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('appointments.notes', 'Notes')}</p>
            <p className="text-sm text-foreground bg-muted rounded-md p-2.5">
              {appointment.notes}
            </p>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {appointment.status === 'SCHEDULED' && (
            <>
              <Button
                size="sm"
                onClick={handleCheckIn}
                disabled={isLoading}
              >
                {checkIn.isPending
                  ? t('appointments.checkingIn', 'Checking In...')
                  : t('appointments.checkIn', 'Check In')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {t('appointments.cancelAppointment', 'Cancel')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkNoShow}
                disabled={isLoading}
              >
                {t('appointments.markNoShow', 'Mark No Show')}
              </Button>
            </>
          )}

          {appointment.status === 'CHECKED_IN' && (
            <>
              <Button
                size="sm"
                onClick={handleStartConsultation}
                disabled={isLoading}
              >
                {t('appointments.queue.startConsultation', 'Start Consultation')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkNoShow}
                disabled={isLoading}
              >
                {t('appointments.markNoShow', 'Mark No Show')}
              </Button>
            </>
          )}

          {appointment.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              onClick={handleStartConsultation}
            >
              {t('appointments.continueConsultation', 'Continue Consultation')}
            </Button>
          )}

          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
