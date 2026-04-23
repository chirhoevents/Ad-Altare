'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Check, Upload, ShoppingBag, Link as LinkIcon } from 'lucide-react';
import type { RegistryItem, RegistryLink } from '@/db/schema';

interface ItemForm {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  goalAmount: string;
  itemType: 'campaign' | 'wishlist';
  externalUrl: string;
}

const CATEGORIES = ['Vessels', 'Vestments', 'Books', 'Devotional', 'Mass Kit', 'General Fund', 'Other'];

const emptyForm: ItemForm = {
  name: '',
  category: '',
  description: '',
  imageUrl: '',
  goalAmount: '',
  itemType: 'campaign',
  externalUrl: '',
};

export default function RegistryPage() {
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registry Links state
  const [links, setLinks] = useState<RegistryLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/registry');
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
    setLoading(false);
  }, []);

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/registry-links');
    if (res.ok) {
      const data = await res.json();
      setLinks(data);
    }
    setLinksLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    fetchLinks();
  }, [fetchItems, fetchLinks]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const hasCampaign = items.some((i) => i.itemType === 'campaign');

  function handleItemTypeChange(newType: 'campaign' | 'wishlist') {
    if (newType === 'wishlist' && !hasCampaign) return;
    setForm((prev) => ({
      ...prev,
      itemType: newType,
      goalAmount: '',
      externalUrl: '',
    }));
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (res.ok) {
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Image upload failed');
    }
    setUploading(false);
  }

  function startEdit(item: RegistryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? '',
      description: item.description ?? '',
      imageUrl: item.imageUrl ?? '',
      goalAmount: item.goalAmount > 0 ? (item.goalAmount / 100).toString() : '',
      itemType: (item.itemType as 'campaign' | 'wishlist') ?? 'campaign',
      externalUrl: item.externalUrl ?? '',
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

    let goalCents = 0;
    if (form.goalAmount) {
      goalCents = Math.round(parseFloat(form.goalAmount) * 100);
    }

    if (form.itemType === 'campaign') {
      if (!goalCents || goalCents < 100) {
        setError('Goal amount must be at least $1');
        setSaving(false);
        return;
      }
    }

    const res = await fetch('/api/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        description: form.description,
        imageUrl: form.imageUrl || null,
        goalAmount: goalCents,
        itemType: form.itemType,
        externalUrl: form.externalUrl || null,
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

    let goalCents = 0;
    if (form.goalAmount) {
      goalCents = Math.round(parseFloat(form.goalAmount) * 100);
    }

    const res = await fetch(`/api/registry/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        description: form.description,
        imageUrl: form.imageUrl || null,
        goalAmount: goalCents,
        itemType: form.itemType,
        externalUrl: form.externalUrl || null,
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

  async function handleTogglePurchased(item: RegistryItem) {
    await fetch(`/api/registry/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPurchased: !item.isPurchased }),
    });
    await fetchItems();
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkSaving(true);
    setLinkError(null);
    const res = await fetch('/api/registry-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: linkLabel, url: linkUrl }),
    });
    if (res.ok) {
      setLinkLabel('');
      setLinkUrl('');
      await fetchLinks();
    } else {
      const data = await res.json().catch(() => ({}));
      setLinkError(data.error ?? 'Failed to add link');
    }
    setLinkSaving(false);
  }

  async function handleDeleteLink(id: string) {
    if (!confirm('Remove this registry link?')) return;
    const res = await fetch(`/api/registry-links/${id}`, { method: 'DELETE' });
    if (res.ok) await fetchLinks();
  }

  // Shared image upload field used in both add and edit forms
  function ImageUploadField() {
    return (
      <div className="space-y-2">
        <Label>Item Photo <span className="text-near-black/30 font-normal">(optional)</span></Label>
        <div className="flex items-center gap-3">
          {form.imageUrl && (
            <div className="w-16 h-16 rounded-sm border border-near-black/10 overflow-hidden shrink-0">
              <Image src={form.imageUrl} alt="" width={64} height={64} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(f);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? 'Uploading…' : form.imageUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
            {form.imageUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200"
                onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Shared form fields for both Add and Edit
  function FormFields() {
    return (
      <>
        {/* Item type selector */}
        <div className="space-y-2">
          <Label>Item Type</Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleItemTypeChange('campaign')}
              className={`flex-1 py-2 px-4 rounded-sm border text-sm font-inter transition-colors ${
                form.itemType === 'campaign'
                  ? 'border-burgundy-800 bg-burgundy-800 text-cream'
                  : 'border-near-black/20 text-near-black/60 hover:border-near-black/40'
              }`}
            >
              Campaign
            </button>
            <button
              type="button"
              onClick={() => handleItemTypeChange('wishlist')}
              disabled={!hasCampaign}
              title={!hasCampaign ? 'Add a Campaign item first before adding Wishlist items.' : undefined}
              className={`flex-1 py-2 px-4 rounded-sm border text-sm font-inter transition-colors ${
                form.itemType === 'wishlist'
                  ? 'border-burgundy-800 bg-burgundy-800 text-cream'
                  : !hasCampaign
                  ? 'border-near-black/10 text-near-black/30 cursor-not-allowed'
                  : 'border-near-black/20 text-near-black/60 hover:border-near-black/40'
              }`}
            >
              Wishlist
            </button>
          </div>
          {!hasCampaign ? (
            <p className="font-inter text-xs text-amber-600">
              Add at least one Campaign item before you can add Wishlist items.
            </p>
          ) : (
            <p className="font-inter text-xs text-near-black/40">
              {form.itemType === 'campaign'
                ? 'Donors contribute funds toward this item through the platform.'
                : 'Link donors to an external site where they can purchase it directly.'}
            </p>
          )}
        </div>

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
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800"
          >
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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
        <ImageUploadField />

        {form.itemType === 'campaign' ? (
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
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Estimated Price ($) <span className="text-near-black/30 font-normal">(optional)</span></Label>
              <Input
                id="goalAmount"
                name="goalAmount"
                type="number"
                step="0.01"
                value={form.goalAmount}
                onChange={handleChange}
                placeholder="49.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalUrl">Product Link <span className="text-near-black/30 font-normal">(optional)</span></Label>
              <Input
                id="externalUrl"
                name="externalUrl"
                type="url"
                value={form.externalUrl}
                onChange={handleChange}
                placeholder="https://www.amazon.com/dp/..."
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Platform notice */}
      <div className="mb-8 bg-burgundy-50 border border-burgundy-100 rounded-sm px-5 py-4">
        <p className="font-cormorant text-lg text-burgundy-900 font-light mb-1">
          This platform is made possible by seminarians and priests who set up campaigns.
        </p>
        <p className="font-inter text-sm text-burgundy-800/70 leading-relaxed">
          Hosting, payments, and infrastructure cost real money to run. Adding at least one
          campaign to your registry — we suggest a goal of <strong>$50</strong>, though
          campaigns can be as small as <strong>$25</strong> — helps keep Ad Altare free
          and available for everyone. Thank you for your support.
        </p>
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
            <FormFields />
            {error && <p className="text-red-600 text-sm font-inter">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving || uploading}>
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
            const isWishlist = item.itemType === 'wishlist';
            const pct = isWishlist ? 0 : Math.min(100, Math.round((item.amountRaised / item.goalAmount) * 100));
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <div key={item.id} className="bg-white border border-burgundy-200 rounded-sm p-6">
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <FormFields />
                    {error && <p className="text-red-600 text-sm font-inter">{error}</p>}
                    <div className="flex gap-3">
                      <Button type="submit" size="sm" disabled={saving || uploading}>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </form>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-sm p-5 ${item.isActive ? 'border-near-black/10' : 'border-near-black/5 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Item photo thumbnail */}
                  {item.imageUrl && (
                    <div className="w-16 h-16 rounded-sm border border-near-black/10 overflow-hidden shrink-0">
                      <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-cormorant text-xl text-burgundy-800">{item.name}</h3>
                      {isWishlist && (
                        <Badge variant="muted" className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          Wishlist
                        </Badge>
                      )}
                      {item.category && <Badge variant="muted">{item.category}</Badge>}
                      {!item.isActive && <Badge variant="muted">Hidden</Badge>}
                      {!isWishlist && item.amountRaised >= item.goalAmount && <Badge variant="gold">Funded</Badge>}
                      {isWishlist && item.isPurchased && (
                      <Badge variant="gold">
                        Purchased{item.purchasedAnonymous ? ' (Anonymous)' : item.purchasedByName ? ` by ${item.purchasedByName}` : ''}
                      </Badge>
                    )}
                    </div>
                    {item.description && (
                      <p className="font-inter text-sm text-near-black/50 mb-3">{item.description}</p>
                    )}
                    {isWishlist ? (
                      <div className="space-y-1">
                        {item.goalAmount > 0 && (
                          <p className="font-inter text-xs text-near-black/40">
                            Est. Price: {formatCurrency(item.goalAmount)}
                          </p>
                        )}
                        {item.externalUrl && (
                          <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-inter text-xs text-burgundy-800 hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            {item.externalUrl.length > 50 ? item.externalUrl.slice(0, 50) + '…' : item.externalUrl}
                          </a>
                        )}
                        {item.isPurchased && !item.purchasedAnonymous && item.purchasedByEmail && (
                          <p className="font-inter text-xs text-near-black/40">
                            Email: {item.purchasedByEmail}
                          </p>
                        )}
                        {item.isPurchased && !item.purchasedAnonymous && item.purchasedByPhone && (
                          <p className="font-inter text-xs text-near-black/40">
                            Phone: {item.purchasedByPhone}
                          </p>
                        )}
                        {item.isPurchased && !item.purchasedAnonymous && item.purchasedByAddress && (
                          <p className="font-inter text-xs text-near-black/40">
                            Address: {item.purchasedByAddress}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Progress value={pct} />
                        <div className="flex justify-between text-xs font-inter text-near-black/40">
                          <span>{formatCurrency(item.amountRaised)} raised</span>
                          <span>Goal: {formatCurrency(item.goalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isWishlist && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePurchased(item)}
                        title={item.isPurchased ? 'Mark as not purchased' : 'Mark as purchased'}
                        className="text-xs"
                      >
                        {item.isPurchased ? 'Unmark' : 'Purchased'}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => startEdit(item)} title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleToggle(item)} title={item.isActive ? 'Hide' : 'Show'}>
                      {item.isActive ? <X className="w-3.5 h-3.5 text-near-black/40" /> : <Check className="w-3.5 h-3.5 text-green-600" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Registry Links Section ─────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="mb-4">
          <h2 className="font-cormorant text-2xl text-burgundy-800">External Registry Links</h2>
          <p className="font-inter text-sm text-near-black/50 mt-1">
            Add links to Amazon, Target, or other wishlists. Donors will see these as buttons on your public page.
          </p>
        </div>

        {/* Add link form */}
        <form onSubmit={handleAddLink} className="bg-white border border-near-black/10 rounded-sm p-5 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="linkLabel" className="text-xs">Label</Label>
              <Input
                id="linkLabel"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Amazon Registry"
                required
              />
            </div>
            <div className="flex-[2] space-y-1">
              <Label htmlFor="linkUrl" className="text-xs">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.amazon.com/hz/wishlist/..."
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={linkSaving} size="sm">
                {linkSaving ? 'Adding…' : 'Add Link'}
              </Button>
            </div>
          </div>
          {linkError && <p className="text-red-600 text-sm font-inter mt-2">{linkError}</p>}
        </form>

        {/* Links list */}
        {linksLoading ? (
          <p className="font-inter text-sm text-near-black/40">Loading…</p>
        ) : links.length === 0 ? (
          <p className="font-inter text-sm text-near-black/30 italic">No external registry links yet.</p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="bg-white border border-near-black/10 rounded-sm px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <LinkIcon className="w-4 h-4 text-near-black/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-inter text-sm font-medium text-near-black">{link.label}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-inter text-xs text-near-black/40 hover:text-burgundy-800 truncate block max-w-xs"
                    >
                      {link.url.length > 60 ? link.url.slice(0, 60) + '…' : link.url}
                    </a>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteLink(link.id)}
                  title="Delete link"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
