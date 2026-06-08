import { useState, useRef } from 'react';
import { supabase } from './utils/supabase';
import type { ExtractedData, SurveyResponse } from './types';

type Step = 'upload' | 'survey' | 'done';

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const frontRef = useRef<File | null>(null);
  const backRef = useRef<File | null>(null);
  const cvRef = useRef<File | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontRef.current) {
      setOcrError("PNC Front image is required");
      return;
    }

    setIsProcessing(true);
    setOcrError(null);

    try {
      const frontData = await fileToBase64(frontRef.current);
      const backData = backRef.current ? await fileToBase64(backRef.current) : null;
      const cvData = cvRef.current ? await fileToBase64(cvRef.current) : null;

      const { data, error } = await supabase.functions.invoke('process-pnc-ocr', {
        body: {
          pncFront: { data: frontData, mimeType: frontRef.current.type },
          pncBack: backData ? { data: backData, mimeType: backRef.current!.type } : null,
          cvBase64: cvData ? { data: cvData, mimeType: cvRef.current!.type } : null,
        },
      });

      if (error) throw error;
      setExtracted(data);
      setStep('survey');
    } catch (err: any) {
      // Fallback: allow manual entry without OCR
      console.error(err);
      setOcrError(err.message || "OCR failed. You can still fill the form manually.");
      setStep('survey');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSurveySubmit = async (surveyData: SurveyResponse) => {
    const { error } = await supabase.from('survey_responses').insert({
      ocr_name: extracted?.full_name || null,
      ocr_cnic: extracted?.cnic || null,
      ocr_mobile: extracted?.mobile_number || null,
      ocr_email: extracted?.email_address || null,
      ocr_experience_years: extracted?.total_years_experience || null,
      ocr_pnmc_reg_no: extracted?.pnmc_reg_no || null,
      ocr_credentials: extracted || null,
      section_1: surveyData.section_1,
      section_2: surveyData.section_2,
      section_3: surveyData.section_3,
      section_4: surveyData.section_4,
      section_5: surveyData.section_5,
      section_6: surveyData.section_6,
      section_7: surveyData.section_7,
      consent_accepted: surveyData.consent_accepted,
    });

    if (error) {
      console.error('Submit error:', error);
      alert('Failed to submit. Please try again.');
      return;
    }

    setSubmitted(true);
  };

  if (step === 'done' && submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-lg text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Survey Submitted</h2>
          <p className="text-slate-600 text-sm">Thank you for participating. Your responses have been recorded for the HMSP nurse viability study.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" id="master-app-container">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white font-semibold">
            HMSP
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-base">Nurse Registration Survey</div>
            <div className="text-xs text-slate-500">Home Nursing Platform — Viability Study 2026</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {step === 'upload' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Upload your documents</h2>
            <p className="text-sm text-slate-500 mb-6">
              Upload your PNC license card (front and back) and CV/resume. We'll extract your personal details automatically.
            </p>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  PNC Card — Front <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { frontRef.current = e.target.files?.[0] || null; }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PNC Card — Back</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { backRef.current = e.target.files?.[0] || null; }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CV / Resume (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => { cvRef.current = e.target.files?.[0] || null; }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              {ocrError && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">
                  {ocrError}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Processing documents...' : 'Continue to Survey'}
              </button>
            </form>
          </div>
        )}

        {step === 'survey' && (
          <SurveyForm
            extracted={extracted}
            onSubmit={handleSurveySubmit}
            onBack={() => setStep('upload')}
          />
        )}
      </main>
    </div>
  );
}
