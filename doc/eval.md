# Smart Parking Lot - Phase-Wise Evaluation Criteria

This document outlines the success metrics and evaluation criteria for each phase of the implementation plan defined in `implementationPlan.md`.

## Phase 1: Foundation & Data Layer
**Evaluation Criteria:**
- **Schema Correctness:** The database schema correctly reflects the architecture. `vehicle`, `parking_spot`, and `ticket` tables exist with correct data types, enums, and foreign key relationships.
- **Seeding:** The database seeding script executes successfully without errors, inserting a realistic spread of `SMALL`, `MEDIUM`, and `LARGE` spots across multiple floors.
- **Connection:** The application can successfully connect to the database on startup.

## Phase 2: Core Business Logic
**Evaluation Criteria:**
- **Allocation Rules:** Unit tests prove that Motorcycles fall back to Medium/Large spots if Small spots are full, while Buses are strictly rejected if Large spots are full.
- **Proximity Sorting:** The query/algorithm consistently returns the spot with the lowest `floor_number` and `spot_number`.
- **Fee Calculation:** Unit tests for `FeeCalculationStrategy` pass, explicitly checking:
  - Exact hourly bounds (e.g., exactly 60 minutes vs. 61 minutes).
  - Proper strategy selection based on `VehicleType`.
  - Application of grace period rules (e.g., $0 for <15 minutes).

## Phase 3: REST APIs & Controllers
**Evaluation Criteria:**
- **Endpoint Contracts:** `/check-in`, `/check-out`, and `/availability` accurately match the request/response JSON schemas defined in `architecture.md`.
- **HTTP Status Codes:**
  - `200/201 OK` for successful operations.
  - `400 Bad Request` for invalid payloads (e.g., missing license plate).
  - `404/409/422` if no spots are available.
- **State Mutation:** Checking in properly changes a spot's status to `OCCUPIED`. Checking out changes it back to `AVAILABLE`.

## Phase 4: Concurrency & Transaction Management
**Evaluation Criteria:**
- **Race Condition Prevention:** A load test (e.g., using JMeter or Apache Bench) firing 50 concurrent `/check-in` requests when only 1 spot is available results in exactly **1 success** and **49 rejections**.
- **Transactional Integrity:** Simulating an exception mid-way through a `/check-in` operation results in a complete database rollback (no spot is permanently locked without a corresponding ticket).

## Phase 5: Testing & Production Readiness
**Evaluation Criteria:**
- **Test Coverage:** Overall code coverage (Unit + Integration tests) is > 80%.
- **Containerization:** Running `docker-compose up` successfully boots the database, runs migrations, and starts the API server on the configured port.
- **Documentation:** An interactive API documentation page (e.g., Swagger UI) is accessible and accurately describes all endpoints, request bodies, and possible error codes.
