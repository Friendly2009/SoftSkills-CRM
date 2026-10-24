/** TODO(API): Read the current tenant's license and historical invoices. Server is authoritative. */
export declare function getLicense(): Promise<{
  plan: string;
  expiresAt: string;
  employeeLimit: number;
}>;
/** TODO(API): Return a server-calculated quote before creating any payment. */
export declare function quoteLicense(
  months: number,
): Promise<{ quoteId: string; amount: number; currency: string }>;
/** TODO(API): Start checkout; activate only after verified server-side payment confirmation. */
export declare function startLicenseCheckout(
  quoteId: string,
): Promise<{ url: string }>;
