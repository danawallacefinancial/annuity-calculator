
'use client';
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Shield, Calculator } from "lucide-react";

type RollupType = "simple" | "compound";
interface PayoutBand { minAge: number; single: number; joint: number }
interface CarrierPreset {
  id: string;
  name: string;
  bonusPercent: number;
  assumedIndexRate: number;
  riderFee: number;
  rollupRate: number;
  rollupType: RollupType;
  payoutBands: PayoutBand[];
}

const CARRIER_PRESETS: CarrierPreset[] = [
  { id: "newyorklife", name: "New York Life", bonusPercent: 8,  assumedIndexRate: 4.8, riderFee: 1.0, rollupRate: 6.5, rollupType: "simple",   payoutBands: [ {minAge:55,single:4.2,joint:3.8}, {minAge:60,single:4.7,joint:4.3}, {minAge:65,single:5.2,joint:4.8}, {minAge:70,single:5.8,joint:5.3} ] },
  { id: "massmutual", name: "MassMutual",   bonusPercent: 10, assumedIndexRate: 5.0, riderFee: 1.1, rollupRate: 7.0, rollupType: "simple",   payoutBands: [ {minAge:55,single:4.1,joint:3.7}, {minAge:60,single:4.6,joint:4.2}, {minAge:65,single:5.1,joint:4.7}, {minAge:70,single:5.7,joint:5.2} ] },
  { id: "allianz",    name: "Allianz",      bonusPercent: 12, assumedIndexRate: 5.2, riderFee: 1.0, rollupRate: 7.0, rollupType: "compound", payoutBands: [ {minAge:55,single:4.0,joint:3.6}, {minAge:60,single:4.5,joint:4.1}, {minAge:65,single:5.0,joint:4.6}, {minAge:70,single:5.6,joint:5.1} ] },
  { id: "nationwide", name: "Nationwide",   bonusPercent: 8,  assumedIndexRate: 4.9, riderFee: 1.1, rollupRate: 6.0, rollupType: "compound", payoutBands: [ {minAge:55,single:3.9,joint:3.5}, {minAge:60,single:4.4,joint:4.0}, {minAge:65,single:4.9,joint:4.5}, {minAge:70,single:5.5,joint:5.0} ] },
  { id: "lincoln",    name: "Lincoln",      bonusPercent: 7,  assumedIndexRate: 4.7, riderFee: 1.2, rollupRate: 6.5, rollupType: "simple",   payoutBands: [ {minAge:55,single:4.0,joint:3.6}, {minAge:60,single:4.5,joint:4.1}, {minAge:65,single:5.0,joint:4.6}, {minAge:70,single:5.6,joint:5.1} ] },
  { id: "northamerican", name: "North American", bonusPercent: 15, assumedIndexRate: 5.4, riderFee: 1.0, rollupRate: 7.2, rollupType: "compound", payoutBands: [ {minAge:55,single:4.2,joint:3.8}, {minAge:60,single:4.7,joint:4.3}, {minAge:65,single:5.2,joint:4.8}, {minAge:70,single:5.8,joint:5.3} ] },
  { id: "americanequity", name: "American Equity", bonusPercent: 10, assumedIndexRate: 5.1, riderFee: 0.95, rollupRate: 7.5, rollupType: "simple", payoutBands: [ {minAge:55,single:4.1,joint:3.7}, {minAge:60,single:4.6,joint:4.2}, {minAge:65,single:5.1,joint:4.7}, {minAge:70,single:5.7,joint:5.2} ] },
  { id: "athene",     name: "Athene",       bonusPercent: 20, assumedIndexRate: 5.5, riderFee: 1.0, rollupRate: 8.0, rollupType: "compound", payoutBands: [ {minAge:55,single:4.3,joint:3.9}, {minAge:60,single:4.8,joint:4.4}, {minAge:65,single:5.3,joint:4.9}, {minAge:70,single:5.9,joint:5.4} ] },
  { id: "fg",         name: "F&G",          bonusPercent: 12, assumedIndexRate: 5.0, riderFee: 1.0, rollupRate: 7.0, rollupType: "simple",   payoutBands: [ {minAge:55,single:4.1,joint:3.7}, {minAge:60,single:4.6,joint:4.2}, {minAge:65,single:5.1,joint:4.7}, {minAge:70,single:5.7,joint:5.2} ] },
  { id: "corebridge", name: "Corebridge/AIG", bonusPercent: 9,  assumedIndexRate: 4.8, riderFee: 1.1, rollupRate: 6.8, rollupType: "compound", payoutBands: [ {minAge:55,single:4.0,joint:3.6}, {minAge:60,single:4.5,joint:4.1}, {minAge:65,single:5.0,joint:4.6}, {minAge:70,single:5.6,joint:5.1} ] },
];

type ViewRow = { id:string; name:string; bonus:number; premWithBonus:number; av:number; incomeBase:number; payout:number; estIncome:number };

const pct = (p:number)=>p/100;
const currency = (n:number)=> n.toLocaleString(undefined,{style:"currency",currency:"USD", maximumFractionDigits:0});
function fv(principal:number, annualPct:number, years:number, feePct:number){
  const net = pct(annualPct)-pct(feePct);
  return principal*Math.pow(1+net, years);
}
function pickPayoutRate(bands:PayoutBand[], age:number, joint:boolean){
  const s=[...bands].sort((a,b)=>a.minAge-b.minAge); let ch=s[0]; for(const b of s){ if(age>=b.minAge) ch=b; } return joint?ch.joint:ch.single;
}

interface ServerRow {
  id: string;
  name: string;
  inputs: { incomeStartAge: number; joint: boolean; accountType: string };
  assumptions: { bonusPct?: number; assumedIndex?: number; riderFee?: number; rollupRate?: number; rollupType?: RollupType; payoutRate?: number };
  outputs: { bonusAmt: number; premiumWithBonus: number; projectedAccountValue: number; incomeBase: number; estimatedLifetimeIncome: number };
}
const API_PATH = "/api/annuity";

export default function Page(){
  const [premium, setPremium] = useState<number>(100000);
  const [accountType, setAccountType] = useState<"qualified"|"roth"|"nonqualified"|"tsp">("qualified");
  const [currentAge, setCurrentAge] = useState<number>(60);
  const [growthYears, setGrowthYears] = useState<number>(10);
  const incomeStartAge = currentAge + growthYears;

  const [useSecureApi, setUseSecureApi] = useState(false);
  const [jwt, setJwt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serverRows, setServerRows] = useState<ServerRow[]|null>(null);

  const localRows: ViewRow[] = useMemo(()=>{
    return CARRIER_PRESETS.map((c)=>{
      const bonus = premium * pct(c.bonusPercent);
      const premWithBonus = premium + bonus;
      const av = fv(premWithBonus, c.assumedIndexRate, growthYears, c.riderFee);
      const payout = pickPayoutRate(c.payoutBands, incomeStartAge, false);
      const incomeBase = c.rollupType === "simple"
        ? premWithBonus + premWithBonus*pct(c.rollupRate)*growthYears
        : premWithBonus*Math.pow(1+pct(c.rollupRate), growthYears);
      const estIncome = incomeBase * pct(payout);
      return { id: c.id, name: c.name, bonus, premWithBonus, av, incomeBase, payout, estIncome };
    });
  },[premium, growthYears, incomeStartAge]);

  const rows: ViewRow[] = useMemo(()=>{
    if(useSecureApi && serverRows){
      const map = new Map(serverRows.map(r=>[r.id, r]));
      return CARRIER_PRESETS.map(c=>{
        const r = map.get(c.id);
        if(!r){ return { id:c.id, name:c.name, bonus:NaN, premWithBonus:NaN, av:NaN, incomeBase:NaN, payout:NaN, estIncome:NaN }; }
        return {
          id: c.id,
          name: r.name,
          bonus: r.outputs.bonusAmt,
          premWithBonus: r.outputs.premiumWithBonus,
          av: r.outputs.projectedAccountValue,
          incomeBase: r.outputs.incomeBase,
          payout: r.assumptions.payoutRate ?? pickPayoutRate(c.payoutBands, incomeStartAge, false),
          estIncome: r.outputs.estimatedLifetimeIncome,
        };
      });
    }
    return localRows;
  },[useSecureApi, serverRows, localRows, incomeStartAge]);

  async function runServer(){
    setLoading(true); setError(""); setServerRows(null);
    try{
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "content-type":"application/json", ...(jwt? { authorization: `Bearer ${jwt}` } : {}) },
        body: JSON.stringify({
          accountType, premium, growthYears, currentAge,
          joint: false,
          carriers: CARRIER_PRESETS.map(c=>c.id),
          useCarrierPresets: true
        })
      });
      if(!res.ok){
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setServerRows(json.results as ServerRow[]);
    }catch(e:any){
      setError(e?.message || "Server request failed");
    }finally{ setLoading(false); }
  }

  useEffect(()=>{
    const t = fv(1000, 5, 10, 0);
    console.assert(Math.abs(t - 1000*Math.pow(1.05,10))<1e-6, "FV basic check");
  },[]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-7 h-7"/>
        <h1 className="text-2xl md:text-3xl font-semibold">Annuities Comparison Calculator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>Set the basics and compare carriers</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label>Premium ($)</Label>
            <Input type="number" value={premium} onChange={(e)=>setPremium(Number(e.target.value||0))} />
          </div>
          <div className="grid gap-2">
            <Label>Account Type</Label>
            <select className="border rounded-md px-3 py-2" value={accountType} onChange={(e)=>setAccountType(e.target.value as any)}>
              <option value="qualified">Qualified (IRA/401k)</option>
              <option value="tsp">Thrift Savings Plan (TSP)</option>
              <option value="roth">Roth IRA</option>
              <option value="nonqualified">Non-Qualified</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Current Age</Label>
            <Input type="number" value={currentAge} onChange={(e)=>setCurrentAge(Number(e.target.value||0))} />
          </div>
          <div className="grid gap-2">
            <Label>Deferral (years)</Label>
            <div className="px-1">
              <Slider value={[growthYears]} min={0} max={30} step={1} onValueChange={(v)=>setGrowthYears(v[0])} />
            </div>
            <div className="text-xs text-gray-600">Income start age: {incomeStartAge}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secure Server API (optional)</CardTitle>
          <CardDescription>Keep proprietary assumptions on the server. Toggle on and click Calculate.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="grid gap-2">
            <Label>Use secure API</Label>
            <div className="flex items-center gap-3">
              <input id="use-secure" type="checkbox" checked={useSecureApi} onChange={(e)=>setUseSecureApi(e.target.checked)} />
              <Label htmlFor="use-secure" className="text-sm">Enable</Label>
            </div>
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label>JWT (Bearer)</Label>
            <Input type="password" placeholder="paste your token" value={jwt} onChange={(e)=>setJwt(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>&nbsp;</Label>
            <Button disabled={!useSecureApi || loading} onClick={runServer}>{loading? "Calculating..." : "Calculate (secure)"}</Button>
          </div>
          {error && (
            <div className="md:col-span-4 text-sm text-red-600">{error}</div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rows.map(r=> (
          <Card key={r.id} className="border border-gray-200 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5"/> {r.name}</CardTitle>
              <CardDescription>Assumptions only – confirm with carrier illustration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-500">Day‑1 Bonus</div>
                  <div className="text-xl font-semibold">{currency(r.bonus)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-500">Premium + Bonus</div>
                  <div className="text-xl font-semibold">{currency(r.premWithBonus)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-500">Projected Account Value</div>
                  <div className="text-xl font-semibold">{currency(r.av)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-500">Income Base</div>
                  <div className="text-xl font-semibold">{currency(r.incomeBase)}</div>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-500">Est. Lifetime Income @ payout {r.payout.toFixed(2)}%</div>
                  <div className="text-2xl font-semibold">{currency(r.estIncome)}/yr</div>
                  <div className="text-xs text-gray-500">Income start age: {incomeStartAge} • Single</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-gray-500">Educational use only. Not financial, legal, or tax advice.</div>
    </div>
  );
}
