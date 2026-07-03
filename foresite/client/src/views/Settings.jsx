import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import {
  saveAppearance,
  enablePushReminders,
  sendTestReminder,
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
} from "../api.js";
import { C, PRESETS, TEXT_SIZES, soften } from "../theme.js";

/*
 * Everything here edits a draft copy and saves on "Save changes", with a
 * live preview card so people see exactly what they're choosing.
 */
function ConnectBank({ onLinked }) {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    createLinkToken().then((d) => {
      if (d.link_token) setLinkToken(d.link_token);
    });
  }, []);

  const onSuccess = useCallback(
    async (public_token, metadata) => {
      await exchangePublicToken(public_token, metadata?.institution?.name);
      await syncTransactions();
      onLinked();
    },
    [onLinked]
  );

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess });

  return (
    <button
      className="rateBtn"
      onClick={() => open()}
      disabled={!linkToken || !ready}
      style={{
        width: "100%",
        padding: "13px",
        borderRadius: 12,
        background: C.ink,
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        fontFamily: "inherit",
        opacity: linkToken && ready ? 1 : 0.6,
      }}
    >
      🏦 Connect a bank account
    </button>
  );
}

export default function Settings({ appearance, onSaved, demo, onSignOut }) {
  const [draft, setDraft] = useState(structuredClone(appearance));
  const [saved, setSaved] = useState(false);
  const [reminderStatus, setReminderStatus] = useState(null);
  const [bankStatus, setBankStatus] = useState(null);

  const turnOnReminders = async () => {
    setReminderStatus("Setting up…");
    const r = await enablePushReminders();
    setReminderStatus(
      r.ok
        ? "Reminders are on for this device. Try the test below."
        : r.reason
    );
  };

  const testReminder = async () => {
    setReminderStatus("Sending…");
    const r = await sendTestReminder();
    setReminderStatus(
      r.push > 0
        ? "Sent! Check your notifications."
        : "Sent to the server log, turn on reminders above to get it on this device."
    );
  };

  const setRating = (k, field, value) =>
    setDraft((d) => ({
      ...d,
      preset: field === "color" ? "custom" : d.preset,
      ratings: { ...d.ratings, [k]: { ...d.ratings[k], [field]: value } },
    }));

  const applyPreset = (id) =>
    setDraft((d) => ({
      ...d,
      preset: id,
      ratings: {
        green: { ...d.ratings.green, color: PRESETS[id].ratings.green.color },
        yellow: { ...d.ratings.yellow, color: PRESETS[id].ratings.yellow.color },
        red: { ...d.ratings.red, color: PRESETS[id].ratings.red.color },
      },
    }));

  const save = async () => {
    const clean = await saveAppearance(draft);
    onSaved(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    width: "100%",
    padding: "9px 10px",
    borderRadius: 10,
    border: `1px solid ${C.line}`,
    fontSize: 13.5,
    fontFamily: "inherit",
    color: C.ink,
    background: C.card,
    boxSizing: "border-box",
  };

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 4px" }}>Make it yours</h2>
      <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 14px", lineHeight: 1.4 }}>
        Choose the colors and words that feel right to you. Labels always appear next to
        colors, so any palette works.
      </p>

      {/* presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(PRESETS).map(([id, p]) => (
          <button
            key={id}
            className="rateBtn"
            onClick={() => applyPreset(id)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              fontFamily: "inherit",
              background: draft.preset === id ? C.ink : C.card,
              color: draft.preset === id ? "#fff" : C.ink,
              border: `1px solid ${draft.preset === id ? C.ink : C.line}`,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {["green", "yellow", "red"].map((k) => (
              <span
                key={k}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 9,
                  background: p.ratings[k].color,
                  display: "inline-block",
                }}
              />
            ))}
            {p.name}
          </button>
        ))}
      </div>

      {/* per-tier editors */}
      {["green", "yellow", "red"].map((k) => {
        const r = draft.ratings[k];
        return (
          <div
            key={k}
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              borderLeft: `4px solid ${r.color}`,
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <label
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: r.color,
                cursor: "pointer",
                flexShrink: 0,
                border: `1px solid ${C.line}`,
              }}
              title="Pick a color"
            >
              <input
                type="color"
                value={r.color}
                onChange={(e) => setRating(k, "color", e.target.value)}
                aria-label={`Color for "${r.label}"`}
                style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
              />
            </label>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.muted,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                What do you call these purchases?
              </div>
              <input
                style={inputStyle}
                value={r.label}
                maxLength={24}
                onChange={(e) => setRating(k, "label", e.target.value)}
                aria-label={`Label for the ${k} rating`}
              />
            </div>
          </div>
        );
      })}

      {/* live preview */}
      <div
        style={{
          background: C.paper,
          border: `1px dashed ${C.line}`,
          borderRadius: 12,
          padding: 12,
          margin: "14px 0",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.muted,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Preview
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["green", "yellow", "red"].map((k) => {
            const r = draft.ratings[k];
            return (
              <span
                key={k}
                style={{
                  flex: 1,
                  padding: "9px 4px",
                  borderRadius: 10,
                  background: soften(r.color),
                  color: r.color,
                  fontWeight: 700,
                  fontSize: 13.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 8,
                    background: r.color,
                    display: "inline-block",
                  }}
                />
                {r.label || "…"}
              </span>
            );
          })}
        </div>
      </div>

      {/* linked accounts */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.ink,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        Linked accounts
      </div>
      <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
        Connect your bank once and Foresite pulls in transactions from checking,
        savings, and credit cards automatically, you pick which accounts to sync
        when you connect.
      </p>
      {demo ? (
        <div
          style={{
            background: C.paper,
            border: `1px dashed ${C.line}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 18,
            fontSize: 13.5,
            color: C.muted,
            lineHeight: 1.5,
          }}
        >
          You're in demo mode, so this is a preview. Add free Plaid sandbox keys in
          <code style={{ margin: "0 4px" }}>server/.env</code>
          and set <code>DEMO_MODE=false</code> to connect a real (or sandbox) bank,
          debit or credit.
          <button
            disabled
            style={{
              width: "100%",
              marginTop: 10,
              padding: "13px",
              borderRadius: 12,
              background: C.line,
              color: C.muted,
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "inherit",
              cursor: "not-allowed",
            }}
          >
            🏦 Connect a bank account
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 18 }}>
          <ConnectBank onLinked={() => setBankStatus("Connected! Syncing your transactions now.")} />
          {bankStatus && (
            <p role="status" style={{ fontSize: 13.5, color: C.ink, margin: "8px 0 0" }}>
              {bankStatus}
            </p>
          )}
        </div>
      )}

      {/* text size */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.muted,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Text size
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {TEXT_SIZES.map((s) => (
          <button
            key={s.value}
            className="rateBtn"
            onClick={() => setDraft((d) => ({ ...d, textScale: s.value }))}
            style={{
              flex: 1,
              padding: "9px 4px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              fontFamily: "inherit",
              background: draft.textScale === s.value ? "#9CA3AF" : C.card,
              color: draft.textScale === s.value ? "#fff" : C.ink,
              border: `1px solid ${draft.textScale === s.value ? "#9CA3AF" : C.line}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* reminders */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.muted,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Reminders
      </div>
      <p style={{ fontSize: 13.5, color: C.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
        When a purchase you've regretted before shows up again, Foresite gives you a
        heads-up, like a friend who remembers so you don't have to. Here's what that
        looks like:
      </p>

      {/* what a real push notification looks like */}
      <div
        style={{
          background: C.paper,
          color: C.muted,
          border: `1px dashed ${C.line}`,
          padding: "12px 14px",
          borderRadius: 12,
          fontSize: 14,
          lineHeight: 1.4,
          marginBottom: 14,
        }}
      >
        🔔 <b style={{ color: C.ink }}>Foresite</b> · Heads-up: DoorDash just charged
        $41.87. The last 4 times, you weren't happy about 3 of them. No judgment, just
        looking out for you.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          className="rateBtn"
          onClick={turnOnReminders}
          style={{
            flex: 1,
            padding: "11px 4px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 700,
            fontFamily: "inherit",
            background: C.card,
            color: C.ink,
            border: `1px solid ${C.line}`,
          }}
        >
          🔔 Turn on reminders
        </button>
        <button
          className="rateBtn"
          onClick={testReminder}
          style={{
            flex: 1,
            padding: "11px 4px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 700,
            fontFamily: "inherit",
            background: C.card,
            color: C.ink,
            border: `1px solid ${C.line}`,
          }}
        >
          Send a test
        </button>
      </div>
      {reminderStatus && (
        <p role="status" style={{ fontSize: 13.5, color: C.ink, margin: "0 0 16px", lineHeight: 1.4 }}>
          {reminderStatus}
        </p>
      )}
      {!reminderStatus && <div style={{ marginBottom: 16 }} />}

      <button
        className="rateBtn"
        onClick={save}
        style={{
          width: "100%",
          padding: 15,
          borderRadius: 12,
          background: soften(C.brightGreen),
          color: C.brightGreen,
          fontWeight: 800,
          fontSize: 15,
          fontFamily: "inherit",
        }}
      >
        {saved ? "Saved ✓" : "Save changes"}
      </button>

      {onSignOut && (
        <button
          className="rateBtn"
          onClick={onSignOut}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 16,
            borderRadius: 12,
            background: soften(C.red),
            color: C.red,
            fontWeight: 800,
            fontSize: 15,
            fontFamily: "inherit",
          }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
