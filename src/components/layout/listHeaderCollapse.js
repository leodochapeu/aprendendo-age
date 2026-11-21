import { createContext, useContext } from "react";
export const ListHeaderCollapseContext = createContext(null);
export function useListHeaderCollapse() {
    return useContext(ListHeaderCollapseContext);
}
