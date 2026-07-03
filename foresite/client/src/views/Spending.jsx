import { useEffect, useState, useCallback } from "react";
import { fetchBreakdown, fetchRecurring, changeCategory } from "../api.js";
import { C } from "../theme.js";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const prettyDate = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

/* Color a category's title by whichever rating shows up most among its
   purchases, so the drop-downs read at a glance instead of all looking
   the same. Falls back to black when there's no clear majority. */
function dominantColor(transactions, ratings) {
  const counts = { green: 0, yellow: 0, red: 0 };
  let unrated = 0;
  transactions.forEach((t) => (t.rating ? counts[t.rating]++ : unrated++));
  const [topKey, topCount] = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a));
  if (topCount === 0 || topCount <= unrated) return C.ink;
  return ratings[topKey].color;
}

function Dot({ color, size = 8 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: size,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

/* Small inline picker: move a purchase to any existing category, or make
   a new one. This is how the category list becomes the buyer's own. */
function CategoryPicker({ tx, categories, onMoved, onCancel }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const move = async (category) => {
    await changeCategory(tx.id, category);
    onMoved();
  };

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        borderRadius: 10,
        background: C.paper,
        border: `1px solid ${C.line}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.muted,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Move "{tx.merchant}" to…
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {categories.map((c) => (
          <button
            key={c}
            className="rateBtn"
            onClick={() => move(c)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              background: C.card,
              color: C.ink,
              border: `1px solid ${C.line}`,
            }}
          >
            {c}
          </button>
        ))}
        {!creating ? (
          <button
            className="rateBtn"
            onClick={() => setCreating(true)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              background: C.ink,
              color: "#fff",
            }}
          >
            + New category
          </button>
        ) : (
          <span style={{ display: "flex", gap: 6, width: "100%", marginTop: 4 }}>
            <input
              autoFocus
              placeholder="Name it anything, like 'Kids', 'Vices', 'Japan trip'…"
              value={newName}
              maxLength={40}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && move(newName)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                fontSize: 12.5,
                fontFamily: "inherit",
                color: C.ink,
              }}
            />
            <button
              className="rateBtn"
              onClick={() => newName.trim() && move(newName)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                background: C.ink,
                color: "#fff",
              }}
            >
              Move
            </button>
          </span>
        )}
      </div>
      <button
        onClick={onCancel}
        style={{
          marginTop: 8,
          border: "none",
          background: "transparent",
          color: C.muted,
          fontSize: 11.5,
          fontFamily: "inherit",
          cursor: "pointer",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        Never mind
      </button>
    </div>
  );
}

export default function Spending({ ratings }) {
  const [cats, setCats] = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [open, setOpen] = useState({}); // which categories are expanded
  const [moving, setMoving] = useState(null); // tx id being recategorized
  const [showAllAtOnce, setShowAllAtOnce] = useState(false);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([fetchBreakdown(), fetchRecurring()]);
    setCats(c);
    setRecurring(r);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!cats || !recurring)
    return <p style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>Loading…</p>;

  const grandTotal = cats.reduce((s, c) => s + c.total, 0);
  const categoryNames = cats.map((c) => c.category);
  const recurringYearly = recurring.reduce((s, r) => s + r.perYear, 0);

  const allTx = cats.flatMap((c) => c.transactions.map((t) => ({ ...t, category: c.category })));
  const reasonableTx = allTx.filter((t) => t.rating === "yellow");
  const worthItTx = allTx.filter((t) => t.rating === "green");

  return (
    <div>
      {/* ————— recurring ————— */}
      <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 4px", color: C.green }}>
        Recurring Charges
      </h2>
      <p style={{ fontSize: 12.5, color: C.muted, margin: "0 0 14px", lineHeight: 1.45 }}>
        The quiet ones that come back every month. Together they run about{" "}
        <b style={{ color: C.ink }}>{money(recurringYearly)}</b> a year.
      </p>

      {recurring.length === 0 && (
        <p style={{ fontSize: 12.5, color: C.muted }}>
          Nothing recurring spotted yet, they'll show up here as charges repeat.
        </p>
      )}
      {recurring.map((r) => (
        <div
          key={r.merchant}
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{r.merchant}</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
              {r.category} · {r.times}× · last {prettyDate(r.lastDate)}
            </div>
            {r.ratings.length > 0 && (
              <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                {r.ratings.map((rt, i) => (
                  <Dot key={i} color={ratings[rt].color} size={8} />
                ))}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "'Spline Sans Mono', monospace",
                fontWeight: 600,
                fontSize: 19,
              }}
            >
              {money(r.perMonth)}
              <span style={{ fontSize: 13, color: C.muted }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              ≈ {money(r.perYear)}/yr
            </div>
          </div>
        </div>
      ))}

      {/* ————— see everything at once ————— */}
      <button
        className="rateBtn"
        onClick={() => setShowAllAtOnce((v) => !v)}
        aria-expanded={showAllAtOnce}
        style={{
          width: "100%",
          marginTop: 4,
          marginBottom: 18,
          padding: "12px 14px",
          borderRadius: 10,
          border: `1px solid ${C.line}`,
          background: C.card,
          color: C.ink,
          fontWeight: 700,
          fontSize: 12.5,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {showAllAtOnce ? "▾" : "▸"} See recurring, reasonable, and worth-it charges all at
        once
      </button>

      {showAllAtOnce && (
        <div style={{ marginBottom: 20, display: "grid", gap: 14 }}>
          {[
            { title: "Recurring", color: C.green, items: recurring.map((r) => ({ id: r.merchant, merchant: r.merchant, amount: r.perMonth })) },
            { title: ratings.yellow.label, color: ratings.yellow.color, items: reasonableTx },
            { title: ratings.green.label, color: ratings.green.color, items: worthItTx },
          ].map((group) => (
            <div
              key={group.title}
              style={{
                background: C.card,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13, color: group.color, marginBottom: 8 }}>
                {group.title} <span style={{ color: C.muted, fontWeight: 600 }}>· {group.items.length}</span>
              </div>
              {group.items.length === 0 && (
                <div style={{ fontSize: 12, color: C.muted }}>Nothing here yet.</div>
              )}
              {group.items.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    padding: "5px 0",
                    borderTop: `1px solid ${C.line}`,
                  }}
                >
                  <span>{t.merchant}</span>
                  <span style={{ fontFamily: "'Spline Sans Mono', monospace" }}>{money(t.amount)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ————— by category ————— */}
      <h2 style={{ fontSize: 16, fontWeight: 800, margin: "22px 0 4px", color: C.green }}>
        Where It All Went
      </h2>
      <p style={{ fontSize: 12.5, color: C.muted, margin: "0 0 12px", lineHeight: 1.45 }}>
        Tap a category to see every purchase inside. Tap a purchase's category tag to
        move it, your categories, your rules.
      </p>

      {cats.map((c) => {
        const isOpen = !!open[c.category];
        const share = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
        return (
          <div
            key={c.category}
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              marginBottom: 8,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpen((o) => ({ ...o, [c.category]: !isOpen }))}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                color: C.ink,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform .15s ease",
                      marginRight: 8,
                      fontSize: 12,
                      color: C.muted,
                    }}
                  >
                    ▶
                  </span>
                  <span style={{ color: dominantColor(c.transactions, ratings) }}>
                    {c.category}
                  </span>
                  <span style={{ color: C.muted, fontWeight: 600, fontSize: 12 }}>
                    {" "}
                    · {c.count} {c.count === 1 ? "purchase" : "purchases"}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Spline Sans Mono', monospace",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {money(c.total)}
                </div>
              </div>
              {/* share-of-spending bar */}
              <div
                style={{
                  marginTop: 8,
                  height: 6,
                  borderRadius: 4,
                  background: C.paper,
                  overflow: "hidden",
                }}
                aria-label={`${share}% of total spending`}
              >
                <div
                  style={{
                    width: `${share}%`,
                    height: "100%",
                    background: C.ink,
                    opacity: 0.75,
                  }}
                />
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: "0 14px 12px" }}>
                {c.transactions.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      borderTop: `1px solid ${C.line}`,
                      padding: "10px 0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
                      >
                        <Dot color={t.rating ? ratings[t.rating].color : C.unrated} />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.merchant}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                            {prettyDate(t.date)}
                            {t.recurring ? " · recurring" : ""} ·{" "}
                            <button
                              onClick={() => setMoving(moving === t.id ? null : t.id)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: C.muted,
                                fontSize: 11,
                                fontFamily: "inherit",
                                cursor: "pointer",
                                textDecoration: "underline",
                                padding: 0,
                              }}
                            >
                              move category
                            </button>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Spline Sans Mono', monospace",
                          fontWeight: 600,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {money(t.amount)}
                      </div>
                    </div>
                    {moving === t.id && (
                      <CategoryPicker
                        tx={t}
                        categories={categoryNames.filter((n) => n !== c.category)}
                        onMoved={() => {
                          setMoving(null);
                          load();
                        }}
                        onCancel={() => setMoving(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
