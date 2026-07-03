import { C } from "./theme.js";

/* Renders "Foresite" using a dotless ı, then overlays a colored circle
   where the dot belongs, so the wordmark carries a rating color without
   needing an image asset. */
function IDot({ color, fontSize }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      ı
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: fontSize * 0.02,
          transform: "translate(-50%, -100%)",
          width: fontSize * 0.14,
          height: fontSize * 0.14,
          borderRadius: "50%",
          background: color,
        }}
      />
    </span>
  );
}

export default function Wordmark({ fontSize = 48, fontWeight = 900 }) {
  return (
    <span
      style={{
        fontSize,
        fontWeight,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: C.ink,
      }}
    >
      Fores
      <IDot color={C.brightGreen} fontSize={fontSize} />
      te
    </span>
  );
}
