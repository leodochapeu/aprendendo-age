import { createContext, useContext } from "react";

export type ListHeaderCollapse = {
  open: boolean;
  toggle: () => void;
  controlsId: string;
  /** Ponto âmbar no botão recolhido quando a página tem filtro aplicado. */
  marked: boolean;
  setMarked: (active: boolean) => void;
};

export const ListHeaderCollapseContext = createContext<ListHeaderCollapse | null>(null);

export function useListHeaderCollapse() {
  return useContext(ListHeaderCollapseContext);
}
