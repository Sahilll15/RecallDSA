'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PATTERNS } from '@/lib/constants';
import { Lightbulb, Plus, Save, Trash2 } from 'lucide-react';

export interface RecallNoteData {
  keyIdea: string | null;
  approach: string | null;
  edgeCases: string | null;
  complexity: string | null;
  hints: string[];
}

interface RecallNoteEditorProps {
  problemId: string;
  pattern: string | null;
  note: RecallNoteData | null;
  onSaved: () => void;
}

const FIELDS: Array<{
  key: keyof Omit<RecallNoteData, 'hints' | 'complexity'>;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: 'keyIdea',
    label: 'Key idea / search space',
    placeholder: 'e.g. Binary search on the answer. Search space: 1 to max(piles).',
    rows: 2,
  },
  {
    key: 'approach',
    label: 'Approach / validation function',
    placeholder:
      'e.g. mid = eating speed. Feasible if hours(mid) <= h. Feasibility is monotonic, so if mid works, search smaller.',
    rows: 4,
  },
  {
    key: 'edgeCases',
    label: 'Edge cases and traps',
    placeholder: 'e.g. Integer division needs ceil: (a + b - 1) / b. Reset counters per mid.',
    rows: 2,
  },
];

export function RecallNoteEditor({ problemId, pattern, note, onSaved }: RecallNoteEditorProps) {
  const [form, setForm] = useState({
    pattern: pattern ?? '',
    keyIdea: note?.keyIdea ?? '',
    approach: note?.approach ?? '',
    edgeCases: note?.edgeCases ?? '',
    complexity: note?.complexity ?? '',
  });
  const [hints, setHints] = useState<string[]>(note?.hints ?? []);
  const [newHint, setNewHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const addHint = () => {
    const hint = newHint.trim();
    if (!hint) return;
    setHints((h) => [...h, hint]);
    setNewHint('');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/problems/${problemId}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pattern: form.pattern || null, hints }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save');
      }
      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">Pattern</label>
        <select
          value={form.pattern}
          onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
          className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Unclassified</option>
          {PATTERNS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-semibold">{field.label}</label>
          <textarea
            value={form[field.key]}
            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
            rows={field.rows}
            placeholder={field.placeholder}
            className="w-full rounded-lg border-2 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      ))}

      <div className="space-y-2">
        <label className="text-sm font-semibold">Complexity</label>
        <Input
          value={form.complexity}
          onChange={(e) => setForm((f) => ({ ...f, complexity: e.target.value }))}
          placeholder="e.g. O(n log max(piles)) time, O(1) space"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Progressive hints (revealed one at a time in recall sessions)
        </label>
        {hints.map((hint, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-warning/30 bg-warning/[0.07] px-3 py-2 text-sm">
              <span className="mr-2 font-mono text-xs font-semibold uppercase tracking-wider text-warning">
                {i + 1}
              </span>
              {hint}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHints((h) => h.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHint()}
            placeholder="e.g. Think about what mid represents"
          />
          <Button variant="outline" onClick={addHint} disabled={!newHint.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={save} disabled={saving} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Recall Note'}
      </Button>
    </div>
  );
}
