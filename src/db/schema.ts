import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('user').notNull(), // 'admin' or 'user'
  isBanned: boolean('is_banned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const surveys = pgTable('surveys', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  rewardPoints: integer('reward_points').default(0).notNull(),
  expiryDate: timestamp('expiry_date'),
  eligibility: text('eligibility'),
  category: text('category'),
  estimatedCompletionTime: integer('estimated_completion_time'), // in minutes
  status: text('status').default('draft').notNull(), // 'draft', 'active', 'closed'
  repeatable: boolean('repeatable').default(false).notNull(),
  content: jsonb('content'), // JSON containing survey questions/structure
  brandId: integer('brand_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const surveyResponses = pgTable('survey_responses', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => surveys.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  responseData: jsonb('response_data').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  completedAt: timestamp('completed_at').defaultNow(),
});

export const redemptions = pgTable('redemptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  provider: text('provider').notNull(), // Amazon, Flipkart, Google Play, Xoxoday
  amount: integer('amount').notNull(), // 250, 500
  pointsCost: integer('points_cost').notNull(), // 2500, 5000
  status: text('status').default('pending').notNull(), // pending, approved, rejected
  code: text('code'), // the actual gift card code
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  surveyResponses: many(surveyResponses),
  redemptions: many(redemptions),
}));

export const surveysRelations = relations(surveys, ({ many }) => ({
  responses: many(surveyResponses),
}));

export const surveyResponsesRelations = relations(surveyResponses, ({ one }) => ({
  survey: one(surveys, {
    fields: [surveyResponses.surveyId],
    references: [surveys.id],
  }),
  user: one(users, {
    fields: [surveyResponses.userId],
    references: [users.id],
  }),
}));
