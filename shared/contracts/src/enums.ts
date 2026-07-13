import { z } from 'zod';

/**
 * Role assigned to a user, controlling access across the application.
 *
 * Values mirror the Prisma `UserRole` enum exactly so the same literal strings
 * flow unchanged from the database through the backend to the frontend.
 *
 * - `Requester` — creates and submits purchase requests.
 * - `Reviewer` — reviews requests and approves or rejects them.
 */
export const UserRoleSchema = z.enum(['Requester', 'Reviewer']);

/** User role literal, inferred from {@link UserRoleSchema}. */
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Lifecycle status of a purchase request.
 *
 * Values mirror the Prisma `RequestStatus` enum exactly.
 *
 * - `Pending` — awaiting review (initial status).
 * - `Approved` — accepted by a reviewer.
 * - `Rejected` — declined by a reviewer.
 */
export const RequestStatusSchema = z.enum(['Pending', 'Approved', 'Rejected']);

/** Purchase request status literal, inferred from {@link RequestStatusSchema}. */
export type RequestStatus = z.infer<typeof RequestStatusSchema>;
