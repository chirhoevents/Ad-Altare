'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { RegistryItem } from '@/db/schema';

interface ItemForm {
  name: string;
  description: string;
  goalAmount: string;
}

const emptyForm: ItemForm = { name: '', description: '', goalAmount: '' };

export default function RegistryPage() {
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/registry');
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(item: RegistryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      goalAmount: (item.goalAmount / 100).toString(),
    });
    setShowForm(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const goalCents = Math.round(parseFloat(form.goalAmount) * 100);
    if (!goalCents || goalCents < 100) {
      setError('Goal amount must be at least $1');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        goalAmount: goalCents,
      }),
    });

    if (res.ok) {
      setForm(emptyForm);
      setShowForm(false);
      await fetchItems();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to add item');
    }
    setSaving(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);

    const goalCents = Math.round(parseFloat(form.goalAmount) * 100);

    const res = await fetch(`/api/registry/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        goalAmount: goalCents,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      setForm(emptyForm);
      await fetchItems();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to update item');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this item from your registry?')) return;

    const res = await fetch(`/api/registry/${id}`, { method: 'DELETE' });
    if (res.ok) await fetchItems();
  }

  async function handleToggle(item: RegistryItem) {
    await fetch(`/api/registry/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    await fetchItems();
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-light text-burgundy-800">Registry</h1>
          <p className="font-inter text-sm text-near-black/50 mt-1">
            Manage the items on your ordination registry.
          </p>
        </div>
        {!showForm && !editingId && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-near-black/10 rounded-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cormorant text-xl text-burgundy-800">New Registry Item</h2>
            <button onClick={() => { setShowForm(false); setError(null); }}>
              <X className="w-4 h-4 text-near-black/40" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Chalice, Roman Missal, Stole"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Tell donors what this item means for your ministry…"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Goal Amount ($) *</Label>
              <Input
                id="goalAmount"
                name="goalAmount"
                type="number"
                min="1"
                step="0.01"
                value={form.goalAmount}
                onChange={handleChange}
                placeholder="250.00"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm font-inter">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding…' : 'Add to Registry'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="font-inter text-sm text-near-black/40">Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-near-black/10 rounded-sm">
          <p className="font-cormorant text-2xl text-near-black/30 mb-2">Your registry is empty</p>
          <p className="font-inter text-sm text-near-black/30 mb-4">
            Add the items you need for your ordination and ministry.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add First Item
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const pct = Math.min(100, Math.round((item.amountRaised / item.goalAmount) * 100));
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <div key={item.id} className="bg-white border border-burgundy-200 rounded-sm p-6">
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${item.id}`}>Item Name</Label>
                      <Input
                        id={`name-${item.id}`}
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${item.id}`}>Description</Label>
                      <Textarea
                        id={`desc-${item.id}`}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`goal-${item.id}`}>Goal Amount ($)</Label>
                      <Input
                        id={`goal-${item.id}`}
                        name="goalAmount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.goalAmount}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {error && <p className="text-red-600 text-sm font-inter">{error}</p>}
                    <div className="flex gap-3">
                      <Button type="submit" size="sm" disabled={saving}>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-sm p-5 ${
                  item.isActive ? 'border-near-black/10' : 'border-near-black/5 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-cormorant text-xl text-burgundy-800">{item.name}</h3>
                      {!item.isActive && <Badge variant="muted">Hidden</Badge>}
                      {item.amountRaised >= item.goalAmount && (
                        <Badge variant="gold">Funded</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="font-inter text-sm text-near-black/50 mb-3">{item.description}</p>
                    )}
                    <div className="space-y-1.5">
                      <Progress value={pct} />
                      <div className="flex justify-between text-xs font-inter text-near-black/40">
                        <span>{formatCurrency(item.amountRaised)} raised</span>
                        <span>Goal: {formatCurrency(item.goalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(item)}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggle(item)}
                      title={item.isActive ? 'Hide from public page' : 'Show on public page'}
                    >
                      {item.isActive ? (
                        <X className="w-3.5 h-3.5 text-near-black/40" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
