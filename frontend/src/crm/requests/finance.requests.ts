/** TODO(API): Atomically add a payment and a ledger entry; deduplicate by requestId. */
export declare function topUpClient(
  clientId: string,
  amount: number,
  requestId: string,
): Promise<{ balance: number; transactionId: string }>;
/** TODO(API): Validate attendance, close a lesson and write charges in one transaction. */
export declare function closeLesson(
  lessonId: string,
  presentClientIds: string[],
  requestId: string,
): Promise<void>;
/** TODO(API): Reverse a payment through an auditable compensating operation. */
export declare function reverseTransaction(
  transactionId: string,
  reason: string,
): Promise<void>;
