import React, { createContext, useContext, useState, useCallback } from "react";

interface DemoContextValue {
  isDemoActive: boolean;
  activeCaseId: string | null;
  demoStep: number;
  activeScenario: string | null;
  startDemo: (caseId?: string, scenario?: string) => void;
  exitDemo: () => void;
  setDemoStep: (step: number) => void;
  setActiveCaseId: (id: string | null) => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoActive: false,
  activeCaseId: null,
  demoStep: 0,
  activeScenario: null,
  startDemo: () => {},
  exitDemo: () => {},
  setDemoStep: () => {},
  setActiveCaseId: () => {}
});

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const startDemo = useCallback((caseId?: string, scenario?: string) => {
    setIsDemoActive(true);
    setActiveCaseId(caseId || null);
    setDemoStep(0);
    setActiveScenario(scenario || null);
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemoActive(false);
    setActiveCaseId(null);
    setDemoStep(0);
    setActiveScenario(null);
  }, []);

  return (
    <DemoContext.Provider value={{
      isDemoActive,
      activeCaseId,
      demoStep,
      activeScenario,
      startDemo,
      exitDemo,
      setDemoStep,
      setActiveCaseId
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);
