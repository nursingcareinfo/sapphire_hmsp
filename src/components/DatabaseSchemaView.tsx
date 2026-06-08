import React, { useState } from 'react';
import { Database, ShieldCheck, Key, Code, HelpCircle, Copy, Check } from 'lucide-react';

export default function DatabaseSchemaView() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sqlSchema = `-- Supabase Table Schema
CREATE TABLE IF NOT EXISTS public.nurses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    cnic TEXT NOT NULL UNIQUE,
    mobile_number TEXT,
    email_address TEXT,
    total_years_experience NUMERIC,
    city TEXT,
    neighborhood TEXT,
    shift_preferences TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nurse_id UUID REFERENCES public.nurses(user_id) ON DELETE CASCADE,
    pnmc_reg_no TEXT NOT NULL UNIQUE,
    valid_upto DATE,
    initial_reg_date DATE,
    specializations TEXT[] DEFAULT '{}',
    ocr_confidence_score NUMERIC,
    validation_status TEXT DEFAULT 'Pending_Verification',
    raw_ocr_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const rlsPolicy = `-- Row Level Security (RLS) Configuration
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Nurses can view/edit their own profiles
CREATE POLICY "Nurses can query and update their own record" 
ON public.nurses
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Nurses can view their credentials validation status
CREATE POLICY "Nurses can read their own credentials payload"
ON public.credentials
FOR SELECT
TO authenticated
USING (auth.uid() = nurse_id);

-- Policy: Edge Function service_role can perform upsert on behalf of nurses
CREATE POLICY "Service role absolute override bypass for OCR registrar"
ON public.credentials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);`;

  const edgeFunctionCode = `// Supabase Deno Edge Function: /supabase/functions/process-pnc-ocr/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenAI } from "https://esm.sh/@google/genai"

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Used inside Edge function only
  )
  
  const { pncFrontUrl, pncBackUrl, cvUrl, userId } = await req.json()
  
  // 1. Fetch documents from private storage buckets
  // 2. Initialize GoogleGenAI SDK with process.env.GEMINI_API_KEY
  // 3. Call 'gemini-3.5-flash' with the system prompt context
  // 4. Perform database transaction writing to public.nurses and public.credentials
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  })
})`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="supabase-schema-config">
      
      {/* Label and banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="font-display text-sm font-semibold tracking-tight text-slate-800 uppercase">
            Supabase Backend Integration Blueprint
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          RLS Confirmed
        </div>
      </div>

      <p className="text-slate-500 font-sans text-xs leading-relaxed max-w-2xl">
        This platform is pre-architected to seamlessly bind with your secure Supabase cloud project. Use these optimized DDL commands and Row-Level Security declarations to set up high-compliance constraints.
      </p>

      {/* Database Schema Codes Tab */}
      <div className="space-y-4">
        
        {/* SQL Tables Scheme */}
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-slate-500" />
              1. Relational PG Tables Schema (nurses & credentials)
            </span>
            <button
              onClick={() => copyToClipboard(sqlSchema, 'schema')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-1 text-[11px]"
            >
              {copiedText === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedText === 'schema' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48 whitespace-pre">
            {sqlSchema}
          </pre>
        </div>

        {/* Row Level Security Declarations */}
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              2. Row Level Security Rules (Compliance constraints)
            </span>
            <button
              onClick={() => copyToClipboard(rlsPolicy, 'rls')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-1 text-[11px]"
            >
              {copiedText === 'rls' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedText === 'rls' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48 whitespace-pre">
            {rlsPolicy}
          </pre>
        </div>

        {/* Edge Functions Code */}
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              3. Secure Middleman: Deno Edge Function
            </span>
            <button
              onClick={() => copyToClipboard(edgeFunctionCode, 'edge')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-1 text-[11px]"
            >
              {copiedText === 'edge' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedText === 'edge' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48 whitespace-pre">
            {edgeFunctionCode}
          </pre>
        </div>

      </div>

      {/* Guide Notes card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
          <Key className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-display font-semibold text-slate-800 text-xs block">Securing credentials within Supabase Vault</span>
          <p className="text-slate-500 font-sans text-xs leading-relaxed">
            Configure your <code className="font-mono bg-white px-1 py-0.5 rounded border text-indigo-600">GEMINI_API_KEY</code> within Supabase using standard shell CLI declarations: 
            <br />
            <code className="bg-slate-950 text-slate-200 px-2 py-1 rounded inline-block font-mono text-[10px] mt-1.5 border border-slate-800">
              supabase secrets set GEMINI_API_KEY=AI_STUDIO_CLIENT_KEY
            </code>
          </p>
        </div>
      </div>

    </div>
  );
}
