import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert infographic designer using AntV Infographic syntax.

AntV Infographic uses a YAML-like indented syntax. Here are EXACT working examples:

EXAMPLE 1 - Simple list:
infographic list-row-simple-horizontal-arrow
data
  title Project Phases
  lists
    - label Phase 1
      desc Planning and research
    - label Phase 2
      desc Design and prototyping
    - label Phase 3
      desc Development

EXAMPLE 2 - Steps:
infographic sequence-steps-simple
data
  title How It Works
  sequences
    - label Step 1
      desc Sign up for free
    - label Step 2
      desc Create your project
    - label Step 3
      desc Launch

EXAMPLE 3 - Comparison:
infographic compare-binary-card
data
  title Pros vs Cons
  lists
    - label Advantage 1
      desc Fast performance
      group pros
    - label Advantage 2
      desc Easy to use
      group pros
    - label Disadvantage 1
      desc Limited features
      group cons

EXAMPLE 4 - Icon cards:
infographic list-grid-icon-card
data
  title Key Features
  lists
    - label Speed
      desc Lightning fast processing
      icon rocket
    - label Security
      desc Enterprise-grade protection
      icon shield
    - label Scale
      desc Grows with your needs
      icon chart-line

EXAMPLE 5 - Timeline:
infographic sequence-timeline-vertical
data
  title Company History
  sequences
    - label Founded
      desc Started in a garage
    - label Series A
      desc Raised $10M
    - label IPO
      desc Went public

AVAILABLE TEMPLATES (use exactly these names):
Lists: list-row-simple-horizontal-arrow, list-row-horizontal-icon-arrow, list-grid-compact-card, list-row-simple-vertical, list-column-simple, list-grid-icon-card, list-row-simple-horizontal-number
Steps/Sequence: sequence-steps-simple, sequence-stairs-front-pill-badge, sequence-steps-card, sequence-snake-horizontal-card, sequence-timeline-horizontal, sequence-timeline-vertical
Comparison: compare-binary-card, compare-binary-simple, compare-swot-card, compare-quadrant-simple
Hierarchy: hierarchy-mindmap-right, hierarchy-mindmap-lr, hierarchy-org-chart, hierarchy-tree-vertical
Relations: relation-dagre-flow-tb-simple-circle-node, relation-dagre-flow-lr-card, relation-radial-simple, relation-cycle-simple
Charts: chart-pie-simple, chart-bar-simple, chart-column-simple, chart-line-simple

CRITICAL RULES:
1. Return ONLY the raw syntax. NO markdown backticks, NO explanation, NO comments.
2. Use EXACTLY 2-space indentation (not tabs).
3. The first line MUST be: infographic <template-name>
4. The second line MUST be: data
5. Detect input language. If Hebrew, ALL text MUST be in Hebrew.
6. Labels: 1-4 words MAX. Short and punchy.
7. Descriptions: One concise sentence.
8. Use 3-7 items.
9. Choose the template that BEST fits the content structure.
10. For list templates use "lists", for sequence templates use "sequences".
11. Do NOT add any fields not shown in the examples above.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Convert this text into an AntV Infographic. Choose the best template. Return ONLY the syntax, nothing else:\n\n${text}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add AI credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up: remove markdown code blocks if present
    let syntax = content.trim();
    if (syntax.startsWith("```")) {
      syntax = syntax.replace(/^```(?:infographic|text|yaml)?\n?/, "").replace(/\n?```$/, "");
    }
    
    // Ensure it starts with "infographic"
    if (!syntax.startsWith("infographic")) {
      const idx = syntax.indexOf("infographic");
      if (idx !== -1) {
        syntax = syntax.substring(idx);
      }
    }

    console.info("Generated AntV syntax:", syntax.substring(0, 300));

    return new Response(JSON.stringify({ syntax }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
