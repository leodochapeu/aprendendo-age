import { Link, useLocation, useParams } from "react-router-dom";

import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { InfoRow } from "@/components/ui/InfoRow";
import { NotionText } from "@/components/ui/NotionText";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { listIndexReturnTo, listOrDetailBackLinkLabel } from "@/lib/listIndexReturnState";

export function EraDetailPage() {
  const { t } = useTranslation();
  const { construcaoById, construcaoSlugById, eraBySlug } = useCatalog();
  const { state: navState } = useLocation();
  const backToList = listIndexReturnTo("/eras", navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, "/eras", t("nav.eras"));
  const { slug } = useParams();
  const e = slug ? eraBySlug.get(slug) : undefined;

  if (!e) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.era")}</p>
      </div>
    );
  }

  const reqIds = (e as { requisitos_para_subir_de_era_ids?: number[] }).requisitos_para_subir_de_era_ids;
  const reqSingle = (e as { requisitos_para_subir_de_era_id?: number }).requisitos_para_subir_de_era_id;

  const eraIcon = getEraAssetUrl(e);

  const reqLinks = (reqIds ?? (reqSingle != null ? [reqSingle] : []))
    .map((cid) => {
      const c = construcaoById.get(cid);
      return c ? (
        <Link
          key={cid}
          to={`/construcoes/${construcaoSlugById.get(cid) ?? cid}`}
          className="text-amber-200 underline-offset-2 hover:underline"
        >
          {c.nome}
        </Link>
      ) : (
        <span key={cid}>#{cid}</span>
      );
    })
    .filter(Boolean);

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={e.nome}
        description={e.hint}
        headerIconSrc={eraIcon}
        siblingNav={<CatalogRecordNav section="eras" currentId={e.id} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("common.description")}>
          <NotionText text={e.description} />
        </Section>

        <Section title={t("common.advanceCosts")}>
          <div className="space-y-0">
            <InfoRow label={t("common.food")} icon="foodaom">
              {e.comida === 0 ? t("common.none") : e.comida ?? 0}
            </InfoRow>
            <InfoRow label={t("common.wood")} icon="woodaom">
              {e.madeira === 0 ? t("common.none") : e.madeira ?? 0}
            </InfoRow>
            <InfoRow label={t("common.gold")} icon="goldaom">
              {e.ouro === 0 ? t("common.none") : e.ouro ?? 0}
            </InfoRow>
            <InfoRow label={t("common.baseTimeSec")} icon="aomr_time_icon">
              {e.tempo_seg === 0 ? t("common.initial") : e.tempo_seg ?? 0}
            </InfoRow>
          </div>
        </Section>

        {(e.requisitos_para_subir_de_era || reqLinks.length > 0) && (
          <Section title={t("common.ageUpRequirements")}>
            {reqLinks.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {reqLinks.map((el, i) => (
                  <li key={i}>
                    {el}
                    {i < reqLinks.length - 1 ? <span className="text-zinc-600">,</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>
        )}
      </div>
      {slug ? <PageComments pageKind="eras" pageKey={slug} itemName={e.nome} kindLabel={t("comments.kinds.age")} /> : null}
    </div>
  );
}
