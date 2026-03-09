import { Paintbrush, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type RenderStyle = "sketch" | "professional";

interface RenderStyleToggleProps {
  style: RenderStyle;
  onStyleChange: (style: RenderStyle) => void;
}

const RenderStyleToggle = ({ style, onStyleChange }: RenderStyleToggleProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={style === "sketch" ? "default" : "ghost"}
              size="sm"
              className="gap-1.5 h-7 text-xs px-2.5"
              onClick={() => onStyleChange("sketch")}
            >
              <Paintbrush className="w-3 h-3" />
              כתב יד
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>סגנון שרטוט ביד חופשית</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={style === "professional" ? "default" : "ghost"}
              size="sm"
              className="gap-1.5 h-7 text-xs px-2.5"
              onClick={() => onStyleChange("professional")}
            >
              <Sparkles className="w-3 h-3" />
              מקצועי
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>אינפוגרפיקה מקצועית עם 200+ תבניות</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default RenderStyleToggle;
