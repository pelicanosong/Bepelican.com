import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerDetails {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentType: "CC" | "CE" | "NIT" | "PP";
  documentNumber: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}

interface CustomerFormProps {
  customerDetails: CustomerDetails;
  formErrors: FormErrors;
  onInputChange: (field: string, value: string) => void;
  title?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const CustomerForm = ({
  customerDetails,
  formErrors,
  onInputChange,
  title = "Datos del comprador",
}: CustomerFormProps) => {
  return (
    <div className="bg-card border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Nombre *</Label>
            <Input
              id="firstName"
              value={customerDetails.firstName}
              onChange={(e) => onInputChange("firstName", e.target.value)}
              placeholder="Tu nombre"
              className={`mt-1 ${formErrors.firstName ? "border-destructive" : ""}`}
            />
            {formErrors.firstName && (
              <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Apellido *</Label>
            <Input
              id="lastName"
              value={customerDetails.lastName}
              onChange={(e) => onInputChange("lastName", e.target.value)}
              placeholder="Tu apellido"
              className={`mt-1 ${formErrors.lastName ? "border-destructive" : ""}`}
            />
            {formErrors.lastName && (
              <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Correo electrónico *</Label>
          <Input
            id="email"
            type="email"
            value={customerDetails.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            placeholder="tu@email.com"
            className={`mt-1 ${formErrors.email ? "border-destructive" : ""}`}
          />
          {formErrors.email && <p className="text-sm text-destructive mt-1">{formErrors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono (10 dígitos) *</Label>
          <Input
            id="phone"
            type="tel"
            value={customerDetails.phone}
            onChange={(e) =>
              onInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="3001234567"
            maxLength={10}
            className={`mt-1 ${formErrors.phone ? "border-destructive" : ""}`}
          />
          {formErrors.phone && <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="documentType">Tipo doc.</Label>
            <select
              id="documentType"
              value={customerDetails.documentType}
              onChange={(e) => onInputChange("documentType", e.target.value)}
              className={`mt-1 w-full h-10 px-3 rounded-md border bg-background text-sm ${
                formErrors.documentType ? "border-destructive" : "border-input"
              }`}
            >
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="NIT">NIT</option>
              <option value="PP">Pasaporte</option>
            </select>
            {formErrors.documentType && (
              <p className="text-sm text-destructive mt-1">{formErrors.documentType}</p>
            )}
          </div>
          <div className="col-span-2">
            <Label htmlFor="documentNumber">Número de documento *</Label>
            <Input
              id="documentNumber"
              value={customerDetails.documentNumber}
              onChange={(e) =>
                onInputChange(
                  "documentNumber",
                  e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)
                )
              }
              placeholder="123456789"
              maxLength={20}
              className={`mt-1 ${formErrors.documentNumber ? "border-destructive" : ""}`}
            />
            {formErrors.documentNumber && (
              <p className="text-sm text-destructive mt-1">{formErrors.documentNumber}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
