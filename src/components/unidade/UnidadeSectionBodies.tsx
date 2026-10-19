import { useLocation } from "react-router-dom";

import { InfoRow } from "@/components/ui/InfoRow";
import { InfoRowPortraitOrText } from "@/components/ui/InfoRowPortraitCluster";
import { PortraitHeaderActions } from "@/components/ui/PortraitHeaderActions";
import { Section } from "@/components/ui/Section";
import { formatArmorPercent } from "@/lib/armorDisplay";
import { UnidadeTipoLine } from "@/components/unidade/UnidadeTipoLine";
import { NotionText } from "@/components/ui/NotionText";
import { resolveTokenIconSrc } from "@/lib/tokenIconUrl";
import type { LocaleCatalog } from "@/data/catalogLocale";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import {
  hasMultiplicadorContent,
  multiplicadorItemsToNotionText,
} from "@/lib/unidadeMultiplicador";
import {
  categoriaItemsToNotionText,
  hasCategoriaContent,
  hasTipoContent,
} from "@/lib/unidadeTipo";
import { getConstrucaoAssetUrl } from "@/lib/entityWatermarkUrls";
import { getEraAssetUrl } from "@/lib/eraAssetUrl";
import { listIndexLinkStateFromLocation } from "@/lib/listIndexReturnState";
import { construcaoPublicId, construcaoVariantQuery } from "@/lib/buildingFamilies";
import { localeSectionPath } from "@/lib/localeRoutes";
import { getPantheonWatermarkUrl } from "@/lib/pantheonAssetUrl";

type U = LocaleCatalog["unidades"][number];

export function UnidadeVisaoGeralBody({ u }: { u: U }) {
  const { t } = useTranslation();
  const catalog = useCatalog();
  const { locale, construcaoById, construcaoSlugById, eraById, eraSlugById, panteaoById, panteaoSlugById } =
    catalog;
  const { pathname, search: locSearch } = useLocation();
  const linkState = listIndexLinkStateFromLocation(pathname, locSearch);
  const panteaoRefs = u.panteao;
  const eraRefs = u.era;
  const constrRefs = u.construcao;

  const panteoesPortraitItems =
    Array.isArray(panteaoRefs) && panteaoRefs.length
      ? panteaoRefs.map((r, i) => {
          const p = panteaoById.get(r.id);
          return {
            key: `${r.id}-${i}`,
            to: localeSectionPath(locale, "panteoes", panteaoSlugById.get(r.id) ?? r.id),
            nome: r.nome,
            src: p ? getPantheonWatermarkUrl(p) : undefined,
          };
        })
      : [];

  const eraPortraitItems =
    Array.isArray(eraRefs) && eraRefs.length
      ? eraRefs.map((r, i) => {
          const e = eraById.get(r.id);
          return {
            key: `${r.id}-${i}`,
            to: localeSectionPath(locale, "eras", eraSlugById.get(r.id) ?? r.id),
            nome: r.nome,
            src: e ? getEraAssetUrl(e) : undefined,
          };
        })
      : [];

  const construcaoPortraitItems =
    Array.isArray(constrRefs) && constrRefs.length
      ? constrRefs.map((r, i) => {
          const publicId = construcaoPublicId(r.id);
          const c = construcaoById.get(publicId);
          return {
            key: `${r.id}-${i}`,
            to: `${localeSectionPath(locale, "construcoes", construcaoSlugById.get(publicId) ?? publicId)}${construcaoVariantQuery(r.id)}`,
            nome: r.nome,
            src: c ? getConstrucaoAssetUrl(c) : undefined,
          };
        })
      : [];

  const descricaoResumida = (u.descricao_resumida ?? "").trim();
  const descricaoAvancada = (u.descricao_avancada ?? "").trim();
  const showAvancada = Boolean(descricaoAvancada && descricaoAvancada !== descricaoResumida);

  return (
    <div className="space-y-0">
      {descricaoResumida ? (
        <InfoRow label={t("common.description")}>
          <NotionText text={descricaoResumida} />
        </InfoRow>
      ) : null}
      {hasTipoContent(u.tipo) ? (
        <InfoRow label={t("common.type")}>
          <UnidadeTipoLine tipo={u.tipo} colored />
        </InfoRow>
      ) : null}
      {hasCategoriaContent(u.categoria) ? (
        <InfoRow label={t("common.category")}>
          <NotionText text={categoriaItemsToNotionText(u.categoria)} />
        </InfoRow>
      ) : null}
      {panteoesPortraitItems.length ? (
        <InfoRow label={t("common.pantheon")}>
          <InfoRowPortraitOrText
            portraits={
              <PortraitHeaderActions
                items={panteoesPortraitItems}
                linkState={linkState}
                size="sm"
                justify="start"
              />
            }
            textFallback={null}
          />
        </InfoRow>
      ) : null}
      {eraPortraitItems.length ? (
        <InfoRow label={t("common.era")}>
          <InfoRowPortraitOrText
            portraits={
              <PortraitHeaderActions
                items={eraPortraitItems}
                linkState={linkState}
                size="sm"
                justify="start"
              />
            }
            textFallback={null}
          />
        </InfoRow>
      ) : null}
      {construcaoPortraitItems.length ? (
        <InfoRow label={t("spreadsheet.unidades.building")}>
          <InfoRowPortraitOrText
            portraits={
              <PortraitHeaderActions
                items={construcaoPortraitItems}
                linkState={linkState}
                size="sm"
                justify="start"
              />
            }
            textFallback={null}
          />
        </InfoRow>
      ) : null}
      {showAvancada ? (
        <div className="border-t border-aom-border/50 pt-3">
          <NotionText
            text={descricaoAvancada}
            className="block whitespace-pre-line text-sm leading-relaxed text-zinc-300"
          />
        </div>
      ) : null}
    </div>
  );
}

export function UnidadeCombateBody({ u }: { u: U }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0">
      <InfoRow label={t("spreadsheet.unidades.hitPoints")} icon="aomr_hit_points_icon">
        {u.pontos_de_vida ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.range")} icon="rangeicon">
        {u.alcance ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.hackDamage")} icon="hackdamage">
        {u.dano_cortante ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.pierceDamage")} icon="piercedamage">
        {u.dano_perfurante ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.attackSpeed")} icon="aomr_rate_of_fire_icon">
        {u.velocidade_de_ataque_atk_s ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.dps")} icon="attack_cur">
        {u.dps ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.hackArmor")} icon="hackarmor">
        {formatArmorPercent(u.armadura_anticorte)}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.pierceArmor")} icon="piercearmor">
        {formatArmorPercent(u.armadura_antiperfurante)}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.counterOf")}>
        {u.counter_de ? <NotionText text={u.counter_de} /> : "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.multiplier")}>
        {hasMultiplicadorContent(u.multiplicador) ? (
          <NotionText text={multiplicadorItemsToNotionText(u.multiplicador)} />
        ) : (
          "—"
        )}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.strongAgainst")} icon="aomr_better_icon">
        {u.forte_contra ? <NotionText text={u.forte_contra} /> : "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.weakAgainst")} icon="aomr_worse_icon">
        {u.fraco_contra ? <NotionText text={u.fraco_contra} /> : "—"}
      </InfoRow>
    </div>
  );
}

export function UnidadeCustoBody({ u }: { u: U }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0">
      <InfoRow label={t("common.food")} icon="foodaom">
        {u.comida ?? "—"}
      </InfoRow>
      <InfoRow label={t("common.wood")} icon="woodaom">
        {u.madeira ?? "—"}
      </InfoRow>
      <InfoRow label={t("common.gold")} icon="goldaom">
        {u.ouro ?? "—"}
      </InfoRow>
      {typeof u.favor === "number" && u.favor > 0 ? (
        <InfoRow label={t("spreadsheet.favor")} icon="favoraom">
          {u.favor}
        </InfoRow>
      ) : null}
      <InfoRow label={t("spreadsheet.unidades.population")} icon="aomr_population_provision_icon">
        {u.populacao ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.trainTime")} icon="aomr_time_icon">
        {u.tempo_treinamento ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.moveSpeed")} icon="aomr_speed_icon">
        {u.velocidade_movimento ?? "—"}
      </InfoRow>
      <InfoRow label={t("spreadsheet.unidades.attributeStrength")} icon="attack_cur">
        {u.forca_atributos ?? "—"}
      </InfoRow>
    </div>
  );
}

export function UnidadeHabilidadesBody({ u }: { u: U }) {
  const habilidades = Array.isArray(u.habilidades) ? u.habilidades : [];
  if (!habilidades.length) return null;

  return (
    <ul className="space-y-3">
      {habilidades.map((h, i) => {
        const iconToken = (h.icon ?? "").replace(/^:+|:+$/g, "");
        const iconSrc = iconToken ? resolveTokenIconSrc(iconToken) : undefined;
        return (
          <li
            key={`${h.nome}-${i}`}
            className="flex items-start gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5"
          >
            {iconSrc ? (
              <img
                src={iconSrc}
                alt=""
                aria-hidden
                className="mt-0.5 size-10 shrink-0 rounded-md border border-zinc-700/60 bg-zinc-900/80 object-contain p-0.5"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <NotionText text={h.nome} className="text-sm font-medium text-zinc-100" />
              {h.descricao ? (
                <NotionText
                  text={h.descricao}
                  className="mt-1 block text-sm leading-relaxed text-zinc-400"
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Seção de história do jogo — sempre aberta. */
export function UnidadeHistoriaDetails({ historia }: { historia: string }) {
  const { t } = useTranslation();
  const text = historia.trim();
  if (!text) return null;

  return (
    <Section title={t("common.history")} className="mt-6">
      <NotionText
        text={text.replace(/\n\n+/g, "\n\n")}
        className="block whitespace-pre-line text-sm leading-relaxed text-zinc-300"
      />
    </Section>
  );
}
