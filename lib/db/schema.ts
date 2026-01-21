import { pgTable, text, timestamp, boolean, integer, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  version: integer('version').default(1),
  lastModified: integer('last_modified').default(0),
  syncStatus: text('sync_status').default('synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  version: integer('version').default(1),
  lastModified: integer('last_modified').default(0),
  syncStatus: text('sync_status').default('synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').default('medium'),
  dueDate: timestamp('due_date'),
  dueTime: text('due_time'),
  isImportant: boolean('is_important').default(false),
  isCompleted: boolean('is_completed').default(false),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  googleEventId: text('google_event_id'),
  googleCalendarId: text('google_calendar_id'),
  calendarEventId: text('calendar_event_id'),
  order: integer('order').default(0),
  version: integer('version').default(1),
  lastModified: integer('last_modified').default(0),
  syncStatus: text('sync_status').default('synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subtasks = pgTable('subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  isCompleted: boolean('is_completed').default(false),
  dueDate: timestamp('due_date'),
  dueTime: text('due_time'),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  googleEventId: text('google_event_id'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taskTags = pgTable('task_tags', {
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.tagId] }),
}));

export type User = InferSelectModel<typeof users>;
export type Project = InferSelectModel<typeof projects>;
export type Tag = InferSelectModel<typeof tags>;
export type Task = InferSelectModel<typeof tasks>;
export type Subtask = InferSelectModel<typeof subtasks>;
