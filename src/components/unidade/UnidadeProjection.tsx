import { useEffect, useMemo, useState } from "react";

import { UnidadeModelViewer } from "@/components/unidade/UnidadeModelViewer";
import tokenAssetMap from "@/data/token_asset_map.json";
import { useCatalog } from "@/hooks/useCatalog";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import { useTranslation } from "@/hooks/useTranslation";
import { unitIdleVfx } from "@/lib/unitIdleVfx";
import { projectionUrls, toggleTechTag, unitTechVisual, type BodySex, type TechGroup, type WeaponStance } from "@/lib/unitModelTechs";

type UnidadeProjectionProps = {
  unitId: number;
  fallbackUrl?: string;
  hero?: boolean;
};

function catalogKey(ingles: string | undefined): string {
  return (ingles ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function iconKey(token: string): string {
  let core = token.toLowerCase();
  if (core.startsWith("aomr_")) core = core.slice(5);
  if (core.endsWith("_icon")) core = core.slice(0, -5);
  return core.replace(/[^a-z]/g, "");
}

const iconByTag = new Map<string, { src: string; label: string }>();
for (const [token, src] of Object.entries(tokenAssetMap)) {
  if (typeof src !== "string") continue;
  const tag = iconKey(token);
  if (!tag || iconByTag.has(tag)) continue;
  const label = token
    .replace(/^aomr_/, "")
    .replace(/_icon$/, "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  iconByTag.set(tag, { src, label });
}

const STANCE_BUTTON =
  "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40";

export function UnidadeProjection({ unitId, fallbackUrl, hero = false }: UnidadeProjectionProps) {
  const { tecnologias } = useCatalog();
  const { t } = useTranslation();
  const visual = unitTechVisual(unitId);
  const [selected, setSelected] = useState<string[]>([]);
  const [stance, setStance] = useState<WeaponStance>("hack");
  const [sex, setSex] = useState<BodySex>("male");
  useEffect(() => {
    setSelected([]);
    setStance("hack");
    setSex("male");
  }, [unitId]);
  const urls = projectionUrls(visual, selected, fallbackUrl, stance, sex);
  const hackIcon = resolveTokenIconSrc("hackdamage");
  const pierceIcon = resolveTokenIconSrc("piercedamage");
  const vfx = useMemo(() => unitIdleVfx(unitId), [unitId]);

  const byCatalog = useMemo(() => {
    const map = new Map<string, { nome: string; icon?: string }>();
    const put = (key: string, nome: string, icon: string | undefined, prefer: boolean) => {
      if (!key) return;
      if (map.has(key) && !prefer) return;
      map.set(key, { nome, icon });
    };
    for (const tech of tecnologias) {
      const icon = tech.icon ? resolveTokenIconSrc(tech.icon) : undefined;
      const prefer = tech.panteoes === "Geral";
      put(catalogKey(tech.ingles), tech.nome, icon, prefer);
      put(iconKey(tech.icon), tech.nome, icon, prefer);
    }
    return map;
  }, [tecnologias]);

  const onToggle = (group: TechGroup, tag: string) => {
    if (!visual) return;
    setSelected((current) => toggleTechTag(visual.groups, current, group.id, tag));
  };

  return (
    <div>
      {visual ? (
        <div className="mb-3 flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          {visual.groups.map((group) => (
            <div key={group.id} className="flex flex-wrap gap-1.5">
              {[...group.options].sort((a, b) => a.rank - b.rank || a.tag.localeCompare(b.tag)).map((option) => {
                const info = byCatalog.get(option.tag) ?? byCatalog.get(option.catalog);
                const fallback = iconByTag.get(option.tag);
                const pressed = selected.includes(option.tag);
                const label = info?.nome ?? fallback?.label ?? option.tag;
                const icon = info?.icon ?? fallback?.src;
                return (
                  <button
                    key={option.tag}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={pressed}
                    onClick={() => onToggle(group, option.tag)}
                    className={`inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border px-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
                      pressed
                        ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/60"
                        : "border-aom-border bg-black/25 hover:border-amber-400/40 hover:bg-amber-500/10"
                    }`}
                  >
                    {icon ? (
                      <img src={icon} alt="" className="h-7 w-7 object-contain" />
                    ) : (
                      <span className="px-1 text-[10px] leading-tight text-amber-100/90">{label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          </div>
          {visual.stance || visual.sex ? (
            <div className="ml-auto flex shrink-0 gap-1.5">
              {visual.stance
                ? (
                    [
                      ["hack", hackIcon, t("spreadsheet.unidades.hackDamage")],
                      ["pierce", pierceIcon, t("spreadsheet.unidades.pierceDamage")],
                    ] as const
                  ).map(([mode, icon, label]) => (
                    <button
                      key={mode}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={stance === mode}
                      onClick={() => setStance(mode)}
                      className={`${STANCE_BUTTON} ${
                        stance === mode
                          ? "border-amber-400/70 bg-amber-500/15 ring-1 ring-amber-400/60"
                          : "border-aom-border bg-black/25 hover:border-amber-400/40 hover:bg-amber-500/10"
                      }`}
                    >
                      {icon ? <img src={icon} alt="" className="h-7 w-7 object-contain" /> : null}
                    </button>
                  ))
                : null}
              {visual.sex
                ? (
                    [
                      ["male", "♂", t("common.male")],
                      ["female", "♀", t("common.female")],
                    ] as const
                  ).map(([mode, mark, label]) => (
                    <button
                      key={mode}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={sex === mode}
                      onClick={() => setSex(mode)}
                      className={`${STANCE_BUTTON} text-lg leading-none ${
                        sex === mode
                          ? "border-amber-400/70 bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/60"
                          : "border-aom-border bg-black/25 text-zinc-200 hover:border-amber-400/40 hover:bg-amber-500/10"
                      }`}
                    >
                      {mark}
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <UnidadeModelViewer urls={urls} hero={hero} vfx={vfx} />
    </div>
  );
}
