import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { countryCodes } from '@/lib/countryCodes';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CountryCodeSelector = ({ value, onChange }: CountryCodeSelectorProps) => {
  const [open, setOpen] = useState(false);

  const selected = countryCodes.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-32 shrink-0 justify-between px-2 text-sm font-normal h-10"
        >
          <span className="truncate">
            {selected ? `${selected.country}` : '+57'}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar país o código..." />
          <CommandList>
            <CommandEmpty>No se encontró el país.</CommandEmpty>
            <CommandGroup>
              {countryCodes.map((c) => (
                <CommandItem
                  key={`${c.code}-${c.country}`}
                  value={`${c.label} ${c.code} ${c.country}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === c.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="mr-2">{c.country}</span>
                  <span className="text-muted-foreground">{c.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
