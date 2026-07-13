import type { RequestStatus } from '@ec-group/contracts';
import { InvalidStatusTransitionError } from './request-status.error';

/**
 * Domain model of a purchase request, guarding its status lifecycle.
 *
 * Encapsulates the single business invariant that matters for review: a request
 * may be approved or rejected **only** while it is `Pending`. Any attempt to
 * review an already-decided request raises {@link InvalidStatusTransitionError}.
 *
 * The model owns transition rules only; persistence and DTO mapping live in the
 * repository and service layers.
 */
export class PurchaseRequestModel {
  private constructor(
    /** Request id. */
    public readonly id: string,
    /** Current lifecycle status. */
    private status: RequestStatus,
  ) {}

  /**
   * Rebuild the model from a persisted status.
   *
   * @param id - Request id.
   * @param status - Status loaded from the database.
   */
  static fromPersistence(id: string, status: RequestStatus): PurchaseRequestModel {
    return new PurchaseRequestModel(id, status);
  }

  /** Current status of the request. */
  get currentStatus(): RequestStatus {
    return this.status;
  }

  /**
   * Approve the request.
   *
   * @returns The new status (`Approved`).
   * @throws {InvalidStatusTransitionError} When the request is not `Pending`.
   */
  approve(): RequestStatus {
    this.assertPending('Approved');
    this.status = 'Approved';
    return this.status;
  }

  /**
   * Reject the request.
   *
   * @returns The new status (`Rejected`).
   * @throws {InvalidStatusTransitionError} When the request is not `Pending`.
   */
  reject(): RequestStatus {
    this.assertPending('Rejected');
    this.status = 'Rejected';
    return this.status;
  }

  /** Guard: a review transition is only legal from the `Pending` state. */
  private assertPending(targetStatus: RequestStatus): void {
    if (this.status !== 'Pending') {
      throw new InvalidStatusTransitionError(this.status, targetStatus);
    }
  }
}
