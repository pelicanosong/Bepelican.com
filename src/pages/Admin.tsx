import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminExperiences, useAdminStats } from "@/hooks/useAdminExperiences";
import { useAdminFlipbooks, AdminFlipbook } from "@/hooks/useAdminFlipbooks";
import { useAdminLodgings, AdminLodging } from "@/hooks/useAdminLodgings";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminStatusChart } from "@/components/admin/AdminStatusChart";
import { ExperiencesTable } from "@/components/admin/ExperiencesTable";
import { ExperienceFormDialog } from "@/components/admin/ExperienceFormDialog";
import { FlipbooksTable } from "@/components/admin/FlipbooksTable";
import { FlipbookFormDialog } from "@/components/admin/FlipbookFormDialog";
import { LodgingsTable } from "@/components/admin/LodgingsTable";
import { LodgingFormDialog } from "@/components/admin/LodgingFormDialog";
import { FlipbookCategoriesManager } from "@/components/admin/FlipbookCategoriesManager";
import { ExperienceCategoriesManager } from "@/components/admin/ExperienceCategoriesManager";
import { HeroSlidesManager } from "@/components/admin/HeroSlidesManager";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Shield, Loader2, MapPin, BookOpen, Home, ArrowLeft, CalendarDays, Hotel } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminExperienceWithCategory } from "@/hooks/useAdminExperiences";
import { ExperienceSortManager } from "@/components/admin/ExperienceSortManager";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin({ enabled: !!user });
  const adminQueriesEnabled = !!user && isAdmin === true;
  const { data: experiences, isLoading: expLoading } = useAdminExperiences({ enabled: adminQueriesEnabled });
  const { data: stats, isLoading: statsLoading } = useAdminStats({ enabled: adminQueriesEnabled });
  const { data: flipbooks, isLoading: flipbooksLoading } = useAdminFlipbooks({ enabled: adminQueriesEnabled });
  const { data: lodgings, isLoading: lodgingsLoading } = useAdminLodgings({ enabled: adminQueriesEnabled });

  const [activeTab, setActiveTab] = useState("home");
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<AdminExperienceWithCategory | null>(null);
  const [flipbookDialogOpen, setFlipbookDialogOpen] = useState(false);
  const [editingFlipbook, setEditingFlipbook] = useState<AdminFlipbook | null>(null);
  const [lodgingDialogOpen, setLodgingDialogOpen] = useState(false);
  const [editingLodging, setEditingLodging] = useState<AdminLodging | null>(null);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
                <p className="text-muted-foreground">
                  No tienes permisos de administrador para acceder a esta página.
                </p>
              </div>
              <Button onClick={() => window.history.back()} variant="outline">
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEdit = (experience: AdminExperienceWithCategory) => {
    setEditingExperience(experience);
    setExpDialogOpen(true);
  };

  const handleExpDialogClose = (open: boolean) => {
    setExpDialogOpen(open);
    if (!open) setEditingExperience(null);
  };

  const handleEditFlipbook = (flipbook: AdminFlipbook) => {
    setEditingFlipbook(flipbook);
    setFlipbookDialogOpen(true);
  };

  const handleFlipbookDialogClose = (open: boolean) => {
    setFlipbookDialogOpen(open);
    if (!open) setEditingFlipbook(null);
  };

  const handleEditLodging = (lodging: AdminLodging) => {
    setEditingLodging(lodging);
    setLodgingDialogOpen(true);
  };

  const handleLodgingDialogClose = (open: boolean) => {
    setLodgingDialogOpen(open);
    if (!open) setEditingLodging(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Experiencias, librería y contenido del home</p>
            </div>
            <div className="flex gap-2">
              {activeTab === "experiencias" && (
                <Button onClick={() => setExpDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva Experiencia
                </Button>
              )}
              {activeTab === "flipbooks" && (
                <Button onClick={() => setFlipbookDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Flipbook
                </Button>
              )}
              {activeTab === "hospedajes" && (
                <Button onClick={() => setLodgingDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Hospedaje
                </Button>
              )}
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="home" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="experiencias" className="gap-2">
              <MapPin className="h-4 w-4" />
              Experiencias
            </TabsTrigger>
            <TabsTrigger value="flipbooks" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Librería
            </TabsTrigger>
            <TabsTrigger value="disponibilidad" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="hospedajes" className="gap-2">
              <Hotel className="h-4 w-4" />
              Hospedajes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Banner del Home</CardTitle>
              </CardHeader>
              <CardContent>
                <HeroSlidesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiencias" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Orden de experiencias en la web</CardTitle>
              </CardHeader>
              <CardContent>
                <ExperienceSortManager experiences={experiences} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Todas las Experiencias</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {experiences?.length || 0} experiencias
                </span>
              </CardHeader>
              <CardContent>
                <ExperiencesTable
                  experiences={experiences}
                  isLoading={expLoading}
                  onEdit={handleEdit}
                />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AdminStatusChart
                data={stats?.statusDistribution || []}
                isLoading={statsLoading}
              />
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Resumen Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{stats?.activeExperiences || 0}</div>
                      <div className="text-sm text-muted-foreground">Activas</div>
                    </div>
                    <div className="text-center p-4 bg-[hsl(var(--bepelican-orange))]/10 rounded-lg">
                      <div className="text-3xl font-bold text-[hsl(var(--bepelican-orange))]">{stats?.draftExperiences || 0}</div>
                      <div className="text-sm text-muted-foreground">Borrador</div>
                    </div>
                    <div className="text-center p-4 bg-[hsl(var(--bepelican-green))]/10 rounded-lg">
                      <div className="text-3xl font-bold text-[hsl(var(--bepelican-green))]">{stats?.paidOrders || 0}</div>
                      <div className="text-sm text-muted-foreground">Ventas</div>
                    </div>
                    <div className="text-center p-4 bg-[hsl(var(--bepelican-deepblue))]/10 rounded-lg">
                      <div className="text-3xl font-bold text-[hsl(var(--bepelican-deepblue))]">{stats?.confirmedBookings || 0}</div>
                      <div className="text-sm text-muted-foreground">Reservas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ExperienceCategoriesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flipbooks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Librería Pelicana</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {flipbooks?.length || 0} flipbooks
                </span>
              </CardHeader>
              <CardContent>
                <FlipbooksTable
                  flipbooks={flipbooks}
                  isLoading={flipbooksLoading}
                  onEdit={handleEditFlipbook}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <FlipbookCategoriesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disponibilidad" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Disponibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hospedajes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Hospedajes</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {lodgings?.length || 0} hospedajes
                </span>
              </CardHeader>
              <CardContent>
                <LodgingsTable
                  lodgings={lodgings}
                  isLoading={lodgingsLoading}
                  onEdit={handleEditLodging}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminStatsCards stats={stats} isLoading={statsLoading} />
          </CardContent>
        </Card>
      </main>

      <ExperienceFormDialog
        open={expDialogOpen}
        onOpenChange={handleExpDialogClose}
        experience={editingExperience}
      />

      <FlipbookFormDialog
        open={flipbookDialogOpen}
        onOpenChange={handleFlipbookDialogClose}
        flipbook={editingFlipbook}
      />

      <LodgingFormDialog
        open={lodgingDialogOpen}
        onOpenChange={handleLodgingDialogClose}
        lodging={editingLodging}
      />
    </div>
  );
}
