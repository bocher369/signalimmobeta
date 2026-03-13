import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
    const MODEL = body.model || "gemini-2.0-flash";

    const geminiBody: any = {
      contents: body.contents,
    };

    if (body.systemInstruction) {
      geminiBody.systemInstruction = {
        parts: [{ text: body.systemInstruction }]
      };
    }

    if (body.generationConfig) {
      geminiBody.generationConfig = body.generationConfig;
    }

    if (body.tools) {
      geminiBody.tools = body.tools;
    }

    console.log("Calling Gemini model:", MODEL);
    console.log("API Key present:", !!GEMINI_API_KEY);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    const responseText = await geminiResponse.text();
    console.log("Gemini status:", geminiResponse.status);
    console.log("Gemini response:", responseText.substring(0, 500));

    // Always return 200 so Supabase client receives data instead of an error.
    // Wrap error responses so the frontend can inspect them.
    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ geminiError: true, status: geminiResponse.status, detail: responseText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(responseText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});