import { useLocation, useParams } from "react-router-dom";

import { PageComments } from "@/components/comments/MapComments";
import { StartAuthorsMeta } from "@/components/start/StartAuthorsMeta";
import { StartGodPortraits } from "@/components/start/StartGodPortraits";
import { StartStructuredContent } from "@/components/starts/StartStructuredContent";
import { StartVideosSection } from "@/components/starts/StartVideosSection";
import { BackLink } from "@/components/ui/BackLink";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { listIndexBackLinkLabel, listIndexLinkStateFromLocation, listIndexReturnTo } from "@/lib/listIndexReturnState";

export function StartDetailPage() {
  const { t } = useTranslation();
  const { startBySlug } = useCatalog();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const backToList = listIndexReturnTo("/starts", navState);
  const backLabel = listIndexBackLinkLabel(backToList, t("nav.starts"));
  const backLabelNotFound = listIndexBackLinkLabel(backToList, t("nav.starts"));
  const deusLinkFromStartState = listIndexLinkStateFromLocation(pathname, locSearch);
  const { slug } = useParams();
  const s = slug ? startBySlug.get(slug) : undefined;

  if (!s) {
    return (
      <div>
        <BackLink to={backToList}>{backLabelNotFound}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.start")}</p>
      </div>
    );
  }

  const hasStructured = s.structured?.segments?.some(
    (seg) => (seg.lead?.length ?? 0) > 0 || (seg.table?.length ?? 0) > 0 || (seg.footer?.length ?? 0) > 0,
  );

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={<NotionText text={s.titulo} />}
        description={
          s.author.length ? (
            <StartAuthorsMeta authors={s.author} className="text-sm text-zinc-300" />
          ) : undefined
        }
        actions={<StartGodPortraits names={s.god} linkState={deusLinkFromStartState} />}
      />

      {hasStructured ? <StartStructuredContent segments={s.structured.segments} /> : null}

      <StartVideosSection title={s.titulo} urls={s.youtube} />

      {!hasStructured && s.youtube.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">{t("common.noContentOrVideos")}</p>
      ) : null}
      {slug ? (
        <PageComments
          pageKind="starts"
          pageKey={slug}
          itemName={s.titulo.replace(/:[a-z0-9_-]+:/gi, " ").replace(/\s+/g, " ").trim() || s.titulo}
          kindLabel={t("comments.kinds.start")}
        />
      ) : null}
    </div>
  );
}
