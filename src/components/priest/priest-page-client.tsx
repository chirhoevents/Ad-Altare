'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegistryItemCard } from './registry-item';
import { GeneralDonation } from './general-donation';
import { DonationModal } from './donation-modal';
import { RsvpFlow } from './rsvp-flow';
import type { RegistryItem } from '@/db/schema';

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
  hasRsvp?: boolean;
}

type ActiveTab = 'about' | 'registry' | 'rsvp';

export function PriestPageClient({ priest, registryItems, hasRsvp = false }: PriestPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('about');
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
                {priestName} hasn't added a bio yet.
              </p>
            )}
          </div>
        )}

        {/* Registry Tab */}
        {activeTab === 'registry' && (
          <div className="space-y-6">
            {registryItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-cormorant text-2xl text-near-black/40 mb-2">
                  No items yet
                </p>
                <p className="font-inter text-sm text-near-black/30">
                  {priestName} hasn't added any registry items.
                </p>
              </div>
            ) : (
              <>
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

                {/* General Fund */}
                <div className="mt-8 pt-8 border-t border-near-black/10">
                  <GeneralDonation
                    onDonate={(amount) => handleDonate(null, amount)}
                    stripeReady={stripeReady}
                    priestName={priestName}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* RSVP Tab */}
        {activeTab === 'rsvp' && (
          <RsvpFlow
            priestId={priest.id}
            priestFirstName={priest.firstName}
            priestLastName={priest.lastName}
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
