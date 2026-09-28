import type { Metadata } from "next";

import { Workspace } from "@/components/Workspace";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Research roles, compare them with your resume, and prepare application notes with MIRAI PATH.",
};

export default function WorkspacePage() {
  return <Workspace />;
}
