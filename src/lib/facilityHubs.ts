export type FacilityHub = "provence" | "czech" | "tuscany" | "croatia";

export const FACILITY_HUBS: { key: FacilityHub; label: string }[] = [
  { key: "czech", label: "Czech" },
  { key: "tuscany", label: "Tuscany" },
  { key: "provence", label: "801 FR Campus" },
  { key: "croatia", label: "Croatia" },
];

export const DEFAULT_FACILITY_HUB: FacilityHub = "provence";

export function isFacilityHub(value: string | undefined | null): value is FacilityHub {
  return !!value && FACILITY_HUBS.some(h => h.key === value);
}

export function normalizeHub(value: string | undefined | null): FacilityHub {
  return isFacilityHub(value) ? value : DEFAULT_FACILITY_HUB;
}

export function hubLabel(value: string | undefined | null): string {
  return FACILITY_HUBS.find(h => h.key === normalizeHub(value))?.label ?? "801 FR Campus";
}
