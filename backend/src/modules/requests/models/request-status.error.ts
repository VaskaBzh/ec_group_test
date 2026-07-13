import type { RequestStatus } from '@ec-group/contracts';

/**
 * Raised when a status transition violates the purchase-request lifecycle.
 *
 * A pure domain error carrying no HTTP concerns — the exception filter maps it
 * to a `409 Conflict`. Thrown by {@link PurchaseRequestModel} when `approve()`
 * or `reject()` is attempted from a non-`Pending` state.
 */
export class InvalidStatusTransitionError extends Error {
  constructor(
    /** Status the request was in when the transition was attempted. */
    public readonly currentStatus: RequestStatus,
    /** Status the transition tried to reach. */
    public readonly targetStatus: RequestStatus,
  ) {
    super(
      `Cannot change request status from ${currentStatus} to ${targetStatus}: only Pending requests can be reviewed`,
    );
    this.name = 'InvalidStatusTransitionError';
  }
}
