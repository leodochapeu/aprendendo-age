import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { SiteNotificationsProvider } from "@/context/SiteNotificationsContext";
import { useCatalog } from "@/hooks/useCatalog";
import { useTranslation } from "@/hooks/useTranslation";
import { startAppUpdateWatcher } from "@/lib/appUpdateWatcher";
import { AZTEC_PANTEON_ID } from "@/lib/astecasCatalog";
import { COMMENTS_ENABLED } from "@/lib/commentsFeature";
import { localeModerationPath, localePantheonIndexPath, localePlayersPath } from "@/lib/localeRoutes";
import { AldeaoComparePage } from "@/pages/AldeaoComparePage";
import { AldeaoDetailPage } from "@/pages/AldeaoDetailPage";
import { AldeoesPage } from "@/pages/AldeoesPage";
import { PanteaoFullPage } from "@/pages/PanteaoFullPage";
import { BattlePage } from "@/pages/BattlePage";
import { BattlePantheonPage } from "@/pages/BattlePantheonPage";
import { CampeonatoPage } from "@/pages/CampeonatoPage";
import { CampeonatosPage } from "@/pages/CampeonatosPage";
import { ClansPage } from "@/pages/ClansPage";
import { ClanDetailPage } from "@/pages/ClanDetailPage";
import { ConstrucaoDetailPage } from "@/pages/ConstrucaoDetailPage";
import { ConstrucoesPage } from "@/pages/ConstrucoesPage";
import { DeusDetailPage } from "@/pages/DeusDetailPage";
import { DeusesPage } from "@/pages/DeusesPage";
import { EraDetailPage } from "@/pages/EraDetailPage";
import { ErasPage } from "@/pages/ErasPage";
import { GodpowerComparePage } from "@/pages/GodpowerComparePage";
import { GodpowerDetailPage } from "@/pages/GodpowerDetailPage";
import { GodpowersPage } from "@/pages/GodpowersPage";
import { HomePage } from "@/pages/HomePage";
import { MapaDetailPage } from "@/pages/MapaDetailPage";
import { MapasPage } from "@/pages/MapasPage";
import { NotificationComposePage } from "@/pages/NotificationComposePage";
import { NotificationManagePage } from "@/pages/NotificationManagePage";
import { NotificationShowcasePage } from "@/pages/NotificationShowcasePage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { CommentModerationPage } from "@/pages/CommentModerationPage";
import { CommunityTopicPage } from "@/pages/CommunityTopicPage";
import { CommunityTopicsPage } from "@/pages/CommunityTopicsPage";
import { PanteaoDetailPage } from "@/pages/PanteaoDetailPage";
import { PanteoesPage } from "@/pages/PanteoesPage";
import { FormRankPage } from "@/pages/FormRankPage";
import { JogadoresAomPage } from "@/pages/JogadoresAomPage";
import { LinksStreamersPage } from "@/pages/LinksStreamersPage";
import { LoginPage } from "@/pages/LoginPage";
import { PublicPlayerProfilePage } from "@/pages/PublicPlayerProfilePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ReliquiasDetailPage } from "@/pages/ReliquiasDetailPage";
import { ReliquiasPage } from "@/pages/ReliquiasPage";
import { SecretStartBuilderPage } from "@/pages/SecretStartBuilderPage";
import { StartDetailPage } from "@/pages/StartDetailPage";
import { StartsPage } from "@/pages/StartsPage";
import { CommunityVideoDetailPage } from "@/pages/CommunityVideoDetailPage";
import { CommunityVideosPage } from "@/pages/CommunityVideosPage";
import { TrilhaDeAprendizadoPage } from "@/pages/trilha-de-aprendizado/TrilhaDeAprendizadoPage";
import { TecnologiaDetailPage } from "@/pages/TecnologiaDetailPage";
import { TecnologiasPage } from "@/pages/TecnologiasPage";
import { UnidadeComparePage } from "@/pages/UnidadeComparePage";
import { UnidadeDetailPage } from "@/pages/UnidadeDetailPage";
import { UnidadesPage } from "@/pages/UnidadesPage";
const BattleRandomPage = lazy(() => import("@/pages/BattleRandomPage").then((m) => ({ default: m.BattleRandomPage })));
function LegacyAstecasRedirect() {
    const { locale } = useTranslation();
    const { panteaoSlugById } = useCatalog();
    const slug = panteaoSlugById.get(AZTEC_PANTEON_ID) ?? "astecas";
    return _jsx(Navigate, { to: localePantheonIndexPath(locale, slug), replace: true });
}
function LegacyRankRedirect() {
    const { locale } = useTranslation();
    return _jsx(Navigate, { to: `${localePlayersPath(locale)}?tab=rank`, replace: true });
}
function LegacySuggestionsRedirect() {
    const { locale } = useTranslation();
    return _jsx(Navigate, { to: localeModerationPath(locale, "suggestions"), replace: true });
}
function BattleRandomFallback() {
    return (_jsx("div", { className: "flex min-h-48 items-center justify-center text-sm text-zinc-400", children: "Carregando\u2026" }));
}
export default function App() {
    useEffect(() => startAppUpdateWatcher(), []);
    return (_jsx(BrowserRouter, { children: _jsx(SiteNotificationsProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "campeonato/:slug/:panel?", element: _jsx(CampeonatoPage, {}) }), _jsx(Route, { path: "championship/:slug/:panel?", element: _jsx(CampeonatoPage, {}) }), _jsxs(Route, { element: _jsx(AppShell, {}), children: [_jsx(Route, { index: true, element: _jsx(HomePage, {}) }), _jsx(Route, { path: "panteoes", element: _jsx(PanteoesPage, {}) }), _jsx(Route, { path: "pantheons", element: _jsx(PanteoesPage, {}) }), _jsx(Route, { path: "panteoes/:slug/indice", element: _jsx(PanteaoFullPage, {}) }), _jsx(Route, { path: "pantheons/:slug/indice", element: _jsx(PanteaoFullPage, {}) }), _jsx(Route, { path: "panteoes/:slug", element: _jsx(PanteaoDetailPage, {}) }), _jsx(Route, { path: "pantheons/:slug", element: _jsx(PanteaoDetailPage, {}) }), _jsx(Route, { path: "astecas", element: _jsx(LegacyAstecasRedirect, {}) }), _jsx(Route, { path: "deuses", element: _jsx(DeusesPage, {}) }), _jsx(Route, { path: "gods", element: _jsx(DeusesPage, {}) }), _jsx(Route, { path: "deuses/:slug", element: _jsx(DeusDetailPage, {}) }), _jsx(Route, { path: "gods/:slug", element: _jsx(DeusDetailPage, {}) }), _jsx(Route, { path: "eras", element: _jsx(ErasPage, {}) }), _jsx(Route, { path: "ages", element: _jsx(ErasPage, {}) }), _jsx(Route, { path: "eras/:slug", element: _jsx(EraDetailPage, {}) }), _jsx(Route, { path: "ages/:slug", element: _jsx(EraDetailPage, {}) }), _jsx(Route, { path: "poderes", element: _jsx(GodpowersPage, {}) }), _jsx(Route, { path: "god-powers", element: _jsx(GodpowersPage, {}) }), _jsx(Route, { path: "poderes/compare/:slugA/:slugB", element: _jsx(GodpowerComparePage, {}) }), _jsx(Route, { path: "god-powers/compare/:slugA/:slugB", element: _jsx(GodpowerComparePage, {}) }), _jsx(Route, { path: "poderes/:slug", element: _jsx(GodpowerDetailPage, {}) }), _jsx(Route, { path: "god-powers/:slug", element: _jsx(GodpowerDetailPage, {}) }), _jsx(Route, { path: "construcoes", element: _jsx(ConstrucoesPage, {}) }), _jsx(Route, { path: "buildings", element: _jsx(ConstrucoesPage, {}) }), _jsx(Route, { path: "construcoes/:slug", element: _jsx(ConstrucaoDetailPage, {}) }), _jsx(Route, { path: "buildings/:slug", element: _jsx(ConstrucaoDetailPage, {}) }), _jsx(Route, { path: "unidades", element: _jsx(UnidadesPage, {}) }), _jsx(Route, { path: "units", element: _jsx(UnidadesPage, {}) }), _jsx(Route, { path: "unidades/compare/:slugA/:slugB", element: _jsx(UnidadeComparePage, {}) }), _jsx(Route, { path: "units/compare/:slugA/:slugB", element: _jsx(UnidadeComparePage, {}) }), _jsx(Route, { path: "unidades/:slug", element: _jsx(UnidadeDetailPage, {}) }), _jsx(Route, { path: "units/:slug", element: _jsx(UnidadeDetailPage, {}) }), _jsx(Route, { path: "aldeoes", element: _jsx(AldeoesPage, {}) }), _jsx(Route, { path: "villagers", element: _jsx(AldeoesPage, {}) }), _jsx(Route, { path: "aldeoes/compare/:slugA/:slugB", element: _jsx(AldeaoComparePage, {}) }), _jsx(Route, { path: "villagers/compare/:slugA/:slugB", element: _jsx(AldeaoComparePage, {}) }), _jsx(Route, { path: "aldeoes/:slug", element: _jsx(AldeaoDetailPage, {}) }), _jsx(Route, { path: "villagers/:slug", element: _jsx(AldeaoDetailPage, {}) }), _jsx(Route, { path: "mapas", element: _jsx(MapasPage, {}) }), _jsx(Route, { path: "maps", element: _jsx(MapasPage, {}) }), _jsx(Route, { path: "mapas/:slug", element: _jsx(MapaDetailPage, {}) }), _jsx(Route, { path: "maps/:slug", element: _jsx(MapaDetailPage, {}) }), _jsx(Route, { path: "reliquias", element: _jsx(ReliquiasPage, {}) }), _jsx(Route, { path: "relics", element: _jsx(ReliquiasPage, {}) }), _jsx(Route, { path: "reliquias/:slug", element: _jsx(ReliquiasDetailPage, {}) }), _jsx(Route, { path: "relics/:slug", element: _jsx(ReliquiasDetailPage, {}) }), _jsx(Route, { path: "tecnologias", element: _jsx(TecnologiasPage, {}) }), _jsx(Route, { path: "technologies", element: _jsx(TecnologiasPage, {}) }), _jsx(Route, { path: "tecnologias/:slug", element: _jsx(TecnologiaDetailPage, {}) }), _jsx(Route, { path: "technologies/:slug", element: _jsx(TecnologiaDetailPage, {}) }), _jsx(Route, { path: "starts", element: _jsx(StartsPage, {}) }), _jsx(Route, { path: "starts/:slug", element: _jsx(StartDetailPage, {}) }), _jsx(Route, { path: "admin/novo-start", element: _jsx(SecretStartBuilderPage, {}) }), _jsx(Route, { path: "battle", element: _jsx(BattlePage, {}) }), _jsx(Route, { path: "battle/random", element: _jsx(BattlePantheonPage, {}) }), _jsx(Route, { path: "battle/random/:pantheonSlug", element: _jsx(Suspense, { fallback: _jsx(BattleRandomFallback, {}), children: _jsx(BattleRandomPage, {}) }) }), _jsx(Route, { path: "rank", element: _jsx(LegacyRankRedirect, {}) }), _jsx(Route, { path: "rank/form", element: _jsx(FormRankPage, {}) }), _jsx(Route, { path: "jogadores-aom", element: _jsx(JogadoresAomPage, {}) }), _jsx(Route, { path: "aom-players", element: _jsx(JogadoresAomPage, {}) }), _jsx(Route, { path: "campeonato", element: _jsx(CampeonatosPage, {}) }), _jsx(Route, { path: "championship", element: _jsx(CampeonatosPage, {}) }), _jsx(Route, { path: "clans", element: _jsx(ClansPage, {}) }), _jsx(Route, { path: "clans/:slug", element: _jsx(ClanDetailPage, {}) }), _jsx(Route, { path: "links-streamers", element: _jsx(LinksStreamersPage, {}) }), _jsx(Route, { path: "streamer-links", element: _jsx(LinksStreamersPage, {}) }), _jsx(Route, { path: "trilha-de-aprendizado", element: _jsx(TrilhaDeAprendizadoPage, {}) }), _jsx(Route, { path: "comunidade", element: COMMENTS_ENABLED ? _jsx(CommunityTopicsPage, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "comunidade/:slug", element: COMMENTS_ENABLED ? _jsx(CommunityTopicPage, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "community", element: COMMENTS_ENABLED ? _jsx(CommunityTopicsPage, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "community/:slug", element: COMMENTS_ENABLED ? _jsx(CommunityTopicPage, {}) : _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "videos-comunidade", element: _jsx(CommunityVideosPage, {}) }), _jsx(Route, { path: "videos-comunidade/:id", element: _jsx(CommunityVideoDetailPage, {}) }), _jsx(Route, { path: "trilha-de-aprendizado/tipos-unidades-multiplicadores", element: _jsx(Navigate, { to: "/trilha-de-aprendizado#forcas", replace: true }) }), _jsx(Route, { path: "trilha-de-aprendizado/atalhos-importantes", element: _jsx(Navigate, { to: "/trilha-de-aprendizado#atalhos", replace: true }) }), _jsx(Route, { path: "trilha-de-aprendizado/rush-turtle-boom", element: _jsx(Navigate, { to: "/trilha-de-aprendizado#estrategia", replace: true }) }), _jsx(Route, { path: "entrar", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "cadastro", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "jogador/:id", element: _jsx(PublicPlayerProfilePage, {}) }), _jsx(Route, { path: "player/:id", element: _jsx(PublicPlayerProfilePage, {}) }), _jsx(Route, { path: "perfil", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "profile", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "sugestoes", element: _jsx(LegacySuggestionsRedirect, {}) }), _jsx(Route, { path: "suggestions", element: _jsx(LegacySuggestionsRedirect, {}) }), _jsx(Route, { path: "moderacao", element: _jsx(CommentModerationPage, {}) }), _jsx(Route, { path: "moderation", element: _jsx(CommentModerationPage, {}) }), _jsx(Route, { path: "notificacoes", element: _jsx(NotificationsPage, {}) }), _jsx(Route, { path: "notifications", element: _jsx(NotificationsPage, {}) }), _jsx(Route, { path: "notificacoes/apresentacao", element: _jsx(NotificationShowcasePage, {}) }), _jsx(Route, { path: "notifications/presentation", element: _jsx(NotificationShowcasePage, {}) }), _jsx(Route, { path: "notificacoes/gerenciar", element: _jsx(NotificationManagePage, {}) }), _jsx(Route, { path: "notifications/manage", element: _jsx(NotificationManagePage, {}) }), _jsx(Route, { path: "notificacoes/enviar", element: _jsx(NotificationComposePage, {}) }), _jsx(Route, { path: "notificacoes/enviar/:id", element: _jsx(NotificationComposePage, {}) }), _jsx(Route, { path: "notifications/send", element: _jsx(NotificationComposePage, {}) }), _jsx(Route, { path: "notifications/send/:id", element: _jsx(NotificationComposePage, {}) }), _jsx(Route, { path: "home", element: _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] })] }) }) }));
}
