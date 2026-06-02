import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, ShoppingCart, Wallet, Calendar, TrendingUp } from "lucide-react";

interface AdminStatsCardsProps {
  stats: {
    totalExperiences: number;
    activeExperiences: number;
    totalCities: number;
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    totalBookings: number;
    confirmedBookings: number;
  } | undefined;
  isLoading: boolean;
}

export function AdminStatsCards({ stats, isLoading }: AdminStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const cards = [
    {
      title: "Experiencias",
      value: stats?.totalExperiences || 0,
      subtitle: `${stats?.activeExperiences || 0} activas`,
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Destinos",
      value: stats?.totalCities || 0,
      subtitle: "ciudades únicas",
      icon: MapPin,
      color: "text-[hsl(var(--bepelican-orange))]"
    },
    {
      title: "Órdenes",
      value: stats?.totalOrders || 0,
      subtitle: `${stats?.paidOrders || 0} pagadas`,
      icon: ShoppingCart,
      color: "text-[hsl(var(--bepelican-green))]"
    },
    {
      title: "Ingresos",
      value: formatCurrency(stats?.totalRevenue || 0),
      subtitle: "total recaudado",
      icon: Wallet,
      color: "text-[hsl(var(--bepelican-deepblue))]",
      isMonetary: true
    },
    {
      title: "Reservas",
      value: stats?.totalBookings || 0,
      subtitle: `${stats?.confirmedBookings || 0} confirmadas`,
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Tasa de Conversión",
      value: stats?.totalOrders ? `${Math.round((stats.paidOrders / stats.totalOrders) * 100)}%` : '0%',
      subtitle: "órdenes pagadas",
      icon: TrendingUp,
      color: "text-[hsl(var(--bepelican-green))]",
      isPercentage: true
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-8 w-8 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted rounded w-16 mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.isMonetary ? 'text-lg' : ''}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
