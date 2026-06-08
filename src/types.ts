export interface NurseCredentials {
  pnmc_reg_no: string; // e.g. "PK-K-22-A-290169"
  valid_upto: string; // "YYYY-MM-DD" or "NC"
  initial_reg_date: string; // "YYYY-MM-DD" or "NC"
  full_name: string; // Must match card exactly
  cnic: string; // CNIC format or "NC"
  specializations: string[]; // List of specializations (e.g. ["Pediatric Nursing"])
  gender?: string;
  father_husband_name?: string;
}

export interface NurseCV {
  mobile_number: string; // Phone number or "NC"
  email_address: string; // Email address or "NC"
  total_years_experience: number | string; // e.g. 5, or "NC"
  education: string[];
  skills: string[];
  work_history: {
    role: string;
    organization: string;
    duration: string;
    start_year?: number;
    end_year?: number;
  }[];
}

export interface VerificationAlert {
  type: 'discrepancy' | 'warning' | 'info';
  field: string;
  message: string;
}

export interface LogicalValidation {
  is_valid: boolean;
  timeline_discrepancy: boolean;
  years_experience_vs_registration_years: number;
  time_since_registration_years: number;
  validation_notes: string;
  alerts: VerificationAlert[];
}

export interface GapAnalysis {
  missing_required_fields: string[]; // ["city", "neighborhood", "shift_preferences"]
  manual_entry_required: string[]; // fields that cannot be parsed from docs
}

export interface ExtractedData {
  credentials: NurseCredentials;
  cv: NurseCV;
  logical_validation: LogicalValidation;
  gap_analysis: GapAnalysis;
  confidence_score: number; // 0.0 to 1.0 for license number extraction
}

export interface RegistrationSurvey {
  // Extracted fields
  full_name: string;
  cnic: string;
  pnmc_reg_no: string;
  valid_upto: string;
  initial_reg_date: string;
  specializations: string[];
  mobile_number: string;
  email_address: string;
  total_years_experience: number;

  // Survey fields (usually manual or prefilled if in CV)
  city: string;
  neighborhood: string;
  shift_preferences: 'Morning' | 'Evening' | 'Night' | '24-Hour' | 'Rotational' | 'NC';
  
  // Statuses
  is_verified_by_user: boolean;
  status: 'Draft' | 'Submitted' | 'Verified' | 'PNC_Discrepancy';
}

// Simulated Database Row
export interface NurseRecord {
  id: string;
  user_id: string; // auth.uid()
  created_at: string;
  updated_at: string;
  survey_data: RegistrationSurvey;
  raw_extracted: ExtractedData;
}
