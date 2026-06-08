import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

serve(async (req) => {
  try {
    const { pncFront, pncBack, cvBase64 } = await req.json();

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Build multimodal contents
    const contents: any[] = [];

    if (pncFront) {
      contents.push({
        inlineData: {
          mimeType: pncFront.mimeType || "image/jpeg",
          data: pncFront.data.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }

    if (pncBack) {
      contents.push({
        inlineData: {
          mimeType: pncBack.mimeType || "image/jpeg",
          data: pncBack.data.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
    }

    if (cvBase64) {
      contents.push({
        inlineData: {
          mimeType: cvBase64.mimeType || "application/pdf",
          data: cvBase64.data.replace(/^data:application\/\w+;base64,/, ""),
        },
      });
    }

    const systemPrompt = `You are a medical registration OCR assistant. Extract the following from the PNC card and CV:

1. Full name (exactly as on card)
2. CNIC number (format: XXXXX-XXXXXXX-X)
3. Mobile number (with country code +92)
4. Email address
5. Total years of experience (numeric)
6. PNC registration number
7. PNC license valid upto date
8. PNC initial registration date
9. Specializations (array of strings)
10. Professional qualification

Return ONLY a valid JSON object. Use "NC" for missing strings, null for missing dates, 0 for missing numbers.

JSON Schema:
{
  "full_name": "string",
  "cnic": "string",
  "mobile_number": "string",
  "email_address": "string",
  "total_years_experience": number,
  "pnmc_reg_no": "string",
  "valid_upto": "string or null",
  "initial_reg_date": "string or null",
  "specializations": ["string"],
  "qualification": "string"
}`;

    contents.push({ text: systemPrompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: { parts: contents },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      }
    );

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
    const data = JSON.parse(cleaned);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message || "OCR failed" }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
