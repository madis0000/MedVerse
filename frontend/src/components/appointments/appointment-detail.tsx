import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './status-badge';
import { useUpdateAppointmentStatus, useCheckIn } from '@/api/appointments';
import type { Appointment } from '@/types';

const VISIT_TYPE_LABELS: Record<string, string> = {
  FIRST_VISIT: 'First Visit',
  FOLLOW_UP: 'Follow-up',
  EMERGENCY: 'Emergency',
  PROCEDURE: 'Procedure',
  TELECONSULTATION: 'Teleconsultation',
};

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose?: () => void;
}

export function AppointmentDetail({ appointment, onClose }: AppointmentDetailProps) {
  const navigate = useNavigate();
  const updateStatus = useUpdateAppointmentStatus();
  const checkIn = useCheckIn();

  const patientName = appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : 'Unknown Patient';

  const doctorName = appointment.doctor
    ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
    : 'Unknown Doctor';

  const specialtyName = appointment.specialty?.name || 'General';

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
          <CardTitle className="text-lg">Appointment Details</CardTitle>
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
                MRN: {appointment.patient.mrn}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Doctor & Specialty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Doctor</p>
            <p className="text-sm font-medium">{doctorName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Specialty</p>
            <p className="text-sm font-medium">{specialtyName}</p>
          </div>
        </div>

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">
                {format(parseISO(appointment.dateTime), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-medium">
                {format(parseISO(appointment.dateTime), 'h:mm a')} -{' '}
                {format(parseISO(appointment.endTime), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Visit Type */}
        <div>
          <p className="text-xs text-muted-foreground">Visit Type</p>
          <p className="text-sm font-medium">
            {VISIT_TYPE_LABELS[appointment.visitType] || appointment.visitType}
          </p>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
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
                {checkIn.isPending ? 'Checking In...' : 'Check In'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkNoShow}
                disabled={isLoading}
              >
                Mark No Show
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
                Start Consultation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkNoShow}
                disabled={isLoading}
              >
                Mark No Show
              </Button>
            </>
          )}

          {appointment.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              onClick={handleStartConsultation}
            >
              Continue Consultation
            </Button>
          )}

          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
