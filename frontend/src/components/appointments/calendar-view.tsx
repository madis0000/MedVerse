import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setHours,
  addDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';
import { AppointmentCard } from './appointment-card';

type CalendarViewMode = 'day' | 'week' | 'month';

interface CalendarViewProps {
  view: CalendarViewMode;
  selectedDate: Date;
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8am to 6pm
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function groupAppointmentsByDate(appointments: Appointment[]) {
  const map = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    const key = format(parseISO(apt.dateTime), 'yyyy-MM-dd');
    const list = map.get(key) || [];
    list.push(apt);
    map.set(key, list);
  }
  return map;
}

function getHourFromDateTime(dateTime: string): number {
  return parseISO(dateTime).getHours();
}

function getMinuteFromDateTime(dateTime: string): number {
  return parseISO(dateTime).getMinutes();
}

function getDurationInMinutes(appointment: Appointment): number {
  const start = parseISO(appointment.dateTime).getTime();
  const end = parseISO(appointment.endTime).getTime();
  const diff = (end - start) / 60000;
  return diff > 0 ? diff : 30; // fallback to 30min
}

// ---------- Month View ----------

function MonthView({
  selectedDate,
  appointments,
  onDateSelect,
  onAppointmentClick,
}: Omit<CalendarViewProps, 'view'>) {
  const { t } = useTranslation();
  const grouped = useMemo(() => groupAppointmentsByDate(appointments), [appointments]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [selectedDate]);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 bg-muted">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground border-b"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = grouped.get(dateKey) || [];
          const inCurrentMonth = isSameMonth(day, selectedDate);
          const today = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDateSelect(day)}
              className={cn(
                'relative min-h-[100px] border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50',
                !inCurrentMonth && 'bg-muted/30',
                isSelected && 'ring-2 ring-primary ring-inset',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  today && 'bg-primary text-primary-foreground',
                  !today && inCurrentMonth && 'text-foreground',
                  !today && !inCurrentMonth && 'text-muted-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              <div className="mt-1 space-y-0.5">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    compact
                    onClick={onAppointmentClick}
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <span className="block text-[10px] text-muted-foreground pl-1">
                    +{dayAppointments.length - 3} {t('common.more', 'more')}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Week View ----------

function WeekView({
  selectedDate,
  appointments,
  onDateSelect,
  onAppointmentClick,
}: Omit<CalendarViewProps, 'view'>) {
  const weekStart = startOfWeek(selectedDate);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const grouped = useMemo(() => groupAppointmentsByDate(appointments), [appointments]);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header with day labels */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted border-b">
        <div className="border-r" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDateSelect(day)}
              className={cn(
                'px-2 py-2 text-center border-r transition-colors hover:bg-accent/50',
                today && 'bg-primary/10',
              )}
            >
              <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
              <div
                className={cn(
                  'text-sm font-semibold',
                  today && 'text-primary',
                )}
              >
                {format(day, 'd')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto max-h-[600px]">
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            {/* Time label */}
            <div className="border-r border-b px-1 py-2 text-right">
              <span className="text-[10px] text-muted-foreground">
                {format(setHours(new Date(), hour), 'h a')}
              </span>
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = (grouped.get(dateKey) || []).filter(
                (apt) => getHourFromDateTime(apt.dateTime) === hour,
              );

              return (
                <div
                  key={`${dateKey}-${hour}`}
                  className="relative border-r border-b min-h-[60px] p-0.5"
                >
                  {dayAppointments.map((apt) => {
                    const mins = getMinuteFromDateTime(apt.dateTime);
                    const duration = getDurationInMinutes(apt);
                    const topOffset = (mins / 60) * 100;
                    const heightPct = Math.min((duration / 60) * 100, 100);

                    return (
                      <div
                        key={apt.id}
                        className="absolute left-0.5 right-0.5 z-10"
                        style={{
                          top: `${topOffset}%`,
                          height: `${heightPct}%`,
                          minHeight: '24px',
                        }}
                      >
                        <AppointmentCard
                          appointment={apt}
                          compact
                          onClick={onAppointmentClick}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Day View ----------

function DayView({
  selectedDate,
  appointments,
  onAppointmentClick,
}: Omit<CalendarViewProps, 'view' | 'onDateSelect'>) {
  const { t } = useTranslation();
  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const dayAppointments = useMemo(
    () =>
      appointments.filter(
        (apt) => format(parseISO(apt.dateTime), 'yyyy-MM-dd') === dateKey,
      ),
    [appointments, dateKey],
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day header */}
      <div className="bg-muted px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-foreground">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dayAppointments.length} {t('appointments.title', 'appointment')}{dayAppointments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Time slots */}
      <div className="overflow-y-auto max-h-[600px]">
        {HOURS.map((hour) => {
          const hourAppointments = dayAppointments.filter(
            (apt) => getHourFromDateTime(apt.dateTime) === hour,
          );

          return (
            <div
              key={hour}
              className="grid grid-cols-[80px_1fr] border-b min-h-[72px]"
            >
              {/* Time label */}
              <div className="border-r px-3 py-2 text-right">
                <span className="text-xs font-medium text-muted-foreground">
                  {format(setHours(new Date(), hour), 'h:mm a')}
                </span>
              </div>

              {/* Appointments */}
              <div className="p-1.5 space-y-1.5">
                {hourAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onClick={onAppointmentClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Main Export ----------

export function CalendarView({
  view,
  selectedDate,
  appointments,
  onDateSelect,
  onAppointmentClick,
}: CalendarViewProps) {
  switch (view) {
    case 'month':
      return (
        <MonthView
          selectedDate={selectedDate}
          appointments={appointments}
          onDateSelect={onDateSelect}
          onAppointmentClick={onAppointmentClick}
        />
      );
    case 'week':
      return (
        <WeekView
          selectedDate={selectedDate}
          appointments={appointments}
          onDateSelect={onDateSelect}
          onAppointmentClick={onAppointmentClick}
        />
      );
    case 'day':
      return (
        <DayView
          selectedDate={selectedDate}
          appointments={appointments}
          onAppointmentClick={onAppointmentClick}
        />
      );
    default:
      return null;
  }
}
