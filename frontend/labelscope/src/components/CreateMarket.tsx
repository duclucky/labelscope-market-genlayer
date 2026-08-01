import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CreateMarketInput, MarketCategory } from '../types';

interface CreateMarketProps {
  onCreateMarket: (input: CreateMarketInput) => Promise<boolean>;
  onCancel: () => void;
}

function localTime(minutesFromNow: number) {
  const date = new Date(Date.now() + minutesFromNow * 60_000);
  date.setSeconds(0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function utc(local: string) {
  return new Date(local).toISOString().replace('.000Z', 'Z');
}

export function CreateMarket({ onCreateMarket, onCancel }: CreateMarketProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    marketId: 'jideytro-ros1',
    title: 'Will the FDA label match the locked ROS1 NSCLC scope?',
    category: 'ONCOLOGY' as MarketCategory,
    drugName: 'Jideytro (zidesamtinib)',
    applicationNumber: 'NDA220185',
    labelSetId: '3760e421-b523-4d9b-e063-6394a90ab94b',
    labelEffectiveTime: '20260722',
    approvalUrl: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-zidesamtinib-ros1-positive-non-small-cell-lung-cancer',
    condition: 'ROS1-positive non-small cell lung cancer',
    biomarker: 'ROS1-positive',
    population: 'adults',
    diseaseStage: 'locally advanced or metastatic',
    priorTherapy: 'at least one prior ROS1 tyrosine kinase inhibitor',
    combinationRequirement: 'NOT_REQUIRED',
    approvalClass: 'FDA approval',
    closeAt: localTime(10),
    resolveAt: localTime(20),
    refundAt: localTime(80),
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const next = () => {
    const required = step === 1
      ? [form.marketId, form.drugName, form.applicationNumber, form.labelSetId, form.labelEffectiveTime, form.approvalUrl]
      : [form.title, form.condition, form.biomarker, form.population, form.diseaseStage, form.priorTherapy, form.combinationRequirement, form.approvalClass];
    if (required.some((value) => !value.trim())) {
      setError('Complete every required field before continuing.');
      return;
    }
    setError('');
    setStep((step + 1) as 2 | 3);
  };

  const create = async () => {
    const close = new Date(form.closeAt);
    const resolve = new Date(form.resolveAt);
    const refund = new Date(form.refundAt);
    if (!(close < resolve && resolve < refund)) {
      setError('Funding close, resolution, and refund times must be in chronological order.');
      return;
    }
    setSubmitting(true);
    const ok = await onCreateMarket({ ...form, closeAt: utc(form.closeAt), resolveAt: utc(form.resolveAt), refundAt: utc(form.refundAt) });
    setSubmitting(false);
    if (!ok) setError('The market was not created. Review the transaction message above and try again.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pt-6 pb-24">
      <div className="mb-8">
        <h1 className="font-sans font-bold text-3xl md:text-4xl text-slate-900 mb-2 tracking-tight">Compose FDA Question</h1>
        <p className="font-sans text-base text-slate-500">Lock the exact label identity, semantic facets, and market schedule.</p>
      </div>
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />
        {['Identity', 'Facets', 'Review'].map((label, index) => (
          <div key={label} className="flex flex-col items-center gap-1 bg-slate-50 px-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${step >= index + 1 ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>{index + 1}</div>
            <span className={`text-xs font-semibold ${step >= index + 1 ? 'text-indigo-600' : 'text-slate-500'}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-bold text-xl border-b border-slate-200 pb-4">Label Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Market ID" value={form.marketId} onChange={(v) => update('marketId', v)} placeholder="lowercase-market-id" />
              <Field label="Drug name" value={form.drugName} onChange={(v) => update('drugName', v)} />
              <Field label="FDA application number" value={form.applicationNumber} onChange={(v) => update('applicationNumber', v.toUpperCase())} />
              <Field label="Label effective date (YYYYMMDD)" value={form.labelEffectiveTime} onChange={(v) => update('labelEffectiveTime', v)} />
            </div>
            <Field label="Label set ID" value={form.labelSetId} onChange={(v) => update('labelSetId', v.toLowerCase())} />
            <Field label="Official FDA approval URL" type="url" value={form.approvalUrl} onChange={(v) => update('approvalUrl', v)} />
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wider">Therapeutic category</label>
              <select value={form.category} onChange={(event) => update('category', event.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm bg-white focus:outline-none focus:border-indigo-600">
                {['ONCOLOGY', 'NEUROLOGY', 'CARDIOLOGY', 'INFECTIOUS DISEASE', 'RARE DISEASE', 'ENDOCRINOLOGY'].map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-xl border-b border-slate-200 pb-4">Resolution Scope & Facets</h2>
            <Field label="Market question" value={form.title} onChange={(v) => update('title', v)} />
            <Field label="Condition" value={form.condition} onChange={(v) => update('condition', v)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Biomarker" value={form.biomarker} onChange={(v) => update('biomarker', v)} />
              <Field label="Population" value={form.population} onChange={(v) => update('population', v)} />
              <Field label="Disease stage" value={form.diseaseStage} onChange={(v) => update('diseaseStage', v)} />
              <Field label="Prior therapy" value={form.priorTherapy} onChange={(v) => update('priorTherapy', v)} />
              <Field label="Combination requirement" value={form.combinationRequirement} onChange={(v) => update('combinationRequirement', v)} />
              <Field label="Approval class" value={form.approvalClass} onChange={(v) => update('approvalClass', v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-bold text-xl border-b border-slate-200 pb-4">Review & Create Market</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between text-xs"><strong className="text-indigo-600">{form.category}</strong><span className="font-mono text-slate-500">{form.marketId}</span></div>
              <h3 className="font-bold text-lg">{form.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                <Review label="Drug" value={form.drugName} /><Review label="Application" value={form.applicationNumber} />
                <Review label="Condition" value={form.condition} /><Review label="Population" value={form.population} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TimeField label="Funding closes" value={form.closeAt} onChange={(v) => update('closeAt', v)} />
              <TimeField label="Resolution eligible" value={form.resolveAt} onChange={(v) => update('resolveAt', v)} />
              <TimeField label="Refund eligible" value={form.refundAt} onChange={(v) => update('refundAt', v)} />
            </div>
            <p className="text-xs text-slate-500">Creating a market does not fund either side. After finalization, open the market and fund a position with native GEN.</p>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700"><AlertCircle className="w-4 h-4" />{error}</div>}
      </div>

      <div className="flex justify-between items-center">
        {step > 1 ? <button onClick={() => setStep((step - 1) as 1 | 2)} className="h-11 px-6 bg-white border border-slate-200 rounded-xl text-sm font-semibold flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Back</button> : <button onClick={onCancel} className="h-11 px-6 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-semibold">Cancel</button>}
        {step < 3 ? <button onClick={next} className="h-11 px-8 bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2">Continue<ArrowRight className="w-4 h-4" /></button> : <button disabled={submitting} onClick={() => void create()} className="h-11 px-8 bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{submitting ? 'Waiting for finalization…' : 'Create Market'}</button>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <div><label className="block text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wider">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm bg-white focus:outline-none focus:border-indigo-600" /></div>;
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="block text-xs font-semibold text-slate-900 mb-2">{label}</label><input type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs bg-white focus:outline-none focus:border-indigo-600" /></div>;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div><span className="text-slate-500">{label}: </span><strong>{value}</strong></div>;
}
