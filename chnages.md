# Comprehensive Performance & RBAC Hardening Changes Report

This document records the exact details of the optimizations, security hardening, and user role/policy management additions across the **Provisioning Service (`ra-wlan-cloud-owprov`)** and **Frontend UI (`ra-wlan-cloud-owprov-ui`)** relative to their respective `main` branches.

---

## 1. Core Mechanics: How RBAC is Achieved Using Roles & Policies

The Role-Based Access Control (RBAC) model is split between organizational scoping and permission policies:

1. **Management Policies (`managementPolicy`)**:
   - Define a list of `entries`. Each entry maps a list of resource types (e.g., `entity`, `venue`, `inventory`, `device`, `user`) to an authorization level (e.g., `READ`, `MODIFY`, `DELETE`, `CREATE`, `NOACCESS`).
2. **Management Roles (`managementRole`)**:
   - Act as the binding agent between:
     - **Users**: A list of user IDs assigned to this role.
     - **Scope**: A specific `entity` (and optional sub-`venue`) defining the spatial boundaries of the permission.
     - **Permissions**: The assigned `managementPolicy`.

### Request Authorization Execution flow (REST API):
- When a standard user sends a request, `RESTAPIHandler::RoleIsAuthorized` resolves the target context (which `entity` or `venue` ID is requested).
- It looks up the user's roles from the `AuthCache`.
- It matches a role corresponding to the target context's entity/venue scope.
- It fetches the associated `ManagementPolicy` and checks if the HTTP method mapped to that resource (e.g., `GET` maps to `READ`/`LIST`, `POST`/`PUT` to `MODIFY`/`CREATE`) is permitted.

---

## 2. Backend (`ra-wlan-cloud-owprov`) Detailed Changes

### Issue 2.1: Context-Aware Authorization Failure (Reordering)
- **Before (Main Branch)**: Target context parameters (like `?entity=UUID`) were parsed *after* the authorization check was executed, causing the check to always fail for standard users due to missing context.
- **Now**: Reordered `ParseParameters()` to execute before `RoleIsAuthorized()` in the base REST handler pipeline.

### Issue 2.2: Redundant DB Lookup Bottleneck (Performance Optimization)
- **Before (Main Branch)**: Every request resolved roles and policies by making multiple synchronous SQL database calls to target tables.
- **Now**: 
  - Introduced `AuthCache` using a thread-safe `std::shared_mutex` to store role lists and policies.
  - Caches roles **user-wise** using a `std::map<std::string, CachedUser>` keyed by `userId` to minimize memory overhead; roles are only lazy-loaded from the database on a user's first request (cache miss).
  - Uses read/write lock synchronization (concurrent `std::shared_lock` for cache reads, exclusive `std::unique_lock` for writes and cache clearing).

### Issue 2.3: In-Memory Role Filtering
- **Before (Main Branch)**: `FindExistingRole` generated SQL queries to filter roles directly on the database on every lookup request:
  ```cpp
  std::string WhereClause = "entity='" + entityId + "' and venue='" + venueId + "'";
  StorageService()->RolesDB().GetRecords(0, 500, Roles, WhereClause);
  ```
- **Now**: Replaced SQL generation with in-memory iteration over cached role lists:
  ```cpp
  for (const auto &role : CachedRoles) {
      if (role.entity == entityId && role.venue == venueId) {
          ExistingRole = role;
          return true;
      }
  }
  ```

### Issue 2.4: Mutating Cache Invalidation
- **Before (Main Branch)**: Modifications to roles and policies updated SQL tables but left cached permissions out of sync.
- **Now**: Intercepted create, update, and delete endpoints in `RESTAPI_managementRole_handler.cpp` and `RESTAPI_managementPolicy_handler.cpp` to run `AuthCache::GetInstance()->Clear()` synchronously.

### Issue 2.5: Scope Visibility Leakage (List Endpoints)
- **Before (Main Branch)**: Standard users calling list endpoints returned all entries in the database database-wide.
- **Now**: Standard users only retrieve resources within their boundary.
  - **Entity Listing (`DoGet`)**: Standard users only see their assigned entity and descendants resolved recursively.
  - **Venue Listing (`DoGet`)**: Returns only venues associated with allowed descendant entities.
  - **Inventory Listing (`DoGet`)**: Filters device tags to match allowed descendant entity or venue scopes.

---

## 3. Frontend UI (`ra-wlan-cloud-owprov-ui`) Detailed Changes

### Issue 3.1: Sidebar Route Permissions Refactoring
- **Before (Main Branch)**:
  - The `/users` route was visible to all management roles under a generic top-level sidebar link.
  - No Policy Management view existed for administrative users.
- **Now**:
  - Grouped administration views inside a nested sidebar group `users-group` restricted only to `root` and `system` users. This group contains:
    - **Users List** (`/users`)
    - **Policies Management** (`/policies`)
  - A fallback route `/users` is kept for standard roles (`partner`, `admin`, `csr`) so they can access basic user views without policy access.

### Issue 3.2: Context-Aware User Creation Modal Form
- **Before (Main Branch)**:
  - Creating a user only submitted fields to create the security account (email, name, role, password).
  - No role scope or policy mapping could be selected during user creation.
- **Now**:
  - Added new dropdown fields to the User Creation Form: `Scope Type` (None / Entity / Venue), `Select Entity`, `Select Venue`, and `Select Policy`.
  - When submitting a new user, the frontend automatically intercepts the successful creation, generates a UUID for a new `ManagementRole`, and POSTs it to the provisioning API:
    ```javascript
    const newRole = {
      id: uuid(),
      name: `${formData.name}_role`,
      description: `Access role for user ${formData.name}`,
      managementPolicy: formData.scopePolicy,
      users: [createdUserId],
      entity: formData.scopeEntity,
      venue: formData.scopeType === 'venue' ? formData.scopeVenue : '',
    };
    await axiosProv.post(`managementRole/${newRole.id}`, newRole);
    ```

### Issue 3.3: Access Policy Tab on User Editing Modal Form
- **Before (Main Branch)**:
  - Editing a user only had "Main" and "Notes" tabs. No visibility or editing of their assigned tenant scopes was available.
- **Now**:
  - Added an **"Access Policy"** tab to the User Edit Form.
  - Integrated the `<ManagementRolesTable userId={selectedUser.id} />` component inside this tab, enabling admins to view, add, or delete the specific entity/venue scopes and policies linked to the user.

### Issue 3.4: Policies Management Page (`/policies`)
- **Before (Main Branch)**: No dedicated interface existed to manage policies.
- **Now**: Added a fully functional Policies Management Page (`src/pages/PoliciesPage`) featuring:
  - A policy list table with granular resource capability displays.
  - `CreatePolicyModal` and `EditPolicyModal` components to manage policy configurations and permissions.

---

## 4. Multi-Entity/Tenant Visibility Scoping Support

### Issue 4.1: Single Role Limitation on Multi-Tenant Lists
- **Before (Main Branch)**: Standard users assigned to multiple management roles (i.e., multiple entity scopes) only had the first role processed because handlers resolved scope via `FindAnyRole()`. This hid all other assigned entities, venues, and inventory tags.
- **Now**: 
  - Added the `FindAllUserRoles()` helper in `RESTAPIHandler` to query all roles linked to the user's ID using `AuthCache`.
  - Refactored list endpoints to query and merge descendants across the union of all assigned entities.

### Issue 4.2: Merging Disjoint Trees in the UI Modal
- **Before (Main Branch)**: Standard users with multiple assigned entities only saw the first entity's subtree in the "Entity and Venue Navigation" dropdown modal.
- **Now**: 
  - If a user has exactly one assigned entity, the handler returns its subtree directly.
  - If a user has multiple assigned entities, the handler dynamically constructs a virtual root node:
    ```json
    {
      "type": "entity",
      "name": "Assigned Entities",
      "uuid": "0000-0000-0000",
      "children": [ ...subtrees... ],
      "venues": []
    }
    ```
    This groups all disjoint tenant trees under a unified top-level node, allowing the frontend recursive renderer to display all of them correctly.

---

## 5. Entity Nesting Hierarchy Restrictions

### Issue 5.1: Nesting Entities Under Normal Entities
- **Before (Main Branch)**: Sub-entities could be created under any parent entity arbitrarily. This allowed nesting child entities under normal entities, creating complex multi-tier setups that violated scope isolation rules.
- **Now**: 
  - Standardized nesting constraints:
    1. A normal entity can only be created directly under the Root node.
    2. An operator entity is automatically created under the Root node during operator creation.
    3. Nesting sub-entities is only allowed if the parent entity belongs to an operator hierarchy (i.e. descends from an operator entity). Sub-entities cannot be nested under normal entities.
  - Implemented the `IsInsideOperatorHierarchy()` helper to recursively walk up the parent hierarchy chain to search for a non-empty `operatorId`.
  - Added a check in `RESTAPI_entity_handler::DoPost()`: if the parent is not the root node and is not within an operator's hierarchy, the creation is rejected with a `400 Bad Request` returning `RESTAPI::Errors::InvalidEntityType` ("Invalid entity type.").

### Issue 5.2: 403 Access Denied when Creating a Child Entity
- **Before (Main Branch)**: When a standard user (like `sumit`) tried to create a child entity under their assigned operator entity, the UI made a request `POST /api/v1/entity/0` (using the dummy ID `"0"` as a creation placeholder). The RBAC framework resolved the `TargetEntity` to `"0"` (an invalid, unauthorized resource scope) instead of looking at the target `parent` UUID specified in the body. This caused the request to be rejected with a `403 Forbidden` (`ACCESS_DENIED`).
- **Now**:
  - Refactored `RESTAPIHandler::ResolveTargetContext()` to ignore the dummy creation ID `"0"` during path-based context extraction.
  - Added a fallback to check the request's JSON body: if `parent` is defined and `TargetEntity` is empty, it resolves the context to the parent entity or parent venue. This maps the RBAC check to the correct parent hierarchy, authorizing the user's role on their assigned scope.


---

## 6. Automated Creator Role Seeding & Deletion Cleanup

### Issue 6.1: Access Denied After Creating Entity/Venue
- **Before (Main Branch)**: When standard users successfully created child entities or venues under their assigned parent scope, they lacked immediate management access to the new resource because no role granted them explicit authorization. This resulted in `403 Forbidden` (`ACCESS_DENIED`) errors when trying to read or modify the newly created resource.
- **Now**:
  - Implemented `RESTAPIHandler::AutoCreateCreatorRole()` to automatically clone the creator's role policy from the parent resource and assign it to a new `ManagementRole` specifically linked to the newly created entity/venue.
  - Automatically registers the new role in the DB, updates parent resource memberships, updates the policy usage counts, and clears `AuthCache` to apply permissions instantly.
  - Injected this call into `RESTAPI_entity_handler::DoPost` and `RESTAPI_venue_handler::DoPost`.

### Issue 6.2: Orphaning Roles and Policies on Entity/Venue Deletion
- **Before (Main Branch)**: When deleting an entity or venue, any management roles linked to them remained orphaned in the database, polluting the database and leaving policy usage counters out of sync.
- **Now**:
  - Refactored `RESTAPI_entity_handler::DoDelete` and `RESTAPI_venue_handler::DoDelete` to clean up associated management roles.
  - For every role linked in the resource's `managementRoles` array, the handler deletes the role from the database, corrects policy usage count, cleans up memberships, and invalidates `AuthCache`.

### Issue 6.3: Restoring Hierarchical RBAC Traversal (Downward Permission Inheritance)
- **Before**: A strict flat access model required explicit role assignments on every child entity and venue, leading to DB pollution and operational overhead.
- **Now**: Restored hierarchical downward traversal inside `RESTAPIHandler::FindExistingRole`. If a user attempts to access a child resource and lacks a direct role mapping on it, the system recursively walks up the parent chain (venue parent links first, then entity parent links up to the root) to find an ancestor role assignment. It validates permissions using this resolved ancestor role, fully eliminating the need for duplicate role seeding on subtrees while leveraging `AuthCache` for high-performance checks. Also fixed a loop boundary condition to ensure that role assignments configured directly on the root entity (`0000-0000-0000`) are checked during the walk-up before the loop terminates.

---

## 7. Policies Management Visibility and Modal View additions

### Issue 7.1: UI Sidebar Visibility of Policies for Standard Users
- **Before**: Only `root` and `system` users could access the Policies page. Standard users could not see or navigate to the Policies page.
- **Now**: Refactored `routes.tsx` to expose the `users-group` sidebar accordion group and `/policies` route to all user roles (`partner`, `admin`, `csr`, `root`, `system`). Standard users can now see and access the Policies page.

### Issue 7.2: Restricting Policy Creation & Modifications
- **Before**: Any user on the Policies page could see edit/delete controls, or access the Create action.
- **Now**: Added role checks to `Table.tsx`. Hides the "Create Policy" button and hides the entire "Actions" column (Edit/Delete controls) in the table layout if the logged-in user is not a `root` or `system` user.

### Issue 7.3: Reusing Edit Modal for Read-Only Policy Visibility on Row Click
- **Before**: Standard users could see the policy list but could not inspect what specific resources and permission levels were configured for a policy, as the editing screen was restricted.
- **Now**: Configured `DataTable` to support row clicks (`onRowClick`) triggering the policy modal. Refactored `EditPolicyModal` to check the current user's role: if the user is not root/system, it disables all input fields, textareas, preset dropdowns, and capability selects. It also dynamically sets the header to "View Management Policy" and replaces the "Save" button with a single "Close" button.

---

## 8. Operator Visibility Access Controls

### Issue 8.1: Unrestricted Operator Visibility (Security Leakage)
- **Before**: Standard users calling `/api/v1/operator` or `/api/v1/operator/UUID` could list or retrieve any operator configuration in the system, even if the operator was completely unrelated to the user's assigned scope.
- **Now**: 
  - Gated the `RESTAPI_operators_list_handler::DoGet` and `RESTAPI_operators_handler::DoGet` handlers with a hierarchy scope lookup.
  - If a user is not a `root` or `system` administrator:
    1. The handler queries all roles assigned to the user to compile their scoped entity list.
    2. For each assigned entity, the handler walks up the entity hierarchy using the parent fields to find a descendant of an operator (resolving the parent entity containing the `operatorId`).
    3. The list of allowed operator IDs is built from these matches.
    4. Only operators whose IDs are in this allowed set are returned (list requests filter matching results, count requests return the scoped count, and single-record GET requests return `403 Forbidden` if unauthorized).
  - Admins with `root` or `system` roles, as well as users assigned a management role directly on the Root Entity (`0000-0000-0000`), continue to have full visibility across all operators.

---

## 9. User Creation Form & Scope Selection Flow

### Issue 9.1: Scope Fields in Create User Modal
- **Before**: Creating a user required selecting `scopeType`, `scopeEntity`, `scopeVenue`, and `scopePolicy` in the creation modal, complicating the form.
- **Now**: 
  - Removed all scope selection dropdowns and validation schemas from the `CreateUserForm` component.
  - On successful user creation, the system triggers the `onCreateSuccess` callback, automatically opening the `EditUserModal` for the newly created user.
  - Added a `defaultTab` prop to `EditUserModal` and `UpdateUserForm` so that the modal defaults directly to the "Access Policy" tab (index 2) upon auto-opening, allowing the admin to assign scopes seamlessly immediately after creation.

### Issue 9.2: Access Policy Form Toggle and Button Renaming
- **Before**: The scope assignment form under the "Access Policy" tab was always visible, cluttering the view, and the action button was labeled `+ Assign Scope`.
- **Now**:
  - Hid the "Assign New Entity or Venue Scope" form behind a new `Create New Policy` button that toggles form visibility.
  - Renamed the submit button from `+ Assign Scope` to `Save` and removed the plus icon for a cleaner interface.
  - Automatically collapses the form space on successful scope save, showing only the updated list of assigned policies.

---

## 10. Descriptive Entity Creation Error Popups

### Issue 10.1: Generic Error Messages on Invalid Entity Nesting
- **Before**: Creating an entity under another normal entity (which is not allowed) resulted in a generic message like `"1064: Invalid entity type."` returning `400 Bad Request`.
- **Now**: Updated the backend framework constant `InvalidEntityType` in `ow_constants.h` to output a detailed message: `"An entity can only be created under the Root Entity or under an Operator Entity. Deep nesting of normal entities is not allowed."`. The frontend now catches and surfaces this backend-defined detail inside the toast popup modal for clearer user diagnostics.

---

## 11. IAM Navigation Sidebar Renaming & Localization

### Issue 11.1: Sidebar Group Labeling and Policy Labels
- **Before**: The sidebar dropdown group containing User and Policy items was labeled "Access Management" (and its translations), and Policies was referred to as "Management Policy".
- **Now**:
  - Changed the main user-management dropdown group in the navigation menu to `"IAM"` across all translation locale files (English, German, French, Spanish, Portuguese).
  - Renamed the "Management Policy" sub-item to "Policies" under `policies.title` in all language files.

---

## 12. Dynamic Sidebar Flex Layout for Bottom Panels

### Issue 12.1: Navigation Height & Bottom Panels Overlap
- **Now**:
  - Configured the items Box in `Sidebar/index.tsx` to use `flex={children ? "0 1 auto" : "1"}` so it sizes itself dynamically according to contents when children are rendered in the bottom.
  - Set the bottom panel container to `flex={children ? "1 1 auto" : undefined} minH={0}` so it takes up all remaining available sidebar height and supports clean expansion.

---

## 13. Entity Tree Venue Double-Rendering Fix

### Issue 13.1: Sub-Venues Duplicated at Entity Level and Under Parent Venue
- **Now**: Refactored the `BuildTree` iteration in `storage_entity.cpp` to only process venues where `parent` is empty (top-level venues). Sub-venues are cleanly filtered out at the entity root level, since they are already fetched recursively and rendered inside their respective parent nodes via `AddVenues`.

---

## 14. Hierarchical Access Policy Resolution

### Issue 14.1: Policy Lookup Downward Inheritance
- **Before**: The authorization check only performed single-level checks, meaning users needed direct role assignments on child entities and venues.
- **Now**: Re-implemented the hierarchical parent-walk in `RESTAPIHandler::FindExistingRole`.
  - For venues: Recursively walks up the parent venue chain to look for a matching role. If none is found, falls back to the host entity's parent chain.
  - For entities: Recursively walks up the entity parent chain to the Root entity to inherit roles.
  - Keeps organizational entity level creation restricted to at most three levels (Top/Root Entity, Operator Entity, and Entity) in the creation handler, while allowing venues to be nested to any depth.




