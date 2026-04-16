// types/project.ts
export type ProjectStatus = 'draft' | 'submitted' | 'admin_approved' | 'auditor_verified' | 'rejected' | 'listed';

export interface ProjectVersion {
  id: number;
  project_id: number;
  version_number: number;
  name: string;
  description: string;
  location_country: string;
  location_province: string;
  location_city: string;
  address: string;
  status: ProjectStatus;
  admin_verification_status: 'pending' | 'approved' | 'rejected';
  auditor_verification_status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  auditor_notes?: string;
  is_locked: boolean;
}

export interface Project {
  id: number;
  issuer_id: number;
  active_version_id: number;
  active_version: ProjectVersion; // Ini hasil dari with('activeVersion') di Laravel
}