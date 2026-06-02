import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicLodgingOption {
  id: string;
  lodging_id: string;
  room_type_id: string | null;
  is_default_option: boolean;
  lodging: {
    id: string;
    name: string;
    lodging_type: string;
    city: string;
    short_description: string | null;
    main_image_url: string | null;
  };
  room_type: {
    id: string;
    name: string;
    short_description: string | null;
    capacity: number;
    base_price: number;
    main_image_url: string | null;
  } | null;
}

export const usePublicExperienceLodgings = (experienceId?: string) => {
  return useQuery({
    queryKey: ['public-experience-lodgings', experienceId],
    queryFn: async () => {
      if (!experienceId) return [];

      // Get links
      const { data: links, error } = await supabase
        .from('experience_lodgings')
        .select('*')
        .eq('experience_id', experienceId)
        .eq('is_active', true)
        .order('is_default_option', { ascending: false });

      if (error) throw error;
      if (!links || links.length === 0) return [];

      // Get unique lodging ids
      const lodgingIds = [...new Set(links.map(l => l.lodging_id))];
      const { data: lodgings } = await supabase
        .from('lodgings')
        .select('id, name, lodging_type, city, short_description, main_image_url')
        .in('id', lodgingIds)
        .eq('is_active', true);

      // Get room types: specific ones referenced + all for lodgings with null room_type_id
      const specificRtIds = links.map(l => l.room_type_id).filter(Boolean) as string[];
      const lodgingsWithAllRooms = links.filter(l => !l.room_type_id).map(l => l.lodging_id);

      let roomTypes: any[] = [];

      if (specificRtIds.length > 0) {
        const { data: rts } = await supabase
          .from('lodging_room_types')
          .select('id, name, short_description, capacity, base_price, main_image_url')
          .in('id', specificRtIds)
          .eq('is_active', true);
        roomTypes = rts || [];
      }

      // For links with "all rooms", fetch all active room types for those lodgings
      let allRoomsByLodging: Record<string, any[]> = {};
      if (lodgingsWithAllRooms.length > 0) {
        const { data: allRts } = await supabase
          .from('lodging_room_types')
          .select('id, name, short_description, capacity, base_price, main_image_url, lodging_id')
          .in('lodging_id', lodgingsWithAllRooms)
          .eq('is_active', true);
        (allRts || []).forEach(rt => {
          if (!allRoomsByLodging[rt.lodging_id]) allRoomsByLodging[rt.lodging_id] = [];
          allRoomsByLodging[rt.lodging_id].push(rt);
        });
      }

      const lodgingMap = Object.fromEntries((lodgings || []).map(l => [l.id, l]));
      const rtMap = Object.fromEntries(roomTypes.map(r => [r.id, r]));

      const results: PublicLodgingOption[] = [];

      for (const link of links) {
        if (!lodgingMap[link.lodging_id]) continue;

        if (link.room_type_id) {
          // Specific room type
          results.push({
            id: link.id,
            lodging_id: link.lodging_id,
            room_type_id: link.room_type_id,
            is_default_option: link.is_default_option,
            lodging: lodgingMap[link.lodging_id],
            room_type: rtMap[link.room_type_id] || null,
          });
        } else {
          // "All rooms" — expand into one option per room type
          const rooms = allRoomsByLodging[link.lodging_id] || [];
          if (rooms.length > 0) {
            rooms.forEach((rt, idx) => {
              results.push({
                id: `${link.id}_${rt.id}`,
                lodging_id: link.lodging_id,
                room_type_id: rt.id,
                is_default_option: link.is_default_option && idx === 0,
                lodging: lodgingMap[link.lodging_id],
                room_type: rt,
              });
            });
          } else {
            // No rooms configured, show lodging without room
            results.push({
              id: link.id,
              lodging_id: link.lodging_id,
              room_type_id: null,
              is_default_option: link.is_default_option,
              lodging: lodgingMap[link.lodging_id],
              room_type: null,
            });
          }
        }
      }

      return results;
    },
    enabled: !!experienceId,
  });
};
