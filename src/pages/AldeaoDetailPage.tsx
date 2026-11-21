import { Link, useLocation, useParams } from "react-router-dom";

import { AldeaoBonusBody, AldeaoColetaBody, AldeaoGeralBody } from "@/components/aldeao/AldeaoSectionBodies";
import { PageComments } from "@/components/comments/MapComments";
import { BackLink } from "@/components/ui/BackLink";
import { CatalogRecordNav } from "@/components/ui/DetailSiblingNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { entityDisplayDescription } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { getAldeaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { localeSectionPath } from "@/lib/localeRoutes";
import { unitIdMatchingAldeao } from "@/lib/unidadeAldeao";
import {
  listIndexLinkStateFromLocation,
  listIndexReturnTo,
  listOrDetailBackLinkLabel,
} from "@/lib/listIndexReturnState";

export function AldeaoDetailPage() {
  const { t, locale } = useTranslation();
  const { aldeaoBySlug, unidades, unidadeSlugById } = useCatalog();
  const { pathname, search: locSearch, state: navState } = useLocation();
  const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const villagersList = localeSectionPath(locale, "aldeoes");
  const backToList = listIndexReturnTo(villagersList, navState);
  const backLabel = listOrDetailBackLinkLabel(backToList, villagersList, t("nav.villagers"));
  const { slug } = useParams();
  const a = slug ? aldeaoBySlug.get(slug) : undefined;

  if (!a) {
    return (
      <div>
        <BackLink to={backToList}>{backLabel}</BackLink>
        <p className="text-zinc-400">{t("common.entityNotFound.villager")}</p>
      </div>
    );
  }

  const aldeaoIcon = getAldeaoAssetUrl(a);
  const unitId = unitIdMatchingAldeao(a, unidades);
  const unitSlug = unitId != null ? unidadeSlugById.get(unitId) : undefined;
  const unitPath = unitSlug ? localeSectionPath(locale, "unidades", unitSlug) : undefined;

  return (
    <div>
      <BackLink to={backToList}>{backLabel}</BackLink>
      <PageHeader
        title={a.nome}
        description={entityDisplayDescription(a, locale, t)}
        headerIconSrc={aldeaoIcon}
        siblingNav={<CatalogRecordNav section="aldeoes" currentId={a.id} />}
      />

      {unitPath ? (
        <div className="mb-6">
          <Link
            to={unitPath}
            aria-label={t("pages.aldeoes.openUnitAria")}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-500/25"
          >
            {t("pages.aldeoes.openUnit")}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={t("common.general")} className="h-full">
          <AldeaoGeralBody a={a} linkState={linkState} />
        </Section>

        {aldeaoIcon ? (
          <Section title={t("common.icon")} className="h-full">
            <img
              src={aldeaoIcon}
              alt={`${a.nome} — ${t("common.icon")}`}
              className="mx-auto h-auto w-full max-w-96 rounded-xl object-contain"
            />
          </Section>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title={t("common.baseGatherRates")} className="h-full">
          <AldeaoColetaBody a={a} />
        </Section>

        <Section title={t("common.percentBonus")} className="h-full">
          <AldeaoBonusBody a={a} />
        </Section>
      </div>
      {slug ? (
        <PageComments pageKind="aldeoes" pageKey={slug} itemName={a.nome} kindLabel={t("comments.kinds.villager")} />
      ) : null}
    </div>
  );
}
