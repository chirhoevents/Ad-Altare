import { NextResponse } from 'next/server';
import { db } from '@/db';
import { priests, registryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createDonationPaymentIntent } from '@/lib/stripe';
import { computePlatformFee } from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({
  priestId: z.string().uuid(),
  registryItemId: z.string().uuid().nullable().optional(),
  amountCents: z.number().int().min(100),
  donorName: z.string().max(200).optional().default(''),
  donorEmail: z.string().email(),
  donorAddress: z.string().max(500).optional().default(''),
  donorPhone: z.string().max(30).optional().default(''),
  isAnonymous: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const {
    priestId,
    registryItemId,
    amountCents,
    donorName,
    donorEmail,
    donorAddress,
    donorPhone,
    isAnonymous,
  } = parsed.data;

  // Fetch priest
  const priest = await db.query.priests.findFirst({
    where: eq(priests.id, priestId),
  });

  if (!priest) {
    return NextResponse.json({ error: 'Priest not found' }, { status: 404 });
  }

  if (!priest.stripeAccountId || !priest.stripeOnboardingComplete) {
    return NextResponse.json(
      { error: 'This priest has not connected Stripe yet.' },
      { status: 400 }
    );
  }

  // Validate registry item if provided
  let itemName: string | null = null;
  if (registryItemId) {
    const item = await db.query.registryItems.findFirst({
      where: eq(registryItems.id, registryItemId),
    });
    if (!item || item.priestId !== priestId) {
      return NextResponse.json({ error: 'Registry item not found' }, { status: 404 });
    }
    itemName = item.name;
  }

  const platformFee = computePlatformFee(amountCents);
  const amountNet = amountCents - platformFee;

  const paymentIntent = await createDonationPaymentIntent({
    amountCents,
    platformFeeCents: platformFee,
    connectedAccountId: priest.stripeAccountId,
    metadata: {
      priestId,
      registryItemId: registryItemId ?? '',
      itemName: itemName ?? '',
      donorName: isAnonymous ? '' : donorName,
      donorEmail,
      donorAddress: isAnonymous ? '' : donorAddress,
      donorPhone: isAnonymous ? '' : donorPhone,
      isAnonymous: isAnonymous.toString(),
      platformFee: platformFee.toString(),
      amountNet: amountNet.toString(),
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
