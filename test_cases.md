# Web Application Test Cases

## I. User Authentication

### 1. Registration
*   **TC1.1:** Attempt to register with a new, valid username and password.
    *   *Expected:* Registration successful, user prompted to log in.
*   **TC1.2:** Attempt to register with a username that already exists.
    *   *Expected:* Error message indicating username is taken.
*   **TC1.3:** Attempt to register with a blank username or password.
    *   *Expected:* Error message indicating fields are required.

### 2. Login
*   **TC2.1:** Attempt to log in with valid credentials for an existing user.
    *   *Expected:* Login successful, app view is shown, user's data (HC, appliances) loads.
*   **TC2.2:** Attempt to log in with an incorrect password.
    *   *Expected:* Error message indicating invalid credentials.
*   **TC2.3:** Attempt to log in with a non-existent username.
    *   *Expected:* Error message indicating invalid credentials.
*   **TC2.4:** Attempt to log in with blank username or password.
    *   *Expected:* Error message indicating fields are required.

### 3. Logout
*   **TC3.1:** Log in, then click the logout button.
    *   *Expected:* User is logged out, authentication view (login form) is shown. HC/Appliance data is cleared from UI.

### 4. Session Persistence & Access Control
*   **TC4.1:** Log in, close the browser tab, reopen, and navigate to the app.
    *   *Expected:* User remains logged in (or is seamlessly logged in via session).
*   **TC4.2:** Try to access API endpoints that require login (e.g., `/api/heures_creuses`) directly without being logged in (e.g., using Postman or a similar tool, or by manipulating UI if possible).
    *   *Expected:* API returns an unauthorized error.
*   **TC4.3:** After logging out, ensure no user-specific data is visible or accessible in the UI.

## II. "Heures Creuses" (HC) Management (CRUD - perform while logged in)

### 1. Add HC
*   **TC5.1:** Add a new HC period with valid `nom`, `debut` ("HH:MM"), `fin` ("HH:MM").
    *   *Expected:* HC period is added to the list, success message shown.
*   **TC5.2:** Attempt to add an HC period with invalid time format (e.g., "123", "12:345").
    *   *Expected:* Error message, HC not added. (Backend validation)
*   **TC5.3:** Attempt to add an HC period with `fin` time before `debut` time (e.g., Debut 14:00, Fin 12:00 - assuming non-midnight spanning for this simple validation if backend enforces it, otherwise calculation logic handles it).
    *   *Expected:* Behavior depends on backend validation. If allowed, calculation should handle. If not, error message.

### 2. View HC
*   **TC6.1:** After adding multiple HC periods, ensure all are listed correctly.
    *   *Expected:* List displays `nom`, `debut`, `fin` for all user's HC.

### 3. Edit HC
*   **TC7.1:** Select an HC period, click "Edit". Modify its `nom`, `debut`, and `fin` with valid data. Save.
    *   *Expected:* HC period is updated in the list, success message.
*   **TC7.2:** Attempt to edit an HC period with invalid time format for `debut` or `fin`.
    *   *Expected:* Error message, HC not updated.

### 4. Delete HC
*   **TC8.1:** Select an HC period, click "Delete". Confirm.
    *   *Expected:* HC period is removed from the list, success message.

## III. Appliances Management (CRUD - perform while logged in)

### 1. Add Appliance
*   **TC9.1:** Add a new appliance with valid `nom`, `duree` (positive integer), `type` ("debut" or "fin"), `pas` (positive integer).
    *   *Expected:* Appliance is added to the list and main calculation dropdown, success message.
*   **TC9.2:** Attempt to add an appliance with non-integer or negative `duree` or `pas`.
    *   *Expected:* Error message, appliance not added. (Backend validation)
*   **TC9.3:** Attempt to add an appliance with an invalid `type` (e.g., "middle").
    *   *Expected:* Error message, appliance not added. (Backend validation)

### 2. View Appliances
*   **TC10.1:** After adding multiple appliances, ensure all are listed correctly.
    *   *Expected:* List displays all properties for user's appliances. Main dropdown is populated.

### 3. Edit Appliance
*   **TC11.1:** Select an appliance, click "Edit". Modify its properties with valid data. Save.
    *   *Expected:* Appliance is updated in the list and dropdown, success message.
*   **TC11.2:** Attempt to edit an appliance with invalid data (e.g., negative `duree`).
    *   *Expected:* Error message, appliance not updated.

### 4. Delete Appliance
*   **TC12.1:** Select an appliance, click "Delete". Confirm.
    *   *Expected:* Appliance is removed from the list and dropdown, success message.

## IV. Calculation Logic (perform while logged in, with HC and Appliances configured)

*   **Setup Scenarios:**
    *   *Scenario A (Standard Day):* HC1: 14:00-17:00. Appliance1 (A1): Lave-linge, 60min, type "debut", pas 10min.
    *   *Scenario B (Midnight Span):* HC2: 23:00-05:00. Appliance2 (A2): Sèche-linge, 180min, type "fin", pas 30min.
    *   *Scenario C (Multiple Plages):* HC1: 12:00-14:00, HC2: 22:00-02:00. Appliance1 (A1).
    *   *Scenario D (Currently in HC):* HC1: (current time is within this plage). Appliance1 (A1).

*   **TC13.1 (Scenario A):** Current time 10:00. Select A1. Calculate.
    *   *Expected:* Result suggests starting A1 around 14:00 to maximize HC usage. Details on % in HC.
*   **TC13.2 (Scenario B):** Current time 20:00. Select A2. Calculate.
    *   *Expected:* Result suggests an optimal start for A2 so it *finishes* within 23:00-05:00. Details on % in HC.
*   **TC13.3 (Scenario C):** Current time 09:00. Select A1. Calculate.
    *   *Expected:* Result prioritizes the 12:00-14:00 plage. May offer 22:00-02:00 as alternative. Details for both.
*   **TC13.4 (Scenario D):** Current time is 14:30 (within HC1: 14:00-17:00). Select A1. Calculate.
    *   *Expected:* Result suggests immediate start is an option, showing how much of it is in HC. Also provides optimization for the *next* available plage if applicable or if immediate start is not 100% in HC.
*   **TC13.5 (No HC Configured):** Delete all HC. Attempt calculation.
    *   *Expected:* Message indicating no HC are configured.
*   **TC13.6 (No Appliances Configured):** Delete all Appliances. Attempt calculation.
    *   *Expected:* Message indicating no appliances are configured / main dropdown is empty or shows placeholder.
*   **TC13.7 (Appliance `pas`):** Use an appliance with a large `pas` (e.g., 60 min).
    *   *Expected:* Calculation steps reflect this `pas`.
*   **TC13.8 (Appliance `type: fin`):** Test specifically an appliance with `type: "fin"`.
    *   *Expected:* Start time is calculated such that the appliance *finishes* within an HC period.

## V. General UI/UX

*   **TC14.1:** Check responsiveness of forms and display elements on different screen sizes (if browser dev tools allow simulation).
    *   *Expected:* Layout remains usable.
*   **TC14.2:** Ensure all buttons are clickable and provide feedback.
    *   *Expected:* Normal button behavior.
*   **TC14.3:** Check if error messages are clear and disappear/update appropriately.
    *   *Expected:* Good user feedback.
*   **TC14.4:** Check if forms are cleared after successful submissions (e.g., Add HC form).
    *   *Expected:* Forms reset as appropriate.
