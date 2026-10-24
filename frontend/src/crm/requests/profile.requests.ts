import type { MockDatabase } from "../interfaces/common";
/** TODO(API): Fetch the current profile; do not accept a user id from a local session claim. */
export declare function getProfile(): Promise<MockDatabase["profile"]>;
/** TODO(API): Update permitted personal fields and return the canonical profile. */
export declare function updateProfile(
  profile: MockDatabase["profile"],
): Promise<MockDatabase["profile"]>;
/** TODO(API): Retrieve current user's notifications and mark selected ids read. */
export declare function getNotifications(): Promise<
  MockDatabase["notifications"]
>;
export declare function readNotifications(ids: string[]): Promise<void>;
