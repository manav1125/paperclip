import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "@/lib/router";
import { useCompany } from "./CompanyContext";
import { useDialog } from "./DialogContext";
import { useSidebar } from "./SidebarContext";
import { ProductGuideOverlay } from "../components/ProductGuideOverlay";
import {
  WORKSPACE_GUIDE_STEPS,
  hasCompletedWorkspaceGuide,
  markWorkspaceGuideCompleted,
  readPendingWorkspaceGuideCompanyId,
  writePendingWorkspaceGuideCompanyId,
} from "../lib/product-guide";

type ProductGuideContextValue = {
  startWorkspaceGuide: () => void;
  queueWorkspaceGuide: (companyId: string | null) => void;
  isGuideOpen: boolean;
};

const ProductGuideContext = createContext<ProductGuideContextValue | null>(null);

export function ProductGuideProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { selectedCompanyId, companies } = useCompany();
  const { onboardingOpen } = useDialog();
  const { isMobile, setSidebarOpen } = useSidebar();
  const [stepIndex, setStepIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const autoStartedRef = useRef<Set<string>>(new Set());

  const activeCompanyId = selectedCompanyId ?? companies[0]?.id ?? null;

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    setStepIndex(0);
  }, []);

  const startWorkspaceGuide = useCallback(() => {
    if (!activeCompanyId) return;
    if (isMobile) setSidebarOpen(true);
    setStepIndex(0);
    setGuideOpen(true);
    writePendingWorkspaceGuideCompanyId(activeCompanyId);
  }, [activeCompanyId, isMobile, setSidebarOpen]);

  const queueWorkspaceGuide = useCallback((companyId: string | null) => {
    writePendingWorkspaceGuideCompanyId(companyId);
  }, []);

  useEffect(() => {
    if (!guideOpen || !isMobile) return;
    setSidebarOpen(true);
  }, [guideOpen, isMobile, setSidebarOpen]);

  useEffect(() => {
    if (!activeCompanyId || onboardingOpen || location.pathname === "/auth") return;
    if (guideOpen) return;

    const pendingCompanyId = readPendingWorkspaceGuideCompanyId();
    const shouldAutoStart =
      pendingCompanyId === activeCompanyId ||
      (!hasCompletedWorkspaceGuide(activeCompanyId) && !autoStartedRef.current.has(activeCompanyId));

    if (!shouldAutoStart) return;

    const timeoutId = window.setTimeout(() => {
      if (isMobile) setSidebarOpen(true);
      setGuideOpen(true);
      setStepIndex(0);
      autoStartedRef.current.add(activeCompanyId);
    }, pendingCompanyId === activeCompanyId ? 350 : 900);

    return () => window.clearTimeout(timeoutId);
  }, [activeCompanyId, guideOpen, isMobile, location.pathname, onboardingOpen, setSidebarOpen]);

  const handleNext = useCallback(() => {
    if (!activeCompanyId) {
      closeGuide();
      return;
    }

    setStepIndex((current) => {
      if (current >= WORKSPACE_GUIDE_STEPS.length - 1) {
        markWorkspaceGuideCompleted(activeCompanyId);
        writePendingWorkspaceGuideCompanyId(null);
        setGuideOpen(false);
        return 0;
      }
      return current + 1;
    });
  }, [activeCompanyId, closeGuide]);

  const handleBack = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const handleClose = useCallback(() => {
    if (activeCompanyId) {
      writePendingWorkspaceGuideCompanyId(null);
    }
    closeGuide();
  }, [activeCompanyId, closeGuide]);

  const value = useMemo<ProductGuideContextValue>(
    () => ({
      startWorkspaceGuide,
      queueWorkspaceGuide,
      isGuideOpen: guideOpen,
    }),
    [guideOpen, queueWorkspaceGuide, startWorkspaceGuide],
  );

  return (
    <ProductGuideContext.Provider value={value}>
      {children}
      {guideOpen && (
        <ProductGuideOverlay
          step={WORKSPACE_GUIDE_STEPS[stepIndex]!}
          stepIndex={stepIndex}
          totalSteps={WORKSPACE_GUIDE_STEPS.length}
          onBack={handleBack}
          onNext={handleNext}
          onClose={handleClose}
        />
      )}
    </ProductGuideContext.Provider>
  );
}

export function useProductGuide() {
  const ctx = useContext(ProductGuideContext);
  if (!ctx) {
    throw new Error("useProductGuide must be used within a ProductGuideProvider");
  }
  return ctx;
}
