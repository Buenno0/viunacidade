"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { timeAgo, type PostProperties } from "@/lib/posts";
import { Spinner } from "../ui";
import { CheckIcon, CloseIcon } from "../ui/icons";
import { errorMessage } from "@/lib/errors";
import Olheiro, { NIVEL_COR } from "../landing/Olheiro";

type Vote = Pick<PostProperties, "confirm_count" | "deny_count" | "expires_at" | "last_confirmed_at">;

type Props = {
  post: PostProperties;
  loggedIn: boolean;
  onNeedLogin: () => void;
  onVoted: (id: string, v: Vote) => void;
};

function position(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 })
      : reject(new Error("Este navegador não informa a localização")),
  );
}

// "Ainda está rolando?": quem está perto confirma ou nega. Confirmar mantém o
// post no ar; negar encurta. O resultado aparece na hora na barra de vida.
export default function StillThere({ post, loggedIn, onNeedLogin, onVoted }: Props) {
  const [busy, setBusy] = useState<"sim" | "nao" | null>(null);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function vote(still: boolean) {
    if (!loggedIn) return onNeedLogin();
    setBusy(still ? "sim" : "nao");
    setError(null);
    try {
      const pos = await position().catch(() => {
        throw new Error("Precisamos da sua localização para saber se você está perto");
      });
      const { data, error } = await getSupabase().rpc("vote_post", {
        p_id: post.id,
        p_still: still,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
      });
      if (error) {
        if (error.code === "23505") setAnswered(still);
        throw error;
      }
      setAnswered(still);
      onVoted(post.id, data as Vote);
    } catch (e) {
      setError(errorMessage(e, "Não foi possível responder"));
    } finally {
      setBusy(null);
    }
  }

  const summary =
    post.confirm_count > 0
      ? `${post.confirm_count} ${post.confirm_count === 1 ? "confirmou" : "confirmaram"}${post.last_confirmed_at ? ` · último ${timeAgo(post.last_confirmed_at)}` : ""}`
      : "Ninguém confirmou ainda";

  // Estilo story: botões de vidro sobre o desfoque, sem caixa em volta
  return (
    <div className="flex flex-col gap-2">
      {answered === null ? (
        <div className="flex gap-2.5">
          <button type="button" className="story-pill story-vidro flex-1" disabled={busy !== null} onClick={() => vote(true)}>
            {busy === "sim" ? <Spinner /> : <CheckIcon className="text-ok" />} Ainda está rolando
          </button>
          <button type="button" className="story-pill story-vidro px-4" disabled={busy !== null} onClick={() => vote(false)}>
            {busy === "nao" ? <Spinner /> : <CloseIcon />} Acabou
          </button>
        </div>
      ) : (
        <p className="story-pill story-vidro justify-start px-4 text-sm font-medium">
          {answered ? <CheckIcon className="text-ok" /> : <CloseIcon />}
          {answered ? "Você confirmou que ainda está rolando" : "Você disse que acabou"}
        </p>
      )}
      <p className="etiqueta flex items-end gap-2 text-ink/70">
        {post.confirm_count > 0 && (
          // quem confirmou vira Olheiro (um por pessoa, até três): o número
          // continua ao lado, os bonecos só dão cara à confirmação
          <span className="flex shrink-0 items-end" aria-hidden="true">
            {Array.from({ length: Math.min(3, post.confirm_count) }, (_, i) => (
              <Olheiro key={i} nivel={[0, 1, 3][i]} cor={NIVEL_COR[[0, 1, 3][i]]} tam={18} className="-mr-0.5" />
            ))}
          </span>
        )}
        <span>
          {summary}
          {post.deny_count > 0 ? ` · ${post.deny_count} disse que acabou` : ""}
        </span>
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
