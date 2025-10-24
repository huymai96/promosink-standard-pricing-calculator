'use client';

import { useEffect, useState } from 'react';
import QuotePreview from '../components/QuotePreview';

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
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }:{label:string;checked:boolean;onChange:(v:boolean)=>void}){
  return (
    <label className="toggle">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function Page(){
  const [numPieces, setNumPieces] = useState<number>(40);
  const [numLocations, setNumLocations] = useState<number>(2);
  const [locations, setLocations] = useState<Loc[]>([{ numColors: 1 }, { numColors: 1 }]);
  const [fold, setFold] = useState(false);
  const [stick, setStick] = useState(false);
  const [blankArrival, setBlankArrival] = useState<string>('');
  const [shipDate, setShipDate] = useState<string>('');

  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{
    setLocations(prev=>{
      const arr = [...prev];
      if (numLocations > arr.length){
        while (arr.length < numLocations) arr.push({ numColors: 1 });
      } else {
        arr.length = numLocations;
      }
      return arr;
    });
  }, [numLocations]);

  async function calc(){
    setBusy(true); setError(null);
    try{
      const res = await fetch('/api/calc', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
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
    }catch(e:any){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Promos Ink – Screen Printing Price Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Inputs">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Number of Pieces</span>
              <input className="input" type="number" min={1} value={numPieces}
                onChange={(e)=>setNumPieces(parseInt(e.target.value || '0', 10))}/>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Locations</span>
              <input className="input" type="number" min={1} value={numLocations}
                onChange={(e)=>setNumLocations(parseInt(e.target.value || '0', 10))}/>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Blank Arrival (optional)</span>
              <input className="input" type="date" value={blankArrival}
                onChange={(e)=>setBlankArrival(e.target.value)}/>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Ship Date (optional)</span>
              <input className="input" type="date" value={shipDate}
                onChange={(e)=>setShipDate(e.target.value)}/>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <Toggle label="Individual Folding & Polybagging (+$0.45 ea)" checked={fold} onChange={setFold} />
            <Toggle label="Individual Stickers (+$0.10 ea)" checked={stick} onChange={setStick} />
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: numLocations }).map((_, i)=>(
              <div key={i} className="rounded-xl border p-4">
                <div className="font-medium mb-3">Location {i+1}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">Colors</span>
                    <input className="input" type="number" min={1} value={locations[i]?.numColors ?? 1}
                      onChange={(e)=>{
                        const v = parseInt(e.target.value || '1', 10);
                        setLocations(prev=>prev.map((L, idx)=> idx===i ? { ...L, numColors: v } : L));
                      }}/>
                  </label>

                  <label className="toggle">
                    <input type="checkbox" className="h-4 w-4"
                      checked={!!locations[i]?.cmykSetup}
                      onChange={(e)=>setLocations(prev=>prev.map((L,idx)=> idx===i?{...L,cmykSetup:e.target.checked}:L))}/>
                    <span>CMYK / Sim Process (+$150 setup)</span>
                  </label>

                  <label className="toggle">
                    <input type="checkbox" className="h-4 w-4"
                      checked={!!locations[i]?.specialLocation}
                      onChange={(e)=>setLocations(prev=>prev.map((L,idx)=> idx===i?{...L,specialLocation:e.target.checked}:L))}/>
                    <span>Special imprint location (+$0.35 ea / print)</span>
                  </label>

                  <label className="toggle">
                    <input type="checkbox" className="h-4 w-4"
                      checked={!!locations[i]?.bulkSpecial}
                      onChange={(e)=>setLocations(prev=>prev.map((L,idx)=> idx===i?{...L,bulkSpecial:e.target.checked}:L))}/>
                    <span>Bulk / hard to handle (+$0.75 ea / location)</span>
                  </label>

                  <label className="toggle">
                    <input type="checkbox" className="h-4 w-4"
                      checked={!!locations[i]?.syntheticFabric}
                      onChange={(e)=>setLocations(prev=>prev.map((L,idx)=> idx===i?{...L,syntheticFabric:e.target.checked}:L))}/>
                    <span>Synthetic / regular hard to handle (+$0.35 ea / print)</span>
                  </label>

                  <label className="toggle">
                    <input type="checkbox" className="h-4 w-4"
                      checked={!!locations[i]?.specialtyInks}
                      onChange={(e)=>setLocations(prev=>prev.map((L,idx)=> idx===i?{...L,specialtyInks:e.target.checked}:L))}/>
                    <span>Specialty inks (+$0.35 per color / location)</span>
                  </label>

                  <label className="toggle md:col-span-2">
                    <input type="checkbox" className="h-4 w-4"
                      checked={!!locations[i]?.reflectiveGlowWater}
                      onChange={(e)=>setLocations(prev=>prev.map((L,idx)=> idx===i?{...L,reflectiveGlowWater:e.target.checked}:L))}/>
                    <span>Reflective / Glow / Water-based (+$1.00 per print / location)</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <button onClick={calc} disabled={busy} className="mt-6 btn">
            {busy ? 'Calculating…' : 'Calculate Price'}
          </button>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </Card>

        <div className="space-y-6">
          <Card title="Quote Preview">
            <QuotePreview result={result} />
          </Card>

          <Card title="Details">
            {!result ? (
              <p className="text-gray-500">Run a calculation to view line-item details.</p>
            ) : (
              <div className="text-sm space-y-3">
                <div className="font-medium">Aggregates</div>
                <div>Base per shirt (Light): {currency.format(result.basePrintingPricePerShirtLight)}</div>
                <div>Base per shirt (Dark): {currency.format(result.basePrintingPricePerShirtDark)}</div>
                <div>Screen fee (Light): {currency.format(result.aggregatedLightScreenFee)}</div>
                <div>Screen fee (Dark): {currency.format(result.aggregatedDarkScreenFee)}</div>
                <div>Folding/Polybag: {currency.format(result.foldingPolyBaggingCost)}</div>
                <div>Stickers: {currency.format(result.individualStickersCost)}</div>

                <div className="font-medium pt-2">Per-Location Add-ons (Light)</div>
                {result.locationBreakdownLight.map((loc:any, i:number)=>(
                  <div key={`L-${i}`}>Location {i+1}: {currency.format(loc.additionalCost)}</div>
                ))}
                <div className="font-medium pt-2">Per-Location Add-ons (Dark)</div>
                {result.locationBreakdownDark.map((loc:any, i:number)=>(
                  <div key={`D-${i}`}>Location {i+1}: {currency.format(loc.additionalCost)}</div>
                ))}
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
