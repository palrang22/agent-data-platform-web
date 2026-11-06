// 도서관 카드 목록함: 정형 데이터는 색인 카드만 바로, 문서는 정리 라인을 거쳐 OKF 카드로.
// 실행: node figure/library.mjs  →  public/library.html
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "generated", "library.html");

const W = 640;
const H = 560;
const FLOOR = { x: -310, y: -170, w: 610, d: 330, r: 12 };
const FLOOR_H = 8;
// 세 단(계층): 앞 L1 원천, 가운데 L2 시맨틱 레이어, 뒤 L3 AI 에이전트
const TIERS = [
  { y0: 30, y1: 160, top: 0, label: "L1 · 원천 데이터  데이터베이스와 문서" },
  { y0: -90, y1: 30, top: 34, label: "L2 · 시맨틱 레이어  지식 카탈로그" },
  { y0: -170, y1: -90, top: 68, label: "L3 · AI 에이전트  MCP 서버와 에이전트" },
];
const Z2 = TIERS[1].top;
const Z3 = TIERS[2].top;

const P = k.fitProjection(
  [...k.boxCorners(FLOOR, -FLOOR_H, 0), [-80, -64, 130 + Z2], [20, -150, 90 + Z3], [-310, -170, Z3], [300, -170, Z3]],
  W,
  H,
  { pad: 16, azimuth: 40 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const Tx = (tr, text, size, tone = "mid") => k.faceTextSvg(tr, text, { size, tone });
const top = (x, y, z = 0) => k.topMatrix([x, y], z, P);
const front = (x, y, z) => k.sideMatrix([x, y], z, P, "left");
const part = (id, inner) => `<g class="pt" data-part="${id}" role="button" tabindex="0" aria-label="${NAMES[id]} 설명 열기">${inner}</g>`;
const poly = (pts) => "M" + pts.map((p) => at(p).join(",")).join("L");

const NAMES = {
  stacks: "Google Cloud 데이터베이스",
  external: "외부 데이터베이스",
  memos: "메모 뭉치",
  typewriter: "타자기",
  gate: "게이트",
  stamp: "승인 도장",
  catalog: "지식 카탈로그",
  board: "그래프 판",
  mcp: "MCP 서버",
  agent: "AI 에이전트",
};

// ---------- 바닥: 계단식 세 단 ----------
function tier(t, i) {
  const plan = { x: FLOOR.x, y: t.y0, w: FLOOR.w, d: t.y1 - t.y0, r: i === 0 ? 10 : 2 };
  const out = [];
  if (i === 2) out.push(`<path class="iso-halo" d="${k.haloOf(FLOOR, -FLOOR_H, FLOOR_H, P)}"/>`);
  out.push(S(k.slabOf(plan, -FLOOR_H, t.top + FLOOR_H, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 7), t.top, P), { tone: "faint" }));
  const screws = k.corners(plan, 12);
  out.push(D(screws.map(([x, y]) => at([x, y, t.top])), { size: 0.7 }));
  out.push(`<g class="tier-label">${Tx(front(FLOOR.x + 14, t.y1 + 0.1, t.top - 1.6), t.label, 5.4, "lo")}</g>`);
  return out.join("");
}
const onTier = (z, inner) => `<g transform="${k.translateAlong(P, [0, 0, z])}">${inner}</g>`;

// ---------- 데이터베이스 (1st party / 3rd party) ----------
const CASE_Y = 96;
const DB_Y = CASE_Y + 9;
const FIRST = { plan: { x: -292, y: CASE_Y - 10, w: 188, d: 44, r: 4 }, r: 14, h: 40, xs: [-270, -234, -198, -162, -126], names: ["BigQuery", "Spanner", "AlloyDB", "Cloud SQL", "Cloud Storage"] };
const THIRD = { plan: { x: -94, y: CASE_Y - 8, w: 82, d: 40, r: 4 }, r: 12, h: 30, xs: [-74, -36], names: ["Databricks", "Snowflake"] };

function db(x, y, r, h, cls) {
  const out = [`<g class="db ${cls}">`];
  out.push(S(k.cylinder(x, y, r, 0, h, P, 40, 1), { tone: "mid" }));
  out.push(L([h / 3, (2 * h) / 3].map((z) => k.sideArc(x, y, r, z, P, 28)).join(""), { tone: "lo" }));
  out.push(`<g class="db-cap">${S(k.cylinder(x, y, r - 0.6, h, 0.8, P, 40), { tone: "hi", crease: "none" })}</g>`);
  out.push(L(k.ring(x, y, r - 3.5, h + 0.8, P, 32), { tone: "faint" }));
  out.push("</g>");
  return out.join("");
}

function dbGroup(g, cls, title, dashed) {
  const out = [`<path class="iso-halo" d="${k.haloOf(g.plan, 0, 1, P)}"/>`];
  out.push(`<g class="${dashed ? "pad-3p" : "pad-1p"}">${S(k.slabOf(g.plan, 0, 3, P, 4, 0.6), { tone: "lo" })}</g>`);
  if (dashed) out.push(L(k.planOutline(k.insetPlan(g.plan, 3), 3, P), { tone: "mid", dashed: true }));
  g.xs.forEach((x, i) => {
    out.push(`<g transform="${k.translateAlong(P, [0, 0, 3])}">${db(x, DB_Y, g.r, g.h, cls)}</g>`);
    out.push(Tx(top(x - g.r, DB_Y + g.r + 7, 3), g.names[i], 3.8));
  });
  out.push(Tx(top(g.plan.x + 3, g.plan.y + g.plan.d + 8), title, 4.6, "lo"));
  return out.join("");
}

function stacks() {
  return dbGroup(FIRST, "db-1p", "Google Cloud · 1st party · 데이터는 제자리", false);
}
function external() {
  return dbGroup(THIRD, "db-3p", "외부 · 3rd party", true);
}

// ---------- 정리 라인 ----------
const MEMO = { x: 36, y: 100, w: 40, d: 30, r: 1 };
function memos() {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const dx = ((i * 37) % 7) - 3;
    const dy = ((i * 23) % 5) - 2;
    out.push(S(k.slabOf({ ...MEMO, x: MEMO.x + dx, y: MEMO.y + dy }, i * 1.5, 1.2, P, 2), { tone: i === 5 ? "hi" : "mid", crease: "none" }));
  }
  for (const [dy, w] of [[7, 26], [13, 20], [19, 28]]) out.push(L(k.lineOnTop([MEMO.x + 4, MEMO.y + dy], [MEMO.x + 4 + w, MEMO.y + dy], 9.2, P), { tone: "lo", free: "end" }));
  out.push(Tx(top(MEMO.x - 4, MEMO.y + MEMO.d + 12), "절차서 · 규정 · FAQ", 4.6, "lo"));
  return out.join("");
}

const TW = { x: 98, y: 92, w: 54, d: 36, r: 4 };
function typewriter() {
  const out = [`<path class="iso-halo" d="${k.haloOf(TW, 0, 1, P)}"/>`];
  out.push(S(k.slabOf(TW, 0, 14, P, 4, 1)));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    out.push(S(k.cylinder(TW.x + 7 + c * 6.6 + r * 1.5, TW.y + 14 + r * 6.5, 2, 14, 2, P, 12), { tone: "hi" }));
  }
  // 종이 롤러 (x축 방향 원통 대신 받침 위 두 기둥 + 종이)
  for (const x of [TW.x + 4, TW.x + TW.w - 8]) out.push(S(k.slabOf({ x, y: TW.y + 2, w: 4, d: 6, r: 1 }, 14, 8, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: TW.x + 4, y: TW.y + 2, w: TW.w - 8, d: 6, r: 3 }, 22, 6, P, 6, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf({ x: TW.x + 12, y: TW.y + 4, w: 30, d: 1, r: 0 }, 28, 18, P, 2), { tone: "hi", crease: "none" }));
  out.push(Tx(top(TW.x, TW.y + TW.d + 10), "Gemini 초안", 4.6, "lo"));
  return out.join("");
}

const GATE = { x: 172, y: 90, w: 46, d: 40, r: 3 };
function gate() {
  const out = [S(k.slabOf(GATE, 0, 8, P, 4, 0.8))];
  out.push(L(k.planOutline(k.insetPlan(GATE, 4), 8, P), { tone: "faint" }));
  // 돋보기
  const [mx, my] = [GATE.x + 18, GATE.y + 18];
  out.push(S(k.slabOf({ x: mx + 6, y: my + 6, w: 14, d: 4, r: 2 }, 8, 3, P, 3), { tone: "lo" }));
  out.push(S(k.cylinder(mx, my, 9, 8, 3, P, 32, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(mx, my, 6.8, 11, 0.4, P, 32), { tone: "hi", crease: "none" }));
  // 체크 램프
  [0, 1].forEach((i) => {
    const lx = GATE.x + 36;
    const ly = GATE.y + 10 + i * 12;
    out.push(S(k.cylinder(lx, ly, 3, 8, 3, P, 16), { tone: "mid" }));
    out.push(`<g class="lamp" data-lamp="${i}">${D([at([lx, ly, 11])], { size: 2, tone: "lo" })}</g>`);
  });
  out.push(Tx(top(GATE.x, GATE.y + GATE.d + 10), "게이트 검사", 4.6, "lo"));
  return out.join("");
}

const STAMP = { x: 238, y: 90, w: 46, d: 40, r: 3 };
function stamp() {
  const out = [S(k.slabOf(STAMP, 0, 6, P, 4, 0.8))];
  out.push(S(k.slabOf({ x: STAMP.x + 10, y: STAMP.y + 10, w: 22, d: 18, r: 1 }, 6, 1, P, 2), { tone: "lo", crease: "none" }));
  const [sx, sy] = [STAMP.x + 21, STAMP.y + 19];
  out.push(`<g data-stamp>${S(k.slabOf({ x: sx - 8, y: sy - 6, w: 16, d: 12, r: 1.5 }, 20, 6, P, 3, 0.4), { tone: "mid" })}${S(k.cylinder(sx, sy, 2.2, 26, 10, P, 16), { tone: "mid", crease: "none" })}${S(k.cylinder(sx, sy, 4.6, 36, 5, P, 24, 0.8), { tone: "hi" })}${L(k.knurl(sx, sy, 4.6, 36, 41, 20, P), { tone: "lo" })}</g>`);
  out.push(Tx(top(STAMP.x, STAMP.y + STAMP.d + 10), "사람 승인", 4.6, "lo"));
  return out.join("");
}

// ---------- 카드 목록함 (지식 카탈로그) ----------
const CAT = { x: -86, y: -64, w: 164, d: 72, r: 3 };
const CAT_H = 70;
const SLOT_L = { x: -74, y: -26, w: 58, d: 8, r: 2 };
const SLOT_R = { x: 8, y: -26, w: 58, d: 8, r: 2 };
function catalog() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CAT, 0, 2, P)}"/>`];
  out.push(S(k.slabOf(CAT, 0, CAT_H, P, 5, 1.4)));
  out.push(L(k.planOutline(k.insetPlan(CAT, 4), CAT_H, P), { tone: "faint" }));
  out.push(S(k.slabOf(SLOT_L, CAT_H, 1, P, 3), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf(SLOT_R, CAT_H, 1, P, 3), { tone: "lo", crease: "none" }));
  out.push(Tx(top(CAT.x + 10, CAT.y + 20, CAT_H), "Knowledge Catalog", 7));
  const fy = CAT.y + CAT.d;
  for (let c = 0; c < 4; c++) {
    const x0 = CAT.x + 6 + c * 39;
    const tech = c < 2;
    for (let r = 0; r < 3; r++) {
      const z = 5 + r * 19;
      out.push(S(k.slabOf({ x: x0, y: fy, w: 36, d: 1, r: 0 }, z, 16, P, 2), { tone: "mid", crease: "none" }));
      out.push(`<g class="${tech ? "h-blue" : "h-green"}">${S(k.slabOf({ x: x0 + 12, y: fy + 1, w: 12, d: 2.4, r: 1 }, z + 6, 3, P, 2), { tone: "lo" })}</g>`);
      if (tech) out.push(D([at([x0 + 31, fy + 1, z + 12])], { size: 0.9, tone: "lo" }));
    }
  }
  out.push(Tx(front(CAT.x + 6, fy + 1.1, CAT_H - 3), "기술 메타 · 읽기 전용", 4.4));
  out.push(Tx(front(CAT.x + 84, fy + 1.1, CAT_H - 3), "비즈니스 메타", 4.4));
  return out.join("");
}

// ---------- 그래프 판 ----------
const BOARD = { x: -64, y: -70, w: 120, d: 4, r: 1 };
const BOARD_Z = CAT_H;
const PINS = [
  { x: -54, z: 108, t: "고객" },
  { x: -30, z: 90, t: "주문" },
  { x: -6, z: 110, t: "반품" },
  { x: 18, z: 92, t: "배송" },
  { x: 40, z: 110, t: "이탈" },
];
function board() {
  const out = [];
  for (const x of [BOARD.x + 6, BOARD.x + BOARD.w - 10]) out.push(S(k.slabOf({ x, y: BOARD.y, w: 4, d: 4, r: 0.8 }, BOARD_Z, 8, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf(BOARD, BOARD_Z + 8, 48, P, 3, 0.8), { tone: "lo" }));
  const fy = BOARD.y + BOARD.d;
  out.push(`<path class="iso-line yarn" d="${poly(PINS.map((p) => [p.x + 7, fy + 1.2, p.z - 4]))}"/>`);
  for (const p of PINS) {
    out.push(S(k.slabOf({ x: p.x, y: fy, w: 14, d: 1, r: 0 }, p.z - 9, 10, P, 2), { tone: "hi", crease: "none" }));
    out.push(Tx(front(p.x + 2, fy + 1.1, p.z - 2.5), p.t, 3.8));
    out.push(D([at([p.x + 7, fy + 1.2, p.z - 4])], { size: 1.1, tone: "lo" }));
  }
  out.push(Tx(front(BOARD.x + 2, fy + 0.1, BOARD_Z + 6), "그래프 · 카드 사이의 실", 4, "lo"));
  return out.join("");
}

// ---------- MCP 서버 + AI 에이전트 (L3) ----------
const MCP = { x: 104, y: -152, w: 96, d: 46, r: 3 };
const MCP_H = 24;
const TERM = { x: 226, y: -160, w: 72, d: 50, r: 3 };
const TERM_H = 14;
const TOOLS = ["search_entries", "lookup_entry", "lookup_context"];
function mcp() {
  const out = [`<path class="iso-halo" d="${k.haloOf(MCP, 0, 1, P)}"/>`];
  out.push(S(k.slabOf(MCP, 0, MCP_H, P, 5, 1.2)));
  out.push(L(k.planOutline(k.insetPlan(MCP, 4), MCP_H, P), { tone: "faint" }));
  out.push(Tx(top(MCP.x + 6, MCP.y + 14, MCP_H), "MCP 서버", 6));
  TOOLS.forEach((name, i) => {
    const z = MCP_H - 7 - i * 6.4;
    out.push(`<g class="led" data-led="${i}">${D([at([MCP.x + 6, MCP.y + MCP.d + 0.2, z + 1.4])], { size: 1.4, tone: "lo" })}</g>`);
    out.push(Tx(front(MCP.x + 10, MCP.y + MCP.d + 0.2, z), name, 3.4));
  });
  // 포트 두 개: 요청 들어오는 곳 / 응답 나가는 곳
  return out.join("");
}
function agent() {
  const out = [`<path class="iso-halo" d="${k.haloOf(TERM, 0, 1, P)}"/>`];
  out.push(S(k.slabOf(TERM, 0, TERM_H, P, 4, 1)));
  const scr = { x: TERM.x + 6, y: TERM.y + 14, w: 60, d: 4, r: 1 };
  out.push(S(k.slabOf({ x: TERM.x + 30, y: TERM.y + 18, w: 12, d: 6, r: 1 }, TERM_H, 8, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf(scr, TERM_H + 8, 38, P, 3, 0.8), { tone: "mid" }));
  const fy = scr.y + scr.d;
  out.push(S(k.slabOf({ x: scr.x + 3, y: fy, w: scr.w - 6, d: 0.5, r: 0 }, TERM_H + 11, 32, P, 2), { tone: "hi", crease: "none" }));
  const z = TERM_H + 37;
  out.push(`<g data-screen="q">${Tx(front(scr.x + 6, fy + 0.6, z), "지난 분기 우수 고객", 4.2)}${Tx(front(scr.x + 6, fy + 0.6, z - 7), "이탈률이 왜 올랐지?", 4.2)}</g>`);
  out.push(`<g data-screen="a" style="opacity:0">${Tx(front(scr.x + 6, fy + 0.6, z), "맥락 묶음 도착", 4.2, "hi")}${Tx(front(scr.x + 6, fy + 0.6, z - 7), "엔트리 4개 · YAML", 4.2)}</g>`);
  for (let c = 0; c < 8; c++) out.push(S(k.slabOf({ x: TERM.x + 5 + c * 8, y: TERM.y + 36, w: 6, d: 8, r: 0.8 }, TERM_H, 1.2, P, 2), { tone: "hi", crease: "none" }));
  out.push(Tx(top(TERM.x, TERM.y + TERM.d + 8, 0), "AI 에이전트", 4.6, "lo"));
  return out.join("");
}

// ---------- 흐름 ----------
const CT = Z2 + CAT_H; // 카탈로그 윗면 높이
const BLUE_PATH = [[FIRST.xs[0], DB_Y, 3 + FIRST.h + 1], [FIRST.xs[0], DB_Y, CT + 18], [-45, -22, CT + 18], [-45, -22, CT + 1]];
const BLUE_PATH_2 = [[THIRD.xs[1], DB_Y, 3 + THIRD.h + 1], [THIRD.xs[1], DB_Y, CT + 10], [-30, -22, CT + 10], [-30, -22, CT + 1]];
const GREEN_PATH = [[56, 115, 10], [125, 110, 30], [195, 110, 14], [261, 110, 9], [261, 110, CT + 14], [37, -22, CT + 14], [37, -22, CT + 1]];
// 요청: 에이전트 → MCP → 카탈로그 / 응답: 카탈로그 → MCP → 에이전트
const MCP_MID = MCP.x + MCP.w / 2;
const MID_Y = MCP.y + MCP.d / 2; // MCP를 가로지르는 선의 y
// 하나의 점선: 카탈로그 → MCP(관통) → 에이전트. 요청은 이 선을 거꾸로, 응답은 이 선을 따라 움직임
const LANE = [[60, -30, CT + 1], [60, -30, CT + 24], [60, MID_Y, CT + 24], [MCP.x - 2, MID_Y, Z3 + 10], [MCP.x + MCP.w + 2, MID_Y, Z3 + 10], [TERM.x, MID_Y, Z3 + 8]];

function flows() {
  return [
    `<path class="iso-line flow blue" data-flow="blue" d="${poly(BLUE_PATH)}"/>`,
    `<path class="iso-line flow blue" d="${poly(BLUE_PATH_2)}"/>`,
    `<path class="iso-line flow green" data-flow="green" d="${poly(GREEN_PATH)}"/>`,
  ].join("");
}

const svg = k.figureSvg({
  width: W,
  height: H,
  label: "계단식 세 단. 앞 단에 Google Cloud 데이터베이스 다섯 개와 외부 데이터베이스 두 개, 문서 정리 라인이 있고, 가운데 단에 지식 카탈로그와 그래프 판, 뒤 단에 MCP 서버와 AI 에이전트 단말이 있습니다. 에이전트와 MCP 사이에는 요청 선과 응답 선이 따로 있습니다.",
  body: [
    tier(TIERS[2], 2),
    `<path class="iso-line flow red" data-flow="red" d="${poly(LANE)}"/>`,
    `<g class="lane-label">${Tx(top(MCP.x + MCP.w + 3, MID_Y - 3, Z3), "요청 ↔ 응답", 3.6)}</g>`,
    onTier(Z3, part("mcp", mcp())),
    `<path class="iso-line flow red" d="${poly(LANE.slice(-2))}"/>`,
    onTier(Z3, part("agent", agent())),
    tier(TIERS[1], 1),
    onTier(Z2, part("catalog", catalog()) + part("board", board())),
    tier(TIERS[0], 0),
    flows(),
    part("stamp", stamp()),
    part("gate", gate()),
    part("typewriter", typewriter()),
    part("stacks", stacks()),
    part("external", external()),
    part("memos", memos()),
  ],
});

// ---------- 카메라 시야 ----------
const ASPECT = W / H;
function viewOf(box, pad = 18) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const pts = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(at([x, y, z]));
  let minX = Math.min(...pts.map((p) => p[0])) - pad;
  let maxX = Math.max(...pts.map((p) => p[0])) + pad;
  let minY = Math.min(...pts.map((p) => p[1])) - pad;
  let maxY = Math.max(...pts.map((p) => p[1])) + pad;
  let w = maxX - minX;
  let h = maxY - minY;
  if (w / h > ASPECT) {
    const nh = w / ASPECT;
    minY -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * ASPECT;
    minX -= (nw - w) / 2;
    w = nw;
  }
  return [minX, minY, w, h].map((v) => Math.round(v * 10) / 10);
}
const VIEWS = {
  all: [0, 0, W, H],
  stacks: viewOf([-300, 40, 0, -8, 150, 60]),
  external: viewOf([-100, 40, 0, -8, 150, 50], 30),
  okf: viewOf([20, -30, 0, 290, 150, Z2 + 90]),
  catalog: viewOf([-90, -72, Z2, 82, 30, Z2 + 122]),
  graph: viewOf([-66, -72, Z2 + 68, 60, -60, Z2 + 122], 10),
  desk: viewOf([40, -165, CT - 10, 300, -30, Z3 + 70]),
};

const POSES = {
  intro: ["all", []],
  stacks: ["stacks", ["memos", "typewriter", "gate", "stamp", "mcp", "agent"]],
  okf: ["okf", ["stacks", "external", "mcp", "agent"]],
  catalog: ["catalog", ["stacks", "external", "memos", "typewriter", "gate", "stamp"]],
  graph: ["graph", ["catalog", "mcp", "agent"]],
  desk: ["desk", ["stacks", "external", "memos", "typewriter", "gate", "stamp", "board"]],
  ask: ["all", []],
};

// ---------- 글 ----------
const SECTIONS = [
  { id: "intro", html: `<h1><span class="t1">Agent Data Cloud</span><span class="t2">&amp; Enterprise Agent Ontology</span></h1><p class="lead">아래로 스크롤하며 기업의 데이터가 맥락을 가지게 되는 여정을 확인해 보세요.</p><a class="scroll-hint" href="#stacks" aria-label="아래로 스크롤"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8l7 7 7-7"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8l7 7 7-7"/></svg></a>` },
  { id: "stacks", html: `<p class="no">01 · 정형 데이터</p><h2>데이터베이스</h2><p>왼쪽 받침의 다섯 개는 Google Cloud의 First-Party DB이고, 점선 받침의 두 개는 Databricks, Snowflake 같은 3rd-Party 데이터베이스입니다.</p><p>Knowledge Catalog로 올라가는 건 데이터 원본이 아닌 메타데이터뿐이고, 조회와 계산도 원본 DB에서만 이루어집니다.</p>` },
  { id: "okf", html: `<p class="no">02 · 비정형 데이터</p><h2>끄적인 메모가 데이터가 되기까지</h2><p>절차서, 규정집, FAQ, 그리고 담당자 머릿속의 노하우는 형식과 모양이 제각각입니다. 데이터베이스에 바로 삽입할 수 없기 때문에, 일정한 형식으로 성형합니다.</p><p>Gemini가 OKF 문서 초안을 만들어주면, 게이트가 근거 문서와 관계 대상을 점검합니다. 이후 담당자가 승인하게 되면, status가 stable이 됩니다.</p>` },
  { id: "catalog", html: `<p class="no">03 · Knowledge Catalog</p><h2>데이터 카탈로그</h2><p>왼쪽 서랍은 컬럼과 스키마가 들어 있는 기술 메타입니다.</p><p>오른쪽 서랍은 정의와 규칙 등이 들어 있는 비즈니스 메타입니다. OKF 문서는 여기에 저장됩니다.</p>` },
  { id: "graph", html: `<p class="no">04 · Graph</p><h2>데이터 사이의 연결고리</h2><p>BigQuery Graph와 Spanner Graph는 이미 있는 테이블 위에 관계만 정의합니다. 고객, 주문, 반품, 배송, 이탈 카드를 실로 엮어 두는 셈입니다. 데이터를 복사하지 않고 처리합니다.</p>` },
  { id: "desk", html: `<p class="no">05 · MCP</p><h2>요청과 응답</h2><p>AI 에이전트는 MCP 서버로 요청을 보냅니다. MCP 서버는 그 요청을 도구 호출로 바꿔 카탈로그에 묻고, 받은 답을 다시 에이전트에게 돌려줍니다. 빨간 점선 하나를 따라 요청은 카탈로그 쪽으로 내려가고, 응답은 에이전트 쪽으로 올라옵니다.</p><p>도구는 세 개를 차례로 씁니다. search_entries로 찾고, lookup_entry로 하나를 자세히 보고, lookup_context로 최대 10개 엔트리를 YAML이나 JSON 한 묶음으로 받아 갑니다.</p>` },
  { id: "ask", html: `<p class="no">한 번에</p><h2>질문 하나가 지나가는 길</h2><p>“지난 분기 우수 고객 이탈률이 왜 올랐지?”라고 물으면 에이전트는 네 가지를 알아야 합니다. 데이터가 어디 있는지, ‘우수 고객’이 무엇인지, 무엇을 이탈로 보는지, 왜 올랐는지.</p><button type="button" class="send" data-send>질문 보내기</button><ol class="steps" data-steps><li>어디에 있지? 카탈로그의 기술 메타가 BigQuery 테이블 위치를 알려 줍니다.</li><li>‘우수 고객’이 뭐지? 매출 상위이면서 반품률 20% 미만인 고객입니다.</li><li>무엇을 이탈로 보지? 문서에서 만든 OKF 파일에 기준이 있습니다.</li><li>왜 올랐지? 그래프 판에서 고객부터 이탈까지 이어진 길을 따라갑니다.</li><li>lookup_context가 이 넷을 한 묶음으로 에이전트에 건넵니다.</li></ol>` },
];

const NOTES = {
  stacks: ["Google Cloud 데이터베이스 · 1st party", "BigQuery, Spanner, AlloyDB, Cloud SQL, Cloud Storage입니다. Google Cloud 안에 있는 회사의 정형 데이터입니다.", "지식 카탈로그는 여기서 메타데이터만 가져옵니다. 테이블 이름, 컬럼, 스키마 같은 것들입니다. 데이터 자체는 원본에 그대로 있고, 조회와 계산도 원본에서 합니다."],
  external: ["외부 데이터베이스 · 3rd party", "Databricks, Snowflake, MySQL, PostgreSQL처럼 Google Cloud 바깥에 있는 데이터베이스입니다.", "바깥에 있어도 지식 카탈로그에 함께 등록할 수 있습니다. 여기서도 카탈로그로 가는 건 메타데이터뿐이고, 데이터는 원래 자리에 있습니다."],
  memos: ["메모 뭉치", "절차서, 규정집, FAQ, 그리고 담당자 머릿속에만 있는 노하우입니다.", "모양이 제각각이라 바로 카탈로그에 넣을 수 없습니다. 정리 라인을 거쳐 OKF 파일이 됩니다."],
  typewriter: ["Gemini 초안", "Gemini가 문서를 읽고 OKF 파일 초안을 씁니다.", "BigQuery나 Spanner의 메타데이터를 보고 에이전트가 초안을 쓰거나 보강하는 입구도 있습니다."],
  gate: ["게이트 검사", "초안이 근거로 삼은 문서가 실제로 있는지, 관계를 맺은 대상이 실제로 있는지 자동으로 점검합니다."],
  stamp: ["사람 승인", "점검을 통과한 초안을 사람이 확인하고 승인하면 status가 stable이 됩니다.", "OKF는 Markdown 위에 YAML 이름표를 붙인 파일입니다. 꼭 있어야 하는 필드는 type 하나입니다. 무엇인지(type, resource, tags), 어떻게 연결되는지(Schema, Joins), 믿어도 되는지(status, verified, stale_after)를 적습니다.", "작게는 로컬 Git에서 시작하고, 크게는 지식 카탈로그로 가져가면 됩니다."],
  catalog: ["지식 카탈로그", "흩어진 메타데이터를 한곳에 모으는 곳입니다.", "기술 메타는 컬럼과 스키마처럼 원본에서 온 정보라 여기서는 읽기만 합니다. 비즈니스 메타는 정의와 규칙이고, OKF 파일이 파일째 들어와 여기에 놓입니다.", "데이터 프로파일링, 품질 규칙, 테이블 관계 추론은 자동으로 하고, 비즈니스 정의는 사람이 씁니다."],
  board: ["그래프", "BigQuery Graph와 Spanner Graph는 이미 있는 테이블 위에 노드와 엣지를 정의합니다. 그래프를 만들어도 데이터를 옮기거나 복사하지 않습니다.", "고객에서 주문, 반품, 배송, 이탈로 이어지는 길을 GQL로 따라갈 수 있습니다. BigQuery Graph는 대규모 분석에, Spanner Graph는 실시간 서비스에 씁니다."],
  mcp: ["MCP 서버", "에이전트와 지식 카탈로그 사이의 창구입니다. 에이전트의 요청을 받아 도구를 부르고, 결과를 응답으로 돌려줍니다.", "search_entries는 자연어로 엔트리를 찾습니다. lookup_entry는 엔트리 하나를 자세히 봅니다. lookup_context는 최대 10개 엔트리의 메타데이터와 관계를 YAML이나 JSON 한 묶음으로 돌려줍니다. 받을 양도 정할 수 있습니다."],
  agent: ["AI 에이전트", "직접 만든 에이전트일 수도 있고, Google이 제공하는 에이전트일 수도 있습니다.", "어느 쪽이든 회사 안의 뜻은 모릅니다. 그래서 MCP 서버에 요청을 보내 맥락을 받아 온 다음에 답합니다."],
};

const live = `
const P = ${JSON.stringify(P)};
const VIEWS = ${JSON.stringify(VIEWS)};
const POSES = ${JSON.stringify(POSES)};
const NOTES = ${JSON.stringify(NOTES)};
const SEC_OF = { stacks: "stacks", external: "stacks", memos: "okf", typewriter: "okf", gate: "okf", stamp: "okf", catalog: "catalog", board: "graph", mcp: "desk", agent: "desk" };
const svg = document.querySelector(".fig svg");
const parts = [...svg.querySelectorAll(".pt")];
const still = matchMedia("(prefers-reduced-motion: reduce)");

// ---------- 카메라 ----------
let view = VIEWS.all.slice(), viewTo = view.slice();
function setView(v) { view = v; svg.setAttribute("viewBox", v.map((n) => Math.round(n * 10) / 10).join(" ")); }
let focusView = null, focusUntil = 0;
function goTo(v) {
  viewTo = v.slice();
  if (still.matches) setView(viewTo.slice());
  run();
}
function pose(id) {
  const [v, dim] = POSES[id];
  parts.forEach((p) => p.classList.toggle("dim", dim.includes(p.dataset.part)));
  const locked = focusView && performance.now() < focusUntil;
  viewTo = (locked ? focusView : VIEWS[v]).slice();
  if (still.matches) setView(viewTo.slice());
  run();
}
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) pose(e.target.dataset.sec);
}, { rootMargin: "-45% 0px -45% 0px" });
document.querySelectorAll("[data-sec]").forEach((s) => io.observe(s));

let last = 0, frame = 0, visible = true, dragging = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const follow = 1 - Math.exp(-dt / 0.28);
  const moving = view.some((v, i) => Math.abs(viewTo[i] - v) > 0.05);
  if (moving && !dragging) setView(view.map((v, i) => v + (viewTo[i] - v) * follow));
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }).observe(svg);
setView(view);
run();

// ---------- 스크롤 안내 ----------
const hint = document.querySelector(".scroll-hint");
if (hint) {
  const sync = () => hint.classList.toggle("gone", window.scrollY > 60);
  addEventListener("scroll", sync, { passive: true });
  sync();
  hint.addEventListener("click", (e) => { e.preventDefault(); document.getElementById("stacks").scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "center" }); });
}

// ---------- 손으로 끌어서 이동 / 확대 ----------
let drag = null, dragged = false;
const unitsPerPx = () => 1 / svg.getScreenCTM().a;
svg.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, v: view.slice(), id: e.pointerId };
  dragged = false;
});
svg.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!dragged && Math.hypot(dx, dy) < 5) return;
  if (!dragged) { dragged = true; dragging = true; svg.setPointerCapture(drag.id); svg.classList.add("grabbing"); }
  const u = unitsPerPx();
  const v = [drag.v[0] - dx * u, drag.v[1] - dy * u, drag.v[2], drag.v[3]];
  setView(v); viewTo = v.slice(); focusView = null;
});
const endDrag = () => { drag = null; dragging = false; svg.classList.remove("grabbing"); };
svg.addEventListener("pointerup", endDrag);
svg.addEventListener("pointercancel", endDrag);
svg.addEventListener("click", (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
svg.addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return; // 그냥 휠은 페이지 스크롤, 핀치(ctrl+휠)는 확대
  e.preventDefault();
  const m = svg.getScreenCTM().inverse();
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  const c = pt.matrixTransform(m);
  const f = Math.min(4, Math.max(0.25, Math.exp(e.deltaY * 0.01)));
  const w = Math.min(VIEWS.all[2] * 1.4, Math.max(80, view[2] * f));
  const k2 = w / view[2];
  const v = [c.x - (c.x - view[0]) * k2, c.y - (c.y - view[1]) * k2, w, view[3] * k2];
  setView(v); viewTo = v.slice(); focusView = null;
}, { passive: false });
document.querySelector("[data-reset]").addEventListener("click", () => { focusView = null; goTo(VIEWS.all); });
document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
  const f = b.dataset.zoom === "in" ? 0.75 : 1.33;
  const base = viewTo;
  const w = Math.min(VIEWS.all[2] * 1.4, Math.max(80, base[2] * f)), h = base[3] * (w / base[2]);
  const cx = base[0] + base[2] / 2, cy = base[1] + base[3] / 2;
  focusView = null;
  goTo([cx - w / 2, cy - h / 2, w, h]);
}));

// ---------- 설명 카드 ----------
const side = document.querySelector(".side");
const sideBody = side.querySelector(".side-body");
let opener = null;
function openNote(id) {
  opener = document.activeElement;
  const [title, ...paras] = NOTES[id];
  sideBody.innerHTML = '<h3 id="note-title">' + title + "</h3>" + paras.map((p) => "<p>" + p + "</p>").join("");
  side.classList.add("open"); side.inert = false; side.setAttribute("aria-hidden", "false");
  parts.forEach((p) => p.classList.toggle("sel", p.dataset.part === id));
  side.querySelector(".side-close").focus({ preventScroll: true });
}
function closeNote() {
  side.classList.remove("open"); side.inert = true; side.setAttribute("aria-hidden", "true");
  parts.forEach((p) => p.classList.remove("sel"));
  opener?.focus({ preventScroll: true });
}
function viewAround(p) {
  const r = p.getBoundingClientRect();
  const m = svg.getScreenCTM().inverse();
  const pt = svg.createSVGPoint();
  const pts = [[r.left, r.top], [r.right, r.bottom]].map(([x, y]) => { pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return [q.x, q.y]; });
  const cx = (pts[0][0] + pts[1][0]) / 2, cy = (pts[0][1] + pts[1][1]) / 2;
  const aspect = VIEWS.all[2] / VIEWS.all[3];
  let w = Math.max((pts[1][0] - pts[0][0]) * 2.2, 200), h = Math.max((pts[1][1] - pts[0][1]) * 2.2, 200 / aspect);
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  return [cx - w / 2, cy - h / 2 + h * 0.2, w, h];
}
function choose(p) {
  const id = p.dataset.part;
  openNote(id);
  focusView = viewAround(p); focusUntil = performance.now() + 2000;
  goTo(focusView);
  const sec = document.querySelector('[data-sec="' + SEC_OF[id] + '"]');
  if (sec) sec.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", block: "center" });
}
parts.forEach((p) => {
  p.addEventListener("click", () => choose(p));
  p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(p); } });
});
side.querySelector(".side-close").addEventListener("click", closeNote);
document.addEventListener("keydown", (e) => { if (!side.inert && e.key === "Escape") closeNote(); });

// ---------- 질문 보내기 ----------
const send = document.querySelector("[data-send]");
const items = [...document.querySelectorAll("[data-steps] li")];
const LIT = [["stacks", "catalog", "flow:blue"], ["catalog"], ["stamp", "catalog", "flow:green"], ["board"], ["mcp", "agent", "flow:red"]];
function light(n) {
  svg.querySelectorAll(".lit").forEach((el) => el.classList.remove("lit"));
  items.forEach((li, i) => { li.classList.toggle("on", i <= n); li.classList.toggle("now", i === n); });
  svg.querySelector('[data-screen="q"]').style.opacity = n === 4 ? 0 : 1;
  svg.querySelector('[data-screen="a"]').style.opacity = n === 4 ? 1 : 0;
  if (n < 0) return;
  for (const key of LIT[n]) {
    const el = key.startsWith("flow:") ? svg.querySelector('[data-flow="' + key.slice(5) + '"]') : svg.querySelector('[data-part="' + key + '"]');
    el.classList.add("lit");
  }
}
let timers = [];
send.addEventListener("click", () => {
  timers.forEach(clearTimeout); timers = [];
  light(-1); send.disabled = true;
  if (still.matches) { light(4); send.disabled = false; send.textContent = "다시 보내기"; return; }
  for (let i = 0; i < 5; i++) timers.push(setTimeout(() => light(i), 300 + i * 1500));
  timers.push(setTimeout(() => { send.disabled = false; send.textContent = "다시 보내기"; }, 300 + 4 * 1500 + 400));
});
`;

const CSS = `
:root{color-scheme:dark;--ink:#e8eaed;--muted:#9aa0a6;--line:#3c4043;--bg:#141517;--card:#1c1d20;--accent:#4285f4;--blue:#4285f4;--red:#ea4335;--yellow:#fbbc05;--green:#34a853}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink)}
body{font-family:'Pretendard Variable',Pretendard,'Noto Sans KR',system-ui,sans-serif;line-height:1.75;word-break:keep-all}
.top{position:fixed;top:0;left:0;right:0;z-index:5;display:flex;justify-content:space-between;padding:22px 32px;font-size:15px;pointer-events:none}
.top a{pointer-events:auto;color:var(--ink);text-decoration:none;font-weight:500}
.top a+a{color:var(--muted);font-size:14px}
.wrap{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:64px;max-width:1440px;margin:0 auto;padding:0 32px}
.fig{position:sticky;top:0;height:100vh;display:flex;align-items:center;justify-content:center}
.figure-card{width:100%;border:1px solid var(--line);border-radius:8px;background:var(--card);overflow:hidden}
.fig svg{display:block;width:100%;height:min(80vh,760px)}
.text{padding:0 0 30vh}
.sec{min-height:100vh;display:flex;flex-direction:column;justify-content:center;max-width:460px}
.sec h1{margin:0 0 22px;line-height:1.15;letter-spacing:-.02em}
.sec h1 .t1{display:block;font-size:44px;font-weight:700}
.sec h1 .t2{display:block;margin-top:8px;font-size:22px;font-weight:400;color:var(--muted)}
.lead{color:var(--muted);font-size:15px!important;max-width:340px}
.sec h2{font-size:28px;margin:0 0 14px;letter-spacing:-.01em}
.sec p{margin:0 0 12px;font-size:16px}
.sec .no{font-family:ui-monospace,Menlo,monospace;color:var(--muted);font-size:13px;margin:0 0 6px}
.send{align-self:flex-start;font:inherit;font-size:15px;padding:9px 16px;margin:6px 0 14px;border:0;border-radius:999px;background:var(--blue);color:#fff;font-weight:600;cursor:pointer}
.send:disabled{opacity:.5;cursor:progress}
.steps{margin:0;padding-left:20px;font-size:15px;color:var(--muted)}
.steps li{margin:4px 0;transition:color .3s}
.steps li.on{color:var(--ink)}
.steps li.now{font-weight:700}
.pt{cursor:pointer;outline:none;transition:opacity .4s}
.pt.dim{opacity:.22}
.pt:hover .iso-solid{filter:brightness(.97)}
.pt:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.pt.lit .iso-top,.pt.sel .iso-top{fill:#24344f}
.pt.lit .iso-edge,.pt.sel .iso-edge{stroke:var(--accent)!important}
.h-blue .iso-top,.h-blue .iso-shade,.h-blue path{fill:#2b4a7e}
.h-green .iso-top,.h-green .iso-shade,.h-green path{fill:#235c34}
.flow{fill:none;stroke-width:1.2;stroke-dasharray:4 5;animation:dash 1s linear infinite;opacity:.6}
.flow.blue{stroke:var(--blue)!important}
.flow.green{stroke:var(--green)!important}
.flow.red{stroke:var(--red)!important}
.lane-label .iso-face-text{fill:#f28b82}
.card.red path,.card.red-res path{stroke:var(--red)!important}
.card.red-res .iso-top{fill:#5c2420}
.db-1p .db-cap .iso-top{fill:#26334a}
.pad-1p .iso-top{fill:#1e2228}
.db-3p .db-cap .iso-top{fill:#3c4043}
.pad-3p .iso-top{fill:#202124}
.flow.lit{stroke-width:1.8;opacity:.95}
@keyframes dash{to{stroke-dashoffset:-18}}
.yarn{fill:none;stroke:var(--yellow)!important;stroke-width:1.8}
.card.blue path{stroke:var(--blue)!important}
.card.green path{stroke:var(--green)!important}
.card.green .iso-top{fill:#1f4a2c}
.card.gray path{stroke:#888!important}
.lamp circle{transition:fill .2s}
.lamp.on circle{fill:var(--yellow)!important}
.led.on circle{fill:var(--red)!important}
.iso-face-text{fill:#d7dade!important}
.iso-face-text[data-tone="lo"]{fill:#b8bcc2!important}
.tier-label .iso-face-text{fill:#c4c7cc!important}
.sec h1 em{font-style:normal;color:var(--blue)}
[data-screen]{transition:opacity .4s}
.figure-card{position:relative}
.fig svg{touch-action:none;cursor:grab}
.fig svg.grabbing{cursor:grabbing}
.zoom{position:absolute;top:12px;right:12px;display:flex;gap:8px;z-index:4}
.zoom button{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:rgba(32,33,36,.9);color:var(--ink);font:inherit;font-size:18px;line-height:1;cursor:pointer;display:grid;place-items:center}
.zoom button:hover{border-color:var(--muted)}
.side{position:absolute;left:14px;right:14px;bottom:14px;max-height:46%;overflow:auto;background:rgba(32,33,36,.94);backdrop-filter:blur(8px);border:1px solid var(--line);border-radius:10px;padding:16px 44px 14px 18px;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .25s,transform .25s;z-index:3}
.side.open{opacity:1;transform:none;pointer-events:auto}
.side h3{font-size:17px;margin:0 0 8px}
.side p{margin:0 0 8px;font-size:14.5px;line-height:1.7;color:#d5d7da}
.side-close{position:absolute;top:10px;right:12px;font:inherit;font-size:20px;line-height:1;background:none;border:0;cursor:pointer;color:var(--muted)}
@media (max-width:820px){
  .wrap{display:block;padding:0 16px}
  .top{display:none}
  .fig{height:52vh;background:var(--bg);z-index:2;align-items:flex-start}
  .figure-card{border-radius:0 0 8px 8px}
  .fig svg{height:52vh}
  .sec{min-height:80vh;padding:35px 8px}
  .sec h1 .t1{font-size:36px}
  .sec h1 .t2{font-size:19px}
  .sec h2{font-size:24px}
  .text{padding-bottom:50vh}
  .side{left:8px;right:8px;bottom:8px;max-height:55%;padding:12px 38px 10px 14px}
  .side p{font-size:13.5px}
}
.scroll-hint{display:flex;flex-direction:column;align-items:center;width:44px;margin-top:40px;color:var(--ink);transition:opacity .4s}
.scroll-hint svg{width:28px;height:28px;margin-top:-14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;animation:chev 1.6s ease-in-out infinite;opacity:0}
.scroll-hint svg:first-child{margin-top:0}
.scroll-hint svg:nth-child(2){animation-delay:.25s}
.scroll-hint.gone{opacity:0;pointer-events:none}
@keyframes chev{0%{opacity:0;transform:translateY(-6px)}45%{opacity:1}100%{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}.scroll-hint svg{opacity:.7}}
`;

const kitSource = readFileSync(join(HERE, "kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>에이전트에게 맥락을 건네는 세 단</title><meta name="description" content="Knowledge Catalog, OKF, Graph가 맞물려 AI 에이전트에게 회사의 맥락을 건네는 과정을 한 장의 그림으로 살펴봅니다."><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><style>${k.ISO_CSS}${CSS}</style></head>
<body class="iso" data-theme="dark">
<header class="top"><a href="#intro">Google Cloud · Agentic Data Cloud</a></header>
<main class="wrap">
  <div class="fig"><div class="figure-card"><div class="zoom" role="group" aria-label="확대 축소"><button type="button" data-zoom="in" aria-label="확대">+</button><button type="button" data-zoom="out" aria-label="축소">−</button><button type="button" data-reset aria-label="전체 보기">↺</button></div>${svg.replace('role="img"', 'role="group"')}<aside class="side" aria-labelledby="note-title" aria-hidden="true" inert><button type="button" class="side-close" aria-label="닫기">×</button><div class="side-body"></div></aside></div></div>
  <div class="text">${SECTIONS.map((s) => `<section class="sec" id="${s.id}" data-sec="${s.id}">${s.html}</section>`).join("")}</div>
</main>
<script type="module">${(kitSource + live).replace(/<\/(script)/gi, "<\\/$1")}</script>
</body></html>`;
writeFileSync(OUT, html);
console.log("wrote", OUT);
