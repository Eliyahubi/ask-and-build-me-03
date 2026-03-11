import { useState } from "react";
import { Palette, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_THEMES, type ColorThemeData } from "@/lib/colorThemes";

// Re-export for backward compatibility
export type ColorTheme = ColorThemeData;
export const colorThemes = COLOR_THEMES;

interface ColorThemePickerProps {
  selectedTheme: string;
  onSelect: (theme: ColorTheme) => void;
}

const ColorThemePicker = ({ selectedTheme, onSelect }: ColorThemePickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          צבעים
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid gap-1">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => { onSelect(theme); setOpen(false); }}
              className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent/10 transition-colors w-full"
            >
              <div className="flex gap-1">
                {theme.colors.slice(0, 4).map((color, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-sm text-foreground flex-1 text-right">{theme.name}</span>
              {selectedTheme === theme.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorThemePicker;
