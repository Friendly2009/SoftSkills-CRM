import type { Activity, Entity } from "../interfaces/common";
/** TODO(API): Read an authorized entity's audit timeline with cursor pagination. */
export declare function getActivity(
  entity: Entity,
  id: string,
  cursor?: string,
): Promise<{ items: Activity[]; nextCursor?: string }>;
/** TODO(API): Append a comment using the server-authenticated author and timestamp. */
export declare function addComment(
  entity: Entity,
  id: string,
  text: string,
): Promise<Activity>;
