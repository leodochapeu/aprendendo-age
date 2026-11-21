import { createContext, useContext } from "react";
export const TrilhaJumpContext = createContext(() => { });
export function useTrilhaJump() {
    return useContext(TrilhaJumpContext);
}
