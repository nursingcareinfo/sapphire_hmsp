import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, ShieldAlert, Award, FileUp } from 'lucide-react';

interface DocumentUploadProps {
  onProcessOCR: (payload: {
    pncFront: any;
    pncBack: any;
    cvText: string;
    cvBase64: any;
    sampleId: string;
    forceMock: boolean;
  }) => void;
  isProcessing: boolean;
}

export default function DocumentUpload({ onProcessOCR, isProcessing }: DocumentUploadProps) {
  const [pncFront, setPncFront] = useState<{ name: string; data: string; size: string } | null>(null);
  const [pncBack, setPncBack] = useState<{ name: string; data: string; size: string } | null>(null);
  const [cvDoc, setCvDoc] = useState<{ name: string; data: string; text?: string; size: string } | null>(null);
  const [activeSample, setActiveSample] = useState<string>('');
  const [useRealGemini, setUseRealGemini] = useState<boolean>(true); // default to calling actual server-side Gemini unless forced to use our structured sample logic directly

  const pncFrontRef = useRef<HTMLInputElement>(null);
  const pncBackRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'cv'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64Data = await getBase64(file);
    const sizeStr = (file.size / 1024).toFixed(1) + ' KB';

    // Clear active sample selection since user uploaded custom documents
    setActiveSample('');

    if (type === 'front') {
      setPncFront({ name: file.name, data: base64Data, size: sizeStr });
    } else if (type === 'back') {
      setPncBack({ name: file.name, data: base64Data, size: sizeStr });
    } else {
      setCvDoc({ name: file.name, data: base64Data, size: sizeStr });
    }
  };

  const handleDrop = async (e: React.DragEvent, type: 'front' | 'back' | 'cv') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const base64Data = await getBase64(file);
    const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    
    setActiveSample('');

    if (type === 'front') {
      setPncFront({ name: file.name, data: base64Data, size: sizeStr });
    } else if (type === 'back') {
      setPncBack({ name: file.name, data: base64Data, size: sizeStr });
    } else {
      setCvDoc({ name: file.name, data: base64Data, size: sizeStr });
    }
  };

  const selectSample = (sampleId: string) => {
    setActiveSample(sampleId);
    if (sampleId === 'fatima_perfect') {
      setPncFront({ name: 'PNC_Front_FatimaAli.png', data: 'MOCK_DATA', size: '240 KB' });
      setPncBack({ name: 'PNC_Back_FatimaAli.png', data: 'MOCK_DATA', size: '280 KB' });
      setCvDoc({ 
        name: 'Fatima_Ali_CV.pdf', 
        data: 'MOCK_DATA', 
        size: '1.2 MB',
        text: 'Fatima Ali. Email: fatima.nurse.pnc@gmail.com. Phone: +92-333-1234567. B.Sc. Nursing from Aga Khan Univ (2022). Experience: Pediatric Nurse at Aga Khan Univ Hospital (2022-2024), Senior ICU Charge Nurse at National Institute of Child Health (2024-Present).' 
      });
    } else if (sampleId === 'ayesha_discrepancy') {
      setPncFront({ name: 'PNC_Front_AyeshaKhan.png', data: 'MOCK_DATA', size: '244 KB' });
      setPncBack({ name: 'PNC_Back_AyeshaKhan.png', data: 'MOCK_DATA', size: '265 KB' });
      setCvDoc({ 
        name: 'Ayesha_Khan_CV.pdf', 
        data: 'MOCK_DATA', 
        size: '890 KB',
        text: 'Ayesha Khan. Email: ayesha.khan94@yahoo.com. Phone: +92-312-9876543. General Nursing Diploma from Pakistan Institute of Medical Sciences. Experience: Lead Home Health Officer at Palliative Care Pakistan Services (2018-Present, 8 years of home treatment).' 
      });
    }
  };

  const handleSubmit = () => {
    if (!activeSample && (!pncFront || !pncBack || !cvDoc)) {
      alert("Please upload standard PNC Card Front, Back, and CV documents, or select a sample registration scenario first!");
      return;
    }

    onProcessOCR({
      pncFront: pncFront && pncFront.data !== 'MOCK_DATA' ? { data: pncFront.data, mimeType: 'image/jpeg' } : null,
      pncBack: pncBack && pncBack.data !== 'MOCK_DATA' ? { data: pncBack.data, mimeType: 'image/jpeg' } : null,
      cvText: cvDoc?.text || 'NC',
      cvBase64: cvDoc && cvDoc.data !== 'MOCK_DATA' ? { data: cvDoc.data, mimeType: 'application/pdf' } : null,
      sampleId: activeSample,
      forceMock: activeSample !== '' // if sample is elected, use mock mapping for ultra-fast, deterministic verification
    });
  };

  const clearUploads = () => {
    setPncFront(null);
    setPncBack(null);
    setCvDoc(null);
    setActiveSample('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="doc-uploader-panel">
      
      {/* Banner / Header */}
      <div className="bg-slate-900 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Master Registrar Document Port</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-sans">
              Deploy high-precision OCR to instantly cross-reference credentials and parse CV metadata
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Sample select scenario widgets */}
        <div>
          <label className="text-slate-800 text-xs font-semibold uppercase tracking-wider block mb-3 font-display">
            Select Registrar Validation Scenario
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <button
              id="scenario-fatima-perfect"
              onClick={() => selectSample('fatima_perfect')}
              type="button"
              className={`text-left p-4 rounded-xl border transition-all text-sm flex items-start gap-4 ${
                activeSample === 'fatima_perfect'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20'
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg mt-0.5 ${activeSample === 'fatima_perfect' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200/80 text-slate-500'}`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-semibold text-slate-900 block">Scenario A: Approved Alignment</span>
                <span className="text-xs text-slate-500 font-sans block leading-relaxed">
                  Fatima Ali. Initial Reg in 2022. Claimed experience: 4 Years. Perfect alignment with legal PNC eligibility scope.
                </span>
              </div>
            </button>

            <button
              id="scenario-ayesha-discrepancy"
              onClick={() => selectSample('ayesha_discrepancy')}
              type="button"
              className={`text-left p-4 rounded-xl border transition-all text-sm flex items-start gap-4 ${
                activeSample === 'ayesha_discrepancy'
                  ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/20'
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg mt-0.5 ${activeSample === 'ayesha_discrepancy' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-200/80 text-slate-500'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-semibold text-slate-900 block">Scenario B: Work/PNC Code Discrepancy</span>
                <span className="text-xs text-slate-500 font-sans block leading-relaxed">
                  Ayesha Khan. Initial Reg in 2024. Claimed experience: 8 Years. Flagged for practicing before PNC registration.
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* Custom Upload Sections */}
        {!activeSample && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 text-xs font-semibold uppercase tracking-wider block font-display">
                Or Upload Nurse Documents (Custom Mode)
              </span>
              <button 
                onClick={clearUploads}
                className="text-slate-500 hover:text-slate-800 text-xs border border-slate-100 hover:bg-slate-50 px-2 py-1 rounded"
              >
                Clear Docs
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* PNC Front Drag Drop */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'front')}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative ${
                  pncFront ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={pncFrontRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'front')}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer" onClick={() => pncFrontRef.current?.click()}>
                  <div className={`p-2 rounded-lg ${pncFront ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">PNC Card Front</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
                      {pncFront ? pncFront.name : "Drag Front Image Here"}
                    </p>
                  </div>
                  {pncFront && <span className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">{pncFront.size}</span>}
                </div>
              </div>

              {/* PNC Back Drag Drop */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'back')}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative ${
                  pncBack ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={pncBackRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'back')}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer" onClick={() => pncBackRef.current?.click()}>
                  <div className={`p-2 rounded-lg ${pncBack ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">PNC Card Back</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
                      {pncBack ? pncBack.name : "Drag Back Image Here"}
                    </p>
                  </div>
                  {pncBack && <span className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">{pncBack.size}</span>}
                </div>
              </div>

              {/* Nurse CV Drag Drop */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'cv')}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all relative ${
                  cvDoc ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  ref={cvRef}
                  accept=".pdf,.doc,.docx,image/*,.txt"
                  onChange={(e) => handleFileChange(e, 'cv')}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer" onClick={() => cvRef.current?.click()}>
                  <div className={`p-2 rounded-lg ${cvDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Nurse CV / Resume</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] mx-auto overflow-hidden text-ellipsis whitespace-nowrap">
                      {cvDoc ? cvDoc.name : "Upload PDF/CV Doc"}
                    </p>
                  </div>
                  {cvDoc && <span className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">{cvDoc.size}</span>}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Selected Sample Overview Label */}
        {activeSample && (
          <div className="p-4 bg-slate-100/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-500" />
              <div>
                <span className="text-xs text-slate-400 font-sans block">Selected Template Assets</span>
                <span className="text-xs font-mono font-medium text-slate-700">
                  {pncFront?.name} • {cvDoc?.name}
                </span>
              </div>
            </div>
            <button 
              onClick={clearUploads}
              className="text-xs text-rose-500 font-medium hover:underline hover:text-rose-600"
            >
              Reset Selection
            </button>
          </div>
        )}

        {/* Submit Registrations Section & Run Settings */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="gemini-toggle"
              checked={useRealGemini}
              onChange={(e) => setUseRealGemini(e.target.checked)}
              className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="gemini-toggle" className="text-xs text-slate-600 font-sans select-none cursor-pointer">
              Deploy Live Gemini 3.5 Flash Model (recommended)
            </label>
          </div>

          <button
            id="btn-process-ocr"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-display font-medium text-sm text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
              isProcessing 
                ? 'bg-slate-400 cursor-not-allowed scale-95' 
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Document Credentials...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Initialize Master OCR Registrar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
