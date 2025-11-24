import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface LayoutState {
  showAccountPanel: boolean;
  showBotStatus: boolean;
  showOptionsPositions: boolean;
  showOrderTicket: boolean;
  showNews: boolean;
  showNotes: boolean;
  showKPIs: boolean;
  showOptionsChain: boolean;
  showTradeHistory: boolean;
}

export type WorkspacePreset = "scan" | "trade" | "focus" | "full";

const defaultLayout: LayoutState = {
  showAccountPanel: true,
  showBotStatus: true,
  showOptionsPositions: true,
  showOrderTicket: true,
  showNews: true,
  showNotes: true,
  showKPIs: true,
  showOptionsChain: true,
  showTradeHistory: true,
};

const workspacePresets: Record<WorkspacePreset, LayoutState> = {
  scan: {
    showAccountPanel: true,
    showBotStatus: true,
    showOptionsPositions: false,
    showOrderTicket: false,
    showNews: true,
    showNotes: true,
    showKPIs: true,
    showOptionsChain: false,
    showTradeHistory: true,
  },
  trade: {
    showAccountPanel: true,
    showBotStatus: true,
    showOptionsPositions: true,
    showOrderTicket: true,
    showNews: false,
    showNotes: false,
    showKPIs: false,
    showOptionsChain: true,
    showTradeHistory: false,
  },
  focus: {
    showAccountPanel: true,
    showBotStatus: false,
    showOptionsPositions: false,
    showOrderTicket: false,
    showNews: false,
    showNotes: false,
    showKPIs: false,
    showOptionsChain: false,
    showTradeHistory: false,
  },
  full: defaultLayout,
};

interface LayoutContextType {
  layout: LayoutState;
  updateLayout: (updates: Partial<LayoutState>) => void;
  setWorkspace: (preset: WorkspacePreset) => void;
  currentWorkspace: WorkspacePreset | null;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = "dashboard-layout";

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [layout, setLayout] = useState<LayoutState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultLayout;
  });
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspacePreset | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const updateLayout = (updates: Partial<LayoutState>) => {
    setLayout((prev) => ({ ...prev, ...updates }));
    setCurrentWorkspace(null); // Clear preset when manually changing
  };

  const setWorkspace = (preset: WorkspacePreset) => {
    setLayout(workspacePresets[preset]);
    setCurrentWorkspace(preset);
  };

  return (
    <LayoutContext.Provider value={{ layout, updateLayout, setWorkspace, currentWorkspace }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
};
