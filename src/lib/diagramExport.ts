import rough from "roughjs";
import { toast } from "sonner";
import type { DiagramData, DiagramNode } from "@/types/diagram";
import { getNodeCenter } from "./diagramDrawing";

export function exportCanvasAsPng(canvas: HTMLCanvasElement) {
  const link = document.createElement("a");
  link.download = `diagram-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  toast.success("התמונה הורדה!");
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement) {
  try {
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast.success("הועתק ללוח!");
  } catch {
    toast.error("ההעתקה נכשלה.");
  }
}

export function exportDiagramAsSvg(
  data: DiagramData,
  colorPalette: string[],
  useTemplateStyle: boolean
) {
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("width", String(data.width));
  svgEl.setAttribute("height", String(data.height));
  svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const rc = rough.svg(svgEl);

  // Connections
  data.connections.forEach((conn) => {
    const fromNode = data.nodes.find((n) => n.id === conn.from);
    const toNode = data.nodes.find((n) => n.id === conn.to);
    if (!fromNode || !toNode) return;
    const from = getNodeCenter(fromNode);
    const to = getNodeCenter(toNode);
    svgEl.appendChild(rc.line(from.x, from.y, to.x, to.y, { stroke: "#666", strokeWidth: 1.5, roughness: 1.2 }));
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = 12;
    const edgeX = to.x - Math.cos(angle) * (toNode.width / 2 + 4);
    const edgeY = to.y - Math.sin(angle) * (toNode.height / 2 + 4);
    svgEl.appendChild(rc.line(edgeX, edgeY, edgeX - headLen * Math.cos(angle - Math.PI / 6), edgeY - headLen * Math.sin(angle - Math.PI / 6), { stroke: "#666", strokeWidth: 1.5, roughness: 0.5 }));
    svgEl.appendChild(rc.line(edgeX, edgeY, edgeX - headLen * Math.cos(angle + Math.PI / 6), edgeY - headLen * Math.sin(angle + Math.PI / 6), { stroke: "#666", strokeWidth: 1.5, roughness: 0.5 }));
  });

  // Nodes
  data.nodes.forEach((node, i) => {
    const color = node.color || colorPalette[i % colorPalette.length];
    const opts = { fill: color, fillStyle: "solid" as const, roughness: 1.5, stroke: "#333", strokeWidth: 1.5 };

    if (!useTemplateStyle) {
      appendNodeShape(svgEl, rc, node, opts);
    }

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(node.x + node.width / 2));
    text.setAttribute("y", String(node.y + node.height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("font-family", "'Caveat', cursive");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", useTemplateStyle ? "hsl(220, 20%, 15%)" : "#fff");
    text.textContent = node.label;
    svgEl.appendChild(text);
  });

  // Title
  if (data.title) {
    const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleEl.setAttribute("x", String(data.width / 2));
    titleEl.setAttribute("y", "30");
    titleEl.setAttribute("text-anchor", "middle");
    titleEl.setAttribute("font-family", "'Caveat', cursive");
    titleEl.setAttribute("font-size", "28");
    titleEl.setAttribute("font-weight", "bold");
    titleEl.setAttribute("fill", "hsl(220, 20%, 25%)");
    titleEl.textContent = data.title;
    svgEl.appendChild(titleEl);
  }

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.download = `diagram-${Date.now()}.svg`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success("SVG הורד!");
}

function appendNodeShape(
  svgEl: SVGSVGElement,
  rc: ReturnType<typeof rough.svg>,
  node: DiagramNode,
  opts: { fill: string; fillStyle: "solid"; roughness: number; stroke: string; strokeWidth: number }
) {
  switch (node.type) {
    case "ellipse":
    case "circle":
      svgEl.appendChild(rc.ellipse(node.x + node.width / 2, node.y + node.height / 2, node.width, node.height, opts));
      break;
    case "diamond":
      svgEl.appendChild(rc.polygon([
        [node.x + node.width / 2, node.y],
        [node.x + node.width, node.y + node.height / 2],
        [node.x + node.width / 2, node.y + node.height],
        [node.x, node.y + node.height / 2],
      ], opts));
      break;
    case "hexagon": {
      const cx = node.x + node.width / 2;
      const cy = node.y + node.height / 2;
      const rx = node.width / 2;
      const ry = node.height / 2;
      svgEl.appendChild(rc.polygon([
        [cx - rx, cy], [cx - rx * 0.5, cy - ry], [cx + rx * 0.5, cy - ry],
        [cx + rx, cy], [cx + rx * 0.5, cy + ry], [cx - rx * 0.5, cy + ry],
      ], opts));
      break;
    }
    default:
      svgEl.appendChild(rc.rectangle(node.x, node.y, node.width, node.height, opts));
  }
}
