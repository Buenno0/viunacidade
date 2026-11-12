"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { principal, type CityAlert } from "@/lib/alerts";
import { waitPublished } from "@/lib/posting";
import { markSeen, useSeen } from "@/lib/seen";
import { locationWorkedBefore, permissionState } from "@/lib/useLocation";
import { CITY } from "@/lib/city";
import { ALL_CATEGORY_KEYS, CATEGORIES, type Category } from "@/lib/categories";
import { formatDistance, trendingRanks, type PostFeature, type PostsCollection, type RequestFeature } from "@/lib/posts";
import type { Business } from "@/lib/business";
import BusinessSheet from "./BusinessSheet";
import { HistoryList, HistoryRuler, cityDay, dayLabel } from "./HistoryView";
import { useTheme } from "@/lib/theme";
import { useMapType } from "@/lib/mapType";
import AccountSheet from "./AccountSheet";
import AchievementOverlay, { type Celebration } from "./AchievementOverlay";
import type { Progress } from "@/lib/progress";
import AlertsSheet from "./AlertsSheet";
import AskPanel from "./AskPanel";
import AuthSheet, { PENDING_TERMS_KEY, PENDING_THEN_KEY } from "./AuthSheet";
import LiveStrip from "./LiveStrip";
import { AlertSheet } from "./ui/AlertStrip";
import CeuDoApp, { BotaoConta, ChipTopo, ehTempestade } from "./CeuDoApp";
import Olheiro from "./landing/Olheiro";
import MapTypePicker, { type HeatMode } from "./MapTypePicker";
import LandmarkSheet from "./LandmarkSheet";
import NewPostSheet from "./NewPostSheet";
import type { Landmark } from "@/lib/landmarks";
import OutOfArea from "./OutOfArea";
import InstallHint, { shouldOfferInstall } from "./InstallHint";
import { dismiss, locateCity, onLocationGranted, silentPosition, wasDismissed, type NearestCity } from "@/lib/cityCheck";
import PostViewer from "./PostViewer";
import RequestSheet from "./RequestSheet";
import TrendsView from "./TrendsView";
import { Button, EmptyState, IconButton, cx } from "./ui";
import { useDragScroll } from "@/lib/useDragScroll";
import {
  ArchiveIcon,
  CameraIcon,
  CategoryIcon,
  CheckIcon,
  FlagIcon,
  LocateIcon,
  MapIcon,
  QuestionIcon,
  TrendIcon,
} from "./ui/icons";

// MapLibre usa window/WebGL, então só roda no navegador
const CityMap = dynamic(() => import("./map/CityMap"), { ssr: false });

type AfterLogin = "new" | "ask" | "alerts" | "account" | "business" | null;
type Panel =
  | { kind: "viewer"; ids: string[] | null; startId: string }
  | { kind: "new"; request: { id: string; question: string } | null; photo?: File | null }
  | { kind: "auth"; then: AfterLogin }
  | { kind: "request"; id: string }
  | { kind: "alerts" }
  | { kind: "account" }
  | { kind: "landmark"; id: string }
  | { kind: "business" }
  | null;

type Tab = "mapa" | "trends" | "historico";

type Toast = { text: string; postId?: string };

const CARTAO_KEY = "deolho-cartao";

async function fetchActivePosts(): Promise<PostFeature[]> {
  const { data, error } = await getSupabase().rpc("active_posts", { p_city_id: CITY.id });
  if (error) throw error;
  const now = Date.now();
  return (data as PostsCollection).features
    .filter((f) => new Date(f.properties.expires_at).getTime() > now)
    .sort((a, b) => b.properties.created_at.localeCompare(a.properties.created_at));
}

async function fetchHistory(day: string): Promise<PostFeature[]> {
  const { data, error } = await getSupabase().rpc("history_posts", { p_city_id: CITY.id, p_day: day });
  if (error) throw error;
  return (data as PostsCollection).features;
}

async function fetchRequests(): Promise<RequestFeature[]> {
  const { data, error } = await getSupabase().rpc("active_requests", { p_city_id: CITY.id });
  if (error) throw error;
  return (data as GeoJSON.FeatureCollection<GeoJSON.Point>).features as RequestFeature[];
}

export default function Home() {
  const faixa = useDragScroll();
  const supabase = getSupabase();
  const { theme } = useTheme();
  const mapType = useMapType();
  const params = useSearchParams();
  const [posts, setPosts] = useState<PostFeature[] | null>(null);
  const [requests, setRequests] = useState<RequestFeature[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [filter, setFilter] = useState<Category | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [termsUserId, setTermsUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const termsOk = Boolean(session && termsUserId === session.user.id);
  const [panel, setPanel] = useState<Panel>(null);
  const [asking, setAsking] = useState(false);
  const [alertaAberto, setAlertaAberto] = useState<CityAlert | null>(null);
  // altura medida do céu (px): o que fica embaixo dele se posiciona por ela
  const [alturaTopo, setAlturaTopo] = useState(180);
  // O cartão de baixo encolhe para só os botões (a alça no topo dele): no
  // celular ele toma ~20% da tela. A escolha fica guardada no aparelho.
  const [encolhido, setEncolhido] = useState(false);
  useEffect(() => {
    let salvo = false;
    try {
      salvo = localStorage.getItem(CARTAO_KEY) === "encolhido";
    } catch {
      // sem armazenamento: começa aberto
    }
    if (salvo) Promise.resolve().then(() => setEncolhido(true));
  }, []);
  const alternaCartao = () =>
    setEncolhido((v) => {
      try {
        if (v) localStorage.removeItem(CARTAO_KEY);
        else localStorage.setItem(CARTAO_KEY, "encolhido");
      } catch {
        // sem armazenamento: vale só nesta visita
      }
      return !v;
    });
  const [tab, setTab] = useState<Tab>(params.get("historico") ? "historico" : "mapa");
  const [today] = useState(() => cityDay(new Date()));
  const [historyCounts, setHistoryCounts] = useState<Record<string, number> | null>(null);
  const [historyDay, setHistoryDay] = useState<string | null>(() => {
    const d = params.get("historico");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  });
  const [historyPosts, setHistoryPosts] = useState<PostFeature[] | null>(null);
  const [historyList, setHistoryList] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [heatMode, setHeatMode] = useState<HeatMode>("off");
  const [heatHistory, setHeatHistory] = useState<GeoJSON.FeatureCollection | null>(null);
  const [toast, setToast] = useState<Toast | null>(() =>
    params.get("login") === "erro" ? { text: "Não foi possível entrar com o Google. Tente de novo." } : null,
  );
  const [progress, setProgress] = useState<Progress | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  // O que já foi festejado nesta visita (duas buscas seguidas não repetem a festa)
  const celebrated = useRef(new Set<string>());
  const [installHint, setInstallHint] = useState(false);
  const seen = useSeen();
  // Posts meus ainda sendo protegidos: aparecem na hora, com a prévia desfocada
  const [pending, setPending] = useState<Record<string, PostFeature>>({});
  const dropPending = (id: string) =>
    setPending((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  const [outside, setOutside] = useState<{ nearest: NearestCity; from: [number, number] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ownPosts = useRef(new Set<string>());
  const knownIds = useRef<Set<string> | null>(null);
  const center = useRef<[number, number] | null>(null);
  // Link direto (/mapa?post=… vindo da página de compartilhar, /mapa?pedido=… do alerta, /mapa?comercio da LP)
  const deepLink = useRef({
    post: params.get("post"),
    pedido: params.get("pedido"),
    historico: params.get("historico"),
    comercio: params.has("comercio"),
    entrar: params.has("entrar"),
  });

  const clearDeepLink = () => window.history.replaceState(null, "", "/mapa");

  const loadPosts = useCallback(
    () =>
      fetchActivePosts().then(
        (list) => {
          setError(null);
          setPosts(list);
          // Post novo de outra pessoa: avisa, com atalho para ver
          const known = knownIds.current;
          if (known) {
            const fresh = list.find((f) => !known.has(f.properties.id) && !ownPosts.current.has(f.properties.id));
            if (fresh) setToast({ text: `Novo: ${CATEGORIES[fresh.properties.category].label}`, postId: fresh.properties.id });
          }
          knownIds.current = new Set(list.map((f) => f.properties.id));
          const wanted = deepLink.current.historico ? null : deepLink.current.post;
          if (wanted) {
            deepLink.current.post = null;
            clearDeepLink();
            const f = list.find((x) => x.properties.id === wanted);
            if (f) setPanel({ kind: "viewer", ids: null, startId: wanted });
            else setToast({ text: "Esse registro já sumiu do mapa" });
          }
        },
        (e) => {
          console.error("Falha ao carregar posts", e);
          setError("Não foi possível carregar o mapa agora.");
        },
      ),
    [],
  );

  // Tempo real sem recarregar a lista inteira: busca só o post avisado e o
  // atualiza no lugar (novo, mudou ou saiu do ar)
  const updatePost = useCallback((id: string) => {
    getSupabase()
      .rpc("active_post", { p_id: id })
      .then(({ data, error }) => {
        if (error) return;
        const f = data as PostFeature | null;
        const alive = f && new Date(f.properties.expires_at).getTime() > Date.now() ? f : null;
        setPosts((list) => {
          if (!list) return list;
          const rest = list.filter((x) => x.properties.id !== id);
          return alive ? [alive, ...rest].sort((a, b) => b.properties.created_at.localeCompare(a.properties.created_at)) : rest;
        });
        const known = knownIds.current;
        if (alive && known && !known.has(id) && !ownPosts.current.has(id) && !alive.properties.processing) {
          setToast({ text: `Novo: ${CATEGORIES[alive.properties.category].label}`, postId: id });
        }
        if (alive) knownIds.current?.add(id);
      });
  }, []);

  const loadRequests = useCallback(
    () =>
      fetchRequests().then(
        (list) => {
          setRequests(list);
          const wanted = deepLink.current.pedido;
          if (wanted) {
            deepLink.current.pedido = null;
            clearDeepLink();
            const r = list.find((x) => x.properties.id === wanted);
            if (r) {
              setPanel({ kind: "request", id: wanted });
              setFocus(r.geometry.coordinates as [number, number]);
            } else setToast({ text: "Esse pedido já fechou" });
          }
        },
        (e) => console.error("Falha ao carregar pedidos", e),
      ),
    [],
  );

  // Avisos do tempo: não dependem de ninguém postar, então carregam sozinhos e
  // continuam na tela mesmo com o mapa vazio. É o que o app tem a dizer num
  // dia sem registro nenhum.
  useEffect(() => {
    supabase.rpc("city_alerts", { p_city_id: CITY.id }).then(({ data }) => data && setAlerts(data as CityAlert[]));
  }, [supabase]);

  // Histórico: os dias com algo guardado, e os posts do dia escolhido
  useEffect(() => {
    if (tab !== "historico" || historyCounts) return;
    supabase.rpc("history_days", { p_city_id: CITY.id }).then(({ data }) => {
      const list = (data as { day: string; n: number }[]) ?? [];
      setHistoryCounts(Object.fromEntries(list.map((d) => [d.day, d.n])));
      setHistoryDay((cur) => cur ?? list[0]?.day ?? null);
    });
  }, [supabase, tab, historyCounts]);

  useEffect(() => {
    if (tab !== "historico" || !historyDay) return;
    let off = false;
    fetchHistory(historyDay).then(
      (list) => {
        if (off) return;
        setHistoryPosts(list);
        // Leva o mapa até o registro mais recente do dia
        const last = list[list.length - 1];
        if (last) setFocus(last.geometry.coordinates as [number, number]);
        const wanted = deepLink.current.historico ? deepLink.current.post : null;
        if (deepLink.current.historico) {
          deepLink.current = { ...deepLink.current, historico: null, post: null };
          // O dia fica no endereço (dá para compartilhar); o post sai
          window.history.replaceState(null, "", `/mapa?historico=${historyDay}`);
        }
        if (wanted) {
          if (list.some((f) => f.properties.id === wanted)) setPanel({ kind: "viewer", ids: null, startId: wanted });
          else setToast({ text: "Esse registro saiu do histórico" });
        }
      },
      () => !off && setToast({ text: "Não foi possível carregar o histórico" }),
    );
    return () => {
      off = true;
    };
  }, [tab, historyDay]);

  // Animações que ninguém vê não rodam: com o app escondido, tudo pausa; com
  // o story ou o Trends por cima, pausam as do mapa (marcos, Agora, Em alta)
  const mapCovered = panel?.kind === "viewer" || tab === "trends" || (tab === "historico" && historyList);
  useEffect(() => {
    const root = document.documentElement;
    if (mapCovered) root.dataset.pausaMapa = "sim";
    else delete root.dataset.pausaMapa;
  }, [mapCovered]);
  useEffect(() => {
    const root = document.documentElement;
    const on = () => {
      if (document.visibilityState === "hidden") root.dataset.oculto = "sim";
      else delete root.dataset.oculto;
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  // Marcos: quase nunca mudam. Guardados no aparelho por 1 dia; na volta,
  // aparecem na hora e a cópia só é atualizada quando vence
  useEffect(() => {
    const KEY = `deolho-marcos-${CITY.id}`;
    let cached: { at: number; list: Landmark[] } | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {
      // sem armazenamento: busca sempre
    }
    if (cached?.list?.length) Promise.resolve().then(() => setLandmarks(cached!.list));
    if (cached && Date.now() - cached.at < 24 * 3600e3) return;
    supabase.rpc("city_landmarks", { p_city_id: CITY.id }).then(({ data }) => {
      const list = (data as Landmark[]) ?? [];
      setLandmarks(list);
      try {
        localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), list }));
      } catch {
        // sem armazenamento: tudo bem
      }
    });
  }, [supabase]);

  useEffect(() => {
    loadPosts();
    loadRequests();
    // O tempo real já avisa cada mudança: a lista inteira só vem de novo a cada
    // 5 min (rede de segurança) e ao voltar ao app; com o app escondido, nada
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      loadPosts();
      loadRequests();
    };
    const interval = setInterval(refresh, 5 * 60_000);
    let hiddenAt = 0;
    const onVisible = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 30_000) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const channel = supabase
      .channel(`city:${CITY.id}`)
      .on("broadcast", { event: "post_changed" }, ({ payload }) => {
        const id = (payload as { id?: string } | undefined)?.id;
        if (id) updatePost(id);
        else loadPosts();
      })
      .on("broadcast", { event: "request_changed" }, () => loadRequests())
      .subscribe();
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase, loadPosts, loadRequests, updatePost]);

  // Progresso (XP, nível, conquistas). Conquista nova ou nível novo viram festa.
  const refreshProgress = useCallback(
    (userId: string) =>
      supabase.rpc("my_progress").then(({ data }) => {
        if (!data) return;
        const p = data as Progress;
        setProgress(p);
        const fresh = (key: string) => !celebrated.current.has(key) && Boolean(celebrated.current.add(key));
        const queue: Celebration[] = p.badges
          .filter((b) => !b.seen && fresh(`${b.badge}:${b.tier}`))
          .map((b) => ({ kind: "badge", badge: b.badge, tier: b.tier }));
        const key = `deolho-nivel-${userId}`;
        let stored: number | null = null;
        try {
          stored = Number(localStorage.getItem(key)) || null;
          localStorage.setItem(key, String(p.level));
        } catch {
          // sem armazenamento: não comemora nível, só conquista
        }
        if (stored && p.level > stored && fresh(`nivel:${p.level}`)) queue.push({ kind: "level", level: p.level });
        if (queue.length) {
          setCelebrations((q) => [...q, ...queue]);
          // O builder do supabase-js só executa com then/await
          supabase.rpc("mark_badges_seen").then(() => {});
        }
      }),
    [supabase],
  );
  const refreshMine = () => session && refreshProgress(session.user.id);

  useEffect(() => {
    if (!session) return;
    Promise.resolve().then(() => refreshProgress(session.user.id));
  }, [session, refreshProgress]);

  // Abriu o app longe da cidade? Só confere se a localização já foi liberada antes
  // e também se ela liberar a localização no meio da visita
  useEffect(() => {
    const check = () => {
      if (wasDismissed()) return;
      silentPosition().then(async (p) => {
        if (!p) return;
        const at: [number, number] = [p.coords.longitude, p.coords.latitude];
        const r = await locateCity(at[1], at[0]);
        if (r && r.inside === null) setOutside({ nearest: r.nearest, from: at });
        else if (r) setUserPos(at);
      });
    };
    check();
    return onLocationGranted(check);
  }, []);

  // Onde a pessoa está, e o que fazer se for fora de uma cidade atendida
  const handlePosition = useCallback(async (at: [number, number], fly: boolean) => {
    const r = await locateCity(at[1], at[0]);
    if (r && r.inside === null) {
      setOutside({ nearest: r.nearest, from: at });
      return false;
    }
    setUserPos(at);
    if (fly) setFocus(at);
    return true;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      // Vindo do "Quero divulgar meu negócio" da LP: o pedido é feito aqui, com login
      if (deepLink.current.comercio) {
        deepLink.current.comercio = false;
        window.history.replaceState(null, "", "/mapa");
        setPanel(data.session ? { kind: "business" } : { kind: "auth", then: "business" });
      }
      // "Entrar" da LP
      if (deepLink.current.entrar) {
        deepLink.current.entrar = false;
        window.history.replaceState(null, "", "/mapa");
        if (!data.session) setPanel({ kind: "auth", then: null });
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    // Uma consulta só: termos, moderação e estabelecimento (antes eram três)
    supabase
      .rpc("my_account")
      .then(async ({ data: acc }) => {
        const data = acc as { accepted_terms_at: string | null; is_admin: boolean; business: Business | null } | null;
        setIsAdmin(Boolean(data?.is_admin));
        setBusiness(data?.business ?? null);
        // Voltando do Google: os termos foram aceitos antes de sair
        let pending = false;
        let then: string | null = null;
        try {
          pending = sessionStorage.getItem(PENDING_TERMS_KEY) === "1";
          then = sessionStorage.getItem(PENDING_THEN_KEY);
          sessionStorage.removeItem(PENDING_TERMS_KEY);
          sessionStorage.removeItem(PENDING_THEN_KEY);
        } catch {
          // sem armazenamento: os termos aparecem na próxima ação
        }
        if (!data?.accepted_terms_at && pending) {
          const { error } = await supabase.rpc("accept_terms");
          if (!error) {
            setTermsUserId(session.user.id);
            if (then === "new") setPanel({ kind: "new", request: null });
            else if (then === "alerts") setPanel({ kind: "alerts" });
            else if (then === "account") setPanel({ kind: "account" });
            else if (then === "business") setPanel({ kind: "business" });
            else if (then === "ask") setAsking(true);
            return;
          }
        }
        setTermsUserId(data?.accepted_terms_at ? session.user.id : null);
      });
  }, [supabase, session]);

  // Volta do Google com falha (app/auth/google): o aviso já nasce no estado; aqui só limpa o endereço
  useEffect(() => {
    if (params.get("login") !== "erro") return;
    window.history.replaceState(null, "", window.location.pathname);
  }, [params]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function chooseHeat(mode: HeatMode) {
    setHeatMode(mode);
    if (mode === "historico" && !heatHistory) {
      supabase.rpc("heat_history", { p_city_id: CITY.id, p_days: 30 }).then(({ data, error }) => {
        if (error) return setToast({ text: "Não foi possível carregar o histórico" });
        const fc = data as GeoJSON.FeatureCollection;
        setHeatHistory(fc);
        if (fc.features.length === 0) setToast({ text: "Ainda não há histórico suficiente (mínimo de 3 registros por lugar)" });
      });
    }
  }

  const visible = useMemo(() => {
    const list = (posts ?? []).map((f) =>
      // o servidor já mandou o meu post: carrega a prévia até a foto revelar
      pending[f.properties.id] ? { ...f, properties: { ...f.properties, preview: pending[f.properties.id].properties.preview } } : f,
    );
    const have = new Set(list.map((f) => f.properties.id));
    const mineNow = Object.values(pending).filter((f) => !have.has(f.properties.id));
    return [...mineNow, ...list].filter((f) => !filter || f.properties.category === filter);
  }, [posts, filter, pending]);
  // O que já pode ser visto: sem os que o servidor ainda está desfocando
  const ready = useMemo(() => visible.filter((f) => !f.properties.processing), [visible]);
  const counts = useMemo(() => {
    const c: Partial<Record<Category, number>> = {};
    for (const f of posts ?? []) c[f.properties.category] = (c[f.properties.category] ?? 0) + 1;
    return c;
  }, [posts]);
  // O número no balão conta só respostas visíveis (o banco não desconta as escondidas)
  const requestsShown = useMemo(
    () =>
      requests.map((r) => ({
        ...r,
        properties: {
          ...r.properties,
          answer_count: (posts ?? []).filter((f) => f.properties.request_id === r.properties.id).length,
        },
      })),
    [requests, posts],
  );
  const ranks = useMemo(() => trendingRanks(posts ?? []), [posts]);
  const inHistory = tab === "historico";
  const heat = useMemo(
    () => ({ now: heatMode === "agora", history: heatMode === "historico" ? heatHistory : null }),
    [heatMode, heatHistory],
  );

  const needLogin = (then: AfterLogin) => setPanel({ kind: "auth", then });
  const requireLogin = (then: Exclude<AfterLogin, null>, run: () => void) => (session && termsOk ? run() : needLogin(then));
  // Câmera primeiro: o toque em Registrar já abre a câmera (o navegador só
  // deixa abrir dentro do próprio toque); a foto chega pronta no formulário
  const camera = useRef<HTMLInputElement>(null);
  const geoGranted = useRef(false);
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const read = () => (geoGranted.current = status?.state === "granted");
    permissionState().then((st) => (geoGranted.current = st === "granted"));
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((st) => {
        status = st;
        st.addEventListener("change", read);
      })
      .catch(() => {});
    return () => status?.removeEventListener("change", read);
  }, []);
  const startPost = () =>
    requireLogin("new", () => {
      // Câmera direto só com a localização já liberada. Sem ela, o formulário
      // abre primeiro e pede a localização num toque (com a câmera aberta, o
      // iPhone nega sem perguntar e guarda a negativa até recarregar)
      if ((geoGranted.current || locationWorkedBefore()) && camera.current) {
        camera.current.value = "";
        camera.current.click();
      } else setPanel({ kind: "new", request: null });
    });
  const startAsk = () =>
    requireLogin("ask", () => {
      setPanel(null);
      setAsking(true);
    });
  const openAlerts = () => requireLogin("alerts", () => setPanel({ kind: "alerts" }));
  const openAccount = () => requireLogin("account", () => setPanel({ kind: "account" }));
  const pickTab = (t: Tab) => {
    if (t !== "historico" && window.location.search.includes("historico")) clearDeepLink();
    setTab(t);
    setPanel(null);
    setActiveId(null);
  };
  const openViewer = (startId: string, ids: string[] | null = null) => setPanel({ kind: "viewer", ids, startId });

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => handlePosition([p.coords.longitude, p.coords.latitude], true),
      () => setToast({ text: "Não foi possível obter sua localização" }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  }

  const pool = inHistory ? (historyPosts ?? []) : (posts ?? []);
  const shown = inHistory ? pool : ready;
  const viewerPosts =
    panel?.kind === "viewer"
      ? panel.ids
        ? panel.ids
            .map((id) => pool.find((f) => f.properties.id === id))
            .filter((f): f is PostFeature => Boolean(f) && !f!.properties.processing)
        : shown.some((f) => f.properties.id === panel.startId)
          ? shown
          : pool.filter((f) => !f.properties.processing) // o post pedido está fora do filtro: mostra todos
      : [];
  const openRequest = panel?.kind === "request" ? requests.find((r) => r.properties.id === panel.id) : undefined;
  const answersOf = (requestId: string) => (posts ?? []).filter((f) => f.properties.request_id === requestId);

  // o mais grave valendo agora; se nada vale, o mais grave que vem aí
  const aviso = principal(alerts);

  // O horizonte: uma janela acesa por post no ar (no histórico, por guardado)
  const acesas = inHistory ? (historyPosts?.length ?? 0) : (posts?.length ?? 0);
  const rotuloHorizonte = inHistory
    ? acesas
      ? `${acesas} ${acesas === 1 ? "guardado" : "guardados"}`
      : "nada guardado"
    : posts === null
      ? "carregando"
      : acesas
        ? `${acesas} no ar`
        : "nada no ar";
  const topo = `${Math.round(alturaTopo)}px`;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg">
      <CityMap
        posts={inHistory ? pool : visible}
        seen={seen}
        archive={inHistory}
        theme={theme}
        mapType={mapType}
        focus={focus}
        activeId={activeId}
        userPos={userPos}
        requests={inHistory ? [] : requestsShown}
        heat={heat}
        onSelect={(id) =>
          posts?.find((f) => f.properties.id === id)?.properties.processing
            ? setToast({ text: "Protegendo rostos e placas… seu post aparece em instantes" })
            : openViewer(id)
        }
        onSelectMany={(ids) => openViewer(ids[0], ids)}
        onSelectRequest={(id) => setPanel({ kind: "request", id })}
        landmarks={landmarks}
        activeLandmark={panel?.kind === "landmark" ? panel.id : null}
        onSelectLandmark={(id) => {
          const l = landmarks.find((x) => x.id === id);
          if (l) setFocus([l.lng, l.lat]);
          setPanel({ kind: "landmark", id });
        }}
        onMove={(c) => (center.current = c)}
      />

      {/* Topo: só peças flutuando sobre o mapa. A pílula da marca traz o céu
          da hora real em miniatura (uma janela acesa por post no ar), o
          relógio e o aviso do INMET; embaixo dela, os filtros. */}
      <CeuDoApp
        acesas={acesas}
        rotulo={rotuloHorizonte}
        ultimos={inHistory ? [] : (posts ?? []).filter((f) => !f.properties.processing).slice(0, 3)}
        onAbrirPost={(id) => openViewer(id)}
        carregando={!inHistory && posts === null}
        aviso={aviso}
        onAviso={() => aviso && setAlertaAberto(aviso)}
        onAlertas={openAlerts}
        dia={inHistory && historyDay ? dayLabel(historyDay, today) : null}
        onAltura={setAlturaTopo}
        conta={<BotaoConta progress={session ? progress : null} onClick={openAccount} />}
      >
        {!asking && tab === "mapa" && (
          <nav
            aria-label="Filtrar por categoria"
            ref={faixa}
            className="no-scrollbar -m-2 flex max-w-[calc(100%+1rem)] touch-pan-x select-none items-center gap-1.5 overflow-x-auto overscroll-x-contain p-2"
          >
            {/* os filtros sobre o mapa, no acabamento da pílula do topo */}
            <ChipTopo active={filter === null} onClick={() => setFilter(null)}>
              Tudo
            </ChipTopo>
            {ALL_CATEGORY_KEYS.filter((k) => counts[k]).map((k) => (
              <ChipTopo key={k} active={filter === k} onClick={() => setFilter(filter === k ? null : k)}>
                <CategoryIcon category={k} />
                {CATEGORIES[k].label}
                <span className="num opacity-70">{counts[k]}</span>
              </ChipTopo>
            ))}
          </nav>
        )}
        {inHistory && historyPosts && historyPosts.length > 0 && (
          <div role="group" aria-label="Como ver o dia" className="flex w-fit rounded-full border-[1.5px] border-white/15 bg-[#0f1a44] p-[3px] shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
            {(
              [
                [false, "Ver no mapa"],
                [true, "Lista"],
              ] as const
            ).map(([lista, label]) => (
              <button
                key={label}
                aria-pressed={historyList === lista}
                onClick={() => setHistoryList(lista)}
                className={cx(
                  "h-[30px] rounded-full px-3.5 text-[13px] transition",
                  historyList === lista ? "bg-[#ffd27a] font-bold text-[#0a1230]" : "font-semibold text-[#c4cbe8] hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </CeuDoApp>

      {tab === "trends" && (
        <section
          aria-label="Trends"
          className="absolute inset-0 z-[9] overflow-y-auto bg-bg px-4 pb-48 pt-[calc(var(--topo)+1rem)]"
          style={{ "--topo": topo } as React.CSSProperties}
        >
          <div className="mx-auto max-w-lg">
            <TrendsView posts={posts ?? []} onOpen={(id, ids) => openViewer(id, ids)} />
          </div>
        </section>
      )}

      {inHistory && historyList && historyPosts && (
        <section
          aria-label="Histórico do dia"
          className="absolute inset-0 z-[9] overflow-y-auto bg-bg px-4 pb-56 pt-[calc(var(--topo)+1rem)]"
          style={{ "--topo": topo } as React.CSSProperties}
        >
          <div className="mx-auto max-w-lg">
            <HistoryList posts={historyPosts} onOpen={(id, ids) => openViewer(id, ids)} />
          </div>
        </section>
      )}

      <div
        className={cx(
          "absolute right-3 z-20 flex flex-col gap-2 transition-[top] duration-300",
          (tab === "trends" || (inHistory && historyList)) && "hidden",
        )}
        style={{ top: `calc(${topo} + 0.75rem)` }}
      >
        <IconButton label="Minha localização" onClick={locate} className="h-11 w-11 shadow-[0_6px_16px_rgba(5,10,30,0.25)]">
          <LocateIcon />
        </IconButton>
        <MapTypePicker theme={theme} heat={heatMode} onHeat={chooseHeat} />
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Painel"
            title="Painel"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
          >
            <FlagIcon />
          </Link>
        )}
      </div>

      {inHistory && historyCounts && Object.keys(historyCounts).length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6">
          <div className="pointer-events-auto mx-auto max-w-xs">
            <EmptyState title="O histórico começa agora">
              Quem publica escolhe guardar a foto por 30 dias. Os registros guardados aparecem aqui, dia a dia, depois que somem do mapa.
            </EmptyState>
          </div>
        </div>
      )}

      {/* Estado vazio / erro, no meio do mapa */}
      {!asking && tab === "mapa" && (error || (posts !== null && visible.length === 0 && requests.length === 0 && heatMode === "off")) && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6">
          <div className="light pointer-events-auto mx-auto max-w-xs">
            {error ? (
              <EmptyState title="Sem sinal" action={<Button variant="secundario" onClick={loadPosts}>Tentar de novo</Button>}>
                {error}
              </EmptyState>
            ) : filter ? (
              <EmptyState
                title={`Nada de ${CATEGORIES[filter].label.toLowerCase()} agora`}
                action={<Button variant="secundario" onClick={() => setFilter(null)}>Ver tudo</Button>}
              />
            ) : aviso ? (
              // Com aviso do tempo, a tela vazia deixa de informar e passa a
              // pedir: é o momento em que a pessoa tem o que fotografar. O aviso
              // em si já está na pílula do topo; aqui ele é só o contexto.
              <EmptyState
                topo={<Olheiro nivel={progress ? progress.level - 1 : 1} tam={40} />}
                title="Viu alguma coisa?"
                action={
                  <Button variant="secundario" onClick={startAsk}>
                    <QuestionIcon /> Perguntar o que está rolando
                  </Button>
                }
              >
                Com o alerta de {aviso.kind.toLowerCase()} {aviso.live ? "valendo" : "a caminho"}, ninguém registrou nada ainda. Está vendo
                alguma coisa na rua?
              </EmptyState>
            ) : (
              <EmptyState
                topo={<Olheiro nivel={progress ? progress.level - 1 : 1} tam={40} />}
                title="Tudo calmo por aqui"
                action={
                  <Button variant="secundario" onClick={startAsk}>
                    <QuestionIcon /> Perguntar o que está rolando
                  </Button>
                }
              >
                Nenhum registro agora. Viu algo acontecendo? Registre. Quer saber de algum lugar? Pergunte.
              </EmptyState>
            )}
          </div>
        </div>
      )}

      {asking ? (
        <>
          {/* A mira: o pedido vai para o centro do mapa */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
            <div className="pedido" style={{ animation: "none" }}>
              <QuestionIcon width="20" height="20" />
            </div>
          </div>
          <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <AskPanel
              getCenter={() => center.current}
              onCancel={() => setAsking(false)}
              onCreated={(id, at) => {
                setAsking(false);
                setToast({ text: "Pergunta no mapa por 2h · avisamos quem está perto" });
                refreshMine();
                setFocus(at);
                loadRequests();
                setPanel({ kind: "request", id });
              }}
            />
          </footer>
        </>
      ) : (
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            className={cx(
              "pointer-events-auto mx-auto flex max-w-lg flex-col gap-3 rounded-[26px] border p-3",
              !inHistory && "pt-1.5",
              inHistory
                ? "sala-escura border-[#2e3f7a] bg-[#111b40] text-ink shadow-[0_-10px_40px_rgba(2,6,24,0.5)]"
                : "light border-line bg-surface text-ink shadow-[0_-10px_40px_rgba(2,6,24,0.35)]",
            )}
          >
            {/* a alça: encolhe o cartão para só os botões, e abre de novo */}
            {!inHistory && (
              <button
                type="button"
                onClick={alternaCartao}
                aria-expanded={!encolhido}
                aria-label={encolhido ? "Mostrar abas e posts ao vivo" : "Encolher o cartão"}
                className="-mb-1.5 flex h-6 w-full items-center justify-center"
              >
                <span className="h-1 w-10 rounded-full bg-line transition-colors hover:bg-muted" />
              </button>
            )}
            {/* Mapa | Trends | Histórico: embaixo, onde o polegar alcança (T1) */}
            {(inHistory || !encolhido) && (
            <div role="tablist" aria-label="Seções" className={cx("grid grid-cols-3 gap-0.5 rounded-full p-1", inHistory ? "bg-[#0a1230]" : "bg-elev")}>
              {(
                [
                  ["mapa", "Mapa", MapIcon],
                  ["trends", "Trends", TrendIcon],
                  ["historico", "Histórico", ArchiveIcon],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => pickTab(id)}
                  className={cx(
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-sm transition",
                    tab === id
                      ? inHistory
                        ? "bg-white font-bold text-[#0a1230]"
                        : "bg-[#0a1230] font-bold text-white"
                      : "font-semibold text-ink/80 hover:text-ink",
                  )}
                >
                  <Icon width="1.05em" height="1.05em" /> {label}
                </button>
              ))}
            </div>
            )}

            {inHistory ? (
              <>
                <div className="px-1">
                  <p className="font-display text-[17px] font-medium leading-tight">Últimos 30 dias</p>
                  <p className="text-xs font-semibold text-muted">Só o que quem postou escolheu guardar</p>
                </div>
                <HistoryRuler
                  counts={historyCounts ?? {}}
                  day={historyDay}
                  today={today}
                  onPick={(d) => {
                    setHistoryPosts(null);
                    setHistoryDay(d);
                  }}
                />
              </>
            ) : (
              <>
                {tab === "mapa" && !encolhido && <LiveStrip posts={ready.slice(0, 20)} seen={seen} onOpen={(id) => openViewer(id)} />}
                <div className="flex gap-2">
                  <button
                    onClick={startAsk}
                    aria-label="Perguntar: alguém aí?"
                    className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-[18px] bg-elev px-4 text-[15px] font-bold text-ink transition active:translate-y-px"
                  >
                    <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#0a1230] font-display text-[13px] font-bold text-white">?</span>
                    Alguém aí?
                  </button>
                  <button
                    onClick={startPost}
                    className="inline-flex h-[52px] flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-[18px] bg-[#0a1230] text-base font-bold text-white transition active:translate-y-px"
                  >
                    <span className="grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-luz text-luz-ink">
                      <CameraIcon width="17" height="17" />
                    </span>
                    <span>
                      Registrar<span className="hidden sm:inline"> o que está rolando</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </footer>
      )}

      {installHint && !panel && !outside && (
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <InstallHint onClose={() => setInstallHint(false)} />
        </div>
      )}
      {outside && !panel && (
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <OutOfArea
            nearest={outside.nearest}
            from={outside.from}
            onClose={() => {
              dismiss();
              setOutside(null);
            }}
            onGo={() => {
              dismiss();
              pickTab("mapa");
              setFocus([outside.nearest.lng, outside.nearest.lat]);
              setOutside(null);
            }}
          />
        </div>
      )}

      {toast && (
        <div
          className="absolute inset-x-0 z-30 flex justify-center px-4"
          style={{ top: `calc(${topo} + 0.75rem)` }}
        >
          <button
            onClick={() => {
              if (toast.postId) openViewer(toast.postId);
              setToast(null);
            }}
            className="light flex max-w-full items-center gap-2 rounded-full border border-line bg-surface py-2 pl-2 pr-4 text-sm font-bold text-ink shadow-[0_12px_30px_rgba(2,6,24,0.45)]"
          >
            {toast.text.startsWith("No ar") || toast.text.startsWith("Publicado") ? (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#5bd1b5] text-[#0a1230]">
                <CheckIcon width="14" height="14" strokeWidth={2.6} />
              </span>
            ) : (
              <span className="ml-1.5 h-2 w-2 shrink-0 rounded-full bg-luz" />
            )}
            <span className="min-w-0 text-left">{toast.text}</span>
            {toast.postId && <span className="etiqueta text-ink underline decoration-muted underline-offset-4">ver</span>}
          </button>
        </div>
      )}

      {alertaAberto && <AlertSheet alert={alertaAberto} onClose={() => setAlertaAberto(null)} />}

      {panel?.kind === "viewer" && viewerPosts.length > 0 && (
        <PostViewer
          posts={viewerPosts}
          startId={panel.startId}
          userPos={userPos}
          loggedIn={termsOk}
          ranks={ranks}
          archive={inHistory}
          seen={seen}
          onActive={(f) => {
            markSeen(f.properties.id);
            setActiveId(f.properties.id);
            setFocus(f.geometry.coordinates as [number, number]);
          }}
          onClose={() => {
            setPanel(null);
            setActiveId(null);
          }}
          onNeedLogin={() => needLogin(null)}
          onChanged={() => {
            if (!inHistory) loadPosts();
            refreshMine();
          }}
        />
      )}
      {panel?.kind === "request" && openRequest && (
        <RequestSheet
          request={openRequest.properties}
          answers={answersOf(openRequest.properties.id)}
          loggedIn={termsOk}
          onClose={() => setPanel(null)}
          onNeedLogin={() => needLogin(null)}
          onAnswer={() => setPanel({ kind: "new", request: { id: openRequest.properties.id, question: openRequest.properties.question } })}
          onOpenAnswer={(postId) => openViewer(postId, answersOf(openRequest.properties.id).map((f) => f.properties.id))}
        />
      )}
      {panel?.kind === "landmark" &&
        (() => {
          const l = landmarks.find((x) => x.id === panel.id);
          return l ? (
            <LandmarkSheet
              landmark={l}
              posts={posts ?? []}
              onClose={() => setPanel(null)}
              onOpenPost={(id, ids) => openViewer(id, ids)}
              onPostHere={startPost}
              onAskHere={() => {
                setFocus([l.lng, l.lat]);
                startAsk();
              }}
            />
          ) : null;
        })()}
      {panel?.kind === "alerts" && (
        <AlertsSheet
          getMapCenter={() => center.current}
          onClose={() => setPanel(null)}
          onSaved={(text) => {
            setPanel(null);
            setToast({ text });
          }}
        />
      )}
      {panel?.kind === "account" && session && (
        <AccountSheet
          session={session}
          progress={progress}
          onProgressChanged={refreshMine}
          business={business}
          onOpenBusiness={() => setPanel({ kind: "business" })}
          onClose={() => setPanel(null)}
          onChanged={loadPosts}
          onSignedOut={(text) => {
            setPanel(null);
            setSession(null);
            setProgress(null);
            setTermsUserId(null);
            setIsAdmin(false);
            setBusiness(null);
            setToast({ text });
            loadPosts();
          }}
        />
      )}
      {panel?.kind === "auth" && (
        <AuthSheet
          session={session}
          then={panel.then}
          onClose={() => setPanel(null)}
          onDone={(userId) => {
            setTermsUserId(userId);
            const then = panel.then;
            if (then === "new") setPanel({ kind: "new", request: null });
            else if (then === "alerts") setPanel({ kind: "alerts" });
            else if (then === "account") setPanel({ kind: "account" });
            else if (then === "business") setPanel({ kind: "business" });
            else if (then === "ask") {
              setPanel(null);
              setAsking(true);
            } else setPanel(null);
          }}
        />
      )}
      {panel?.kind === "business" && (
        <BusinessSheet
          business={business}
          onClose={() => setPanel({ kind: "account" })}
          onSaved={(b) => {
            setBusiness(b);
            setPanel({ kind: "account" });
            setToast({ text: "Pedido enviado · a moderação vai conferir" });
          }}
        />
      )}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPanel({ kind: "new", request: null, photo: f });
        }}
      />
      {panel?.kind === "new" && (
        <NewPostSheet
          initialPhoto={panel.photo ?? null}
          request={panel.request}
          business={business?.status === "approved" ? business : null}
          sugerida={ehTempestade(aviso) ? "alagamento" : null}
          onClose={() => setPanel(null)}
          onOutOfArea={(at) => {
            setPanel(null);
            handlePosition(at, false);
          }}
          onPosted={(id, at, accuracy, processing, blurred, category) => {
            ownPosts.current.add(id);
            setPanel(null);
            // Depois do primeiro post, o convite para instalar
            if (shouldOfferInstall()) setTimeout(() => setInstallHint(true), 4000);
            const near = accuracy > 100 ? ` · ±${formatDistance(accuracy)}` : "";
            if (processing) {
              // O pin pousa na hora com a prévia desfocada (feita no aparelho),
              // enquanto o servidor protege rostos e placas
              const now = new Date();
              setPending((m) => ({
                ...m,
                [id]: {
                  type: "Feature",
                  geometry: { type: "Point", coordinates: at },
                  properties: {
                    id,
                    category,
                    caption: null,
                    photo_path: "",
                    created_at: now.toISOString(),
                    expires_at: new Date(now.getTime() + 12 * 3600e3).toISOString(),
                    confirm_count: 0,
                    deny_count: 0,
                    last_confirmed_at: null,
                    request_id: null,
                    view_count: 0,
                    share_count: 0,
                    mine: true,
                    processing: true,
                    preview: blurred,
                  },
                },
              }));
              setToast({ text: `Protegendo rostos e placas…${near}` });
              waitPublished(id).then((r) => {
                loadPosts();
                refreshMine();
                // a prévia sai depois que a foto de verdade já revelou no pin
                setTimeout(() => dropPending(id), 1500);
                const shielded = r.faces + r.plates;
                const what = [
                  r.faces ? `${r.faces} ${r.faces === 1 ? "rosto" : "rostos"}` : "",
                  r.plates ? `${r.plates} ${r.plates === 1 ? "placa" : "placas"}` : "",
                ]
                  .filter(Boolean)
                  .join(" e ");
                if (r.status === "published")
                  setToast({ text: shielded ? `No ar · ${what} ${shielded === 1 ? "protegido" : "protegidos"}` : "No ar", postId: id });
                else if (r.status === "hidden") {
                  dropPending(id);
                  setToast({ text: "A foto não foi publicada: a verificação automática encontrou conteúdo impróprio" });
                } else setToast({ text: "A verificação está demorando. Seu post aparece assim que terminar." });
              });
            } else setToast({ text: `Publicado${near}`, postId: id });
            setUserPos(at);
            setFocus(at);
            loadPosts();
            loadRequests();
            refreshMine();
          }}
        />
      )}
      {celebrations.length > 0 && (
        <AchievementOverlay
          item={celebrations[0]}
          remaining={celebrations.length - 1}
          onNext={() => setCelebrations((q) => q.slice(1))}
          onSeeAll={() => {
            setCelebrations([]);
            setPanel({ kind: "account" });
          }}
        />
      )}
    </main>
  );
}
