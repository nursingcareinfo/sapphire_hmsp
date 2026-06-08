import { useState } from 'react';
import { ExtractedData } from './types';

interface SurveyResponse {
  section_1: Record<string, any>;
  section_2: Record<string, any>;
  section_3: Record<string, any>;
  section_4: Record<string, any>;
  section_5: Record<string, any>;
  section_6: Record<string, any>;
  section_7: Record<string, any>;
  consent_accepted: boolean;
}

interface Props {
  extracted: ExtractedData | null;
  onSubmit: (data: SurveyResponse) => void;
  onBack: () => void;
}

export default function SurveyForm({ extracted, onSubmit, onBack }: Props) {
  const [section, setSection] = useState(1);
  const [data, setData] = useState<SurveyResponse>({
    section_1: extracted ? {
      full_name: extracted.full_name || '',
      gender: '',
      dob: '',
      cnic: extracted.cnic || '',
      mobile: extracted.mobile_number || '',
      whatsapp: '',
      email: extracted.email_address || '',
      city: '',
      neighbourhood: '',
      transport: '',
    } : {},
    section_2: {
      pnmc_reg_no: extracted?.pnmc_reg_no || '',
      pnmc_expiry: extracted?.valid_upto || '',
      qualification: '',
      specialisations: [],
      total_experience: '',
      home_nursing_experience: '',
      institutions: '',
    },
    section_3: {
      employment_status: '',
      monthly_income: '',
      supplemental_income: '',
      supplemental_amount: '',
      expected_shift_pay: '',
    },
    section_4: {
      hours_per_week: '',
      shifts: [],
      travel_willingness: '',
      transition: '',
      patient_preferences: [],
    },
    section_5: {
      comfort_alone: 0,
      challenges: [],
      concerns: [],
      safer_with_platform: '',
      incident_description: '',
    },
    section_6: {
      aware_of_platforms: '',
      how_find_work: [],
      viability_score: 0,
      top_features: [],
      recommend_score: 0,
      biggest_barrier: '',
    },
    section_7: {
      final_remarks: '',
      followup: '',
    },
    consent_accepted: false,
  });

  const update = (sectionNum: number, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [`section_${sectionNum}`]: { ...prev[`section_${sectionNum}` as keyof SurveyResponse], [field]: value }
    }));
  };

  const toggleArray = (sectionNum: number, field: string, value: string) => {
    const current = (data[`section_${sectionNum}` as keyof SurveyResponse] as Record<string, any>)[field] as string[];
    update(sectionNum, field, current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  const handleSubmit = () => {
    if (!data.consent_accepted) {
      alert('Please accept the data privacy consent to continue.');
      return;
    }
    onSubmit(data);
  };

  const sections = [
    { num: 1, title: 'Personal information' },
    { num: 2, title: 'PNC license & professional credentials' },
    { num: 3, title: 'Current employment & income' },
    { num: 4, title: 'Availability & work preferences' },
    { num: 5, title: 'Direct patient interaction & personal safety' },
    { num: 6, title: 'App & platform viability' },
    { num: 7, title: 'Final remarks' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">{section}</span>
        <h3 className="font-medium text-slate-900">{sections[section - 1].title}</h3>
      </div>

      <div className="p-6 space-y-5">
        {/* Section 1 */}
        {section === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <input type="text" value={data.section_1.full_name} onChange={(e) => update(1, 'full_name', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender <span className="text-rose-500">*</span></label>
                <select value={data.section_1.gender} onChange={(e) => update(1, 'gender', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option><option>Female</option><option>Male</option><option>Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of birth <span className="text-rose-500">*</span></label>
                <input type="date" value={data.section_1.dob} onChange={(e) => update(1, 'dob', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNIC number <span className="text-rose-500">*</span></label>
                <input type="text" value={data.section_1.cnic} onChange={(e) => update(1, 'cnic', e.target.value)} placeholder="XXXXX-XXXXXXX-X" maxLength={15} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile <span className="text-rose-500">*</span></label>
                <input type="tel" value={data.section_1.mobile} onChange={(e) => update(1, 'mobile', e.target.value)} placeholder="+92 3XX XXXXXXX" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input type="tel" value={data.section_1.whatsapp} onChange={(e) => update(1, 'whatsapp', e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={data.section_1.email} onChange={(e) => update(1, 'email', e.target.value)} placeholder="optional but recommended" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City <span className="text-rose-500">*</span></label>
                <select value={data.section_1.city} onChange={(e) => update(1, 'city', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option><option>Karachi</option><option>Lahore</option><option>Islamabad</option><option>Rawalpindi</option><option>Peshawar</option><option>Quetta</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Area / neighbourhood</label>
                <input type="text" value={data.section_1.neighbourhood} onChange={(e) => update(1, 'neighbourhood', e.target.value)} placeholder="e.g. DHA Phase 5" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transport <span className="text-rose-500">*</span></label>
              <select value={data.section_1.transport} onChange={(e) => update(1, 'transport', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select</option><option>Own motorcycle</option><option>Own car</option><option>Public transport</option><option>Family/rickshaw</option>
              </select>
            </div>
          </div>
        )}

        {/* Section 2 */}
        {section === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PNC Reg No <span className="text-rose-500">*</span></label>
                <input type="text" value={data.section_2.pnmc_reg_no} onChange={(e) => update(2, 'pnmc_reg_no', e.target.value)} placeholder="e.g. PNC-XXXXX" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PNC Expiry <span className="text-rose-500">*</span></label>
                <input type="date" value={data.section_2.pnmc_expiry} onChange={(e) => update(2, 'pnmc_expiry', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Qualification <span className="text-rose-500">*</span></label>
              <select value={data.section_2.qualification} onChange={(e) => update(2, 'qualification', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select</option><option>DGN</option><option>BSN</option><option>Post-RN BSN</option><option>MSN</option><option>LHV</option><option>Auxiliary Nurse</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialisation</label>
              <div className="flex flex-wrap gap-2">
                {['General nursing', 'ICU/CCU', 'Paediatrics', 'Oncology', 'Cardiac care', 'Wound care', 'Maternity', 'Dialysis'].map(s => (
                  <button key={s} type="button" onClick={() => toggleArray(2, 'specialisations', s)}
                    className={`px-3 py-1 rounded-full text-xs border ${data.section_2.specialisations.includes(s) ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-white text-slate-600'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total experience <span className="text-rose-500">*</span></label>
                <select value={data.section_2.total_experience} onChange={(e) => update(2, 'total_experience', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option><option>< 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6–10 years</option><option>> 10 years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Home nursing experience <span className="text-rose-500">*</span></label>
                <select value={data.section_2.home_nursing_experience} onChange={(e) => update(2, 'home_nursing_experience', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select</option><option>None</option><option>< 1 year</option><option>1–3 years</option><option>> 3 years</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Institutions employed</label>
              <input type="text" value={data.section_2.institutions} onChange={(e) => update(2, 'institutions', e.target.value)} placeholder="e.g. Aga Khan Hospital" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        )}

        {/* Section 3 */}
        {section === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employment status <span className="text-rose-500">*</span></label>
              <div className="space-y-2">
                {['Full-time hospital', 'Part-time', 'Home nursing only', 'Unemployed/seeking', 'Freelance'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="emp" value={opt} checked={data.section_3.employment_status === opt} onChange={(e) => update(3, 'employment_status', e.target.value)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly income (PKR) <span className="text-rose-500">*</span></label>
              <select value={data.section_3.monthly_income} onChange={(e) => update(3, 'monthly_income', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select</option><option>Below 20,000</option><option>20,000–35,000</option><option>35,001–50,000</option><option>50,001–75,000</option><option>75,001–100,000</option><option>Above 100,000</option><option>Not employed</option><option>Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplemental income from home nursing?</label>
              <div className="space-x-4">
                <label className="text-sm"><input type="radio" name="supp" checked={data.section_3.supplemental_income === 'yes'} onChange={() => update(3, 'supplemental_income', 'yes')} /> Yes</label>
                <label className="text-sm"><input type="radio" name="supp" checked={data.section_3.supplemental_income === 'no'} onChange={() => update(3, 'supplemental_income', 'no')} /> No</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected pay per shift <span className="text-rose-500">*</span></label>
              <select value={data.section_3.expected_shift_pay} onChange={(e) => update(3, 'expected_shift_pay', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select</option><option>Rs. 800–1,200</option><option>Rs. 1,200–1,800</option><option>Rs. 1,800–2,500</option><option>Rs. 2,500–3,500</option><option>Above 3,500</option><option>Monthly retainer</option>
              </select>
            </div>
          </div>
        )}

        {/* Section 4 */}
        {section === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hours/week available <span className="text-rose-500">*</span></label>
              <select value={data.section_4.hours_per_week} onChange={(e) => update(4, 'hours_per_week', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select</option><option>< 10 hrs</option><option>10–20 hrs</option><option>20–40 hrs</option><option>Full-time 40+</option><option>Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shifts available</label>
              <div className="space-y-1">
                {['Morning (7AM–3PM)', 'Evening (3PM–11PM)', 'Night (11PM–7AM)', '12-hour', '24-hour live-in', 'Hourly/on-call'].map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.section_4.shifts.includes(s)} onChange={() => toggleArray(4, 'shifts', s)} /> {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Travel willingness</label>
              <select value={data.section_4.travel_willingness} onChange={(e) => update(4, 'travel_willingness', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select</option><option>Within 5km</option><option>Within 10km</option><option>Anywhere in city</option><option>Near home only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transition to home nursing <span className="text-rose-500">*</span></label>
              <div className="space-y-1">
                {['Actively looking to switch', 'If pay is equal/better', 'Keep as supplemental', 'Unsure'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="transition" checked={data.section_4.transition === opt} onChange={(e) => update(4, 'transition', e.target.value)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient preferences</label>
              <div className="grid grid-cols-2 gap-1">
                {['Post-surgical', 'Elderly', 'ICU-level', 'Stroke/paralysis', 'Paediatric', 'Cancer/palliative', 'Mother & baby', 'ADLs'].map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.section_4.patient_preferences.includes(s)} onChange={() => toggleArray(4, 'patient_preferences', s)} /> {s}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 5 */}
        {section === 5 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Comfort working alone <span className="text-rose-500">*</span></label>
              <div className="flex gap-0">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => update(5, 'comfort_alone', n)}
                    className={`flex-1 py-2 text-sm border ${data.section_5.comfort_alone === n ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Not comfortable</span><span>Very comfortable</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Challenges faced (select all)</label>
              <div className="space-y-1">
                {['Disrespectful patients/families', 'Unsafe neighbourhood', 'Delayed/non-payment', 'Lack of equipment', 'No emergency support', 'Tasks beyond scope', 'Harassment', 'Isolation', 'No prior experience'].map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.section_5.challenges.includes(c)} onChange={() => toggleArray(5, 'challenges', c)} /> {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biggest fears about home nursing</label>
              <div className="space-y-1">
                {['Personal safety (female nurse)', 'Blamed for patient deterioration', 'No legal protection/contract', 'Families ignoring care instructions', 'Irregular income', 'No emergency backup', 'Social stigma', 'No career growth'].map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.section_5.concerns.includes(c)} onChange={() => toggleArray(5, 'concerns', c)} /> {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Safer with registered platform?</label>
              <div className="space-x-4">
                {['Yes — significantly more confident', 'Somewhat — still concerns', 'No — feel safe privately'].map(opt => (
                  <label key={opt} className="text-sm">
                    <input type="radio" name="safer" checked={data.section_5.safer_with_platform === opt} onChange={(e) => update(5, 'safer_with_platform', e.target.value)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specific concerns (optional)</label>
              <textarea value={data.section_5.incident_description} onChange={(e) => update(5, 'incident_description', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        )}

        {/* Section 6 */}
        {section === 6 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aware of home nursing apps? <span className="text-rose-500">*</span></label>
              <div className="space-y-1">
                {['Yes — used one', 'Yes — aware but not used', 'No — not aware of any'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="aware" checked={data.section_6.aware_of_platforms === opt} onChange={(e) => update(6, 'aware_of_platforms', e.target.value)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">How do you find home nursing work?</label>
              <div className="space-y-1">
                {['Nursing agency', 'Word of mouth', 'WhatsApp groups', 'Facebook/social', 'Hospital referral', "Don't do home nursing"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.section_6.how_find_work.includes(opt)} onChange={() => toggleArray(6, 'how_find_work', opt)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform viability (1–5) <span className="text-rose-500">*</span></label>
              <div className="flex gap-0">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => update(6, 'viability_score', n)}
                    className={`flex-1 py-2 text-sm border ${data.section_6.viability_score === n ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Top 3 features (select up to 3)</label>
              <div className="grid grid-cols-2 gap-1">
                {['Verified patients', 'Guaranteed payment', 'Emergency loan', 'WhatsApp scheduling', '24/7 support', 'Digital attendance', 'Rate patients', 'Legal contracts', 'Training/CPD', 'Set availability'].map(f => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={data.section_6.top_features.includes(f)} onChange={() => toggleArray(6, 'top_features', f)} disabled={data.section_6.top_features.length >= 3 && !data.section_6.top_features.includes(f)} /> {f}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recommend to others? (1–5)</label>
              <div className="flex gap-0">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => update(6, 'recommend_score', n)}
                    className={`flex-1 py-2 text-sm border ${data.section_6.recommend_score === n ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-600'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biggest adoption barrier</label>
              <textarea value={data.section_6.biggest_barrier} onChange={(e) => update(6, 'biggest_barrier', e.target.value)} placeholder="e.g. trust, internet access..." className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        )}

        {/* Section 7 */}
        {section === 7 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anything else you'd like us to know?</label>
              <textarea value={data.section_7.final_remarks} onChange={(e) => update(7, 'final_remarks', e.target.value)} rows={5} placeholder="Your honest input shapes the product." className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up interview?</label>
              <div className="space-x-4">
                {['Yes — happy to participate', 'No — survey only'].map(opt => (
                  <label key={opt} className="text-sm">
                    <input type="radio" name="followup" checked={data.section_7.followup === opt} onChange={(e) => update(7, 'followup', e.target.value)} /> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-600 leading-relaxed">
              <strong>Data privacy & consent</strong><br />
              By submitting, you consent to H.M.S.P storing responses for product research. PNC/CNIC data collected solely for professional verification. No data shared with third parties. Request deletion at any time via research@hmsp.pk.
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={data.consent_accepted} onChange={(e) => setData(prev => ({ ...prev, consent_accepted: e.target.checked }))} />
              <span>I have read and agree to the data privacy statement <span className="text-rose-500">*</span></span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-slate-100">
          <div>
            {section > 1 && (
              <button onClick={() => setSection(s => s - 1)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">← Back</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onBack} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">← Upload different docs</button>
            {section < 7 ? (
              <button onClick={() => setSection(s => s + 1)} className="px-5 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800">Next</button>
            ) : (
              <button onClick={handleSubmit} className="px-5 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800">Submit Survey</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
