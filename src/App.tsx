import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { SiteNotificationsProvider } from "@/context/SiteNotificationsContext";
import { startAppUpdateWatcher } from "@/lib/appUpdateWatcher";
import { AldeaoComparePage } from "@/pages/AldeaoComparePage";
import { AldeaoDetailPage } from "@/pages/AldeaoDetailPage";
import { AldeoesPage } from "@/pages/AldeoesPage";
import { AstecasPage } from "@/pages/AstecasPage";
import { BattlePage } from "@/pages/BattlePage";
import { BattlePantheonPage } from "@/pages/BattlePantheonPage";
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
import { NotificationsPage } from "@/pages/NotificationsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PanteaoDetailPage } from "@/pages/PanteaoDetailPage";
import { PanteoesPage } from "@/pages/PanteoesPage";
import { FormRankPage } from "@/pages/FormRankPage";
import { JogadoresAomPage } from "@/pages/JogadoresAomPage";
import { LinksStreamersPage } from "@/pages/LinksStreamersPage";
import { LoginPage } from "@/pages/LoginPage";
import { PublicPlayerProfilePage } from "@/pages/PublicPlayerProfilePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RankPage } from "@/pages/RankPage";
import { ReliquiasDetailPage } from "@/pages/ReliquiasDetailPage";
import { ReliquiasPage } from "@/pages/ReliquiasPage";
import { SecretStartBuilderPage } from "@/pages/SecretStartBuilderPage";
import { StartDetailPage } from "@/pages/StartDetailPage";
import { StartsPage } from "@/pages/StartsPage";
import { AtalhosImportantesPage } from "@/pages/trilha-de-aprendizado/AtalhosImportantesPage";
import { RushTurtleBoomarPage } from "@/pages/trilha-de-aprendizado/RushTurtleBoomarPage";
import { TiposUnidadesMultiplicadoresPage } from "@/pages/trilha-de-aprendizado/TiposUnidadesMultiplicadoresPage";
import { CommunityVideoDetailPage } from "@/pages/CommunityVideoDetailPage";
import { CommunityVideosPage } from "@/pages/CommunityVideosPage";
import { TrilhaDeAprendizadoPage } from "@/pages/trilha-de-aprendizado/TrilhaDeAprendizadoPage";
import { TecnologiaDetailPage } from "@/pages/TecnologiaDetailPage";
import { TecnologiasPage } from "@/pages/TecnologiasPage";
import { UnidadeComparePage } from "@/pages/UnidadeComparePage";
import { UnidadeDetailPage } from "@/pages/UnidadeDetailPage";
import { UnidadesPage } from "@/pages/UnidadesPage";

const BattleRandomPage = lazy(() =>
  import("@/pages/BattleRandomPage").then((m) => ({ default: m.BattleRandomPage })),
);

function BattleRandomFallback() {
  return (
    <div className="flex min-h-48 items-center justify-center text-sm text-zinc-400">
      Carregando…
    </div>
  );
}

export default function App() {
  useEffect(() => startAppUpdateWatcher(), []);

  return (
    <BrowserRouter>
      <SiteNotificationsProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="panteoes" element={<PanteoesPage />} />
          <Route path="pantheons" element={<PanteoesPage />} />
          <Route path="panteoes/:slug" element={<PanteaoDetailPage />} />
          <Route path="pantheons/:slug" element={<PanteaoDetailPage />} />
          <Route path="astecas" element={<AstecasPage />} />
          <Route path="deuses" element={<DeusesPage />} />
          <Route path="gods" element={<DeusesPage />} />
          <Route path="deuses/:slug" element={<DeusDetailPage />} />
          <Route path="gods/:slug" element={<DeusDetailPage />} />
          <Route path="eras" element={<ErasPage />} />
          <Route path="ages" element={<ErasPage />} />
          <Route path="eras/:slug" element={<EraDetailPage />} />
          <Route path="ages/:slug" element={<EraDetailPage />} />
          <Route path="poderes" element={<GodpowersPage />} />
          <Route path="god-powers" element={<GodpowersPage />} />
          <Route path="poderes/compare/:slugA/:slugB" element={<GodpowerComparePage />} />
          <Route path="god-powers/compare/:slugA/:slugB" element={<GodpowerComparePage />} />
          <Route path="poderes/:slug" element={<GodpowerDetailPage />} />
          <Route path="god-powers/:slug" element={<GodpowerDetailPage />} />
          <Route path="construcoes" element={<ConstrucoesPage />} />
          <Route path="buildings" element={<ConstrucoesPage />} />
          <Route path="construcoes/:slug" element={<ConstrucaoDetailPage />} />
          <Route path="buildings/:slug" element={<ConstrucaoDetailPage />} />
          <Route path="unidades" element={<UnidadesPage />} />
          <Route path="units" element={<UnidadesPage />} />
          <Route path="unidades/compare/:slugA/:slugB" element={<UnidadeComparePage />} />
          <Route path="units/compare/:slugA/:slugB" element={<UnidadeComparePage />} />
          <Route path="unidades/:slug" element={<UnidadeDetailPage />} />
          <Route path="units/:slug" element={<UnidadeDetailPage />} />
          <Route path="aldeoes" element={<AldeoesPage />} />
          <Route path="villagers" element={<AldeoesPage />} />
          <Route path="aldeoes/compare/:slugA/:slugB" element={<AldeaoComparePage />} />
          <Route path="villagers/compare/:slugA/:slugB" element={<AldeaoComparePage />} />
          <Route path="aldeoes/:slug" element={<AldeaoDetailPage />} />
          <Route path="villagers/:slug" element={<AldeaoDetailPage />} />
          <Route path="mapas" element={<MapasPage />} />
          <Route path="maps" element={<MapasPage />} />
          <Route path="mapas/:slug" element={<MapaDetailPage />} />
          <Route path="maps/:slug" element={<MapaDetailPage />} />
          <Route path="reliquias" element={<ReliquiasPage />} />
          <Route path="relics" element={<ReliquiasPage />} />
          <Route path="reliquias/:slug" element={<ReliquiasDetailPage />} />
          <Route path="relics/:slug" element={<ReliquiasDetailPage />} />
          <Route path="tecnologias" element={<TecnologiasPage />} />
          <Route path="technologies" element={<TecnologiasPage />} />
          <Route path="tecnologias/:slug" element={<TecnologiaDetailPage />} />
          <Route path="technologies/:slug" element={<TecnologiaDetailPage />} />
          <Route path="starts" element={<StartsPage />} />
          <Route path="starts/:slug" element={<StartDetailPage />} />
          <Route path="admin/novo-start" element={<SecretStartBuilderPage />} />
          <Route path="battle" element={<BattlePage />} />
          <Route path="battle/random" element={<BattlePantheonPage />} />
          <Route
            path="battle/random/:pantheonSlug"
            element={
              <Suspense fallback={<BattleRandomFallback />}>
                <BattleRandomPage />
              </Suspense>
            }
          />
          <Route path="rank" element={<RankPage />} />
          <Route path="rank/form" element={<FormRankPage />} />
          <Route path="jogadores-aom" element={<JogadoresAomPage />} />
          <Route path="aom-players" element={<JogadoresAomPage />} />
          <Route path="clans" element={<ClansPage />} />
          <Route path="clans/:slug" element={<ClanDetailPage />} />
          <Route path="links-streamers" element={<LinksStreamersPage />} />
          <Route path="streamer-links" element={<LinksStreamersPage />} />
          <Route path="trilha-de-aprendizado" element={<TrilhaDeAprendizadoPage />} />
          <Route path="videos-comunidade" element={<CommunityVideosPage />} />
          <Route path="videos-comunidade/:id" element={<CommunityVideoDetailPage />} />
          <Route
            path="trilha-de-aprendizado/tipos-unidades-multiplicadores"
            element={<TiposUnidadesMultiplicadoresPage />}
          />
          <Route path="trilha-de-aprendizado/atalhos-importantes" element={<AtalhosImportantesPage />} />
          <Route path="trilha-de-aprendizado/rush-turtle-boom" element={<RushTurtleBoomarPage />} />
          <Route path="entrar" element={<LoginPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="jogador/:id" element={<PublicPlayerProfilePage />} />
          <Route path="player/:id" element={<PublicPlayerProfilePage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notificacoes/enviar" element={<NotificationComposePage />} />
          <Route path="notifications/send" element={<NotificationComposePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </SiteNotificationsProvider>
    </BrowserRouter>
  );
}
