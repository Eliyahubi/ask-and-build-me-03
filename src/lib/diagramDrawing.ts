import rough from "roughjs";
import type { DiagramData, DiagramNode } from "@/types/diagram";

export function getNodeCenter(node: DiagramNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

interface DrawOptions {
  canvas: HTMLCanvasElement;
  data: DiagramData;
  colorPalette: string[];
  useTemplateStyle: boolean;
  templateShapes: { path: string; options?: { fill?: string; stroke?: string } }[];
}

export function drawDiagram({ canvas, data, colorPalette, useTemplateStyle, templateShapes }: DrawOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = data.width * dpr;
  canvas.height = data.height * dpr;
  canvas.style.width = `${data.width}px`;
  canvas.style.height = `${data.height}px`;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, data.width, data.height);

  const rc = rough.canvas(canvas);

  // Template background shapes
  if (useTemplateStyle && templateShapes.length > 0) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.translate(0, 70);
    ctx.scale(data.width / 960, (data.height - 120) / 540);
    templateShapes.forEach((shape, i) => {
      const paletteColor = colorPalette[i % colorPalette.length];
      const fill = paletteColor || shape.options?.fill || "hsl(0 0% 78%)";
      const stroke = paletteColor || shape.options?.stroke || fill;
      rc.path(shape.path, { fill, stroke, strokeWidth: 1, roughness: 1.1, fillStyle: "solid" });
    });
    ctx.restore();
  }

  // Connections (only without template style)
  if (!useTemplateStyle) {
    drawConnections(ctx, rc, data);
  }

  // Nodes
  drawNodes(ctx, rc, data, colorPalette, useTemplateStyle);

  // Title
  if (data.title) {
    ctx.font = "bold 28px 'Caveat', cursive";
    ctx.fillStyle = "hsl(220, 20%, 25%)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(data.title, data.width / 2, 16);
  }
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  rc: ReturnType<typeof rough.canvas>,
  data: DiagramData
) {
  data.connections.forEach((conn) => {
    const fromNode = data.nodes.find((n) => n.id === conn.from);
    const toNode = data.nodes.find((n) => n.id === conn.to);
    if (!fromNode || !toNode) return;

    const from = getNodeCenter(fromNode);
    const to = getNodeCenter(toNode);

    rc.line(from.x, from.y, to.x, to.y, { stroke: "#555", strokeWidth: 2, roughness: 1.0 });

    // Arrowhead
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = 14;
    const edgeX = to.x - Math.cos(angle) * (toNode.width / 2 + 6);
    const edgeY = to.y - Math.sin(angle) * (toNode.height / 2 + 6);
    rc.line(edgeX, edgeY, edgeX - headLen * Math.cos(angle - Math.PI / 6), edgeY - headLen * Math.sin(angle - Math.PI / 6), { stroke: "#555", strokeWidth: 2, roughness: 0.5 });
    rc.line(edgeX, edgeY, edgeX - headLen * Math.cos(angle + Math.PI / 6), edgeY - headLen * Math.sin(angle + Math.PI / 6), { stroke: "#555", strokeWidth: 2, roughness: 0.5 });

    // Connection label
    if (conn.label) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.font = "bold 13px 'Caveat', cursive";
      const labelWidth = ctx.measureText(conn.label).width;
      const pillPad = 6;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.roundRect(midX - labelWidth / 2 - pillPad, midY - 12, labelWidth + pillPad * 2, 20, 8);
      ctx.fill();
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = "#444";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(conn.label, midX, midY);
    }
  });
}

function drawNodeShape(
  rc: ReturnType<typeof rough.canvas>,
  node: DiagramNode,
  color: string
) {
  const opts = {
    fill: color,
    fillStyle: "solid" as const,
    fillWeight: 1,
    roughness: 1.5,
    stroke: "#333",
    strokeWidth: 1.5,
  };

  switch (node.type) {
    case "ellipse":
    case "circle":
      rc.ellipse(node.x + node.width / 2, node.y + node.height / 2, node.width, node.height, opts);
      break;
    case "diamond":
      rc.polygon([
        [node.x + node.width / 2, node.y],
        [node.x + node.width, node.y + node.height / 2],
        [node.x + node.width / 2, node.y + node.height],
        [node.x, node.y + node.height / 2],
      ], opts);
      break;
    case "hexagon": {
      const cx = node.x + node.width / 2;
      const cy = node.y + node.height / 2;
      const rx = node.width / 2;
      const ry = node.height / 2;
      rc.polygon([
        [cx - rx, cy], [cx - rx * 0.5, cy - ry], [cx + rx * 0.5, cy - ry],
        [cx + rx, cy], [cx + rx * 0.5, cy + ry], [cx - rx * 0.5, cy + ry],
      ], opts);
      break;
    }
    default:
      rc.rectangle(node.x, node.y, node.width, node.height, opts);
  }
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  rc: ReturnType<typeof rough.canvas>,
  data: DiagramData,
  colorPalette: string[],
  useTemplateStyle: boolean
) {
  data.nodes.forEach((node, i) => {
    const color = node.color || colorPalette[i % colorPalette.length];
    const isFirst = i === 0;

    if (!useTemplateStyle) {
      drawNodeShape(rc, node, color);
    }

    // Label
    const fontSize = useTemplateStyle ? (isFirst ? 22 : 17) : (isFirst ? 18 : 15);
    const fontWeight = isFirst ? "bold" : "600";
    ctx.font = `${fontWeight} ${fontSize}px 'Caveat', cursive`;
    ctx.fillStyle = useTemplateStyle ? "hsl(220, 20%, 15%)" : "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = node.x + node.width / 2;
    const labelY = node.y + node.height / 2;
    const maxWidth = node.width - 16;

    // Word wrap
    const words = node.label.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize + 2;
    const totalHeight = lines.length * lineHeight;
    const startY = labelY - totalHeight / 2 + lineHeight / 2;

    if (!useTemplateStyle) {
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    lines.forEach((line, idx) => ctx.fillText(line, centerX, startY + idx * lineHeight));

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });
}
