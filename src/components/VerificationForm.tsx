import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, ShieldCheck, HelpCircle, Save, Database, AlertCircle, RefreshCw } from 'lucide-react';
import { ExtractedData, RegistrationSurvey } from '../types';

interface VerificationFormProps {
  extractedData: ExtractedData;
  onSaveToSimulatedSupabase: (survey: RegistrationSurvey) => void;
  isSaving: boolean;
  savedRecord: any | null;
}

export default function VerificationForm({ 
  extractedData, 
  onSaveToSimulatedSupabase, 
  isSaving,
  savedRecord 
}: VerificationFormProps) {
  
  // Create state representing the prefilled Home Nursing Platform Registration Survey incorporating the OCR data
  const [formData, setFormData] = useState<RegistrationSurvey>({
    full_name: '',
    cnic: '',
    pnmc_reg_no: '',
    valid_upto: '',
    initial_reg_date: '',
    specializations: [],
    mobile_number: '',
    email_address: '',
    total_years_experience: 0,
    city: '',
    neighborhood: '',
    shift_preferences: 'Morning',
    is_verified_by_user: false,
    status: 'Draft'
  });

  const [newSpecialization, setNewSpecialization] = useState<string>('');

  // Update form data state whenever extractedData changes
  useEffect(() => {
    if (extractedData) {
      const expStr = extractedData.cv.total_years_experience;
      const parsedExp = typeof expStr === 'number' ? expStr : parseInt(expStr as string, 10) || 0;

      setFormData({
        full_name: extractedData.credentials.full_name !== 'NC' ? extractedData.credentials.full_name : '',
        cnic: extractedData.credentials.cnic !== 'NC' ? extractedData.credentials.cnic : '',
        pnmc_reg_no: extractedData.credentials.pnmc_reg_no !== 'NC' ? extractedData.credentials.pnmc_reg_no : '',
        valid_upto: extractedData.credentials.valid_upto !== 'NC' ? extractedData.credentials.valid_upto : '',
        initial_reg_date: extractedData.credentials.initial_reg_date !== 'NC' ? extractedData.credentials.initial_reg_date : '',
        specializations: extractedData.credentials.specializations || [],
        mobile_number: extractedData.cv.mobile_number !== 'NC' ? extractedData.cv.mobile_number : '',
        email_address: extractedData.cv.email_address !== 'NC' ? extractedData.cv.email_address : '',
        total_years_experience: parsedExp,
        
        // Gap Analysis fields (defaulting to empty so user sees the highlighting unless specified, e.g. some CV notes contain city)
        city: extractedData.gap_analysis && extractedData.gap_analysis.missing_required_fields.map(f => f.toLowerCase()).includes('city') ? '' : '',
        neighborhood: '',
        shift_preferences: 'Morning',
        is_verified_by_user: false,
        status: extractedData.logical_validation.timeline_discrepancy ? 'PNC_Discrepancy' : 'Draft'
      });
    }
  }, [extractedData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSpecialization = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSpecialization.trim()) {
      e.preventDefault();
      if (!formData.specializations.includes(newSpecialization.trim())) {
        setFormData(prev => ({
          ...prev,
          specializations: [...prev.specializations, newSpecialization.trim()]
        }));
      }
      setNewSpecialization('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter(s => s !== spec)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set status based on user verification
    const activeStatus = formData.is_verified_by_user 
      ? (extractedData.logical_validation.timeline_discrepancy ? 'PNC_Discrepancy' : 'Submitted') 
      : 'Draft';

    onSaveToSimulatedSupabase({
      ...formData,
      status: activeStatus
    });
  };

  // Identify state of gap analysis fields
  const isCityMissing = !formData.city;
  const isNeighborhoodMissing = !formData.neighborhood;
  const isShiftPreferenceMissing = formData.shift_preferences === 'NC' || !formData.shift_preferences;

  const missingFieldsCount = [isCityMissing, isNeighborhoodMissing].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" id="verification-survey-form">
      
      {/* Manual verification stats banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
        <div className="flex items-center gap-2.5">
          <ChevronRight className="w-5 h-5 text-emerald-600" />
          <div>
            <span className="font-display font-semibold text-sm text-slate-800">Manual Verification Panel</span>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Confirm OCR extractions and directly address highlighted gaps.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {missingFieldsCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              {missingFieldsCount} Highlighted Gaps Remaining
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All High-Priority Gaps Resolved
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: PNC Front Credentials Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. PNC CARD CREDENTIALS (FRONT)
            </span>
            <span className="text-[10px] font-mono text-slate-400">OCR CONFIDENCE: {(extractedData.confidence_score * 100).toFixed(0)}%</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="pnmc_reg_no" className="text-xs text-slate-500 font-sans block mb-1">PNMC REG. NO</label>
              <input
                type="text"
                id="pnmc_reg_no"
                name="pnmc_reg_no"
                value={formData.pnmc_reg_no}
                onChange={handleInputChange}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-800 transition-all uppercase"
                placeholder="NC"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="initial_reg_date" className="text-xs text-slate-500 font-sans block mb-1">INITIAL REG. DATE</label>
                <input
                  type="date"
                  id="initial_reg_date"
                  name="initial_reg_date"
                  value={formData.initial_reg_date}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-sans text-slate-800 transition-all cursor-pointer"
                  placeholder="NC"
                />
              </div>

              <div>
                <label htmlFor="valid_upto" className="text-xs text-slate-500 font-sans block mb-1">VALID UPTO</label>
                <input
                  type="date"
                  id="valid_upto"
                  name="valid_upto"
                  value={formData.valid_upto}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-sans text-slate-800 transition-all cursor-pointer"
                  placeholder="NC"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Identity & Certifications Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. IDENTITY VERIFICATION (REVERSE)
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="full_name" className="text-xs text-slate-500 font-sans block mb-1 font-medium">FULL NAME (EXACT PNC COPY)</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-display font-semibold text-slate-950 transition-all"
                placeholder="Full Nurse's Name"
                required
              />
            </div>

            <div>
              <label htmlFor="cnic" className="text-xs text-slate-500 font-sans block mb-1">CNIC NUMBER</label>
              <input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-800 transition-all"
                placeholder="e.g. 42101-1234567-2"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Specializations Widget */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">
              3. SPECIALIZATIONS & LICENSED DOMAINS
            </span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs text-slate-500 font-sans block mb-1.5">Active Credentials Tags</label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-100 rounded-xl">
                {formData.specializations.length === 0 ? (
                  <span className="text-slate-400 text-xs italic font-sans px-1">No certificates detected in documents.</span>
                ) : (
                  formData.specializations.map((spec, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-sans font-medium text-emerald-800 shadow-sm">
                      {spec}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSpecialization(spec)}
                        className="text-emerald-500 hover:text-emerald-700 font-bold ml-1 text-xs shrink-0 rounded-full"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <label htmlFor="new_spec" className="text-xs text-slate-500 font-sans block mb-1">Add Certified Specialization</label>
              <input
                type="text"
                id="new_spec"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyDown={handleAddSpecialization}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-xs font-sans text-slate-800 transition-all"
                placeholder="Type and press Enter to insert specialty keyword"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Resume Parsing Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. CV / RESUME RECOGNITION
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mobile_number" className="text-xs text-slate-500 font-sans block mb-1">MOBILE NUMBER</label>
                <input
                  type="text"
                  id="mobile_number"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-sans text-slate-800 transition-all"
                  placeholder="e.g. +92-333-1234567"
                />
              </div>

              <div>
                <label htmlFor="total_years_experience" className="text-xs text-slate-500 font-sans block mb-1">YEARS OF EXPERIENCE</label>
                <input
                  type="number"
                  id="total_years_experience"
                  name="total_years_experience"
                  value={formData.total_years_experience}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-sans text-slate-800 transition-all font-mono"
                  min="0"
                  max="45"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email_address" className="text-xs text-slate-500 font-sans block mb-1 font-medium font-sans">EMAIL ADDRESS</label>
              <input
                type="email"
                id="email_address"
                name="email_address"
                value={formData.email_address}
                onChange={handleInputChange}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm font-sans text-slate-800 transition-all"
                placeholder="e.g. nurse@pnc-portal.org"
              />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 5: GAP ANALYSIS TARGET - Required Survey Fields */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4" id="gap-analysis-survey-prefill">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ChevronRight className="w-4 h-4 text-indigo-600" />
          <span className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">
            5. GAP ANALYSIS PREFILL: MANDATORY PLATFORM SURVEY
          </span>
        </div>

        <p className="text-slate-500 font-sans text-xs max-w-xl">
          The fields below are absolute clinical platform requirements. If Gemini did not identify them inside the credentials or CV, they are highlighted below for required manual entry before submission.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* CITY INPUT (Highlighted if missing) */}
          <div className="relative">
            <label htmlFor="city" className="text-xs font-semibold text-slate-700 font-sans block mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-all border ${
                isCityMissing 
                  ? 'bg-rose-50/20 border-rose-200 focus:border-rose-500 focus:ring-rose-500 shadow-sm' 
                  : 'bg-slate-50/50 border-slate-100 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              placeholder="e.g. Karachi or Lahore"
              required
            />
            {isCityMissing && (
              <span className="absolute right-3.5 top-9 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>

          {/* NEIGHBORHOOD INPUT (Highlighted if missing) */}
          <div className="relative">
            <label htmlFor="neighborhood" className="text-xs font-semibold text-slate-700 font-sans block mb-1">
              Neighborhood
            </label>
            <input
              type="text"
              id="neighborhood"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleInputChange}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-all border ${
                isNeighborhoodMissing 
                  ? 'bg-rose-50/20 border-rose-200 focus:border-rose-500 focus:ring-rose-500 shadow-sm' 
                  : 'bg-slate-50/50 border-slate-100 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              placeholder="e.g. Clifton or Gulberg"
              required
            />
            {isNeighborhoodMissing && (
              <span className="absolute right-3.5 top-9 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>

          {/* SHIFT PREFERENCES */}
          <div>
            <label htmlFor="shift_preferences" className="text-xs font-semibold text-slate-700 font-sans block mb-1">
              Shift Preferences
            </label>
            <select
              id="shift_preferences"
              name="shift_preferences"
              value={formData.shift_preferences}
              onChange={handleInputChange}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-sm font-sans text-slate-800 transition-all cursor-pointer"
            >
              <option value="Morning">Morning (8 AM - 4 PM)</option>
              <option value="Evening">Evening (4 PM - Midnight)</option>
              <option value="Night">Night (Midnight - 8 AM)</option>
              <option value="24-Hour">24-Hour Extended Duty</option>
              <option value="Rotational">Flexible / Rotational Shift</option>
            </select>
          </div>

        </div>
      </div>

      {/* RLS and Verify submission logic */}
      <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl text-white space-y-4 shadow-md">
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
          Supabase Transaction Security Gateway
        </span>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="is_verified_by_user"
            name="is_verified_by_user"
            checked={formData.is_verified_by_user}
            onChange={handleInputChange}
            className="rounded text-emerald-500 border-slate-750 focus:ring-emerald-500 w-5 h-5 shrink-0 mt-0.5 cursor-pointer"
            required
          />
          <div className="space-y-1">
            <label htmlFor="is_verified_by_user" className="text-xs font-semibold font-display text-white block select-none cursor-pointer">
              I certify that these extracted PNC credential details are correct & legally genuine.
            </label>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Upon approval, our server triggers an <code className="font-mono text-emerald-400 text-[10px] bg-slate-950 px-1 py-0.2 rounded">UPSERT</code> transaction executing to the remote PostgreSQL tables scoped through your private credentials session (RLS security active).
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="text-xs text-slate-400 font-sans">
            Status: {formData.is_verified_by_user ? (
              <span className="text-emerald-400 font-semibold">✓ Double-Checked & Verified</span>
            ) : (
              <span className="text-amber-400 italic">● Requires audit confirmation checkbox</span>
            )}
          </div>

          <button
            type="submit"
            id="btn-save-supabase"
            disabled={isSaving || !formData.is_verified_by_user}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-display font-semibold text-xs shadow flex items-center justify-center gap-2 transition-all ${
              !formData.is_verified_by_user
                ? 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                : isSaving
                ? 'bg-emerald-700/60 text-emerald-200 cursor-wait'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 cursor-pointer'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin w-4 h-4" />
                <span>Syncing Database Row...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Save & Complete Registration (Simulated Upsert)</span>
              </>
            )}
          </button>
        </div>
      </div>

    </form>
  );
}
