import { useEffect, useState } from "react";
import { fetchHealth, fetchAppearance, fetchMe, logout } from "./api.js";
import { C, buildRatings } from "./theme.js";
import { DEFAULTS } from "./defaults.js";
import Wordmark from "./wordmark.jsx";
import Auth from "./views/Auth.jsx";
import Home from "./views/Home.jsx";
import Spending from "./views/Spending.jsx";
import Report from "./views/Report.jsx";
import Settings from "./views/Settings.jsx";

const TABS = [
  { id: "home", label: "This month", icon: "📅" },
  { id: "spending", label: "Spending", icon: "🧾" },
  { id: "report", label: "Report", icon: "📈" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

/* grows the layout from a mobile-width column up to a wide tablet/desktop
   column, instead of staying pinned to a phone-sized 420px */
const CONTENT_WIDTH = "clamp(380px, 92vw, 880px)";

/* scattered $ signs in the three rating colors, tiled behind the sign-in
   screen — its own theme, separate from the rest of the app */
const DOLLAR_BG = `url("data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
    <text x='8' y='45' font-family='Arial, sans-serif' font-size='36' font-weight='800' fill='${C.brightGreen}' opacity='0.5'>$</text>
    <text x='85' y='105' font-family='Arial, sans-serif' font-size='32' font-weight='800' fill='${C.yellow}' opacity='0.5'>$</text>
    <text x='35' y='140' font-family='Arial, sans-serif' font-size='28' font-weight='800' fill='${C.red}' opacity='0.5'>$</text>
    <text x='108' y='30' font-family='Arial, sans-serif' font-size='22' font-weight='800' fill='${C.red}' opacity='0.35'>$</text>
    <text x='50' y='75' font-family='Arial, sans-serif' font-size='18' font-weight='800' fill='${C.yellow}' opacity='0.3'>$</text>
  </svg>
`)}")`;

/* very soft green/yellow/red glow, 30% strength, behind every signed-in
   page — a nod to the flag without competing with the content */
const FLAG_GLOW = `radial-gradient(circle at 12% 15%, ${C.brightGreen}, transparent 38%),
  radial-gradient(circle at 50% 45%, ${C.yellow}, transparent 40%),
  radial-gradient(circle at 88% 82%, ${C.red}, transparent 38%)`;

export default function App() {
  const [tab, setTab] = useState("home");
  const [demo, setDemo] = useState(true);
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out
  const [appearance, setAppearance] = useState(DEFAULTS);

  useEffect(() => {
    fetchHealth().then((h) => setDemo(h.demo));
    fetchMe().then(setUser);
  }, []);

  useEffect(() => {
    if (user) fetchAppearance().then(setAppearance);
  }, [user]);

  const ratings = buildRatings(appearance);

  const signOut = async () => {
    await logout();
    setUser(null);
    setTab("home");
    setAppearance(DEFAULTS);
  };

  const signedOut = user === null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: signedOut ? `${DOLLAR_BG}, ${C.paper}` : C.paper,
        backgroundRepeat: signedOut ? "repeat" : undefined,
        position: "relative",
        display: "flex",
        justifyContent: "center",
        padding: "28px 12px 90px",
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
        color: C.ink,
        zoom: appearance.textScale, // text-size setting scales the whole UI
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Spline+Sans+Mono:wght@500;600&display=swap');
        .rateBtn { transition: transform .12s ease, box-shadow .12s ease; cursor: pointer; border: none; }
        .rateBtn:hover { transform: translateY(-2px); }
        .rateBtn:focus-visible { outline: 3px solid ${C.ink}; outline-offset: 2px; }
        .tabBtn:focus-visible { outline: 3px solid ${C.ink}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .rateBtn { transition: none; } }
      `}</style>

      {!signedOut && user && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            opacity: 0.3,
            background: FLAG_GLOW,
            filter: "blur(70px)",
          }}
        />
      )}

      <div style={{ width: "100%", maxWidth: CONTENT_WIDTH, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Wordmark fontSize={52} />
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.muted,
              marginTop: 8,
              letterSpacing: "0.02em",
            }}
          >
            Let's Hold You Accountable Now, Before It's All Gone.
          </div>
        </div>

        {user === undefined && (
          <p style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>Loading…</p>
        )}
        {user === null && <Auth onSignedIn={setUser} />}
        {user && (
          <>
            {tab === "home" && <Home ratings={ratings} demo={demo} user={user} />}
            {tab === "spending" && <Spending ratings={ratings} />}
            {tab === "report" && <Report ratings={ratings} />}
            {tab === "settings" && (
              <Settings appearance={appearance} onSaved={setAppearance} demo={demo} onSignOut={signOut} />
            )}
          </>
        )}
      </div>

      {/* bottom tab bar (only when signed in) */}
      {user && (
        <nav
          aria-label="Main"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            display: "flex",
            justifyContent: "center",
            background: "rgba(255,255,255,.94)",
            backdropFilter: "blur(8px)",
            borderTop: `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: "flex", width: "100%", maxWidth: CONTENT_WIDTH }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                className="tabBtn"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                style={{
                  flex: 1,
                  padding: "10px 4px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: tab === t.id ? 800 : 600,
                  color: tab === t.id ? C.ink : C.muted,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  borderTop: `3px solid ${tab === t.id ? C.ink : "transparent"}`,
                }}
              >
                <span style={{ fontSize: 17 }} aria-hidden="true">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
