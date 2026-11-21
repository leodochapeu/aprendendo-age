/**
 * Contexto reutilizável: alternância Grade / Planilha em páginas de listagem.
 *
 * Uso rápido (sem provider — preferido por página):
 * ```tsx
 * import { useListViewMode } from "@/hooks/useListViewMode";
 * import { ListViewModeToggle } from "@/components/list/ListViewModeToggle";
 *
 * const [viewMode, setViewMode] = useListViewMode("deuses");
 * // …
 * <ListViewModeToggle mode={viewMode} onChange={setViewMode} />
 * {viewMode === "grade" ? <GradeView /> : <PlanilhaView />}
 * ```
 *
 * Planilha com referências clicáveis e pré-visualização:
 * - `resolveEntityLink` em `@/lib/entityResolve`
 * - `SpreadsheetTable`, `SpreadsheetRefChip`, `SpreadsheetHoverPreview` (canto superior no `PageHeader`),
 *   `SpreadsheetExpandableStack` em `@/components/spreadsheet`
 *
 * Chaves sugeridas: `deuses`, `unidades`, `tecnologias`, `godpowers`, …
 */
export { useListViewMode } from "@/hooks/useListViewMode";
