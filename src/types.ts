export interface ExtractedData {
  full_name: string;
  cnic: string;
  mobile_number: string;
  email_address: string;
  total_years_experience: number | string;
  pnmc_reg_no: string;
  valid_upto: string | null;
  initial_reg_date: string | null;
  specializations: string[];
  qualification: string;
}

export interface SurveyResponse {
  section_1: Record<string, any>;
  section_2: Record<string, any>;
  section_3: Record<string, any>;
  section_4: Record<string, any>;
  section_5: Record<string, any>;
  section_6: Record<string, any>;
  section_7: Record<string, any>;
  consent_accepted: boolean;
}
