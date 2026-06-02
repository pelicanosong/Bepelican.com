import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileSummaryProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  onEdit: () => void;
}

const documentTypeLabels: Record<string, string> = {
  CC: "C.C.",
  CE: "C.E.",
  NIT: "NIT",
  PP: "Pasaporte",
};

export const ProfileSummary = ({
  firstName,
  lastName,
  email,
  phone,
  documentType,
  documentNumber,
  onEdit,
}: ProfileSummaryProps) => {
  const fullName = `${firstName} ${lastName}`.trim();
  const docLabel = documentTypeLabels[documentType] || documentType;

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tus datos</h2>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-primary">
          <Edit2 className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Nombre:</span>
          <p className="font-medium">{fullName || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Correo:</span>
          <p className="font-medium">{email || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Teléfono:</span>
          <p className="font-medium">{phone || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Documento:</span>
          <p className="font-medium">
            {documentNumber ? `${docLabel} ${documentNumber}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};
