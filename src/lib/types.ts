
import { tasks, lists, labels, attachments, activityLogs } from './schema';
import { type InferSelectModel } from 'drizzle-orm';

export type Task = InferSelectModel<typeof tasks>;
export type List = InferSelectModel<typeof lists>;
export type Label = InferSelectModel<typeof labels>;
export type Attachment = InferSelectModel<typeof attachments>;
export type ActivityLogEntry = InferSelectModel<typeof activityLogs>;
