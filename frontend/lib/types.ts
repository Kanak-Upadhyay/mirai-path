export type RobotState =
  | "idle"
  | "searching"
  | "reading"
  | "matching"
  | "generating"
  | "completed";

export type SearchValues = {
  role: string;
  location: string;
  experience: string;
  skills: string;
  jobType: string;
  salary: string;
  preferences: string;
};

export type JobResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  experience: string;
  salary: string;
  skills: string[];
  url: string;
  source: string;
  compatibilityScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  explanation: string;
  preview?: boolean;
};

export type ApplicationContent = {
  summary: string;
  recruiterMessage: string;
  coverLetter: string;
  interviewQuestions: string[];
  skillsToRevise: string[];
};

export type ResearchResponse = {
  jobs: JobResult[];
  notice?: string;
};

export type AgentStepState = "pending" | "active" | "done" | "error";

export type AgentStep = {
  id: string;
  label: string;
  state: AgentStepState;
};
