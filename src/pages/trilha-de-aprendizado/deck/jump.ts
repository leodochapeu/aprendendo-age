import { createContext, useContext } from "react";

export const TrilhaJumpContext = createContext<(id: string) => void>(() => {});

export function useTrilhaJump() {
  return useContext(TrilhaJumpContext);
}
