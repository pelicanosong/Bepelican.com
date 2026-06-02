import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { eachDayOfInterval, format, getDay, addMonths, endOfMonth } from 'date-fns';

interface DayAvailability {
  date: Date;
  dateString: string;
  isAvailable: boolean;
  isValidDay: boolean; // day is in available_days
  remainingSpots: number;
  totalBooked: number;
}

// Map day index (0 = Sunday) to our weekday enum
const dayIndexToWeekday: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado'
};

export const useExperienceAvailability = (
  experienceId: string | undefined,
  availableDays: string[] | null,
  maxParticipants: number,
  monthsAhead: number = 3
) => {
  return useQuery({
    queryKey: ['experience-availability', experienceId, monthsAhead],
    queryFn: async () => {
      if (!experienceId) return [];

      // Get date range: today to X months ahead
      const today = new Date();
      const endDate = addMonths(endOfMonth(today), monthsAhead - 1);
      
      // Use RPC function to get aggregate availability data (protects individual booking details)
      const { data: bookings, error } = await supabase.rpc('get_experience_availability', {
        _experience_id: experienceId,
        _start_date: format(today, 'yyyy-MM-dd'),
        _end_date: format(endDate, 'yyyy-MM-dd')
      });

      if (error) throw error;

      // Group bookings by date
      const bookingsByDate = new Map<string, number>();
      (bookings || []).forEach((booking: { booking_date: string; booked_spots: number }) => {
        bookingsByDate.set(booking.booking_date, booking.booked_spots);
      });

      // Generate availability for each day
      const allDays = eachDayOfInterval({ start: today, end: endDate });
      const availableDaysSet = new Set(availableDays || []);

      const availability: DayAvailability[] = allDays.map((date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date);
        const weekday = dayIndexToWeekday[dayOfWeek];
        const isValidDay = availableDaysSet.has(weekday);
        const totalBooked = bookingsByDate.get(dateString) || 0;
        const remainingSpots = maxParticipants - totalBooked;
        const isAvailable = isValidDay && remainingSpots > 0;

        return {
          date,
          dateString,
          isAvailable,
          isValidDay,
          remainingSpots: Math.max(0, remainingSpots),
          totalBooked
        };
      });

      return availability;
    },
    enabled: !!experienceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to check availability for a specific date (includes blocked dates check)
export const useDateAvailability = (
  experienceId: string | undefined,
  date: string | undefined,
  availableDays: string[] | null,
  maxParticipants: number
) => {
  return useQuery({
    queryKey: ['date-availability', experienceId, date],
    queryFn: async () => {
      if (!experienceId || !date) return null;

      // Check if date is blocked
      const { data: blockedData } = await supabase
        .from('experience_blocked_dates' as any)
        .select('id')
        .eq('experience_id', experienceId)
        .eq('blocked_date', date)
        .maybeSingle();

      if (blockedData) {
        return {
          isAvailable: false,
          remainingSpots: 0,
          reason: 'date_blocked'
        };
      }

      // Check if day is valid
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = getDay(dateObj);
      const weekday = dayIndexToWeekday[dayOfWeek];
      const isValidDay = (availableDays || []).includes(weekday);

      if (!isValidDay) {
        return {
          isAvailable: false,
          remainingSpots: 0,
          reason: 'day_not_available'
        };
      }

      // Use RPC function to get aggregate availability for the specific date
      const { data: bookings, error } = await supabase.rpc('get_experience_availability', {
        _experience_id: experienceId,
        _start_date: date,
        _end_date: date
      });

      if (error) throw error;

      const totalBooked = bookings && bookings.length > 0 ? bookings[0].booked_spots : 0;
      const remainingSpots = maxParticipants - totalBooked;

      return {
        isAvailable: remainingSpots > 0,
        remainingSpots: Math.max(0, remainingSpots),
        totalBooked,
        reason: remainingSpots <= 0 ? 'fully_booked' : null
      };
    },
    enabled: !!experienceId && !!date,
  });
};