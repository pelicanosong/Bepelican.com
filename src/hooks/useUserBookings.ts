import { useQuery } from '@tanstack/react-query';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserBooking {
  id: string;
  booking_date: string;
  participants: number;
  status: string;
  experience: {
    title: string;
    slug: string;
    cover_image: string | null;
  };
  order: {
    id: string;
    status: string;
    total_amount: number;
  };
  paymentReference: string | null;
}

export const useUserBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user) return { upcoming: [] as UserBooking[], history: [] as UserBooking[] };

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount')
        .eq('user_id', user.id);

      if (ordersError) throw ordersError;
      if (!orders?.length) return { upcoming: [], history: [] };

      const orderMap = new Map(orders.map((o) => [o.id, o]));
      const orderIds = orders.map((o) => o.id);

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, experience_id, experiences(title, slug, cover_image)')
        .in('order_id', orderIds)
        .not('experience_id', 'is', null);

      if (itemsError) throw itemsError;
      if (!items?.length) return { upcoming: [], history: [] };

      const itemMap = new Map(items.map((i) => [i.id, i]));
      const itemIds = items.map((i) => i.id);

      const { data: bookings, error: bookingsError } = await supabase
        .from('experience_bookings')
        .select('*')
        .in('order_item_id', itemIds)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      const { data: payments } = await supabase
        .from('payments')
        .select('order_id, provider_reference')
        .in('order_id', orderIds);

      const paymentMap = new Map((payments || []).map((p) => [p.order_id, p.provider_reference]));
      const today = startOfDay(new Date());

      const allBookings: UserBooking[] = (bookings || [])
        .map((b) => {
          const item = itemMap.get(b.order_item_id);
          if (!item) return null;
          const order = orderMap.get(item.order_id);
          if (!order) return null;
          const exp = item.experiences as { title: string; slug: string; cover_image: string | null } | null;
          if (!exp) return null;

          return {
            id: b.id,
            booking_date: b.booking_date,
            participants: b.participants,
            status: b.status,
            experience: exp,
            order: {
              id: order.id,
              status: order.status,
              total_amount: Number(order.total_amount),
            },
            paymentReference: paymentMap.get(order.id) || null,
          };
        })
        .filter(Boolean) as UserBooking[];

      const upcoming = allBookings.filter(
        (b) =>
          b.status === 'confirmed' &&
          b.order.status !== 'cancelled' &&
          !isBefore(parseISO(b.booking_date), today)
      );

      const history = allBookings.filter(
        (b) =>
          b.order.status === 'cancelled' ||
          b.status !== 'confirmed' ||
          isBefore(parseISO(b.booking_date), today)
      );

      return { upcoming, history };
    },
    enabled: !!user,
  });
};
