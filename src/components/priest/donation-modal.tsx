'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import type { RegistryItem } from '@/db/schema';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Step = 'form' | 'payment' | 'success';

interface DonorForm {
  name: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isAnonymous: boolean;
}

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentComplete?: () => void;
  priestId: string;
  priestName: string;
  item: RegistryItem | null;
  amount: number;
}

function PaymentStep({
  clientSecret,
  onSuccess,
  onBack,
  amount,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onBack: () => void;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="bg-burgundy-50 border border-burgundy-100 rounded-sm px-4 py-3">
        <p className="font-inter text-sm text-burgundy-800">
          Donating <strong>{formatCurrency(amount)}</strong>
        </p>
      </div>

      <PaymentElement />

      {error && (
        <p className="text-red-600 text-sm font-inter">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={!stripe || loading}>
          {loading ? 'Processing…' : `Pay ${formatCurrency(amount)}`}
        </Button>
      </div>
    </form>
  );
}

export function DonationModal({
  open,
  onClose,
  onPaymentComplete,
  priestId,
  priestName,
  item,
  amount,
}: DonationModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<DonorForm>({
    name: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    isAnonymous: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  /** Build a single mailing address string from the individual fields */
  function buildAddress(): string {
    const parts = [
      form.streetAddress,
      form.city,
      form.state && form.zip ? `${form.state} ${form.zip}` : (form.state || form.zip),
    ].filter(Boolean);
    return parts.join(', ');
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priestId,
          registryItemId: item?.id ?? null,
          amountCents: amount,
          donorName: form.name,
          donorEmail: form.email,
          donorAddress: form.isAnonymous ? null : buildAddress(),
          donorPhone: form.isAnonymous ? null : form.phone,
          isAnonymous: form.isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to initialize payment');
      }

      const { clientSecret: secret } = await res.json();
      setClientSecret(secret);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setStep('form');
    setClientSecret(null);
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-near-black/10">
          <DialogTitle>
            {step === 'success' ? 'Thank You!' : `Support Fr. ${priestName}`}
          </DialogTitle>
          {item && step === 'form' && (
            <DialogDescription>
              Contributing toward: <strong>{item.name}</strong> · {formatCurrency(amount)}
            </DialogDescription>
          )}
          {!item && step === 'form' && (
            <DialogDescription>
              General fund donation · {formatCurrency(amount)}
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">

            {/* Anonymous toggle — first, so it controls what shows below */}
            <div className="flex items-center gap-3 pb-1 border-b border-near-black/5">
              <Switch
                id="anonymous"
                checked={form.isAnonymous}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    isAnonymous: checked,
                    name: checked ? '' : prev.name,
                  }))
                }
              />
              <Label htmlFor="anonymous" className="cursor-pointer normal-case text-sm text-near-black/70">
                Donate anonymously
              </Label>
            </div>

            {/* Name — hidden when anonymous */}
            {!form.isAnonymous && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>
            )}

            {/* Email — always required */}
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
                For your donation receipt only. Never shared without permission.
              </p>
            </div>

            {/* Address + Phone — hidden when anonymous */}
            {!form.isAnonymous && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
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

            {error && (
              <p className="text-red-600 text-sm font-inter">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Preparing payment…' : 'Continue to Payment'}
            </Button>
          </form>
        )}

        {step === 'payment' && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#6B1E2E',
                  colorBackground: '#ffffff',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  borderRadius: '2px',
                },
              },
            }}
          >
            <PaymentStep
              clientSecret={clientSecret}
              amount={amount}
              onSuccess={() => setStep('success')}
              onBack={() => setStep('form')}
            />
          </Elements>
        )}

        {step === 'success' && (
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
              Your donation of {formatCurrency(amount)} has been received.
              A confirmation has been sent to {form.email}.
            </p>
            <Button
              onClick={() => {
                handleClose();
                onPaymentComplete?.();
              }}
              variant="secondary"
              className="mt-2"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
