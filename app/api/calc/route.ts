import { NextResponse } from 'next/server'

type LocationInput = {
  numColors: number
  cmykSetup?: boolean
  specialLocation?: boolean
  bulkSpecial?: boolean
  syntheticFabric?: boolean
  specialtyInks?: boolean
  reflectiveGlowWater?: boolean
}

const priceTable = [
  { min: 12, max: 23, prices: [2.93, 3.39, 4.08, 5.23] },
  { min: 24, max: 48, prices: [2.01, 2.59, 3.16, 3.74, 4.31, 4.89, 5.46, 6.04, 6.61, 7.19, 7.76] },
  { min: 49, max: 143, prices: [1.38, 1.73, 2.07, 2.42, 2.76, 3.11, 3.45, 3.80, 4.14, 4.49, 4.83, 5.18] },
  { min: 144, max: 575, prices: [1.04, 1.21, 1.32, 1.55, 1.78, 2.01, 2.24, 2.47, 2.70, 2.99, 3.34, 3.68] },
  { min: 576, max: 1727, prices: [0.75, 0.92, 1.09, 1.27, 1.44, 1.61, 1.78, 1.96, 2.13, 2.30, 2.47, 2.65] },
  { min: 1728, max: 5003, prices: [0.63, 0.75, 0.86, 0.98, 1.09, 1.21, 1.32, 1.44, 1.55, 1.67, 1.78, 1.90] },
  { min: 5004, max: Infinity, prices: [0.52, 0.63, 0.69, 0.75, 0.81, 0.92, 1.04, 1.09, 1.27, 1.44, 1.61, 1.78] },
] as const

function getPriceFromTable(pieces: number, colors: number) {
  const row = priceTable.find(r => pieces >= r.min && pieces <= r.max)
  if (!row) return 0
  const idx = Math.max(0, Math.min(colors - 1, row.prices.length - 1))
  return row.prices[idx]
}

function calcLight(loc: LocationInput, numPieces: number) {
  const basePriceLight = getPriceFromTable(numPieces, loc.numColors)
  const lightScreenFee = 15 * loc.numColors
  let additionalCost = 0
  if (loc.cmykSetup) additionalCost += 150
  if (loc.specialLocation) additionalCost += 0.35 * numPieces
  if (loc.bulkSpecial) additionalCost += 0.75 * numPieces
  if (loc.syntheticFabric) additionalCost += 0.35 * numPieces
  if (loc.specialtyInks) additionalCost += 0.35 * loc.numColors * numPieces
  if (loc.reflectiveGlowWater) additionalCost += 1 * numPieces
  const locationLightBaseTotal = (basePriceLight * numPieces) + additionalCost
  const totalLight = locationLightBaseTotal + lightScreenFee
  return { basePriceLight, lightScreenFee, additionalCost, locationLightBaseTotal, totalLight, numColors: loc.numColors }
}

function calcDark(loc: LocationInput, numPieces: number) {
  const colorsPlusUnderbase = loc.numColors + 1
  const tableBase = getPriceFromTable(numPieces, colorsPlusUnderbase)
  const flashAdd = 0.15
  const darkBasePerPiece = tableBase + flashAdd
  const darkScreenFee = 15 * colorsPlusUnderbase
  let additionalCost = 0
  if (loc.cmykSetup) additionalCost += 150
  if (loc.specialLocation) additionalCost += 0.35 * numPieces
  if (loc.bulkSpecial) additionalCost += 0.75 * numPieces
  if (loc.syntheticFabric) additionalCost += 0.35 * numPieces
  if (loc.specialtyInks) additionalCost += 0.35 * loc.numColors * numPieces
  if (loc.reflectiveGlowWater) additionalCost += 1 * numPieces
  const locationDarkBaseTotal = (darkBasePerPiece * numPieces) + additionalCost
  const totalDark = locationDarkBaseTotal + darkScreenFee
  return { darkBasePerPiece, tableBase, flashAdd, colorsPlusUnderbase, darkScreenFee, additionalCost, locationDarkBaseTotal, totalDark, numColors: loc.numColors }
}

function calcRush(blankArrivalDate?: string, shippingDate?: string, totalPrice?: number) {
  if (!blankArrivalDate || !shippingDate || !totalPrice) return { rushFee: 0, rushPct: 0 }
  const start = new Date(blankArrivalDate)
  const end = new Date(shippingDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return { rushFee: 0, rushPct: 0 }
  let prodDays = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) prodDays++
  }
  let pct = 0
  if (prodDays === 1) pct = 1.00
  else if (prodDays === 2) pct = 0.75
  else if (prodDays === 3) pct = 0.50
  else if (prodDays === 4) pct = 0.25
  return { rushFee: totalPrice * pct, rushPct: pct }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { numPieces, locations, foldingPolyBagging, individualStickers, blankArrivalDate, shippingDate } = body as {
      numPieces: number
      locations: LocationInput[]
      foldingPolyBagging?: boolean
      individualStickers?: boolean
      blankArrivalDate?: string
      shippingDate?: string
    }

    let aggregatedLightBaseCost = 0
    let aggregatedLightScreenFee = 0
    let aggregatedDarkBaseCost = 0
    let aggregatedDarkScreenFee = 0
    const locationBreakdownLight: any[] = []
    const locationBreakdownDark: any[] = []

    for (let i = 0; i < locations.length; i++) {
      const l = locations[i]
      const L = calcLight(l, numPieces)
      const D = calcDark(l, numPieces)
      aggregatedLightBaseCost += L.locationLightBaseTotal
      aggregatedLightScreenFee += L.lightScreenFee
      aggregatedDarkBaseCost += D.locationDarkBaseTotal
      aggregatedDarkScreenFee += D.darkScreenFee
      locationBreakdownLight.push({ index: i, ...L })
      locationBreakdownDark.push({ index: i, ...D })
    }

    const foldingPolyBaggingCost = foldingPolyBagging ? 0.45 * numPieces : 0
    const individualStickersCost = individualStickers ? 0.10 * numPieces : 0

    const totalLightBeforeRush = aggregatedLightBaseCost + aggregatedLightScreenFee + foldingPolyBaggingCost + individualStickersCost
    const totalDarkBeforeRush = aggregatedDarkBaseCost + aggregatedDarkScreenFee + foldingPolyBaggingCost + individualStickersCost

    const { rushFee: rushServiceFeeLight, rushPct: rushPctLight } = calcRush(blankArrivalDate, shippingDate, totalLightBeforeRush)
    const { rushFee: rushServiceFeeDark, rushPct: rushPctDark } = calcRush(blankArrivalDate, shippingDate, totalDarkBeforeRush)

    const grandTotalLight = totalLightBeforeRush + rushServiceFeeLight
    const grandTotalDark = totalDarkBeforeRush + rushServiceFeeDark

    const basePrintingPricePerShirtLight = aggregatedLightBaseCost / numPieces
    const basePrintingPricePerShirtDark = aggregatedDarkBaseCost / numPieces

    return NextResponse.json({
      ok: true,
      data: {
        numPieces,
        locationBreakdownLight,
        locationBreakdownDark,
        foldingPolyBaggingCost,
        individualStickersCost,
        aggregatedLightScreenFee,
        aggregatedDarkScreenFee,
        basePrintingPricePerShirtLight,
        basePrintingPricePerShirtDark,
        totalLightBeforeRush,
        totalDarkBeforeRush,
        rushServiceFeeLight,
        rushServiceFeeDark,
        rushPctLight,
        rushPctDark,
        grandTotalLight,
        grandTotalDark
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 400 })
  }
}
