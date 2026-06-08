import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Ensure GEMINI_API_KEY is available or output a placeholder error
const apiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Using simulated responses.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Supabase client instance with automatic hot-reload / fetch
let supabaseInstance: any = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      console.log(`[SUPABASE] Initializing Supabase client. URL: ${supabaseUrl}`);
      supabaseInstance = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn("[SUPABASE] Client not initialized. Missing environment variables.");
    }
  }
  return supabaseInstance;
}

// In-memory registration data store simulating Supabase auth.uid() scoping
const simulatedRegistrations: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to handle JSON payloads with generous limits for uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      supabaseActive: !!getSupabaseClient()
    });
  });

  // API Route: Get Saved Registrations
  app.get("/api/registrations", async (req, res) => {
    // Simulates an RLS (Row Level Security) query filtered by the mock active session (e.g. nurse ID)
    const userId = req.query.userId || "usr_nurse_default";
    
    const db = getSupabaseClient();
    if (db) {
      try {
        console.log(`[SUPABASE] Performing authenticated SELECT from 'nurses' where user_id = ${userId}`);
        const { data: nurses, error: errNurses } = await db
          .from('nurses')
          .select('*')
          .eq('user_id', userId);

        if (errNurses) throw errNurses;

        if (nurses && nurses.length > 0) {
          // Join credentials payload
          const { data: credentials, error: errCreds } = await db
            .from('credentials')
            .select('*')
            .eq('nurse_id', userId);

          const joinedRecords = nurses.map((n: any) => {
            const cred = credentials?.find((c: any) => c.nurse_id === n.user_id);
            return {
              id: n.id,
              userId: n.user_id,
              created_at: n.created_at,
              updated_at: n.updated_at,
              surveyData: {
                full_name: n.full_name,
                cnic: n.cnic,
                mobile_number: n.mobile_number,
                email_address: n.email_address,
                total_years_experience: Number(n.total_years_experience) || 0,
                city: n.city,
                neighborhood: n.neighborhood,
                shift_preferences: n.shift_preferences,
                is_verified_by_user: n.is_verified,
                status: cred?.validation_status || 'Draft',
                pnmc_reg_no: cred?.pnmc_reg_no || 'NC',
                valid_upto: cred?.valid_upto || 'NC',
                initial_reg_date: cred?.initial_reg_date || 'NC',
                specializations: cred?.specializations || []
              },
              rawExtracted: cred?.raw_ocr_payload || null,
              isRealSupabaseRow: true
            };
          });
          return res.json(joinedRecords);
        }
      } catch (err: any) {
        console.warn(`[SUPABASE FALLBACK WARNING] Read failed. Tables may need schema update or are not provisioned yet: ${err.message || err}`);
      }
    }

    const userRegistrations = simulatedRegistrations.filter(r => r.userId === userId);
    res.json(userRegistrations);
  });

  // API Route: Upsert Registration (Simulating Supabase Edge Function save workflow)
  app.post("/api/registrations/save", async (req, res) => {
    const { userId, surveyData, rawExtracted } = req.body;
    const uid = userId || "usr_nurse_default";

    if (!surveyData) {
      return res.status(400).json({ error: "Missing survey data." });
    }

    const db = getSupabaseClient();
    let savedRecord = null;
    let didSaveToSupabase = false;

    if (db) {
      try {
        console.log(`[SUPABASE] Attempting direct database UPSERT transaction for: ${uid}`);
        
        // 1. Upsert into 'nurses'
        const nurseObj = {
          user_id: uid,
          full_name: surveyData.full_name || 'NC',
          cnic: surveyData.cnic || 'NC',
          mobile_number: surveyData.mobile_number || 'NC',
          email_address: surveyData.email_address || 'NC',
          total_years_experience: Number(surveyData.total_years_experience) || 0,
          city: surveyData.city || 'NC',
          neighborhood: surveyData.neighborhood || 'NC',
          shift_preferences: surveyData.shift_preferences || 'NC',
          is_verified: surveyData.is_verified_by_user || false,
          updated_at: new Date().toISOString()
        };

        const { data: nurseRow, error: nurseErr } = await db
          .from('nurses')
          .upsert(nurseObj, { onConflict: 'user_id' })
          .select();

        if (nurseErr) throw nurseErr;

        // 2. Upsert into 'credentials'
        if (surveyData.pnmc_reg_no && surveyData.pnmc_reg_no !== 'NC') {
          const credObj = {
            nurse_id: uid,
            pnmc_reg_no: surveyData.pnmc_reg_no,
            valid_upto: surveyData.valid_upto && surveyData.valid_upto !== 'NC' ? surveyData.valid_upto : null,
            initial_reg_date: surveyData.initial_reg_date && surveyData.initial_reg_date !== 'NC' ? surveyData.initial_reg_date : null,
            specializations: surveyData.specializations || [],
            ocr_confidence_score: rawExtracted?.confidence_score || 0.95,
            validation_status: surveyData.status || 'Draft',
            raw_ocr_payload: rawExtracted || null
          };

          const { error: credErr } = await db
            .from('credentials')
            .upsert(credObj, { onConflict: 'pnmc_reg_no' });

          if (credErr) throw credErr;
        }

        didSaveToSupabase = true;
        savedRecord = {
          id: nurseRow?.[0]?.id || `supabase_row_${Date.now()}`,
          userId: uid,
          created_at: nurseRow?.[0]?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          surveyData,
          rawExtracted,
          savedToSupabase: true
        };
        console.log(`[SUPABASE] Save completed successfully to live DB: ${uid}`);

      } catch (err: any) {
        console.warn(`[SUPABASE FALLBACK WARNING] Write failed: ${err.message || err}. Saving to simulated local store instead.`);
      }
    }

    const existingIndex = simulatedRegistrations.findIndex(r => r.userId === uid);
    
    const fallbackRecord = {
      id: existingIndex >= 0 ? simulatedRegistrations[existingIndex].id : `reg_${Math.random().toString(36).substr(2, 9)}`,
      userId: uid,
      created_at: existingIndex >= 0 ? simulatedRegistrations[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      surveyData,
      rawExtracted: rawExtracted || null,
      savedToSupabase: didSaveToSupabase
    };

    if (existingIndex >= 0) {
      simulatedRegistrations[existingIndex] = fallbackRecord;
    } else {
      simulatedRegistrations.push(fallbackRecord);
    }

    const returnedRecord = savedRecord || fallbackRecord;
    return res.json({ success: true, record: returnedRecord, liveSupabase: didSaveToSupabase });
  });

  // API Route: Run Master Registrar extraction
  app.post("/api/register/ocr", async (req, res) => {
    const { pncFront, pncBack, cvText, cvBase64, sampleId } = req.body;

    console.log(`[OCR Request] Processing. SampleId: ${sampleId || 'Real Upload'}`);

    // If API key is missing, or user asks to use simulated mock OCR (for demo speed)
    const isMock = !apiKey || req.body.forceMock === true;

    if (isMock) {
      // Return beautiful pre-configured realistic outcomes mapping the samples
      const mockResult = getMockOCRResponse(sampleId);
      return res.json(mockResult);
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({ 
        error: "Gemini client could not be initialized. Please check your GEMINI_API_KEY secret." 
      });
    }

    try {
      // Build multimodal contents array
      const contentsParts: any[] = [];

      // Add PNC Front if supplied
      if (pncFront) {
        contentsParts.push({
          inlineData: {
            mimeType: pncFront.mimeType || "image/jpeg",
            data: pncFront.data.replace(/^data:image\/\w+;base64,/, "")
          }
        });
      }

      // Add PNC Back if supplied
      if (pncBack) {
        contentsParts.push({
          inlineData: {
            mimeType: pncBack.mimeType || "image/jpeg",
            data: pncBack.data.replace(/^data:image\/\w+;base64,/, "")
          }
        });
      }

      // Add CV if supplied (either as a base64 file or text representation)
      if (cvBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: cvBase64.mimeType || "application/pdf",
            data: cvBase64.data.replace(/^data:application\/\w+;base64,/, "")
          }
        });
      } else if (cvText) {
        contentsParts.push({
          text: `Here is the text extracted from the Nurse's CV:\n\n${cvText}`
        });
      }

      // Prompt enforcing ALL constraints and output rules
      const systemPrompt = `You are a Senior Medical Registrar and OCR Architect for a high-compliance medical staffing platform. Your expertise is in verifying professional credentials and cross-referencing document data with 100% accuracy.

Task:
You will process three input files: (1) PNC Card Front image, (2) PNC Card Back image, and (3) a Nurse's CV. You will extract and synthesize this data into a structured JSON object to pre-populate the Home Nursing Platform Registration Survey.

Chain-of-Thought Processing:
1. Credential OCR:
   - Identify the "PNMC REG. NO" (e.g., PK-K-22-A-290169).
   - Identify the "VALID UPTO" date and "INITIAL REG. DATE" from the PNC card.
2. Identity Verification:
   - Extract the Full Name (confirming it matches the card exactly).
   - CNIC number.
   - Specializations (e.g., Pediatric Nursing, General Nursing, ICU Care) from the card reverse or front.
3. Resume Parsing:
   - Analyze the CV/Resume for mobile_number, email_address, and total_years_experience. State this precisely.
4. Logical Validation:
   - Compare the INITIAL REG. DATE from the PNC card with the work history on the CV.
   - Calculate how many years have passed since the INITIAL REG. DATE to today (current year: 2026).
   - Calculate the total years of experience claimed on the CV work timeline.
   - If the years of experience claimed on the CV exceed the time since their initial registration (for example, claiming 10 years experience, but INITIAL REG. DATE was in 2024), set timeline_discrepancy to true, and write a thorough flag/warning in validation_notes.
5. Gap Analysis:
   - Look for fields required for of home nursing registry: "City", "Neighborhood", and "Shift Preferences" (e.g. Morning, Evening, Night, 24-Hour, Rotational).
   - If they are missing or not communicable from the documents, list them in the "manual_entry_required" array.

Output format constraint:
Return ONLY a valid raw JSON object matching the JSON response schema. Do not output markdown code blocks (\`\`\`json), do not include preambles, and do not say "Here is the JSON". If any string field is missing, use "NC" (Not Communicated).

JSON Schema matching exactly the structure defined here:
{
  "credentials": {
    "pnmc_reg_no": "string",
    "valid_upto": "string",
    "initial_reg_date": "string",
    "full_name": "string",
    "cnic": "string",
    "specializations": ["string"]
  },
  "cv": {
    "mobile_number": "string",
    "email_address": "string",
    "total_years_experience": number_or_NC,
    "education": ["string"],
    "skills": ["string"],
    "work_history": [
      {
        "role": "string",
        "organization": "string",
        "duration": "string"
      }
    ]
  },
  "logical_validation": {
    "is_valid": boolean,
    "timeline_discrepancy": boolean,
    "years_experience_vs_registration_years": number,
    "time_since_registration_years": number,
    "validation_notes": "string",
    "alerts": [
      {
        "type": "discrepancy" | "warning" | "info",
        "field": "string",
        "message": "string"
      }
    ]
  },
  "gap_analysis": {
    "missing_required_fields": ["string"],
    "manual_entry_required": ["string"]
  },
  "confidence_score": number_between_0_and_1
}`;

      // Append system directive text
      contentsParts.push({ text: systemPrompt });

      // Call Gemini 3.5 Flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contentsParts },
        config: {
          responseMimeType: "application/json",
          temperature: 0.1, // deterministic high-precision OCR config
        }
      });

      const rawText = response.text || "{}";
      const cleanedJson = rawText.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
      
      const parsedData = JSON.parse(cleanedJson);
      res.json(parsedData);

    } catch (error: any) {
      console.error("Gemini Extraction Error:", error);
      res.status(500).json({ 
        error: `OCR Extraction Failed: ${error.message || error}`,
        details: "Ensure uploaded files are valid and the API keys are correctly configured."
      });
    }
  });

  // Vite development integration or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open in browser: http://localhost:${PORT}`);
  });
}

// Pre-baked samples that mirror exact professional matching logic or discrepancy logic of "Master Registrar" system prompt
function getMockOCRResponse(sampleId: string) {
  if (sampleId === "fatima_perfect") {
    return {
      credentials: {
        pnmc_reg_no: "PK-K-22-A-290169",
        valid_upto: "2029-12-15",
        initial_reg_date: "2022-03-10",
        full_name: "Fatima Ali",
        cnic: "42101-9876543-2",
        specializations: ["Pediatric Intensive Care", "Neonatal Nursing"]
      },
      cv: {
        mobile_number: "+92-333-1234567",
        email_address: "fatima.nurse.pnc@gmail.com",
        total_years_experience: 4,
        education: ["B.Sc. in Nursing - Aga Khan University"],
        skills: ["Ventilator Management", "Pediatric Resuscitation", "PALS Certified"],
        work_history: [
          {
            role: "Senior ICU Charge Nurse",
            organization: "National Institute of Child Health (NICH), Karachi",
            duration: "2024 - Present"
          },
          {
            role: "Pediatric Nurse",
            organization: "Aga Khan University Hospital",
            duration: "2022 - 2024"
          }
        ]
      },
      logical_validation: {
        is_valid: true,
        timeline_discrepancy: false,
        years_experience_vs_registration_years: 4,
        time_since_registration_years: 4.25,
        validation_notes: "Identity and credential cross-checks passed with 100% alignment. Professional experience (4 years claimed) matches legal service eligibility window since Initial Registration (March 2022, approx 4.25 years of registered clinical eligibility in 2026). License validity extends until Dec 2029.",
        alerts: [
          {
            type: "info",
            field: "valid_upto",
            message: "PNC License valid. Expiry date check succeeded."
          }
        ]
      },
      gap_analysis: {
        missing_required_fields: ["City", "Neighborhood", "Shift Preferences"],
        manual_entry_required: ["City", "Neighborhood", "Shift Preferences"]
      },
      confidence_score: 0.99
    };
  } else if (sampleId === "ayesha_discrepancy") {
    return {
      credentials: {
        pnmc_reg_no: "PK-P-24-F-310492",
        valid_upto: "2028-06-20",
        initial_reg_date: "2024-05-18",
        full_name: "Ayesha Khan",
        cnic: "37405-1234567-1",
        specializations: ["Geriatric Palliative Home Care", "General Medical-Surgical"]
      },
      cv: {
        mobile_number: "+92-312-9876543",
        email_address: "ayesha.khan94@yahoo.com",
        total_years_experience: 8,
        education: ["General Nursing Diploma - Pakistan Institute of Medical Sciences (PIMS)"],
        skills: ["Elderly Mobility Therapy", "Catheterization", "Wound Dressings"],
        work_history: [
          {
            role: "Lead Home Health Officer",
            organization: "Palliative Care Pakistan Services",
            duration: "2018 - Present"
          }
        ]
      },
      logical_validation: {
        is_valid: false,
        timeline_discrepancy: true,
        years_experience_vs_registration_years: 8,
        time_since_registration_years: 2.05,
        validation_notes: "HIGH VIOLATION FLAG: Discrepancy identified during registrar cross-reference timeline analysis. The nurse claims 8 years of professional clinical experience on her CV (timeline commencing 2018), but her official Pakistan Nursing Council (PNC) initial registration date is May 18, 2024. This leaves a gap of 6 years where practice might have been conducted prior to obtaining an official registered nurse license.",
        alerts: [
          {
            type: "discrepancy",
            field: "total_years_experience",
            message: "Experience claimed (8 yrs) exceeds legal register duration (2.05 yrs) by ~6 yrs."
          },
          {
            type: "warning",
            field: "pnmc_reg_no",
            message: "Audit required. Clinical practice prior to initial registration date must be confirmed."
          }
        ]
      },
      gap_analysis: {
        missing_required_fields: ["Neighborhood", "Shift Preferences"],
        manual_entry_required: ["Neighborhood", "Shift Preferences"]
        // Let's assume raw text states City is Rawalpindi, but Neighborhood is NC.
      },
      confidence_score: 0.98
    };
  } else {
    // Default NC response fallback
    return {
      credentials: {
        pnmc_reg_no: "PK-K-22-A-290000",
        valid_upto: "NC",
        initial_reg_date: "NC",
        full_name: "NC",
        cnic: "NC",
        specializations: []
      },
      cv: {
        mobile_number: "NC",
        email_address: "NC",
        total_years_experience: "NC",
        education: [],
        skills: [],
        work_history: []
      },
      logical_validation: {
        is_valid: false,
        timeline_discrepancy: false,
        years_experience_vs_registration_years: 0,
        time_since_registration_years: 0,
        validation_notes: "Incomplete document uploads. Mandatory registration timeline parsing from PNC card and CV could not be matched.",
        alerts: [
          {
            type: "warning",
            field: "documents",
            message: "Missing mandatory PNG images or credential uploads."
          }
        ]
      },
      gap_analysis: {
        missing_required_fields: ["City", "Neighborhood", "Shift Preferences"],
        manual_entry_required: ["City", "Neighborhood", "Shift Preferences"]
      },
      confidence_score: 0.0
    };
  }
}

startServer();
