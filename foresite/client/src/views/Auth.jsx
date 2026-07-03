import { useState } from "react";
import { login, signup } from "../api.js";
import { C } from "../theme.js";
import Wordmark from "../wordmark.jsx";

/*
 * One screen, two modes. Kept deliberately simple: big touch targets,
 * plain words, one thing to do. The copy explains what the app is for
 * in one breath — no jargon, no lecture.
 */
export default function Auth({ onSignedIn }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const resp =
      mode === "signup"
        ? await signup(email, password, name)
        : await login(email, password);
    setBusy(false);
    if (resp.ok) onSignedIn(resp);
    else setError(resp.error || "Something went wrong, try again?");
  };

  const inputStyle = {
    width: "100%",
    padding: "17px 15px",
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    fontSize: 16.5,
    fontFamily: "inherit",
    color: C.ink,
    background: C.card,
    boxSizing: "border-box",
    marginBottom: 12,
  };

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
          {mode === "signup" ? (
            <>
              Welcome to <Wordmark fontSize={22} fontWeight={800} />
            </>
          ) : (
            "Welcome back"
          )}
        </h1>
        <p style={{ fontSize: 13.5, color: C.muted, margin: 0, lineHeight: 1.5 }}>
          We help you rate your purchases and track where all your money
          <br />
          goes, so you can see where you're putting your money and hold
          yourself accountable.
        </p>
      </div>

      {mode === "signup" && (
        <input
          style={inputStyle}
          placeholder="What should we call you? (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      )}
      <input
        style={inputStyle}
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <input
        style={inputStyle}
        placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {error && (
        <div
          role="alert"
          style={{
            background: "#F8E5E0",
            color: "#8E1600",
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 10,
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      <button
        className="rateBtn"
        onClick={submit}
        disabled={busy}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 12,
          background: mode === "signup" ? C.yellow : C.ink,
          color: mode === "signup" ? C.ink : "#fff",
          fontWeight: 800,
          fontSize: 15,
          fontFamily: "inherit",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "One moment…" : mode === "signup" ? "Create my account" : "Sign in"}
      </button>

      <button
        onClick={() => {
          setMode(mode === "signup" ? "login" : "signup");
          setError(null);
        }}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 8,
          border: "none",
          background: "transparent",
          color: C.ink,
          fontWeight: 800,
          fontSize: 15,
          fontFamily: "inherit",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </div>
  );
}
