import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { CalendarView } from '@/components/appointments/calendar-view';
import { BookingDialog } from '@/components/appointments/booking-dialog';
import { AppointmentDetail } from '@/components/appointments/appointment-detail';
import { WaitingQueue } from '@/components/appointments/waiting-queue';
import { useCalendarAppointments } from '@/api/appointments';
import type { Appointment } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

function getDateRange(date: Date, view: ViewMode) {
  switch (view) {
    case 'month': {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return {
        startDate: format(startOfWeek(monthStart), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(monthEnd), 'yyyy-MM-dd'),
      };
    }
    case 'week': {
      const weekStart = startOfWeek(date);
      return {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
      };
    }
    case 'day':
      return {
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'),
      };
  }
}

function getTitle(date: Date, view: ViewMode): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week': {
      const ws = startOfWeek(date);
      const we = addDays(ws, 6);
      return `${format(ws, 'MMM d')} - ${format(we, 'MMM d, yyyy')}`;
    }
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
  }
}

function navigate(date: Date, view: ViewMode, direction: 1 | -1): Date {
  switch (view) {
    case 'month':
      return addMonths(date, direction);
    case 'week':
      return addWeeks(date, direction);
    case 'day':
      return addDays(date, direction);
  }
}

export function AppointmentCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const dateRange = useMemo(
    () => getDateRange(selectedDate, view),
    [selectedDate, view],
  );

  const { data, isLoading } = useCalendarAppointments(dateRange);

  const appointments: Appointment[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.data ?? [];
  }, [data]);

  const handlePrev = () => setSelectedDate((d) => navigate(d, view, -1));
  const handleNext = () => setSelectedDate((d) => navigate(d, view, 1));
  const handleToday = () => setSelectedDate(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (view === 'month') {
      setView('day');
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseDetail = () => {
    setSelectedAppointment(null);
  };

  return (
    <PageWrapper
      title="Appointments"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Appointments' },
      ]}
      actions={
        <Button onClick={() => setBookingOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      }
    >
      <div className="flex gap-6">
        {/* Main calendar area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <h2 className="text-lg font-semibold text-foreground ml-2">
                {getTitle(selectedDate, view)}
              </h2>
            </div>

            <Tabs
              value={view}
              onValueChange={(v) => setView(v as ViewMode)}
            >
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar / Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/30">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Calendar className="h-8 w-8 animate-pulse" />
                <p className="text-sm">Loading appointments...</p>
              </div>
            </div>
          ) : (
            <CalendarView
              view={view}
              selectedDate={selectedDate}
              appointments={appointments}
              onDateSelect={handleDateSelect}
              onAppointmentClick={handleAppointmentClick}
            />
          )}

          {/* Appointment Detail Panel */}
          {selectedAppointment && (
            <div className="mt-4">
              <AppointmentDetail
                appointment={selectedAppointment}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>

        {/* Sidebar: Waiting Queue */}
        <div className="hidden lg:block w-80 shrink-0">
          <WaitingQueue />
        </div>
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        defaultDate={selectedDate}
      />
    </PageWrapper>
  );
}
