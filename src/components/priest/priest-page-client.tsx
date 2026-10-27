'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RegistryItemCard } from './registry-item';
import { GeneralDonation } from './general-donation';
import { DonationModal } from './donation-modal';
import { RsvpFlow } from './rsvp-flow';
import type { RegistryItem, RegistryLink } from '@/db/schema';

// Only the fields the public page actually needs — sensitive fields (email, phone,
// stripeAccountId, clerkUserId, platformFeeOverride, etc.) are stripped server-side
// before this component receives them, so they never appear in the browser payload.
interface PublicPriestData {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  stripeReady: boolean; // computed server-side; never expose the raw stripeAccountId
  displayTitle: string; // computed server-side from ordinationDate/currentTitle
}

interface PriestPageClientProps {
  priest: PublicPriestData;
  registryItems: RegistryItem[];
  registryLinks: RegistryLink[];
  hasRsvp?: boolean;
  paymentReturnStatus?: string | null;
}

type ActiveTab = 'about' | 'registry' | 'rsvp';

export function PriestPageClient({
  priest,
  registryItems,
  registryLinks,
  hasRsvp = false,
  paymentReturnStatus = null,
}: PriestPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ActiveTab>(paymentReturnStatus ? 'registry' : 'about');
  const [returnBanner, setReturnBanner] = useState(paymentReturnStatus);

  // Strip Stripe's return params so a refresh doesn't re-show the banner.
  useEffect(() => {
    if (paymentReturnStatus) router.replace(pathname, { scroll: false });
  }, [paymentReturnStatus, pathname, router]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
  const [donationAmount, setDonationAmount] = useState(0);

  const { stripeReady } = priest;
  const priestName = priest.displayTitle
    ? `${priest.displayTitle} ${priest.firstName} ${priest.lastName}`
    : `${priest.firstName} ${priest.lastName}`;

  function handleDonate(item: RegistryItem | null, amount: number) {
    setSelectedItem(item);
    setDonationAmount(amount);
    setModalOpen(true);
  }

  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-near-black/10 bg-cream sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {(['about', 'registry', ...(hasRsvp ? ['rsvp'] : [])] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 font-inter text-sm capitalize tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-burgundy-800 text-burgundy-800 font-medium'
                  : 'border-transparent text-near-black/50 hover:text-near-black'
              }`}
            >
              {tab === 'about'
                ? priest.displayTitle
                  ? `About ${priest.displayTitle} ${priest.firstName}`
                  : `About ${priest.firstName}`
                : tab === 'rsvp' ? 'RSVP' : 'Registry'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {returnBanner && (
          <div
            className={`mb-8 rounded-sm border px-4 py-3 flex items-start justify-between gap-4 ${
              returnBanner === 'failed'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-gold-50 border-gold-200 text-near-black'
            }`}
          >
            <p className="font-inter text-sm">
              {returnBanner === 'succeeded'
                ? 'Thank you! Your donation was received. A confirmation email is on its way.'
                : returnBanner === 'processing'
                  ? 'Thank you! Your payment is processing — you\'ll receive a confirmation email once it completes.'
                  : 'Your payment was not completed and you have not been charged. Please try again.'}
            </p>
            <button
              onClick={() => setReturnBanner(null)}
              className="font-inter text-xs text-near-black/50 hover:text-near-black shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="max-w-2xl">
            {priest.bio ? (
              <div className="prose prose-lg font-inter text-near-black/70 leading-relaxed">
                {priest.bio.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <p className="font-inter text-near-black/40 italic">
                {priestName} hasn&apos;t added a bio yet.
              </p>
            )}
          </div>
        )}

        {/* Registry Tab */}
        {activeTab === 'registry' && (
          <div className="space-y-6">
            {/* External registry links (Amazon, Target, …) show even with no items */}
            {registryLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {registryLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-inter text-sm border border-burgundy-800/30 text-burgundy-800 px-4 py-2 rounded-sm hover:bg-burgundy-800 hover:text-cream transition-colors"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            )}

            {registryItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-cormorant text-2xl text-near-black/40 mb-2">
                  No items yet
                </p>
                <p className="font-inter text-sm text-near-black/30">
                  {priestName} hasn&apos;t added any registry items.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registryItems.map((item) => (
                  <RegistryItemCard
                    key={item.id}
                    item={item}
                    priestFirstName={priest.firstName}
                    onDonate={(item, amount) => handleDonate(item, amount)}
                    stripeReady={stripeReady}
                  />
                ))}
              </div>
            )}

            {/* General Fund — only when the priest accepts gifts directly (Stripe) */}
            {stripeReady && (
              <div className="mt-8 pt-8 border-t border-near-black/10">
                <GeneralDonation
                  onDonate={(amount) => handleDonate(null, amount)}
                  stripeReady={stripeReady}
                  priestName={priestName}
                />
              </div>
            )}
          </div>
        )}

        {/* RSVP Tab */}
        {activeTab === 'rsvp' && (
          <RsvpFlow
            priestId={priest.id}
            priestName={priestName}
          />
        )}
      </div>

      {/* Donation Modal */}
      <DonationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPaymentComplete={() => router.refresh()}
        priestId={priest.id}
        priestName={priestName}
        item={selectedItem}
        amount={donationAmount}
      />
    </>
  );
}
