import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, Download, Copy, Quote, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AntVDiagramProps {
  syntax: string;
  sourceText: string;
  isRegenerating: boolean;
  onRemove: () => void;
  onRegenerate: () => void;
}

const AntVDiagram = ({
  syntax,
  sourceText,
  isRegenerating,
  onRemove,
  onRegenerate,
}: AntVDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const infographicRef = useRef<any>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !syntax) return;

    let cancelled = false;

    const renderInfographic = async () => {
      try {
        setRenderError(null);
        setIsRendered(false);

        const { Infographic } = await import("@antv/infographic");

        if (cancelled || !containerRef.current) return;

        // Clear previous
        if (infographicRef.current) {
          try {
            infographicRef.current.destroy();
          } catch { /* ignore */ }
          infographicRef.current = null;
        }

        containerRef.current.innerHTML = "";

        const infographic = new Infographic({
          container: containerRef.current,
          width: "100%",
          height: "100%",
        });

        infographicRef.current = infographic;
        
        // Render the syntax
        infographic.render(syntax);
        
        // Check if SVG was actually created
        setTimeout(() => {
          if (!cancelled && containerRef.current) {
            const svgEl = containerRef.current.querySelector("svg");
            if (svgEl) {
              setIsRendered(true);
              console.log("AntV Infographic rendered successfully");
            } else {
              console.warn("AntV: No SVG element found after render");
              setRenderError("הרינדור לא הצליח - נסה לייצר מחדש");
            }
          }
        }, 1000);
      } catch (err) {
        console.error("AntV Infographic render error:", err);
        if (!cancelled) {
          setRenderError(`שגיאה ברינדור: ${err instanceof Error ? err.message : "לא ידוע"}`);
        }
      }
    };

    renderInfographic();

    return () => {
      cancelled = true;
      if (infographicRef.current) {
        try {
          infographicRef.current.destroy();
        } catch { /* ignore */ }
        infographicRef.current = null;
      }
    };
  }, [syntax]);

  const handleDownload = useCallback(async () => {
    if (!containerRef.current) return;
    
    const svgEl = containerRef.current.querySelector("svg");
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.download = `infographic-${Date.now()}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("SVG הורד!");
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!containerRef.current) return;
    
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 600;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              toast.success("הועתק ללוח!");
            }
          });
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch {
      toast.error("ההעתקה נכשלה.");
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative my-4 mx-2 rounded-xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden group"
    >
      {sourceText && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-muted/30 text-xs text-muted-foreground" style={{ direction: "rtl" }}>
          <Quote className="w-3 h-3 shrink-0" />
          <span className="truncate">{sourceText}</span>
        </div>
      )}

      <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={onRegenerate} disabled={isRegenerating} title="ייצור מחדש">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={handleDownload} title="הורד SVG">
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={handleCopy} title="העתק">
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={onRemove} title="הסר">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {renderError && (
        <div className="flex items-center justify-center gap-2 p-4 text-sm text-destructive" style={{ direction: "rtl" }}>
          <AlertTriangle className="w-4 h-4" />
          <span>{renderError}</span>
          <Button variant="outline" size="sm" onClick={onRegenerate} className="mr-2">
            נסה שוב
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex items-center justify-center p-4"
        style={{ minHeight: "500px", width: "100%" }}
      />

      {/* Debug: show raw syntax in dev */}
      {!isRendered && !renderError && syntax && (
        <details className="px-4 pb-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer">סינטקס גולמי (דיבאג)</summary>
          <pre className="mt-1 p-2 bg-muted/50 rounded text-[10px] whitespace-pre-wrap overflow-auto max-h-40" dir="ltr">{syntax}</pre>
        </details>
      )}
    </motion.div>
  );
};

export default AntVDiagram;
