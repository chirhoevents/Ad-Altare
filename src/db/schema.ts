import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  doublePrecision,
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
  currentTitle: text('current_title').default('Seminarian').notNull(), // 'Seminarian' | 'Transitional Deacon' | 'Deacon' | 'Father' (Father is auto-assigned by date logic, never self-selected)
  stripeAccountId: text('stripe_account_id'),
  stripeOnboardingComplete: boolean('stripe_onboarding_complete').default(false).notNull(),
  platformFeeOverride: integer('platform_fee_override'), // null = default 1%, 0 = waived, N = N%
  profileVisible: boolean('profile_visible').default(false).notNull(),
  thankYouTemplate: text('thank_you_template').default(
    'Dear {donor_name},\n\nThank you so much for your generous gift of {amount} in support of my ordination. Your contribution toward {item_name} is a true blessing and means more than words can express.\n\nPlease know that you will be remembered in my prayers, especially at my First Mass.\n\nIn Christ,\nFr. {priest_name}'
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
  category: text('category'),
  description: text('description'),
  imageUrl: text('image_url'),
  goalAmount: integer('goal_amount').notNull(), // in cents
  amountRaised: integer('amount_raised').default(0).notNull(), // in cents
  isActive: boolean('is_active').default(true).notNull(),
  itemType: text('item_type').default('campaign').notNull(), // 'campaign' | 'wishlist'
  externalUrl: text('external_url'),
  isPurchased: boolean('is_purchased').default(false).notNull(),
  purchasedByName: text('purchased_by_name'),
  purchasedByPhone: text('purchased_by_phone'),
  purchasedAnonymous: boolean('purchased_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const registryLinks = pgTable('registry_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  priestId: uuid('priest_id').references(() => priests.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(), // e.g. "Amazon Registry", "Target Registry"
  url: text('url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
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
  platformFee: integer('platform_fee').notNull(), // cents (1% of gross)
  amountNet: integer('amount_net').notNull(), // cents
  donorName: text('donor_name'),
  donorEmail: text('donor_email').notNull(),
  donorAddress: text('donor_address'),
  donorPhone: text('donor_phone'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  feePercentUsed: doublePrecision('fee_percent_used').default(1.0).notNull(), // actual % charged (1 = 1%, 0 = waived)
  thankYouSent: boolean('thank_you_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  priestId: uuid('priest_id')
    .references(() => priests.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  location: text('location').notNull(),
  rsvpEnabled: boolean('rsvp_enabled').default(false).notNull(),
  rsvpDeadline: date('rsvp_deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventQuestions = pgTable('event_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(), // 'text' | 'yes_no' | 'select'
  options: text('options').array(), // for 'select' type
  isRequired: boolean('is_required').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const guestList = pgTable('guest_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  priestId: uuid('priest_id')
    .references(() => priests.id, { onDelete: 'cascade' })
    .notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  inviteCount: integer('invite_count').default(1).notNull(),
  address: text('address'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rsvps = pgTable('rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  guestId: uuid('guest_id')
    .references(() => guestList.id, { onDelete: 'cascade' })
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  attending: boolean('attending').notNull(),
  partySize: integer('party_size').notNull(),
  questionResponses: jsonb('question_responses'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueGuestEvent: uniqueIndex('unique_guest_event_idx').on(table.guestId, table.eventId),
}));

// ─── Relations ───────────────────────────────────────────────────────────────

export const priestsRelations = relations(priests, ({ many }) => ({
  registryItems: many(registryItems),
  donations: many(donations),
  events: many(events),
  guestList: many(guestList),
  registryLinks: many(registryLinks),
}));

export const registryItemsRelations = relations(registryItems, ({ one, many }) => ({
  priest: one(priests, { fields: [registryItems.priestId], references: [priests.id] }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  priest: one(priests, { fields: [donations.priestId], references: [priests.id] }),
  registryItem: one(registryItems, { fields: [donations.registryItemId], references: [registryItems.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  priest: one(priests, { fields: [events.priestId], references: [priests.id] }),
  questions: many(eventQuestions),
  rsvps: many(rsvps),
}));

export const eventQuestionsRelations = relations(eventQuestions, ({ one }) => ({
  event: one(events, { fields: [eventQuestions.eventId], references: [events.id] }),
}));

export const guestListRelations = relations(guestList, ({ one, many }) => ({
  priest: one(priests, { fields: [guestList.priestId], references: [priests.id] }),
  rsvps: many(rsvps),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  guest: one(guestList, { fields: [rsvps.guestId], references: [guestList.id] }),
  event: one(events, { fields: [rsvps.eventId], references: [events.id] }),
}));

export const registryLinksRelations = relations(registryLinks, ({ one }) => ({
  priest: one(priests, { fields: [registryLinks.priestId], references: [priests.id] }),
}));

// ─── Types ───────────────────────────────────────────────────────────────────

export type Priest = typeof priests.$inferSelect;
export type NewPriest = typeof priests.$inferInsert;
export type RegistryItem = typeof registryItems.$inferSelect;
export type NewRegistryItem = typeof registryItems.$inferInsert;
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventQuestion = typeof eventQuestions.$inferSelect;
export type GuestListEntry = typeof guestList.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;
export type RegistryLink = typeof registryLinks.$inferSelect;
export type NewRegistryLink = typeof registryLinks.$inferInsert;
