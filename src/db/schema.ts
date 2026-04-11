import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const priests = pgTable('priests', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  seminary: text('seminary'),
  diocese: text('diocese'),
  parish: text('parish'),
  ordinationDate: date('ordination_date'),
  firstMassDate: date('first_mass_date'),
  bio: text('bio'),
  profilePhotoUrl: text('profile_photo_url'),
  backgroundPhotoUrl: text('background_photo_url'),
  slug: text('slug').unique().notNull(),
  stripeAccountId: text('stripe_account_id'),
  stripeOnboardingComplete: boolean('stripe_onboarding_complete').default(false).notNull(),
  thankYouTemplate: text('thank_you_template').default(
    'Dear {donor_name},\n\nThank you so much for your generous gift in support of my ordination. Your kindness is a true blessing and means more than words can express.\n\nPlease know that you will be remembered in my prayers, especially at my First Mass.\n\nIn Christ,\nFr. {priest_name}'
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const registryItems = pgTable('registry_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  priestId: uuid('priest_id')
    .references(() => priests.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  goalAmount: integer('goal_amount').notNull(), // in cents
  amountRaised: integer('amount_raised').default(0).notNull(), // in cents
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  priestId: uuid('priest_id')
    .references(() => priests.id, { onDelete: 'cascade' })
    .notNull(),
  registryItemId: uuid('registry_item_id').references(() => registryItems.id, {
    onDelete: 'set null',
  }),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
  amountGross: integer('amount_gross').notNull(), // cents
  platformFee: integer('platform_fee').notNull(), // cents (2% of gross)
  amountNet: integer('amount_net').notNull(), // cents
  donorName: text('donor_name'),
  donorEmail: text('donor_email').notNull(),
  donorAddress: text('donor_address'),
  donorPhone: text('donor_phone'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  thankYouSent: boolean('thank_you_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const priestsRelations = relations(priests, ({ many }) => ({
  registryItems: many(registryItems),
  donations: many(donations),
}));

export const registryItemsRelations = relations(registryItems, ({ one, many }) => ({
  priest: one(priests, {
    fields: [registryItems.priestId],
    references: [priests.id],
  }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  priest: one(priests, {
    fields: [donations.priestId],
    references: [priests.id],
  }),
  registryItem: one(registryItems, {
    fields: [donations.registryItemId],
    references: [registryItems.id],
  }),
}));

// Types
export type Priest = typeof priests.$inferSelect;
export type NewPriest = typeof priests.$inferInsert;
export type RegistryItem = typeof registryItems.$inferSelect;
export type NewRegistryItem = typeof registryItems.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
