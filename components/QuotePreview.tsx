'use client';

import { useRef } from 'react';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function rushLabel(pct?: number|null){
  if (!pct) return null;
  if (pct >= 0.999) return '1-day rush';
  if (pct >= 0.74 && pct <= 0.76) return '2-day rush';
  if (pct >= 0.49 && pct <= 0.51) return '3-day rush';
  if (pct >= 0.24 && pct <= 0.26) return '4-day rush';
  return null;
}

export default function QuotePreview({ result }:{ result: any }){
  const ref = useRef<HTMLPreElement>(null);

  if (!result) return <div className="text-gray-500">Run a calculation to generate a client-facing quote.</div>;

  const locsL = result.locationBreakdownLight as any[];
  const linesL: string[] = [];
  linesL.push(`${result.numPieces} light shirts`);
  locsL.forEach((loc, i) => {
    linesL.push(`${loc.numColors} colors Location ${i+1}: ${currency.format(loc.basePriceLight)} ea`);
  });
  const totalScreensL = locsL.reduce((sum, loc)=> sum + (loc.numColors ?? 0), 0);
  linesL.push(`${totalScreensL} screens at ${currency.format(15)} ea`);
  linesL.push(`Total (no rush): ${currency.format(result.totalLightBeforeRush)}`);
  if (result.rushServiceFeeLight){
    const rl = rushLabel(result.rushPctLight);
    if (rl) linesL.push(`Total (${rl}): ${currency.format(result.grandTotalLight)}`);
  }

  const locsD = result.locationBreakdownDark as any[];
  const linesD: string[] = [];
  linesD.push(`${result.numPieces} dark shirts`);
  locsD.forEach((loc, i) => {
    const base = Number(loc.tableBase).toFixed(2);
    const flash = Number(loc.flashAdd).toFixed(2);
    linesD.push(`${loc.colorsPlusUnderbase} colors Location ${i+1}: $(${base}+${flash} flash)`);
  });
  const totalScreensD = locsD.reduce((sum, loc)=> sum + ((loc.numColors ?? 0) + 1), 0);
  const baseColorsD = locsD.reduce((sum, loc)=> sum + (loc.numColors ?? 0), 0);
  const underbases = locsD.length;
  linesD.push(`${totalScreensD} screens (${baseColorsD} colors + ${underbases} underbase) at ${currency.format(15)} ea`);
  linesD.push(`Total (no rush): ${currency.format(result.totalDarkBeforeRush)}`);
  if (result.rushServiceFeeDark){
    const rl = rushLabel(result.rushPctDark);
    if (rl) linesD.push(`Total (${rl}): ${currency.format(result.grandTotalDark)}`);
  }

  const text = ['— LIGHT —', ...linesL, '', '— DARK —', ...linesD].join('\n');

  async function copy(){
    if (!ref.current) return;
    await navigator.clipboard.writeText(ref.current.innerText);
    alert('Quote copied!');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Quote Preview</div>
        <button onClick={copy} className="badge">Copy</button>
      </div>
      <pre ref={ref} className="quote">{text}</pre>
    </div>
  )
}
