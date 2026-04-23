'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import type { RegistryItem } from '@/db/schema';

interface RegistryItemCardProps {
  item: RegistryItem;
  priestFirstName: string;
  onDonate: (item: RegistryItem, amount: number) => void;
  stripeReady: boolean;
}

interface PurchaserForm {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isAnonymous: boolean;
}

const emptyPurchaserForm: PurchaserForm = {
  name: '',
  email: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  isAnonymous: false,
};

function buildAddress(form: PurchaserForm): string {
  const parts = [
    form.streetAddress,
    form.city,
    form.state && form.zip ? `${form.state} ${form.zip}` : (form.state || form.zip),
  ].filter(Boolean);
  return parts.join(', ');
}

function WishlistItemCard({ item, stripeReady }: { item: RegistryItem; stripeReady: boolean }) {
  const [purchased, setPurchased] = useState(item.isPurchased);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PurchaserForm>(emptyPurchaserForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function openModal() {
    setForm(emptyPurchaserForm);
    setError(null);
    setSuccess(false);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/public/registry/${item.id}/purchased`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchasedAnonymous: form.isAnonymous,
        purchasedByName: form.isAnonymous ? undefined : form.name || undefined,
        purchasedByEmail: form.isAnonymous ? undefined : form.email || undefined,
        purchasedByPhone: form.isAnonymous ? undefined : form.phone || undefined,
        purchasedByAddress: form.isAnonymous ? undefined : buildAddress(form) || undefined,
      }),
    });

    if (res.ok) {
      setPurchased(true);
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <>
      <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
        {item.imageUrl && (
          <div className="relative w-full h-48 bg-near-black/5">
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800">{item.name}</h3>
              {item.category && (
                <span className="font-inter text-xs uppercase tracking-widest text-near-black/40 mt-0.5 block">
                  {item.category}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="muted">Wishlist</Badge>
              {purchased && <Badge variant="gold">Purchased</Badge>}
            </div>
          </div>

          {item.description && (
            <p className="font-inter text-sm text-near-black/60 mb-4 leading-relaxed">{item.description}</p>
          )}

          {item.goalAmount > 0 && (
            <div className="mb-4">
              <span className="font-inter text-xs uppercase tracking-widest text-near-black/40">Est. Price</span>
              <p className="font-cormorant text-xl text-burgundy-800 mt-0.5">{formatCurrency(item.goalAmount)}</p>
            </div>
          )}

          {/* Buttons */}
          {!stripeReady ? (
            <div className="space-y-2">
              <Button className="w-full" disabled variant="secondary">
                Registry Coming Soon
              </Button>
              <p className="font-inter text-xs text-near-black/40 text-center">
                This priest is still setting up their registry.
              </p>
            </div>
          ) : purchased ? (
            <Button className="w-full" disabled variant="secondary">
              Already Purchased ✓
            </Button>
          ) : (
            <div className="space-y-3">
              {item.externalUrl ? (
                <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button className="w-full">View &amp; Purchase →</Button>
                </a>
              ) : (
                <p className="font-inter text-sm text-near-black/30 italic text-center py-2">Link coming soon</p>
              )}

              <button
                type="button"
                onClick={openModal}
                className="w-full font-inter text-xs text-near-black/40 hover:text-burgundy-800 transition-colors text-center py-1 underline underline-offset-2"
              >
                Already purchased this? Let the priest know →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Purchased confirmation modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="p-0 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="p-6 pb-2 border-b border-near-black/10">
            <DialogTitle>
              {success ? 'Thank You!' : 'Mark as Purchased'}
            </DialogTitle>
            {!success && (
              <DialogDescription>
                {item.name} — let the priest know you purchased this so he can send a thank-you.
              </DialogDescription>
            )}
          </DialogHeader>

          {success ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-cormorant text-2xl text-burgundy-800">
                God bless your generosity
              </h3>
              <p className="font-inter text-sm text-near-black/60 leading-relaxed">
                Thank you for letting us know! The priest will be so grateful for your gift.
              </p>
              <Button onClick={closeModal} variant="secondary" className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Anonymous toggle — at the top, controls what shows below */}
              <div className="flex items-center gap-3 pb-1 border-b border-near-black/5">
                <Switch
                  id="isAnonymous"
                  checked={form.isAnonymous}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isAnonymous: checked, name: checked ? '' : prev.name }))
                  }
                />
                <Label htmlFor="isAnonymous" className="cursor-pointer normal-case text-sm text-near-black/70">
                  Stay anonymous
                </Label>
              </div>

              {!form.isAnonymous && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs font-inter text-near-black/40">
                      So the priest can send a thank-you email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">
                      Street Address <span className="text-near-black/30 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="streetAddress"
                      name="streetAddress"
                      value={form.streetAddress}
                      onChange={handleChange}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Boston"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="MA"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={form.zip}
                      onChange={handleChange}
                      placeholder="02101"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-near-black/30 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-red-600 text-sm font-inter">{error}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || (!form.isAnonymous && (!form.name.trim() || !form.email.trim()))}
              >
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RegistryItemCard({ item, priestFirstName, onDonate, stripeReady }: RegistryItemCardProps) {
  const [customAmount, setCustomAmount] = useState('');

  // ── Wishlist item rendering ──────────────────────────────────────────────
  if (item.itemType === 'wishlist') {
    return <WishlistItemCard item={item} stripeReady={stripeReady} />;
  }

  // ── Campaign item rendering ──────────────────────────────────────────────
  const pct = Math.min(100, Math.round((item.amountRaised / item.goalAmount) * 100));
  const isFunded = item.amountRaised >= item.goalAmount;
  const remaining = item.goalAmount - item.amountRaised;
  const hasStarted = item.amountRaised > 0;

  function handleFullyFund() {
    if (isFunded) return;
    onDonate(item, remaining);
  }

  function handleCustomDonate() {
    const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : null;
    if (!amount || amount < 100) return;
    onDonate(item, amount);
  }

  return (
    <div className="bg-white border border-near-black/10 rounded-sm overflow-hidden">
      {item.imageUrl && (
        <div className="relative w-full h-48 bg-near-black/5">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-cormorant text-2xl font-semibold text-burgundy-800">
              {item.name}
            </h3>
            {item.category && (
              <span className="font-inter text-xs uppercase tracking-widest text-near-black/40 mt-0.5 block">
                {item.category}
              </span>
            )}
          </div>
          {isFunded ? (
            <Badge variant="gold" className="shrink-0">Fully Funded</Badge>
          ) : (
            <Badge variant="muted" className="shrink-0">{pct}% funded</Badge>
          )}
        </div>

        {item.description && (
          <p className="font-inter text-sm text-near-black/60 mb-4 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <Progress
            value={pct}
            className="mb-2"
            indicatorClassName={isFunded ? 'bg-gold-600' : 'bg-burgundy-800'}
          />
          <div className="flex justify-between text-xs font-inter text-near-black/50">
            {isFunded ? (
              <span className="text-gold-600 font-medium">
                Fully Funded · {formatCurrency(item.amountRaised)} raised of {formatCurrency(item.goalAmount)} goal
              </span>
            ) : (
              <>
                <span>{formatCurrency(item.amountRaised)} raised</span>
                <span>Goal: {formatCurrency(item.goalAmount)}</span>
              </>
            )}
          </div>
        </div>

        {/* Donate controls */}
        {stripeReady ? (
          <div className="space-y-3">
            {/* Fully Fund button */}
            {isFunded ? (
              <>
                <Button className="w-full" disabled variant="secondary">
                  Fully Funded ✓
                </Button>
                <p className="font-inter text-xs text-near-black/50 italic text-center">
                  This item is fully funded — consider a gift to the General Fund below.
                </p>
              </>
            ) : (
              <Button onClick={handleFullyFund} className="w-full">
                {hasStarted
                  ? `Fully Fund (${formatCurrency(remaining)} remaining)`
                  : `Fully Fund (${formatCurrency(item.goalAmount)})`}
              </Button>
            )}

            {/* Custom amount */}
            {!isFunded && (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-near-black/40 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Or enter a custom amount"
                    value={customAmount}
                    min="1"
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-near-black/20 rounded-sm text-sm font-inter focus:outline-none focus:ring-2 focus:ring-burgundy-800"
                  />
                </div>
                <Button
                  onClick={handleCustomDonate}
                  className="w-full"
                  variant="outline"
                  disabled={!customAmount}
                >
                  Donate Custom Amount
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" disabled variant="secondary">
              Registry Coming Soon
            </Button>
            <p className="font-inter text-xs text-near-black/40 text-center">
              This priest is still setting up their registry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
