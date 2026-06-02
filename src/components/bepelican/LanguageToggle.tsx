import { Globe } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
}

const LanguageToggle = ({ className }: LanguageToggleProps) => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇨🇴' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 transition-colors",
            className
          )}
        >
          <Globe className="h-5 w-5" />
          <span className="text-xs font-medium uppercase">{language}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              language === lang.code && "bg-muted"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
