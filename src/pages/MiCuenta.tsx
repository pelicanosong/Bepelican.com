import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Loader2, MapPin, Save, Users } from 'lucide-react';
import BePelicanHeader from '@/components/bepelican/BePelicanHeader';
import BePelicanFooter from '@/components/bepelican/BePelicanFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ExperienceImage } from '@/components/experience/ExperienceImage';
import { useUserBookings } from '@/hooks/useUserBookings';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/formatPrice';

const MiCuenta = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: bookings, isLoading: bookingsLoading } = useUserBookings();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    document_type: 'CC',
    document_number: '',
    address: '',
    city: '',
    department: '',
    country: 'Colombia',
  });

  useEffect(() => {
    document.title = 'Mi Cuenta | BePelican';
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar tu perfil' });
      } else if (data) {
        const loaded = {
          email: data.email || user.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          document_type: data.document_type || 'CC',
          document_number: data.document_number || '',
          address: data.address || '',
          city: data.city || '',
          department: data.department || '',
          country: data.country || 'Colombia',
        };
        setProfile(loaded);
        setIsInitialSetup(
          searchParams.get('setup') === '1' ||
            !loaded.phone ||
            !loaded.document_number ||
            !loaded.address
        );
      }
      setLoadingProfile(false);
    };
    loadProfile();
  }, [user, toast, searchParams]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        document_type: profile.document_type,
        document_number: profile.document_number,
        address: profile.address,
        city: profile.city,
        department: profile.department,
        country: profile.country,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron guardar los cambios' });
    } else {
      toast({ title: 'Perfil actualizado', description: 'Tus datos se guardaron correctamente' });
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (isInitialSetup) {
        navigate('/experiencias', { replace: true });
      }
    }
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const BookingCard = ({
    booking,
    showTotal = false,
  }: {
    booking: NonNullable<typeof bookings>['upcoming'][0];
    showTotal?: boolean;
  }) => (
    <div className="flex gap-4 bg-card border rounded-xl p-4 hover:border-bepelican-orange/30 transition-colors">
      {booking.experience.cover_image ? (
        <ExperienceImage
          src={booking.experience.cover_image}
          alt={booking.experience.title}
          size="thumb"
          priority="list"
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=120&h=120&fit=crop"
          width={120}
          height={120}
          loading="lazy"
          decoding="async"
          alt={booking.experience.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{booking.experience.title}</h4>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(parseISO(booking.booking_date), "d 'de' MMMM, yyyy", { locale: es })}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {booking.participants} {booking.participants === 1 ? 'viajero' : 'viajeros'}
        </p>
        {booking.paymentReference && (
          <p className="text-xs text-muted-foreground mt-1">Ref: {booking.paymentReference}</p>
        )}
        {showTotal && (
          <p className="text-sm font-medium text-bepelican-orange mt-1">
            {formatPrice(booking.order.total_amount)}
          </p>
        )}
      </div>
      <Link
        to={`/experiencias/${booking.experience.slug}`}
        className="self-center text-sm text-bepelican-orange hover:underline flex-shrink-0"
      >
        Ver experiencia
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <BePelicanHeader variant="light" showSearchBar={false} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-display text-3xl text-foreground mb-2">Mi Cuenta</h1>
          <p className="text-muted-foreground mb-8">Gestiona tus datos y revisa tus reservas</p>

          <Tabs defaultValue="datos">
            <TabsList className="mb-6">
              <TabsTrigger value="datos">Datos personales</TabsTrigger>
              <TabsTrigger value="reservas">Reservas futuras</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="datos">
              {loadingProfile ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="bg-card border rounded-xl p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nombre</Label>
                      <Input
                        id="first_name"
                        value={profile.first_name}
                        onChange={(e) => updateField('first_name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Apellido</Label>
                      <Input
                        id="last_name"
                        value={profile.last_name}
                        onChange={(e) => updateField('last_name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" value={profile.email} disabled className="mt-1 bg-muted" />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de documento</Label>
                      <Select
                        value={profile.document_type}
                        onValueChange={(v) => updateField('document_type', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CC">Cédula de ciudadanía</SelectItem>
                          <SelectItem value="CE">Cédula de extranjería</SelectItem>
                          <SelectItem value="PP">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="document_number">Número de documento</Label>
                      <Input
                        id="document_number"
                        value={profile.document_number}
                        onChange={(e) => updateField('document_number', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Departamento</Label>
                      <Input
                        id="department"
                        value={profile.department}
                        onChange={(e) => updateField('department', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={profile.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar cambios
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reservas">
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : bookings?.upcoming.length ? (
                <div className="space-y-4">
                  {bookings.upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No tienes reservas próximas</p>
                  <Link to="/experiencias">
                    <Button className="bg-bepelican-orange hover:bg-bepelican-orange/90 text-white rounded-full">
                      Explorar experiencias
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historial">
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : bookings?.history.length ? (
                <div className="space-y-4">
                  {bookings.history.map((b) => (
                    <BookingCard key={b.id} booking={b} showTotal />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                  <p className="text-muted-foreground">Aún no tienes historial de reservas</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BePelicanFooter />
    </div>
  );
};

export default MiCuenta;
