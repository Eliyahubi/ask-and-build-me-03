import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, Download, Copy, Quote, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { drawDiagram } from "@/lib/diagramDrawing";
import { exportCanvasAsPng, copyCanvasToClipboard, exportDiagramAsSvg } from "@/lib/diagramExport";
import type { DiagramData } from "@/types/diagram";
import type { DiagramTemplateId } from "@/data/diagramTemplates";

interface InlineDiagramProps {
  data: DiagramData;
  colorPalette: string[];
  sourceText: string;
  templateId?: DiagramTemplateId;
  isRegenerating: boolean;
  onRemove: () => void;
  onRegenerate: () => void;
}

type TemplateShape = {
  path: string;
  options?: { fill?: string; stroke?: string };
};

type TemplateShapeMap = Partial<Record<DiagramTemplateId, TemplateShape[]>>;

let templateShapeCache: TemplateShapeMap | null = null;
let templateShapePromise: Promise<TemplateShapeMap> | null = null;

const loadTemplateShapes = async (): Promise<TemplateShapeMap> => {
  if (templateShapeCache) return templateShapeCache;
  if (!templateShapePromise) {
    templateShapePromise = fetch("/opennapkin-template-shapes.json")
      .then((res) => (res.ok ? res.json() : {}))
      .then((json) => { templateShapeCache = json as TemplateShapeMap; return templateShapeCache; })
      .catch(() => { templateShapeCache = {}; return templateShapeCache; });
  }
  return templateShapePromise;
};

const InlineDiagram = ({
  data,
  colorPalette,
  sourceText,
  templateId,
  isRegenerating,
  onRemove,
  onRegenerate,
}: InlineDiagramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [templateShapes, setTemplateShapes] = useState<TemplateShape[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!templateId) { setTemplateShapes([]); return; }
    loadTemplateShapes().then((allShapes) => {
      if (!cancelled) setTemplateShapes(allShapes[templateId] ?? []);
    });
    return () => { cancelled = true; };
  }, [templateId]);

  const useTemplateStyle = Boolean(templateId) && templateShapes.length > 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    drawDiagram({ canvas, data, colorPalette, useTemplateStyle, templateShapes });
  }, [data, colorPalette, useTemplateStyle, templateShapes]);

  useEffect(() => { draw(); }, [draw]);

  const handleDownload = useCallback((format: "png" | "svg" = "png") => {
    if (format === "svg") {
      exportDiagramAsSvg(data, colorPalette, useTemplateStyle);
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) exportCanvasAsPng(canvas);
  }, [data, colorPalette, useTemplateStyle]);

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current;
    if (canvas) await copyCanvasToClipboard(canvas);
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
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleDownload("png")} title="הורד PNG">
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleDownload("svg")} title="הורד SVG">
          <FileDown className="w-3.5 h-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={handleCopy} title="העתק">
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={onRemove} title="הסר">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center justify-center overflow-auto p-4 canvas-grid paper-texture">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </motion.div>
  );
};

export default InlineDiagram;
