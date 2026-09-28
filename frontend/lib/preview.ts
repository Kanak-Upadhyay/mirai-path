import type { ApplicationContent, JobResult } from "@/lib/types";

/** Interface sample only. This is not a live job posting. */
export const previewJob: JobResult = {
  id: "layout-preview",
  title: "Python Data Engineer",
  company: "Sample Company",
  location: "Bangalore",
  employmentType: "Full-time",
  experience: "2–4 years",
  salary: "Not specified",
  skills: ["Python", "SQL", "ETL", "FastAPI"],
  url: "",
  source: "Layout preview",
  compatibilityScore: 78,
  matchedSkills: ["Python", "SQL", "ETL"],
  missingSkills: ["Kubernetes", "Terraform"],
  partialSkills: ["Cloud"],
  explanation:
    "This percentage is a sample of the estimate layout. It is not a hiring decision and not a live job.",
  preview: true,
};

export const previewApplication: ApplicationContent = {
  summary:
    "Sample summary. A live summary is written only from the resume you upload and requirements found on a public job page.",
  recruiterMessage:
    "Sample recruiter note. MIRAI PATH will not invent employers, projects, or years of experience.",
  coverLetter:
    "Sample cover letter.\n\nHello,\n\nThis panel is a layout preview. When research is connected, the letter stays specific to the job page and your resume.\n\nIf a skill is missing, the draft can say you do not have direct experience with it.",
  interviewQuestions: [
    "Sample: How have you designed an ETL pipeline?",
    "Sample: Where would you use FastAPI in a data service?",
    "Sample: Which of the listed gaps would you learn first, and why?",
  ],
  skillsToRevise: ["FastAPI", "PostgreSQL", "Docker", "AWS"],
};
