import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { useCreateAppointment } from '@/api/appointments';
import type { Patient, User, Specialty, VisitType } from '@/types';

const VISIT_TYPES: { value: VisitType; label: string }[] = [
  { value: 'FIRST_VISIT', label: 'First Visit' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'PROCEDURE', label: 'Procedure' },
  { value: 'TELECONSULTATION', label: 'Teleconsultation' },
];

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8; // 8:00 to 17:30
  const min = i % 2 === 0 ? '00' : '30';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return {
    value: `${String(hour).padStart(2, '0')}:${min}`,
    label: `${displayHour}:${min} ${ampm}`,
  };
});

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

export function BookingDialog({ open, onOpenChange, defaultDate }: BookingDialogProps) {
  const createAppointment = useCreateAppointment();

  // Form state
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);

  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<User[]>([]);

  const [specialtyId, setSpecialtyId] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [date, setDate] = useState<Date | undefined>(defaultDate || new Date());
  const [timeSlot, setTimeSlot] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('FOLLOW_UP');
  const [notes, setNotes] = useState('');

  const [conflictWarning, setConflictWarning] = useState('');
  const [error, setError] = useState('');

  // Load specialties and doctors on open
  useEffect(() => {
    if (!open) return;

    apiClient.get('/specialties').then(({ data }) => {
      const list = Array.isArray(data) ? data : data.data ?? [];
      setSpecialties(list);
    }).catch(() => {});

    apiClient.get('/users', { params: { role: 'DOCTOR' } }).then(({ data }) => {
      const list = Array.isArray(data) ? data : data.data ?? [];
      setDoctors(list);
    }).catch(() => {});
  }, [open]);

  // Search patients with debounce
  const searchPatients = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setPatientResults([]);
        return;
      }
      try {
        const { data } = await apiClient.get('/patients', {
          params: { search: query, limit: 10 },
        });
        const list = Array.isArray(data) ? data : data.data ?? [];
        setPatientResults(list);
      } catch {
        setPatientResults([]);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  // Check for conflicts when doctor, date, or time changes
  useEffect(() => {
    if (!doctorId || !date || !timeSlot) {
      setConflictWarning('');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    apiClient
      .get('/appointments/calendar', {
        params: { doctorId, startDate: dateStr, endDate: dateStr },
      })
      .then(({ data }) => {
        const list: any[] = Array.isArray(data) ? data : data.data ?? [];
        const conflict = list.some((apt: any) => {
          const aptTime = apt.dateTime?.substring(11, 16);
          return aptTime === timeSlot;
        });
        setConflictWarning(
          conflict
            ? 'This doctor already has an appointment at the selected time.'
            : '',
        );
      })
      .catch(() => {});
  }, [doctorId, date, timeSlot]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setPatientId('');
      setPatientSearch('');
      setPatientResults([]);
      setSelectedPatient(null);
      setDoctorId('');
      setSpecialtyId('');
      setDate(defaultDate || new Date());
      setTimeSlot('');
      setVisitType('FOLLOW_UP');
      setNotes('');
      setConflictWarning('');
      setError('');
    }
  }, [open, defaultDate]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientId(patient.id);
    setPatientSearch(`${patient.firstName} ${patient.lastName} (${patient.mrn})`);
    setPatientPopoverOpen(false);
  };

  const handleSubmit = async () => {
    setError('');

    if (!patientId || !doctorId || !date || !timeSlot || !visitType) {
      setError('Please fill in all required fields.');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const dateTime = `${dateStr}T${timeSlot}:00`;

    // Calculate endTime as 30 min after start
    const [h, m] = timeSlot.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const endTime = `${dateStr}T${endH}:${endM}:00`;

    try {
      await createAppointment.mutateAsync({
        patientId,
        doctorId,
        specialtyId: specialtyId || undefined,
        dateTime,
        endTime,
        visitType,
        notes: notes || undefined,
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create appointment. Please try again.',
      );
    }
  };

  const filteredDoctors = specialtyId
    ? doctors.filter((d) => d.specialtyId === specialtyId)
    : doctors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientPopoverOpen}
                  className="w-full justify-start font-normal"
                >
                  {selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.mrn})`
                    : 'Search patient by name or MRN...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type patient name or MRN..."
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {patientSearch.length < 2
                        ? 'Type at least 2 characters to search...'
                        : 'No patients found.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {patientResults.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={patient.id}
                          onSelect={() => handleSelectPatient(patient)}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {patient.firstName} {patient.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              MRN: {patient.mrn}
                              {patient.phone ? ` | ${patient.phone}` : ''}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <Label>Specialty</Label>
            <Select value={specialtyId} onValueChange={setSpecialtyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((spec) => (
                  <SelectItem key={spec.id} value={spec.id}>
                    {spec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor */}
          <div className="space-y-2">
            <Label>Doctor *</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {filteredDoctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    Dr. {doc.firstName} {doc.lastName}
                    {doc.specialty ? ` (${doc.specialty.name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot */}
          <div className="space-y-2">
            <Label>Time *</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <Label>Visit Type *</Label>
            <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select visit type" />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((vt) => (
                  <SelectItem key={vt.value} value={vt.value}>
                    {vt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Conflict Warning */}
          {conflictWarning && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400">
              {conflictWarning}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAppointment.isPending}
          >
            {createAppointment.isPending ? 'Booking...' : 'Book Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
