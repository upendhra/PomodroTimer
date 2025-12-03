export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password_hash: string;
  timezone: string;
  work_duration: number; // in minutes
  break_duration: number; // in minutes
  daily_goal: number; // in hours
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  role: 'user' | 'admin';
}

export interface SignupFormData {
  name: string;
  username?: string;
  email: string;
  password: string;
  timezone: string;
  workDuration: number;
  breakDuration: number;
  dailyGoal: number;
}