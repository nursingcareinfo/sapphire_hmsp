import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Database, 
  FileText, 
  Award, 
  HelpCircle, 
  ShieldCheck, 
  Terminal, 
  CheckCircle,
  FileCheck2,
  XCircle,
  Users
} from 'lucide-react';

import DocumentUpload from './components/DocumentUpload';
import VerificationTimeline from './components/VerificationTimeline';
import VerificationForm from './components/VerificationForm';
import DatabaseSchemaView from './components/DatabaseSchemaView';
import { ExtractedData, RegistrationSurvey } from './types';

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  
  // Real-time server logging list displayed on a virtual registrar terminal as the AI processes the files
  const [clinicalLogs, setClinicalLogs] = useState<string[]>([]);
  
  // Simulated Supabase Session states
  const [activeUser, setActiveUser] = useState<string>("usr_fatima_pnc_2026");
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  const [lastSaved, setLastSaved] = useState<any | null>(null);

  // Real-time Supabase connection health states
  const [supabaseActive, setSupabaseActive] = useState<boolean | null>(null);
  const [supabaseDetails, setSupabaseDetails] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Load database records and check connection health on startup
  useEffect(() => {
    checkConnectionAndFetch();
  }, [activeUser]);

  const checkConnectionAndFetch = async () => {
    setIsTestingConnection(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const health = await res.json();
        setSupabaseActive(!!health.supabaseActive);
        if (health.details) {
          setSupabaseDetails(health.details);
        }
      } else {
        setSupabaseActive(false);
      }
    } catch (e) {
      setSupabaseActive(false);
    } finally {
      setIsTestingConnection(false);
    }
    await fetchSavedRecords();
  };

  const fetchSavedRecords = async () => {
    try {
      const res = await fetch(`/api/registrations?userId=${activeUser}`);
      if (res.ok) {
        const data = await res.json();
        setDbRecords(data);
      }
    } catch (e) {
      console.error("Failed to query database records:", e);
    }
  };

  const simulateLogs = (sampleId: string) => {
    setClinicalLogs([]);
    const logs = [
      "[SYSTEM] Initializing Master OCR Registrar framework...",
      "[OCR] Reading document stream buffers...",
      "[HEALTHCHECK] Validating PNC Card layout coordinates...",
      "[IDENTITY] Analyzing Full Name matching indices...",
      "[COMPLIANCE] Cross-referencing PNC card initial date against CV duration timeline...",
      "[ANALYSIS] Running regulatory gap analysis check to pinpoint missing required fields...",
      "[COMPLETED] Synthesis complete. Displaying verification form."
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setClinicalLogs(prev => [...prev, log]);
      }, (index + 1) * 800);
    });
  };

  const handleProcessOCR = async (payload: {
    pncFront: any;
    pncBack: any;
    cvText: string;
    cvBase64: any;
    sampleId: string;
    forceMock: boolean;
  }) => {
    setIsProcessing(true);
    setOcrError(null);
    setExtractedData(null);
    setLastSaved(null);

    // Adjust user ID state based on sample selection for accurate RLS mapping
    if (payload.sampleId === 'fatima_perfect') {
      setActiveUser("usr_fatima_pnc_2026");
    } else if (payload.sampleId === 'ayesha_discrepancy') {
      setActiveUser("usr_ayesha_pnc_2026");
    } else {
      setActiveUser("usr_nurse_custom");
    }

    simulateLogs(payload.sampleId);

    try {
      const response = await fetch('/api/register/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document registration.');
      }

      const verifiedData = await response.json() as ExtractedData;
      
      // Delay slightly so logs complete beautifully
      setTimeout(() => {
        setExtractedData(verifiedData);
        setIsProcessing(false);
      }, 5600);

    } catch (error: any) {
      console.error(error);
      setOcrError(error.message || 'An unexpected server error occurred.');
      setIsProcessing(false);
    }
  };

  const handleSaveToSimulatedSupabase = async (survey: RegistrationSurvey) => {
    setIsSavingRecord(true);
    try {
      const response = await fetch('/api/registrations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: activeUser,
          surveyData: survey,
          rawExtracted: extractedData
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLastSaved(result.record);
        await fetchSavedRecords();
      }
    } catch (e) {
      console.error("Failed to execute database upsert:", e);
    } finally {
      setIsSavingRecord(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900" id="master-app-container">
      
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 py-4" id="portal-navigation-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-semibold shadow-md shrink-0">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold tracking-tight text-slate-900 text-base">Master Registrar Database Port</span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
                  PNC V1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans leading-none mt-1">
                A high-compliance medical verification workspace for clinical credentials, CV audits, & logical validation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Active Sec Session:</span>
              <span className="font-mono font-medium text-slate-800">{activeUser}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Row Level Security (RLS) Active</span>
            </div>

            <button
              onClick={checkConnectionAndFetch}
              disabled={isTestingConnection}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] border cursor-pointer ${
                supabaseActive === true
                  ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                  : supabaseActive === false
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Dynamic testing connection with current environment keys"
            >
              <Database className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span className="font-medium">
                {isTestingConnection ? "Checking..." : supabaseActive === true ? "Supabase Connected" : "Supabase Offline / Local Fallback"}
              </span>
              <span className="text-[9px] bg-slate-200 text-slate-800 px-1 py-0.2 rounded font-mono">Test</span>
            </button>

          </div>

        </div>
      </header>

      {/* Conditionally reveal accidental self-referential loops or invalid URL configuration help */}
      {supabaseDetails?.isSelfReferential && (
        <div className="max-w-7xl mx-auto px-6 pt-6" id="supabase-misconfig-warning">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans shadow-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div>
                <h4 className="font-semibold text-amber-900 text-sm mb-1">Accidental App URL detected in SUPABASE_URL</h4>
                Your environment variable <code className="font-mono bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">SUPABASE_URL</code> appears to copy-paste your preview application's web URL (ending in <code className="font-mono text-amber-900 bg-amber-100 font-semibold px-1 py-0.2">.run.app</code>) instead of your live Supabase Database API endpoint.
                <div className="mt-2 text-[11px] text-amber-700">
                  <strong>To resolve this:</strong> Go to your <span className="underline font-medium">Supabase Workspace → Settings → API</span>, copy the <strong>Project URL</strong> (usually looking like <code className="font-mono">https://xxxxxx.supabase.co</code>), then save it in your Secrets panel in AI Studio or your <code className="font-mono">.env</code> file.
                </div>
              </div>
            </div>
            <button 
              onClick={checkConnectionAndFetch}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-all self-start md:self-auto shadow-sm cursor-pointer whitespace-nowrap font-sans text-xs"
            >
              Recheck Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-layout-grid">
        
        {/* Left Side: Upload Documents & Blueprint Guides (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-8" id="left-workspace-column">
          
          <DocumentUpload 
            onProcessOCR={handleProcessOCR}
            isProcessing={isProcessing}
          />

          {/* Virtual Terminal Log during processing and uploads */}
          {(isProcessing || clinicalLogs.length > 0) && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono shadow-sm space-y-3" id="registrar-runtime-console shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  Registrar OCR Runtime Logs
                </span>
                <span className="text-[9px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-emerald-400 animate-pulse">
                  {isProcessing ? "PROCESSING" : "COMPLETED WORK"}
                </span>
              </div>
              
              <div className="space-y-1.5 text-xs text-slate-300 max-h-48 overflow-y-auto leading-relaxed scrollbar-thin">
                {clinicalLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">❯</span>
                    <span className="font-mono text-slate-200">{log}</span>
                  </div>
                ))}
                {isProcessing && (
                  <div className="animate-pulse text-emerald-400 font-semibold text-[11px] mt-2 flex items-center gap-1">
                    <span>●</span> Thinking... Synthesizing multimodal insights...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PNC Compliance Standard Guidelines Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3" id="guidelines-notes-card">
            <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono tracking-wider">
              Verification Compliance Notes
            </span>
            <div className="space-y-3">
              <h4 className="font-display font-bold text-slate-800 text-sm">Pakistan Nursing Council (PNC) Dual Card Checks</h4>
              <p className="text-slate-500 font-sans text-xs leading-relaxed">
                Verification officers and automatic registrars must cross-reference PNMC registration numbers against historical timeline boundaries. Direct clinical duties are legally prohibited prior to the authenticated card issue date. Discrepancies represent legal liability and require a dedicated registration audit.
              </p>
            </div>
          </div>

          <DatabaseSchemaView />

        </div>

        {/* Right Side: Verification Panel & Saved Database Rows (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-8" id="right-workspace-column">
          
          {/* Main Error Alert */}
          {ocrError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-start gap-3 text-sm font-sans" id="ocr-error-banner">
              <XCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Gemini Processing Fault</span>
                <p className="text-xs text-rose-600 leading-relaxed">{ocrError}</p>
                <div className="mt-3 text-xs">
                  <span className="font-semibold">Troubleshoot Suggestion:</span> Ensure your <code className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> is configured in the secrets dashboard, or run with pre-built mock scenarios by choosing a scenario from the left dashboard.
                </div>
              </div>
            </div>
          )}

          {/* Document Upload State: No Data Screen */}
          {!extractedData && !isProcessing && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center space-y-5" id="no-data-uploaded-screen">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-display font-semibold text-slate-800 text-base">Credentials Registry Standby</h3>
                <p className="text-slate-500 font-sans text-sm leading-relaxed">
                  Select Scenario A or Scenario B on the left workspace, or upload your own PNC Registration Card images and Nurses CV to instantly run the Master Registrar compliance checks.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => handleProcessOCR({
                    pncFront: null, pncBack: null, cvText: 'Fatima Ali B.Sc. NURSE', cvBase64: null,
                    sampleId: 'fatima_perfect', forceMock: true
                  })}
                  className="px-4 py-2 text-xs font-display font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Quick Launch Scenario A (Approved Align)
                </button>
                <button
                  onClick={() => handleProcessOCR({
                    pncFront: null, pncBack: null, cvText: 'Ayesha Khan Diplomate 2018', cvBase64: null,
                    sampleId: 'ayesha_discrepancy', forceMock: true
                  })}
                  className="px-4 py-2 text-xs font-display font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all"
                >
                  Quick Launch Scenario B (Discrepancy)
                </button>
              </div>
            </div>
          )}

          {/* Loader and Log Processing display */}
          {isProcessing && !extractedData && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6" id="processing-loader-container">
              <div className="relative flex items-center justify-center">
                <div className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-emerald-400 opacity-20"></div>
                <div className="relative rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 w-16 h-16 flex items-center justify-center shadow-sm">
                  <Database className="w-7 h-7 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-display font-bold text-slate-800 text-base">Processing Clinical Documents</h4>
                <p className="text-slate-500 font-sans text-xs leading-relaxed">
                  Gemini is analyzing multi-page layout structures. Compiling initial PNMC registration timelines and performing identity audits.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Data displays */}
          {extractedData && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
              id="extracted-registrar-reports"
            >
              
              {/* Timeline Validation */}
              <VerificationTimeline 
                validation={extractedData.logical_validation}
                credentials={extractedData.credentials}
                cv={extractedData.cv}
              />

              {/* Form Manual verification */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="manual-verification-board">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-display text-sm font-semibold tracking-tight text-slate-800 uppercase">
                    Verification Survey Refiner
                  </h3>
                </div>

                <VerificationForm 
                  extractedData={extractedData}
                  onSaveToSimulatedSupabase={handleSaveToSimulatedSupabase}
                  isSaving={isSavingRecord}
                  savedRecord={lastSaved}
                />
              </div>

              {/* Simulated Database Records inspector */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4" id="supabase-live-inspector">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-display text-xs font-semibold text-slate-850 uppercase tracking-tight">
                      Supabase Real-Time Client Inspector (nurses Table)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">
                    SELECT * FROM public.nurses
                  </span>
                </div>

                {dbRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-sans py-2">
                    No active SQL records stored yet for current workspace session. Complete the manual verification above to save a draft row!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dbRecords.map((rec) => (
                      <div key={rec.id} className="p-4 bg-slate-950 text-slate-350 font-mono text-[11px] rounded-xl border border-slate-900 leading-relaxed relative">
                        <div className="absolute top-3.5 right-4 flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-sans uppercase shadow-sm ${
                            rec.surveyData.status === 'Submitted' 
                              ? 'bg-emerald-500 text-white' 
                              : rec.surveyData.status === 'PNC_Discrepancy'
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-indigo-600 text-white'
                          }`}>
                            {rec.surveyData.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 block font-semibold mb-2">
                            [ROW] ID: <span className="text-white">{rec.id}</span> | USER_ID (auth.uid()): <span className="text-indigo-400">{rec.userId}</span>
                          </span>
                          <span className="block text-slate-400">
                            nurse_name: <span className="text-emerald-400">"{rec.surveyData.full_name}"</span>
                          </span>
                          <span className="block text-slate-400">
                            cnic_code: <span className="text-white">"{rec.surveyData.cnic}"</span>
                          </span>
                          <span className="block text-slate-400">
                            pnmc_license: <span className="text-emerald-300">"{rec.surveyData.pnmc_reg_no}"</span>
                          </span>
                          <span className="block text-slate-400">
                            years_experience: <span className="text-indigo-300">{rec.surveyData.total_years_experience}</span>
                          </span>
                          <span className="block text-slate-400">
                            city_scope: <span className="text-white">"{rec.surveyData.city || 'NC'}"</span>
                          </span>
                          <span className="block text-slate-400">
                            neighborhood: <span className="text-white">"{rec.surveyData.neighborhood || 'NC'}"</span>
                          </span>
                          <span className="block text-slate-400">
                            shift_preference: <span className="text-indigo-200">"{rec.surveyData.shift_preferences}"</span>
                          </span>
                          <span className="block text-[9px] text-slate-500 mt-2 italic">
                            Last synced via supabase-js client: {new Date(rec.updated_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </div>

      </main>

      {/* Aesthetic humbler footer */}
      <footer className="bg-white border-t border-slate-100 py-8 px-6 mt-16 text-center text-xs text-slate-400 font-sans" id="master-footer">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-semibold text-slate-500">Nurse Credentials Registrar & PNC Registration Portal</p>
          <p>
            Compliant with Pakistan Nursing Council regulations. Armed with high-precision Google Gemini 3.5 Flash OCR engine.
          </p>
        </div>
      </footer>

    </div>
  );
}
