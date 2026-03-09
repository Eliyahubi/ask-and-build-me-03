import { Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AiAutoToggleProps {
  aiAuto: boolean;
  onToggle: (value: boolean) => void;
}

const AiAutoToggle = ({ aiAuto, onToggle }: AiAutoToggleProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={aiAuto ? "default" : "outline"}
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => onToggle(!aiAuto)}
          >
            {aiAuto ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {aiAuto ? "🤖 בינה בוחרת" : "✋ בחירה ידנית"}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{aiAuto ? "הבינה בוחרת תבנית וצבעים אוטומטית" : "אתה בוחר תבנית וצבעים"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AiAutoToggle;
