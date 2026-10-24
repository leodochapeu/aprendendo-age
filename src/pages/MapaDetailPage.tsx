import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";

import { MapComments } from "@/components/comments/MapComments";
import { AppPageDetail } from "@/components/layout/AppPageDetail";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { BackLink } from "@/components/ui/BackLink";
import { InfoRow } from "@/components/ui/InfoRow";
import { NotionText } from "@/components/ui/NotionText";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { getMapa3dUrl, getMapaAssetUrl, getMapaPreviewUrl } from "@/lib/entityWatermarkUrls";
import { listIndexBackLinkLabel, listIndexReturnTo } from "@/lib/listIndexReturnState";
import { formatMapaOrigem, mapaOrigemTitleIcons } from "@/lib/mapaOrigemIcons";

type PreviewTabId = "ingame" | "vision3d";

function MapAboutFacts({ items }: { items: { key: string; label: string; value: ReactNode }[] }) {
  const pairs: { key: string; label: string; value: ReactNode }[][] = [];
  for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));

  return (
    <div>
      {pairs.map((pair, index) => {
        const hasNext = index < pairs.length - 1;
        return (
          <div
            key={pair[0]?.key ?? index}
            className={cn("grid grid-cols-1 sm:grid-cols-2", hasNext && "sm:border-b sm:border-zinc-800/80")}
          >
            {pair.map((item, col) => (
              <div
                key={item.key}
                className={cn(
                  "min-w-0",
                  col === 0 &&
                    pair.length > 1 &&
                    "border-b border-zinc-800/80 sm:border-b-0 sm:border-r sm:pr-5",
                  col === 1 && "sm:pl-5",
                  col === 1 && hasNext && "border-b border-zinc-800/80 sm:border-b-0",
                  pair.length === 1 && hasNext && "border-b border-zinc-800/80 sm:border-b-0",
                )}
              >
                <InfoRow label={item.label} aside borderless>
                  {item.value}
                </InfoRow>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MapaPreviewSection({
  mapName,
  previewUrl,
  map3dUrl,
}: {
  mapName: string;
  previewUrl?: string;
  map3dUrl?: string;
}) {
  const { t } = useTranslation();
  const [previewFailed, setPreviewFailed] = useState(false);
  const [map3dFailed, setMap3dFailed] = useState(false);
  const [tab, setTab] = useState<PreviewTabId>("ingame");
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollingFromTab = useRef(false);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const hasPreview = Boolean(previewUrl) && !previewFailed;
  const has3d = Boolean(map3dUrl) && !map3dFailed;
  const showTabs = hasPreview && has3d;

  useEffect(() => {
    if (!hasPreview && has3d) setTab("vision3d");
    else if (hasPreview) setTab("ingame");
  }, [hasPreview, has3d]);

  const scrollToTab = useCallback(
    (next: PreviewTabId, behavior: ScrollBehavior = "smooth") => {
      const el = trackRef.current;
      if (!el || !showTabs) return;
      scrollingFromTab.current = true;
      const index = next === "ingame" ? 0 : 1;
      el.scrollTo({ left: index * el.clientWidth, behavior });
      setTab(next);
      window.setTimeout(() => {
        scrollingFromTab.current = false;
      }, behavior === "smooth" ? 400 : 50);
    },
    [showTabs],
  );

  useEffect(() => {
    if (!showTabs) return;
    scrollToTab(tabRef.current, "instant");
    const onResize = () => scrollToTab(tabRef.current, "instant");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showTabs, scrollToTab]);

  const syncTabFromScroll = useCallback(() => {
    if (scrollingFromTab.current) return;
    const el = trackRef.current;
    if (!el || !showTabs) return;
    const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    const next: PreviewTabId = index >= 1 ? "vision3d" : "ingame";
    setTab((prev) => (prev === next ? prev : next));
  }, [showTabs]);

  if (!hasPreview && !has3d) return null;

  return (
    <Section title={t("common.mapPreview")} className="mt-6">
      {showTabs ? (
        <div
          role="tablist"
          aria-label={t("common.mapPreview")}
          className="mb-3 flex flex-wrap gap-2"
        >
          {(
            [
              { id: "ingame" as const, label: t("common.mapPreviewInGame") },
              { id: "vision3d" as const, label: t("common.mapPreview3dVision") },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => scrollToTab(item.id)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
                  active
                    ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35"
                    : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {showTabs ? (
        <div
          ref={trackRef}
          className="flex touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={syncTabFromScroll}
        >
          <div className="w-full min-w-full shrink-0 snap-center snap-always" role="tabpanel">
            <img
              src={previewUrl}
              alt={`${mapName} — ${t("common.mapPreviewInGame")}`}
              className="mx-auto h-auto w-full select-none rounded-xl object-contain"
              draggable={false}
              onError={() => setPreviewFailed(true)}
            />
          </div>
          <div className="w-full min-w-full shrink-0 snap-center snap-always" role="tabpanel">
            <img
              src={map3dUrl}
              alt={`${mapName} — ${t("common.mapPreview3dVision")}`}
              className="mx-auto h-auto w-full select-none rounded-xl object-contain"
              draggable={false}
              onError={() => setMap3dFailed(true)}
            />
          </div>
        </div>
      ) : hasPreview ? (
        <img
          src={previewUrl}
          alt={`${mapName} — ${t("common.mapPreview")}`}
          className="mx-auto h-auto w-full rounded-xl object-contain"
          onError={() => setPreviewFailed(true)}
        />
      ) : (
        <img
          src={map3dUrl}
          alt={`${mapName} — ${t("common.mapPreview3dVision")}`}
          className="mx-auto h-auto w-full rounded-xl object-contain"
          onError={() => setMap3dFailed(true)}
        />
      )}

      {showTabs ? (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition",
              tab === "ingame" ? "bg-amber-400" : "bg-zinc-600",
            )}
          />
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition",
              tab === "vision3d" ? "bg-amber-400" : "bg-zinc-600",
            )}
          />
        </div>
      ) : null}
    </Section>
  );
}

export function MapaDetailPage() {
  const { t } = useTranslation();
  const { mapaBySlug, mapas } = useCatalog();
  const { state: navState } = useLocation();
  const backToList = listIndexReturnTo("/mapas", navState);
  const backLabel = listIndexBackLinkLabel(backToList, t("nav.maps"));
  const { slug } = useParams();
  const m = slug ? mapaBySlug.get(slug) : undefined;

  function fmtSimNao(v: boolean | undefined): string {
    if (v === undefined) return "—";
    return v ? "✅" : "❌";
  }

  if (!m) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.map")}</p>
      </div>
    );
  }

  const mapIndex = mapas.indexOf(m);
  const mapaIcon = getMapaAssetUrl(m);
  const previewUrl = getMapaPreviewUrl(m);
  const map3dUrl = getMapa3dUrl(m);
  const dlcIcons = mapaOrigemTitleIcons(m.origem);
  const shortDesc = (m.descricao_resumida ?? "").trim();
  const hist = (m.historia ?? "").trim();

  return (
    <AppPageDetail
      backTo="/mapas"
      backLabel={backLabel}
      title={m.nome}
      description={
        shortDesc ? <NotionText text={shortDesc} className="block" /> : undefined
      }
      headerIconSrc={mapaIcon}
      heroBackgroundSrc={previewUrl}
      heroBackgroundFallbackSrc={mapaIcon}
      siblingNav={mapIndex >= 0 ? <CatalogRecordNav section="mapas" currentId={mapIndex} /> : undefined}
      actions={
        dlcIcons.length ? (
          <div className="flex items-center gap-2">
            {dlcIcons.map((ti) => (
              <img
                key={ti.src}
                src={ti.src}
                alt=""
                title={ti.label}
                draggable={false}
                className="size-12 rounded-lg border border-aom-border/80 bg-zinc-900/50 object-contain p-1 shadow-sm shadow-black/25 sm:size-14"
              />
            ))}
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("common.aboutMap")} className="h-full">
          {hist && hist !== shortDesc ? (
            <div className="border-b border-zinc-800/80 pb-3">
              <NotionText
                text={hist}
                className="block whitespace-pre-line text-sm leading-relaxed text-zinc-300"
              />
            </div>
          ) : null}
          <MapAboutFacts
            items={[
              { key: "ranked", label: t("common.ranked"), value: fmtSimNao(m.mapas_da_ranqueada) },
              { key: "leftRanked", label: t("common.leftRanked"), value: fmtSimNao(m.saiu_da_ranqueada) },
              { key: "default", label: t("common.default"), value: fmtSimNao(m.padrao) },
              { key: "quick", label: t("common.quickMatches"), value: fmtSimNao(m.partidas_rapidas) },
              { key: "type", label: t("common.type"), value: m.tipo ?? "—" },
              { key: "origin", label: t("common.origin"), value: formatMapaOrigem(m.origem) || "—" },
            ]}
          />
        </Section>
        {mapaIcon ? (
          <Section title={t("common.map2d")} className="h-full">
            <img
              src={mapaIcon}
              alt={`${m.nome} — ${t("common.map2d")}`}
              className="mx-auto h-auto w-full max-w-96 rounded-xl object-contain"
            />
          </Section>
        ) : null}
      </div>
      <MapComments slug={slug ?? m.nome} mapName={m.nome} />
      <MapaPreviewSection
        key={`${previewUrl ?? ""}|${map3dUrl ?? ""}`}
        mapName={m.nome}
        previewUrl={previewUrl}
        map3dUrl={map3dUrl}
      />
    </AppPageDetail>
  );
}
