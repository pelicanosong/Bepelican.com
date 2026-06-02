import { Gift } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GiftBookingToggleProps {
  isGiftBooking: boolean;
  onToggle: (value: boolean) => void;
}

export const GiftBookingToggle = ({ isGiftBooking, onToggle }: GiftBookingToggleProps) => {
  return (
    <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Gift className="h-5 w-5 text-primary" />
        <Label htmlFor="gift-booking" className="cursor-pointer font-medium">
          ¿Estás reservando para otra persona?
        </Label>
      </div>
      <Switch
        id="gift-booking"
        checked={isGiftBooking}
        onCheckedChange={onToggle}
      />
    </div>
  );
};
