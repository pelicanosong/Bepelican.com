import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { GalleryManager } from "./GalleryManager";
import { useLodgingImages, GalleryImage } from "@/hooks/useLodgingImages";
import { AdminLodging, useCreateLodging, useUpdateLodging, useLodgingRoomTypes, useSyncRoomTypes } from "@/hooks/useAdminLodgings";
import { useSyncLodgingSeasons } from "@/hooks/useAdminLodgingSeasons";
import { LodgingSeasonsEditor } from "./LodgingSeasonsEditor";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { COLOMBIA_DEPARTMENTS } from "./experience-form/types";

interface LodgingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lodging?: AdminLodging | null;
}

interface LocalRoomType {
  tempId: string;
  name: string;
  short_description: string;
  capacity: number;
  base_price: number;
  units_available: number;
  main_image_url: string | null;
  gallery_images: string[];
  is_active: boolean;
}

const LODGING_TYPES = [
  { value: "posada", label: "Posada" },
  { value: "hotel", label: "Hotel" },
  { value: "hostal", label: "Hostal" },
  { value: "glamping", label: "Glamping" },
  { value: "cabaña", label: "Cabaña" },
  { value: "finca", label: "Finca" },
];

const CATEGORY_OPTIONS = [
  "rural", "romántico", "familiar", "naturaleza", "urbano", "playa", "montaña", "aventura", "lujo",
];

const generateSlug = (name: string) =>
  name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function LodgingFormDialog({ open, onOpenChange, lodging }: LodgingFormDialogProps) {
  const { toast } = useToast();
  const createLodging = useCreateLodging();
  const updateLodging = useUpdateLodging();
  const syncRoomTypes = useSyncRoomTypes();
  const syncSeasons = useSyncLodgingSeasons();
  const { data: existingRoomTypes } = useLodgingRoomTypes(lodging?.id);

  const isEditing = !!lodging;

  // Form state
  const [name, setName] = useState("");
  const [lodgingType, setLodgingType] = useState("hotel");
  const [categories, setCategories] = useState<string[]>([]);
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [roomTypes, setRoomTypes] = useState<LocalRoomType[]>([]);
  const [seasons, setSeasons] = useState<{ tempId: string; name: string; start_date: string; end_date: string }[]>([]);
  const [seasonRates, setSeasonRates] = useState<{ seasonTempId: string; room_type_id: string; pricing_mode: 'per_room' | 'per_person'; price: number }[]>([]);

  const currentSlug = useMemo(() => {
    if (lodging?.slug) return lodging.slug;
    return name ? generateSlug(name) : "";
  }, [lodging?.slug, name]);

  const {
    isUploading, uploadCoverImage, deleteCoverImage,
    uploadGalleryImage, deleteGalleryImage,
    uploadRoomCoverImage,
  } = useLodgingImages(currentSlug);

  // Reset form on open
  useEffect(() => {
    if (!open) return;
    if (lodging) {
      setName(lodging.name);
      setLodgingType(lodging.lodging_type);
      setCategories(lodging.categories || []);
      setDepartment(lodging.department || "");
      setCity(lodging.city);
      setAddress(lodging.address || "");
      setShortDescription(lodging.short_description || "");
      setLongDescription(lodging.long_description || "");
      setIsActive(lodging.is_active);
      setCoverImageUrl(lodging.main_image_url);
      setGalleryImages(
        (lodging.gallery_images || []).map((url, idx) => ({ url, alt: "", index: idx + 1 }))
      );
    } else {
      setName(""); setLodgingType("hotel"); setCategories([]); setDepartment(""); setCity("");
      setAddress(""); setShortDescription(""); setLongDescription("");
      setIsActive(true); setCoverImageUrl(null); setGalleryImages([]);
      setRoomTypes([]); setSeasons([]); setSeasonRates([]);
    }
  }, [lodging, open]);

  // Sync existing room types
  useEffect(() => {
    if (existingRoomTypes) {
      setRoomTypes(existingRoomTypes.map(rt => ({
        tempId: rt.id,
        name: rt.name,
        short_description: rt.short_description || "",
        capacity: rt.capacity,
        base_price: rt.base_price,
        units_available: rt.units_available ?? 1,
        main_image_url: rt.main_image_url,
        gallery_images: rt.gallery_images || [],
        is_active: rt.is_active,
      })));
    }
  }, [existingRoomTypes]);

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const addRoomType = () => {
    setRoomTypes(prev => [...prev, {
      tempId: crypto.randomUUID(),
      name: "", short_description: "", capacity: 2, base_price: 0,
      units_available: 1, main_image_url: null, gallery_images: [], is_active: true,
    }]);
  };

  const updateRoomType = (tempId: string, field: string, value: any) => {
    setRoomTypes(prev => prev.map(rt =>
      rt.tempId === tempId ? { ...rt, [field]: value } : rt
    ));
  };

  const removeRoomType = (tempId: string) => {
    setRoomTypes(prev => prev.filter(rt => rt.tempId !== tempId));
  };

  const handleCoverUpload = async (file: File): Promise<string | null> => {
    if (!currentSlug) { toast({ title: "Ingresa un nombre primero", variant: "destructive" }); return null; }
    const url = await uploadCoverImage(file);
    if (url) setCoverImageUrl(url);
    return url;
  };

  const handleCoverRemove = async () => {
    await deleteCoverImage();
    setCoverImageUrl(null);
  };

  const handleGalleryUpload = async (file: File, index: number): Promise<string | null> => {
    if (!currentSlug) { toast({ title: "Ingresa un nombre primero", variant: "destructive" }); return null; }
    return await uploadGalleryImage(file, index);
  };

  const handleGalleryDelete = async (index: number): Promise<boolean> => {
    return await deleteGalleryImage(index);
  };

  const handleRoomCoverUpload = async (tempId: string, file: File) => {
    const rt = roomTypes.find(r => r.tempId === tempId);
    if (!rt?.name || !currentSlug) {
      toast({ title: "Ingresa el nombre de la habitación primero", variant: "destructive" });
      return;
    }
    const roomSlug = generateSlug(rt.name);
    const url = await uploadRoomCoverImage(roomSlug, file);
    if (url) updateRoomType(tempId, "main_image_url", url);
  };

  const handleSave = async () => {
    if (!name || !city) {
      toast({ title: "Nombre y ciudad son requeridos", variant: "destructive" });
      return;
    }

    try {
      const slug = lodging?.slug || generateSlug(name);
      const galleryUrls = galleryImages.map(img => img.url);
      const payload = {
        name, slug, lodging_type: lodgingType, categories, department: department || null, city,
        address: address || null, short_description: shortDescription || null,
        long_description: longDescription || null, main_image_url: coverImageUrl,
        gallery_images: galleryUrls, is_active: isActive,
      };

      let lodgingId: string;
      if (isEditing && lodging) {
        await updateLodging.mutateAsync({ id: lodging.id, ...payload });
        lodgingId = lodging.id;
      } else {
        const created = await createLodging.mutateAsync(payload);
        lodgingId = (created as any).id;
      }

      // Sync room types
      await syncRoomTypes.mutateAsync({
        lodgingId,
        roomTypes: roomTypes.map(rt => ({
          name: rt.name,
          short_description: rt.short_description || null,
          capacity: rt.capacity,
          base_price: rt.base_price,
          units_available: rt.units_available,
          main_image_url: rt.main_image_url,
          gallery_images: rt.gallery_images,
          is_active: rt.is_active,
        })),
      });

      // Sync seasons and rates — filter out incomplete seasons
      const validSeasons = seasons.filter(s => s.name && s.start_date && s.end_date);
      if (validSeasons.length > 0) {
        const seasonIndexMap = new Map(validSeasons.map((s, i) => [s.tempId, i]));
        await syncSeasons.mutateAsync({
          lodgingId,
          seasons: validSeasons.map(s => ({ name: s.name, start_date: s.start_date, end_date: s.end_date })),
          rates: seasonRates
            .filter(r => seasonIndexMap.has(r.seasonTempId))
            .map(r => ({
              seasonIndex: seasonIndexMap.get(r.seasonTempId)!,
              room_type_id: r.room_type_id,
              pricing_mode: r.pricing_mode,
              price: r.price,
            })),
        });
      } else {
        // Clear all seasons
        await syncSeasons.mutateAsync({ lodgingId, seasons: [], rates: [] });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const isPending = createLodging.isPending || updateLodging.isPending || syncRoomTypes.isPending || syncSeasons.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditing ? "Editar Hospedaje" : "Nuevo Hospedaje"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-1 pb-4">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Hotel Pelícano Azul" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de hospedaje *</Label>
              <Select value={lodgingType} onValueChange={setLodgingType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LODGING_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={department || "__none__"} onValueChange={v => setDepartment(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Seleccionar...</SelectItem>
                  {COLOMBIA_DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ciudad *</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ej: Cartagena" />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: Calle 5 #3-20" />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categorías</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(cat => (
                <Badge
                  key={cat}
                  variant={categories.includes(cat) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descripción corta (máx. 200)</Label>
              <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Descripción larga</Label>
              <Textarea value={longDescription} onChange={e => setLongDescription(e.target.value)} rows={4} />
            </div>
          </div>

          {/* Cover & Gallery */}
          <div className="space-y-4">
            <ImageUploader
              label="Imagen de portada"
              currentImage={coverImageUrl}
              onUpload={handleCoverUpload}
              onRemove={handleCoverRemove}
              isUploading={isUploading}
            />
            <GalleryManager
              images={galleryImages}
              onImagesChange={setGalleryImages}
              onSetAsCover={(url) => setCoverImageUrl(url)}
              onUploadImage={handleGalleryUpload}
              onDeleteImage={handleGalleryDelete}
              isUploading={isUploading}
              maxImages={10}
            />
          </div>

          {/* Room Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Tipos de Habitación</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRoomType}>
                <Plus className="h-4 w-4 mr-2" /> Agregar habitación
              </Button>
            </div>

            {roomTypes.map((rt) => (
              <Card key={rt.tempId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{rt.name || "Nueva habitación"}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Activa</Label>
                        <Switch checked={rt.is_active} onCheckedChange={v => updateRoomType(rt.tempId, "is_active", v)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRoomType(rt.tempId)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre *</Label>
                      <Input value={rt.name} onChange={e => updateRoomType(rt.tempId, "name", e.target.value)} placeholder="Ej: Standard" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descripción</Label>
                      <Input value={rt.short_description} onChange={e => updateRoomType(rt.tempId, "short_description", e.target.value)} placeholder="Cama doble, baño privado..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Capacidad (personas)</Label>
                      <Input type="number" min={1} value={rt.capacity} onChange={e => updateRoomType(rt.tempId, "capacity", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unidades disponibles</Label>
                      <Input type="number" min={1} value={rt.units_available} onChange={e => updateRoomType(rt.tempId, "units_available", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Precio base (COP)</Label>
                      <Input type="number" min={0} value={rt.base_price} onChange={e => updateRoomType(rt.tempId, "base_price", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  {/* Room cover image */}
                  <ImageUploader
                    label="Portada de habitación"
                    currentImage={rt.main_image_url}
                    onUpload={(file) => handleRoomCoverUpload(rt.tempId, file).then(() => null)}
                    isUploading={isUploading}
                  />
                </CardContent>
              </Card>
            ))}

            {roomTypes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tipos de habitación. Haz clic en "Agregar habitación" para comenzar.
              </p>
            )}
          </div>

          {/* Seasons & Rates */}
          <LodgingSeasonsEditor
            lodgingId={lodging?.id}
            roomTypes={roomTypes.filter(rt => rt.name).map(rt => ({ id: rt.tempId, name: rt.name }))}
            seasons={seasons}
            onSeasonsChange={setSeasons}
            rates={seasonRates}
            onRatesChange={setSeasonRates}
          />

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Hospedaje activo (visible al público)</Label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t pt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || isUploading}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Crear hospedaje"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
