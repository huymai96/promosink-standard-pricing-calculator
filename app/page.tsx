'use client';

import { useEffect, useState } from 'react';

type Loc = {
  numColors: number;
  cmykSetup?: boolean;
  specialLocation?: boolean;
  bulkSpecial?: boolean;
  syntheticFabric?: boolean;
  specialtyInks?: boolean;
  reflectiveGlowWater?: boolean;
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3 font-semibold">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function rushLabel(pct: number | undefined | null) {
  if (!pct) return null;
  if (pct >= 0.999) return '1-day rush';
  if (pct >= 0.74 && pct <= 0.76) return '2-day rush';
  if (pct >= 0.49 && pct <= 0.51) return '3-day rush';
  if (pct >= 0.24 && pct <= 0.26) return '4-day rush';
  return null;
}

function buildLightSummary(result: any) {
  if (!result) return 'Run a calculation to see summary.';
  const lines: string[] = [];
  lines.push(`${result.numPieces} light shirts`);

  const locs = result.locationBreakdownLight as any[];
  locs.forEach((loc, i) => {
    lines.push(`${loc.numColors} colors Location ${i + 1}: ${currency.format(loc.basePriceLight)} ea`);
  });

  const totalScreens = locs.reduce((sum, loc) => sum + (loc.numColors ?? 0), 0);
  lines.push(`${totalScreens} screens at ${currency.format(15)} ea`);
  lines.push('');
  lines.push(`Total (no rush): ${currency.format(result.totalLightBeforeRush)}`);

  if (result.rushServiceFeeLight) {
    const label = rushLabel(result.rushPctLight);
    if (label) lines.push(`Total (${label}): ${currency.format(result.grandTotalLight)}`);
  }

  return lines.join('\n');
}

function buildDarkSummary(result: any) {
  if (!result) return 'Run a calculation to see summary.';
  const lines: string[] = [];
  lines.push(`${result.numPieces} dark shirts`);

  const locs = result.locationBreakdownDark as any[];
  locs.forEach((loc, i) => {
    const base = Number(loc.tableBase).toFixed(2);
    const flash = Number(loc.flashAdd).toFixed(2);
    lines.push(`${loc.colorsPlusUnderbase} colors Location ${i + 1}: $(${base}+${flash} flash)`);
  });

  const totalScreens = locs.reduce((sum, loc) => sum + ((loc.numColors ?? 0) + 1), 0);
  const baseColors = locs.reduce((sum, loc) => sum + (loc.numColors ?? 0), 0);
  const underbases = locs.length;
  lines.push(`${totalScreens} screens (${baseColors} colors + ${underbases} underbase) at ${currency.format(15)} ea`);
  lines.push('');
  lines.push(`Total (no rush): ${currency.format(result.totalDarkBeforeRush)}`);

  if (result.rushServiceFeeDark) {
    const label = rushLabel(result.rushPctDark);
    if (label) lines.push(`Total (${label}): ${currency.format(result.grandTotalDark)}`);
  }

  return lines.join('\n');
}

export default function Page() {
  const [numPieces, setNumPieces] = useState<number>(40);
  const [numLocations, setNumLocations] = useState<number>(2);
  const [locations, setLocations] = useState<Loc[]>([{ numColors: 1 }, { numColors: 1 }]);
  const [fold, setFold] = useState(false);
  const [stick, setStick] = useState(false);
  const [blankArrival, setBlankArrival] = useState<string>('');
  const [shipDate, setShipDate] = useState<string>('');

  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocations((prev) => {
      const arr = [...prev];
      if (numLocations > arr.length) {
        while (arr.length < numLocations) arr.push({ numColors: 1 });
      } else {
        arr.length = numLocations;
      }
      return arr;
    });
  }, [numLocations]);

  async function calc() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numPieces,
          locations,
          foldingPolyBagging: fold,
          individualStickers: stick,
          blankArrivalDate: blankArrival || undefined,
          shippingDate: shipDate || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Calc failed');
      setResult(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">
        Promos Ink – Screen Printing Price Calculator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Inputs">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Number of Pieces</span>
              <input
                type="number"
                min={1}
                value={numPieces}
                onChange={(e) => setNumPieces(parseInt(e.target.value || '0', 10))}
                className="rounded-lg border px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Locations</span>
              <input
                type="number"
                min={1}
                value={numLocations}
                onChange={(e) => setNumLocations(parseInt(e.target.value || '0', 10))}
                className="rounded-lg border px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Blank Arrival (optional)</span>
              <input
                type="date"
                value={blankArrival}
                onChange={(e) => setBlankArrival(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Ship Date (optional)</span>
              <input
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <Toggle
              label="Individual Folding & Polybagging (+$0.45 ea)"
              checked={fold}
              onChange={setFold}
            />
            <Toggle label="Individual Stickers (+$0.10 ea)" checked={stick} onChange={setStick} />
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: numLocations }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="font-medium mb-3">Location {i + 1}</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">Colors</span>
                    <input
                      type="number"
                      min={1}
                      value={locations[i]?.numColors ?? 1}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || '1', 10);
                        setLocations((prev) =>
                          prev.map((L, idx) => (idx === i ? { ...L, numColors: v } : L)),
                        );
                      }}
                      className="rounded-lg border px-3 py-2"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={calc}
            disabled={busy}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {busy ? 'Calculating…' : 'Calculate Price'}
          </button>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </Card>

        <div className="space-y-6">
          <Card title="Client-Facing Summary (Light)">
            <pre className="whitespace-pre-wrap text-sm">{buildLightSummary(result)}</pre>
          </Card>

          <Card title="Client-Facing Summary (Dark)">
            <pre className="whitespace-pre-wrap text-sm">{buildDarkSummary(result)}</pre>
          </Card>

          <Card title="Details">
            {!result ? (
              <p className="text-gray-500">Run a calculation to view line-item details.</p>
            ) : (
              <div className="text-sm space-y-2">
                <div className="font-medium">Aggregates</div>
                <div>Base per shirt (Light): {currency.format(result.basePrintingPricePerShirtLight)}</div>
                <div>Base per shirt (Dark): {currency.format(result.basePrintingPricePerShirtDark)}</div>
                <div>Screen fee (Light): {currency.format(result.aggregatedLightScreenFee)}</div>
                <div>Screen fee (Dark): {currency.format(result.aggregatedDarkScreenFee)}</div>
                <div>Folding/Polybag: {currency.format(result.foldingPolyBaggingCost)}</div>
                <div>Stickers: {currency.format(result.individualStickersCost)}</div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-gray-500">
        Promos Ink Internal Tool — built for contract decoration quoting
      </footer>
    </main>
  );
}
