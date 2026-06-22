/**
 * Single source of truth for the "Python struct profiling" post.
 *
 * Every measured number lives exactly once, in `CONSTRUCTS` below; the chart
 * specs and the raw-data tables (see <StructData />) are *derived* from it, so
 * the figures and the methodology table cannot drift apart. To update a number,
 * change it here and rebuild — nothing else hardcodes it.
 *
 * Provenance (all on CPython 3.14.0, mypy/mypyc 2.1.0, attrs 26.1.0,
 * msgspec 0.21.1, x86_64 Linux/WSL2), reproducible from the committed harness
 * in the python-struct-profiling repo:
 *   - import / type-creation (us/type): `importtime_sweep.py --k 200 --runs 5`
 *     — module of 200 real class-statement/decorator forms, self-time under
 *     `python -X importtime` / 200, median of 5 fresh interpreters.
 *   - dependency import (ms): same harness, `import LIB` in a fresh interpreter.
 *   - memory (bytes) & instantiation (ns): `bench.py`, interpreted vs the
 *     `mypyc`-compiled `containers.so`; instantiation is the min of 7 timeit
 *     repeats of 1e6 iterations.
 *   - bytecode (instruction counts): `dis` on the generated `__new__`/`__init__`.
 *
 * Conventions:
 *   - `mypyc: null` means the construct is NOT on the compiled axis. mypyc
 *     compiles the stdlib `containers` module (native / NamedTuple / dataclass);
 *     attrs and msgspec are defined outside it, so there is no compiled form to
 *     measure — null, not a copy of the interpreted value.
 *   - instantiation is measured by an *interpreted* timeit loop. mypyc's call /
 *     attribute speedups land on the compiled->compiled path, so a compiled
 *     class called from the interpreted loop shows no speedup (and can read
 *     slightly slower); the compiled instantiation numbers reflect that reality.
 */

// --- the data ------------------------------------------------------------

type CellMypyc = number | null; // null = off the compiled axis
type Bytecode = number | "C"; // "C" = no Python bytecode (C-level)

type Variant = {
	importUs: { warm: number; cold: number; mypyc: CellMypyc };
	memBytes: { interp: number; mypyc: CellMypyc };
	instNs: { interp: number; mypyc: CellMypyc };
	initBytecode: Bytecode;
};

type Construct = {
	key: string;
	label: string; // import/memory charts (native framing), multi-line
	immLabel: string; // immutability charts (mutable+frozen framing)
	depLabel: string; // dependency-import chart / table
	tableLabel: string; // single-line, for the raw-data tables
	depMs: { warm: number; cold: number }; // one-time library import
	newBytecode: Bytecode; // __new__ (NamedTuple's is the interesting one)
	mutable: Variant | null; // null for NamedTuple (a tuple — immutable only)
	frozen: Variant;
};

export const CONSTRUCTS: Construct[] = [
	{
		key: "native",
		label: "native<br>slots",
		immLabel: "native<br>slots",
		depLabel: "native<br>(none)",
		tableLabel: "native slots",
		depMs: { warm: 0, cold: 0 },
		newBytecode: "C",
		mutable: {
			importUs: { warm: 7.3, cold: 59.3, mypyc: 6.9 },
			memBytes: { interp: 64, mypyc: 72 },
			instNs: { interp: 87.3, mypyc: 75.2 },
			initBytecode: 9,
		},
		frozen: {
			importUs: { warm: 7.4, cold: 62.2, mypyc: 6.9 },
			memBytes: { interp: 64, mypyc: 72 },
			instNs: { interp: 87.5, mypyc: 75.7 },
			initBytecode: 9,
		},
	},
	{
		// Brett Cannon's complete, genuinely-immutable hand-written record:
		// __setattr__ guard (enforced at runtime, even compiled), __eq__,
		// __hash__, __repr__, __match_args__. The fair pure-Python comparison.
		key: "manualrecord",
		label: "manual<br>record",
		immLabel: "manual<br>record",
		depLabel: "manual<br>(none)",
		tableLabel: "manual record",
		depMs: { warm: 0, cold: 0 },
		newBytecode: "C",
		mutable: null,
		frozen: {
			importUs: { warm: 11.5, cold: 214.5, mypyc: 11.1 },
			memBytes: { interp: 64, mypyc: 96 },
			instNs: { interp: 222.5, mypyc: 78.4 },
			initBytecode: 24,
		},
	},
	{
		// record-type (PyPI): @record codegen's __init__ per class; __eq__/
		// __hash__/__repr__ are inherited from a Record base (no per-class
		// codegen). mypyc can't compile it (decorator returns a class).
		key: "recordtype",
		label: "record-type",
		immLabel: "record-type",
		depLabel: "record-type",
		tableLabel: "record-type",
		depMs: { warm: 12.5, cold: 91.3 },
		newBytecode: "C",
		mutable: null,
		frozen: {
			importUs: { warm: 96.4, cold: 122.4, mypyc: null },
			memBytes: { interp: 64, mypyc: null },
			instNs: { interp: 227.0, mypyc: null },
			initBytecode: 24,
		},
	},
	{
		// record-type (C): the inheritable C-backed `Record` base from JPHutchins'
		// native-record branch — a ~600-line metaclass + base that reads class-body
		// annotations in C (no inspect, no exec). Already native, so it never goes
		// through mypyc (importUs.mypyc / memBytes.mypyc / instNs.mypyc are null,
		// like attrs/msgspec): there is nothing to compile — it IS the compiled
		// thing. Construction is a pure C vectorcall (initBytecode "C"). The dep is
		// the .so itself, which has no source to recompile, so cold == warm.
		key: "recordc",
		label: "record-type<br>(C)",
		immLabel: "record-type<br>(C)",
		depLabel: "record-type<br>(C)",
		tableLabel: "record-type (C)",
		depMs: { warm: 0.2, cold: 0.2 },
		newBytecode: "C",
		mutable: null,
		frozen: {
			importUs: { warm: 8.6, cold: 36.0, mypyc: null },
			memBytes: { interp: 64, mypyc: null },
			instNs: { interp: 61.2, mypyc: null },
			initBytecode: "C",
		},
	},
	{
		key: "namedtuple",
		label: "NamedTuple",
		immLabel: "NamedTuple",
		depLabel: "typing",
		tableLabel: "NamedTuple",
		depMs: { warm: 4.0, cold: 33.9 },
		newBytecode: 7,
		mutable: null,
		frozen: {
			importUs: { warm: 76.2, cold: 104.3, mypyc: 63.3 },
			memBytes: { interp: 88, mypyc: 88 },
			instNs: { interp: 138.3, mypyc: 141.5 },
			initBytecode: "C",
		},
	},
	{
		key: "dataclass",
		label: "frozen<br>dataclass",
		immLabel: "dataclass",
		depLabel: "dataclasses",
		tableLabel: "dataclass",
		depMs: { warm: 11.5, cold: 81.9 },
		newBytecode: "C",
		mutable: {
			importUs: { warm: 228.4, cold: 261.0, mypyc: 190.3 },
			memBytes: { interp: 64, mypyc: 72 },
			instNs: { interp: 87.5, mypyc: 109.5 },
			initBytecode: 9,
		},
		frozen: {
			importUs: { warm: 373.4, cold: 401.2, mypyc: 328.5 },
			memBytes: { interp: 64, mypyc: 72 },
			instNs: { interp: 224.3, mypyc: 226.0 },
			initBytecode: 25,
		},
	},
	{
		key: "attrs",
		label: "attrs",
		immLabel: "attrs",
		depLabel: "attrs",
		tableLabel: "attrs",
		depMs: { warm: 22.2, cold: 128.5 },
		newBytecode: "C",
		mutable: {
			importUs: { warm: 264.6, cold: 288.7, mypyc: null },
			memBytes: { interp: 80, mypyc: null },
			instNs: { interp: 88.5, mypyc: null },
			initBytecode: 9,
		},
		frozen: {
			importUs: { warm: 301.4, cold: 332.2, mypyc: null },
			memBytes: { interp: 80, mypyc: null },
			instNs: { interp: 209.1, mypyc: null },
			initBytecode: 25,
		},
	},
	{
		key: "msgspec",
		label: "msgspec",
		immLabel: "msgspec",
		depLabel: "msgspec",
		tableLabel: "msgspec",
		depMs: { warm: 19.1, cold: 131.7 },
		newBytecode: "C",
		mutable: {
			importUs: { warm: 10.5, cold: 40.1, mypyc: null },
			memBytes: { interp: 64, mypyc: null },
			instNs: { interp: 63.0, mypyc: null },
			initBytecode: "C",
		},
		frozen: {
			importUs: { warm: 10.2, cold: 44.0, mypyc: null },
			memBytes: { interp: 64, mypyc: null },
			instNs: { interp: 62.5, mypyc: null },
			initBytecode: "C",
		},
	},
];

const byKey: Record<string, Construct> = Object.fromEntries(CONSTRUCTS.map((c) => [c.key, c]));
// Canonical implementation order — matches the SUTs table in the post. One list,
// used everywhere, so chart/table ordering can't drift.
const ORDER = [
	"native",
	"manualrecord",
	"namedtuple",
	"dataclass",
	"recordtype",
	"recordc",
	"attrs",
	"msgspec",
];
const order = (keys: string[]): Construct[] => keys.map((k) => byKey[k]);

// Constructs in canonical order, for the raw-data tables (<StructData />).
export const orderedConstructs = order(ORDER);

// Per-construct bar rows for the Type / Instance / Memory charts: one bar per SUT
// in table order, using each construct's representative (frozen) variant — except
// dataclass, the one construct the table splits into mutable + frozen, which
// contributes two bars. Names come from the canonical labels above.
type Row = { name: string; v: Variant };
const ROWS: Row[] = [
	{ name: byKey.native.label, v: byKey.native.frozen },
	{ name: byKey.manualrecord.label, v: byKey.manualrecord.frozen },
	{ name: byKey.namedtuple.label, v: byKey.namedtuple.frozen },
	{ name: "dataclass", v: byKey.dataclass.mutable as Variant },
	{ name: byKey.dataclass.label, v: byKey.dataclass.frozen },
	{ name: byKey.recordtype.label, v: byKey.recordtype.frozen },
	{ name: byKey.recordc.label, v: byKey.recordc.frozen },
	{ name: byKey.attrs.label, v: byKey.attrs.frozen },
	{ name: byKey.msgspec.label, v: byKey.msgspec.frozen },
];

// --- relative-comparison tables (<RatioTable />) -------------------------
// The same ROWS (9 SUTs, table order, dataclass split) re-expressed as absolute
// numbers per metric; <RatioTable> normalizes each column against the `unit`
// row. Add a metric by giving it columns + a picker — nothing here is hardcoded.
const stripBr = (s: string) => s.replace(/<br\s*\/?>/g, " ");
const ratioTable = (
	unit: string,
	columns: { key: string; label: string }[],
	pick: (v: Variant) => Record<string, number | null>,
) => ({
	unit,
	sortKey: columns[0].key,
	rowHeader: "implementation",
	columns,
	rows: ROWS.map((r) => ({ label: stripBr(r.name), cells: pick(r.v) })),
});

export const typeCostTable = ratioTable(
	"NamedTuple",
	[
		{ key: "warm", label: "warm" },
		{ key: "cold", label: "cold" },
		{ key: "mypyc", label: "mypyc" },
	],
	(v) => ({ warm: v.importUs.warm, cold: v.importUs.cold, mypyc: v.importUs.mypyc }),
);

export const instCostTable = ratioTable(
	"NamedTuple",
	[
		{ key: "interp", label: "interpreted" },
		{ key: "mypyc", label: "mypyc" },
	],
	(v) => ({ interp: v.instNs.interp, mypyc: v.instNs.mypyc }),
);

// NamedTuple↔msgspec crossover, derived so the annotation can't drift from the
// data: N where dep_a + N*per_a == dep_b + N*per_b (dep in ms, per-type in us).
const crossoverTypes = (a: Construct, b: Construct, cache: "warm" | "cold"): number =>
	((b.depMs[cache] - a.depMs[cache]) * 1000) /
	(a.frozen.importUs[cache] - b.frozen.importUs[cache]);
const CROSS_WARM = Math.round(crossoverTypes(byKey.namedtuple, byKey.msgspec, "warm"));
const CROSS_COLD = Math.round(crossoverTypes(byKey.namedtuple, byKey.msgspec, "cold"));

// --- plotting machinery (unchanged) --------------------------------------

type Series = { name: string; color: string; values: (number | null)[] };
type Spec = { data: unknown[]; layout: Record<string, unknown> };

const PALETTE = {
	interpreted: "#4C72B0",
	compiled: "#741d49",
	mutable: "#55A868",
	frozen: "#522224",
	warm: "#cf6588",
	cold: "#73c9cf",
	single: "#4C72B0",
	namedtuple: "#4C72B0",
	dataclass: "#C44E52",
	attrs: "#8172B3",
	msgspec: "#55A868",
	native: "#937860",
	manualrecord: "#64B5CD",
	recordtype: "#8C8C8C",
	recordc: "#CCB974",
};

const groupedBar = (
	categories: string[],
	series: Series[],
	yTitle: string,
	opts: { showlegend?: boolean; fmt?: string } = {},
): Spec => ({
	// fmt is a d3 number format: ".3r" = 3 significant figures (timing data),
	// ".0f" = integer (bytes / counts).
	data: series.map((s) => ({
		type: "bar",
		name: s.name,
		x: categories,
		y: s.values,
		marker: { color: s.color },
		texttemplate: `%{y:${opts.fmt ?? ".3r"}}`,
		textposition: "outside",
		textfont: { size: 10 },
		cliponaxis: false,
		hovertemplate: `%{x}<br>${s.name}: %{y:${opts.fmt ?? ".3r"}}<extra></extra>`,
	})),
	layout: {
		barmode: "group",
		showlegend: opts.showlegend ?? series.length > 1,
		legend: { orientation: "h", y: 1.07, yanchor: "bottom", x: 0, xanchor: "left" },
		xaxis: { automargin: true },
		yaxis: { title: { text: yTitle }, rangemode: "tozero" },
		margin: { t: 44, r: 20, b: 78, l: 66 },
	},
});

// --- Figure 1: import / type-construction --------------------------------

export const marginalPerType = groupedBar(
	ROWS.map((r) => r.name),
	[
		{
			name: "µs/type",
			color: PALETTE.warm,
			values: ROWS.map((r) => r.v.importUs.warm),
		},
	],
	"microseconds per type (warm)",
	{ showlegend: false },
);

export const mypycPerType = groupedBar(
	ROWS.map((r) => r.name),
	[
		{
			name: "interpreted (warm)",
			color: PALETTE.warm,
			values: ROWS.map((r) => r.v.importUs.warm),
		},
		{
			name: "mypyc-compiled",
			color: PALETTE.compiled,
			values: ROWS.map((r) => r.v.importUs.mypyc),
		},
	],
	"microseconds per type (import, warm)",
);

export const coldWarmPerType = groupedBar(
	ROWS.map((r) => r.name),
	[
		{
			name: "cold (recompile bytecode)",
			color: PALETTE.cold,
			values: ROWS.map((r) => r.v.importUs.cold),
		},
		{
			name: "warm (cached bytecode)",
			color: PALETTE.warm,
			values: ROWS.map((r) => r.v.importUs.warm),
		},
		{
			name: "mypyc-compiled",
			color: PALETTE.compiled,
			values: ROWS.map((r) => r.v.importUs.mypyc),
		},
	],
	"microseconds per type",
);

export const depImport = groupedBar(
	order(ORDER).map((c) => c.depLabel),
	[
		{
			name: "cold (no cached bytecode)",
			color: PALETTE.cold,
			values: order(ORDER).map((c) => c.depMs.cold),
		},
		{
			name: "warm (cached bytecode)",
			color: PALETTE.warm,
			values: order(ORDER).map((c) => c.depMs.warm),
		},
	],
	"milliseconds (cumulative, fresh interpreter)",
);

// --- per-instance construction time (ns) ---------------------------------
// Parallel to memFootprint but for instantiation: table order, interpreted vs
// mypyc, dataclass split into mutable + frozen like the other per-construct
// charts. (Cold/warm is a bytecode-cache effect on import, not on a runtime
// per-instance op, so it does not apply here.)
export const instCost = groupedBar(
	ROWS.map((r) => r.name),
	[
		{
			name: "interpreted",
			color: PALETTE.warm,
			values: ROWS.map((r) => r.v.instNs.interp),
		},
		{
			name: "mypyc-compiled",
			color: PALETTE.compiled,
			values: ROWS.map((r) => r.v.instNs.mypyc),
		},
	],
	"nanoseconds per instantiation",
);

// --- Figure 2: per-instance memory (bytes → integers) --------------------
export const memFootprint = groupedBar(
	ROWS.map((r) => r.name),
	[
		{
			name: "interpreted",
			color: PALETTE.interpreted,
			values: ROWS.map((r) => r.v.memBytes.interp),
		},
		{
			name: "mypyc-compiled",
			color: PALETTE.compiled,
			values: ROWS.map((r) => r.v.memBytes.mypyc),
		},
	],
	"bytes per instance",
	{ fmt: ".0f" },
);

// --- Figure 3: cost of immutability --------------------------------------
const mut = <T>(c: Construct, pick: (v: Variant) => T): T | null =>
	c.mutable ? pick(c.mutable) : null;

export const immMemory = groupedBar(
	order(ORDER).map((c) => c.immLabel),
	[
		{
			name: "mutable (interpreted)",
			color: PALETTE.warm,
			values: order(ORDER).map((c) => mut(c, (v) => v.memBytes.interp)),
		},
		{
			name: "frozen (interpreted)",
			color: PALETTE.frozen,
			values: order(ORDER).map((c) => c.frozen.memBytes.interp),
		},
		{
			name: "frozen (mypyc)",
			color: PALETTE.compiled,
			values: order(ORDER).map((c) => c.frozen.memBytes.mypyc),
		},
	],
	"bytes per instance",
	{ fmt: ".0f" },
);

export const immInstantiation = groupedBar(
	order(ORDER).map((c) => c.immLabel),
	[
		{
			name: "mutable (interpreted)",
			color: PALETTE.warm,
			values: order(ORDER).map((c) => mut(c, (v) => v.instNs.interp)),
		},
		{
			name: "frozen (interpreted)",
			color: PALETTE.frozen,
			values: order(ORDER).map((c) => c.frozen.instNs.interp),
		},
		{
			name: "frozen (mypyc)",
			color: PALETTE.compiled,
			values: order(ORDER).map((c) => c.frozen.instNs.mypyc),
		},
	],
	"nanoseconds per instantiation",
);

export const immImport = groupedBar(
	order(ORDER).map((c) => c.immLabel),
	[
		{
			name: "mutable (interpreted)",
			color: PALETTE.warm,
			values: order(ORDER).map((c) => mut(c, (v) => v.importUs.warm)),
		},
		{
			name: "frozen (interpreted)",
			color: PALETTE.frozen,
			values: order(ORDER).map((c) => c.frozen.importUs.warm),
		},
		{
			name: "frozen (mypyc)",
			color: PALETTE.compiled,
			values: order(ORDER).map((c) => c.frozen.importUs.mypyc),
		},
	],
	"microseconds per type (import, warm)",
);

// --- Figure 4: startup crossover (fat curve) -----------------------------
const hexToRgba = (hex: string, a: number) => {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// Each construct contributes a cold↔warm band: startup = dependency import
// (fixed, ms) + N × per-type construction (marginal, µs). native also gets a
// solid mypyc line (its interpreted band and mypyc line nearly coincide — the
// point being that mypyc barely changes startup), and it is the only construct
// mypyc transforms, so it is the only one drawn twice.
type CrossSeries = { color: string; cold: [number, number]; warm: [number, number] };
const band = (c: Construct): CrossSeries => ({
	color: (PALETTE as Record<string, string>)[c.key],
	cold: [c.depMs.cold, c.frozen.importUs.cold],
	warm: [c.depMs.warm, c.frozen.importUs.warm],
});
const nativeMypyc = (c: Construct): CrossSeries => ({
	color: PALETTE.compiled,
	cold: [c.depMs.warm, c.frozen.importUs.mypyc as number],
	warm: [c.depMs.warm, c.frozen.importUs.mypyc as number],
});

const CROSS: Record<string, CrossSeries> = {
	"native slots": band(byKey.native),
	"native slots (mypyc)": nativeMypyc(byKey.native),
	"manual record": band(byKey.manualrecord),
	NamedTuple: band(byKey.namedtuple),
	"frozen dataclass": band(byKey.dataclass),
	"record-type": band(byKey.recordtype),
	"record-type (C)": band(byKey.recordc),
	attrs: band(byKey.attrs),
	msgspec: band(byKey.msgspec),
};

const N_POINTS = Array.from({ length: 90 }, (_, i) => 2 ** ((i / 89) * 12.4));
const totalMs = ([fixed, marg]: readonly number[], n: number) => fixed + (n * marg) / 1000;

const startupTraces = () =>
	Object.entries(CROSS).flatMap(([name, m]) => {
		const lower = N_POINTS.map((n) => totalMs(m.warm, n));
		// compiled constructs have no cold/warm spread → draw a single solid line
		if (m.cold[0] === m.warm[0] && m.cold[1] === m.warm[1]) {
			return [
				{
					x: N_POINTS,
					y: lower,
					name,
					mode: "lines",
					line: { color: m.color, width: 1.8 },
					legendgroup: name,
					hovertemplate: `${name}<br>%{x:.0f} types · %{y:.3r} ms<extra></extra>`,
				},
			];
		}
		const upper = N_POINTS.map((n) => totalMs(m.cold, n));
		return [
			{
				x: N_POINTS,
				y: lower,
				mode: "lines",
				line: { color: m.color, width: 1.6 },
				showlegend: false,
				hoverinfo: "skip",
				legendgroup: name,
			},
			{
				x: N_POINTS,
				y: upper,
				name,
				mode: "lines",
				line: { color: m.color, width: 1.6, dash: "dot" },
				fill: "tonexty",
				fillcolor: hexToRgba(m.color, 0.07),
				legendgroup: name,
				hovertemplate: `${name}<br>%{x:.0f} types · cold %{y:.3r} ms<extra></extra>`,
			},
		];
	});

const X_TICKS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const Y_TICKS = [0.01, 0.1, 1, 10, 100, 1000];

export const startup: Spec = {
	data: startupTraces(),
	layout: {
		legend: {
			orientation: "h",
			x: 0,
			xanchor: "left",
			y: -0.22,
			yanchor: "top",
			bgcolor: "rgba(0,0,0,0)",
		},
		margin: { t: 64, r: 24, b: 170, l: 66 },
		// Let the reader flip both scales together: log (full range, the
		// informative default) or linear (Y clipped to 0–1000 ms to make the gross
		// divergence obvious; X linear 0–4096 over the same data).
		updatemenus: [
			{
				type: "buttons",
				direction: "right",
				showactive: true,
				x: 0,
				xanchor: "left",
				y: 1.18,
				yanchor: "top",
				pad: { r: 6, t: 2, b: 2, l: 6 },
				bgcolor: "rgba(128,128,128,0.12)",
				bordercolor: "rgba(128,128,128,0.4)",
				font: { size: 11 },
				buttons: [
					{
						label: "log",
						method: "relayout",
						args: [
							{
								"yaxis.type": "log",
								"yaxis.range": [Math.log10(0.004), Math.log10(2600)],
								"yaxis.tickvals": Y_TICKS,
								"yaxis.ticktext": Y_TICKS.map((v) => String(v)),
								"xaxis.type": "log",
								"xaxis.range": [0, 3.74],
								"xaxis.tickvals": X_TICKS,
								"xaxis.ticktext": X_TICKS.map((v) => v.toLocaleString()),
							},
						],
					},
					{
						label: "linear (0–1000 ms)",
						method: "relayout",
						args: [
							{
								"yaxis.type": "linear",
								"yaxis.range": [0, 1000],
								"yaxis.tickvals": [0, 200, 400, 600, 800, 1000],
								"yaxis.ticktext": ["0", "200", "400", "600", "800", "1000"],
								"xaxis.type": "linear",
								"xaxis.range": [0, 4096],
								"xaxis.tickvals": [0, 1024, 2048, 3072, 4096],
								"xaxis.ticktext": [0, 1024, 2048, 3072, 4096].map((v) =>
									v.toLocaleString(),
								),
							},
						],
					},
				],
			},
		],
		xaxis: {
			type: "log",
			title: { text: "number of types defined" },
			tickvals: X_TICKS,
			ticktext: X_TICKS.map((v) => v.toLocaleString()),
			range: [0, 3.74],
		},
		yaxis: {
			type: "log",
			title: { text: "total startup, milliseconds" },
			tickvals: Y_TICKS,
			ticktext: Y_TICKS.map((v) => String(v)),
			range: [Math.log10(0.004), Math.log10(2600)],
		},
	},
};

export const crossover = { warm: CROSS_WARM, cold: CROSS_COLD };

export const charts = {
	marginalPerType,
	mypycPerType,
	coldWarmPerType,
	depImport,
	instCost,
	memFootprint,
	immMemory,
	immInstantiation,
	immImport,
	startup,
};
