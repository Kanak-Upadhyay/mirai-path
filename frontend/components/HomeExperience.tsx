"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";

import { Landing } from "@/components/Landing";
import { SplashScreen } from "@/components/SplashScreen";

export function HomeExperience() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    if (reduced || !splash) return;
    const timer = window.setTimeout(() => setSplash(false), 3400);
    return () => window.clearTimeout(timer);
  }, [reduced, splash]);

  useEffect(() => {
    document.body.style.overflow = splash ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [splash]);

  return (
    <>
      {splash ? (
        <SplashScreen onStart={() => router.push("/workspace")} onSkip={() => setSplash(false)} />
      ) : null}
      <div aria-hidden={splash}>
        <Landing onReplay={() => setSplash(true)} />
      </div>
    </>
  );
}
