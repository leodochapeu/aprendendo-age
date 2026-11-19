import type { PlayerStreamLinks } from "@/lib/playersApi";

const ICON = "h-7 w-7 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]";

export function PlayerStreamBadges({ streams }: { streams: PlayerStreamLinks }) {
  if (!streams.youtube && !streams.twitch) return null;

  return (
    <div className="player-stream-badges">
      {streams.youtube ? (
        <a
          href={streams.youtube}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          title="YouTube"
          className="player-stream-badges__link player-stream-badges__link--youtube"
        >
          <svg viewBox="0 0 24 24" aria-hidden className={ICON}>
            <path
              fill="currentColor"
              d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6z"
            />
            <path fill="#fff" d="M9.8 15.5V8.9l6 3.3-6 3.3z" />
          </svg>
        </a>
      ) : null}
      {streams.twitch ? (
        <a
          href={streams.twitch}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitch"
          title="Twitch"
          className="player-stream-badges__link player-stream-badges__link--twitch"
        >
          <svg viewBox="0 0 24 24" aria-hidden className={ICON}>
            <path
              fill="currentColor"
              d="M4.3 2 2 6.1v13.2h4.6V22l3.5-2.7h3.1L20.9 12V2H4.3zm15 9.2-2.9 2.9h-3.1l-2.7 2.7v-2.7H7.4V3.6h11.9v7.6z"
            />
            <path fill="#fff" d="M15.5 6.2h1.6v4.7h-1.6V6.2zm-4.3 0h1.6v4.7h-1.6V6.2z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
