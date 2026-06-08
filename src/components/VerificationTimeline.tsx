import React from 'react';
import { ShieldCheck, ShieldAlert, Calendar, GraduationCap, Briefcase } from 'lucide-react';
import { LogicalValidation, NurseCredentials, NurseCV } from '../types';

interface VerificationTimelineProps {
  validation: LogicalValidation;
  credentials: NurseCredentials;
  cv: NurseCV;
}

export default function VerificationTimeline({ validation, credentials, cv }: VerificationTimelineProps) {
  const { 
    is_valid, 
    timeline_discrepancy, 
    years_experience_vs_registration_years, 
    time_since_registration_years,
    validation_notes,
    alerts
  } = validation;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="timeline-verification-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight text-slate-800 uppercase">
          Chronological Validation Audit
        </h3>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          !timeline_discrepancy 
            ? 'bg-emerald-50 text-emerald-700' 
            : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {!timeline_discrepancy ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              Timeline Consistent
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              Timeline Discrepancy
            </>
          )}
        </span>
      </div>

      {/* Visual Timeline Bar */}
      <div className="pt-4 pb-2">
        <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-6">
          Clinical practice timeline vs. pnc license eligibility
        </label>

        <div className="relative pl-8 border-l border-slate-100 ml-4 space-y-8">
          
          {/* Initial PNC Registration node */}
          <div className="relative">
            <span className="absolute -left-[45px] top-0 w-8 h-8 rounded-full bg-slate-900 border-4 border-white shadow-sm flex items-center justify-center text-white">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-mono text-[10px] text-slate-400 block tracking-tight">PNC INITIAL REGISTRATION DATE</span>
              <span className="font-display font-semibold text-slate-900 text-sm">
                {credentials.initial_reg_date !== "NC" ? credentials.initial_reg_date : "NC (Registration Date Unavailable)"}
              </span>
              <p className="text-slate-500 font-sans text-xs mt-1">
                Official commencement date of licensed clinical nursing practice eligibility in Pakistan.
              </p>
            </div>
          </div>

          {/* CV practice timeline node */}
          <div className="relative">
            <span className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white ${
              timeline_discrepancy ? 'bg-amber-500' : 'bg-emerald-500'
            }`}>
              <Briefcase className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-mono text-[10px] text-slate-400 block tracking-tight">CV WORK TIMELINE COMMENCEMENT</span>
              <span className="font-display font-semibold text-slate-900 text-sm">
                {cv.work_history && cv.work_history.length > 0 
                  ? `Clinical experience dates back to ${cv.work_history[cv.work_history.length - 1].duration}` 
                  : "Work timeline commence date: NC"}
              </span>
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Claimed CV Experience:</span>
                  <span className="font-mono font-semibold text-slate-800">{cv.total_years_experience} Years</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">PNC Registered Duration (since initial date to 2026):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {time_since_registration_years > 0 ? `${time_since_registration_years.toFixed(2)} Years` : 'NC'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Report Action Node */}
          <div className="relative">
            <span className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-white ${
              timeline_discrepancy ? 'bg-rose-600' : 'bg-emerald-600'
            }`}>
              {timeline_discrepancy ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            </span>
            <div>
              <span className="font-mono text-[10px] text-slate-400 block tracking-tight">LOGICAL COMPLIANCE SCORE</span>
              <span className={`font-display font-semibold text-sm block mt-0.5 ${timeline_discrepancy ? 'text-rose-600' : 'text-emerald-700'}`}>
                {timeline_discrepancy ? "Timeline Flag Alert: Review Required" : "Timeline Align Check Success"}
              </span>
              <div className="mt-2 text-xs text-slate-600 space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 font-sans leading-relaxed">
                {validation_notes}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Alerts Checklist */}
      {alerts && alerts.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2">
            Automated Audit Alerts
          </label>
          <div className="space-y-2">
            {alerts.map((al, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                  al.type === 'discrepancy' 
                    ? 'bg-rose-50/50 text-rose-700 border border-rose-100' 
                    : al.type === 'warning'
                    ? 'bg-amber-50/50 text-amber-700 border border-amber-100'
                    : 'bg-blue-50/50 text-blue-700 border border-blue-100'
                }`}
              >
                <div className="mt-0.5">
                  {al.type === 'discrepancy' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  ) : al.type === 'warning' ? (
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div>
                  <span className="font-semibold block capitalize mb-0.5">
                    Field: {al.field}
                  </span>
                  <span className="font-sans text-[11px] leading-relaxed block">{al.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
