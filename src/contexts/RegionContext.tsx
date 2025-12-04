import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Region = "europe" | "usa_lappa" | "canada" | null;

export const REGION_LABELS: Record<string, string> = {
  europe: "Europe",
  usa_lappa: "USA & Lappa",
  canada: "Canada",
};

export const REGION_HUBS: Record<string, string | null> = {
  europe: null, // Multiple hubs - determined by OPS Area
  usa_lappa: "USA Hub",
  canada: "Canada Hub",
};

interface RegionContextType {
  selectedRegion: Region;
  setSelectedRegion: (region: Region) => void;
  clearRegion: () => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [selectedRegion, setSelectedRegion] = useState<Region>(() => {
    const stored = localStorage.getItem("selected_region");
    return stored ? (stored as Region) : null;
  });

  useEffect(() => {
    if (selectedRegion) {
      localStorage.setItem("selected_region", selectedRegion);
    } else {
      localStorage.removeItem("selected_region");
    }
  }, [selectedRegion]);

  const clearRegion = () => {
    setSelectedRegion(null);
    localStorage.removeItem("selected_region");
  };

  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion, clearRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}
