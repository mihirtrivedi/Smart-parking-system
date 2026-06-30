# Smart Parking Lot - Edge Cases & Handling Strategies

This document lists potential edge cases and anomalous scenarios for the Smart Parking Lot Backend System, along with strategies to handle them.

## 1. Concurrency and Race Conditions
- **Scenario:** Two cars enter at the exact same millisecond and there is only one `MEDIUM` spot left.
- **Handling:** Handled in Phase 4 via **Pessimistic Locking** (`FOR UPDATE SKIP LOCKED`). The first transaction acquires the lock, the second transaction skips it and realizes 0 spots are available, throwing a `409 Conflict` or returning a "Parking Lot Full" message.

## 2. Capacity Constraints
- **Scenario:** The parking lot is completely full for a specific vehicle size.
- **Handling:** The Spot Allocation Strategy should return a null/empty response. The API must gracefully handle this by returning a `404 Not Found` or `422 Unprocessable Entity` with a message `"No spots available for your vehicle type."`
- **Sub-scenario (Upgrading Spots):** A Motorcycle can park in `SMALL`, `MEDIUM`, or `LARGE` spots. The algorithm must check `SMALL` first, fallback to `MEDIUM`, and then to `LARGE`. 

## 3. Duplicate States (Idempotency)
- **Scenario:** A vehicle with license plate `ABC-1234` is already checked in, but the terminal sends another `check-in` request.
- **Handling:** Query the `ticket` table for any `ACTIVE` tickets associated with that license plate. If one exists, reject the new check-in request with `400 Bad Request` (`"Vehicle already checked in."`).
- **Scenario:** The exit terminal sends two rapid `check-out` requests for the same ticket.
- **Handling:** Ensure the check-out transaction checks if the ticket status is `ACTIVE`. If it's already `COMPLETED`, return a `400 Bad Request` (`"Ticket already processed/paid."`).

## 4. Time and Pricing Anomalies
- **Scenario (Grace Period):** A user checks in, realizes they forgot something, and checks out 2 minutes later. Do they pay for a full hour?
- **Handling:** Introduce a grace period (e.g., 15 minutes). If `ExitTime - EntryTime <= 15 mins`, the fee should be $0.
- **Scenario (Clock Skew):** The server clock resets or drifts, making `ExitTime` earlier than `EntryTime`.
- **Handling:** Add validation during check-out. If `ExitTime < EntryTime`, fail the transaction and log an alert for manual intervention, or use a reliable NTP (Network Time Protocol) synced monotonic clock.

## 5. System Failures
- **Scenario (Database Disconnect):** The database goes down while a vehicle is entering.
- **Handling:** The API should timeout gracefully and return a `500 Internal Server Error` to the terminal so the terminal can instruct the driver to wait or seek manual assistance. Never return a partial ticket.
- **Scenario (Partial Transaction Failure):** The spot is marked `OCCUPIED`, but generating the `ticket` fails.
- **Handling:** Database Transactions (ACID). If the ticket fails to generate, the entire transaction rolls back, and the spot returns to `AVAILABLE`.

## 6. Long-Term Abandonment
- **Scenario:** A car stays parked for 6 months.
- **Handling:** The fee calculation could potentially result in an astronomical number, or exceed maximum decimal limits. Implement a daily cron job that flags tickets older than 30 days for administrative review.
