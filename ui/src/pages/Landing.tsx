import { useEffect } from "react";

export function LandingPage() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;
    const previousHtmlHeight = document.documentElement.style.height;
    const previousBodyBackground = document.body.style.background;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.height = "100%";
    document.body.style.background = "#050507";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
      document.documentElement.style.height = previousHtmlHeight;
      document.body.style.background = previousBodyBackground;
    };
  }, []);

  return (
    <iframe
      title="Paperclip landing page"
      src="/landing-replacement.html"
      className="block h-dvh w-full border-0 bg-[#050507]"
    />
  );
}
