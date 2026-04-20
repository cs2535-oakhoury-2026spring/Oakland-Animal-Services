# Admin User Guide - Oakland Animal Services Portal

## Overview

This guide is for **administrators** at Oakland Animal Services who manage user accounts, system configuration, and security. As an admin, you have full access to all portal features plus additional administrative capabilities.

---

## Table of Contents

1. [Admin Responsibilities](#admin-responsibilities)
2. [User Management](#user-management)
3. [Activity Logging and Auditing](#activity-logging-and-auditing)
4. [Location Management](#location-management)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting User Issues](#troubleshooting-user-issues)

---

## Admin Responsibilities

### Your Role

As an administrator, you are responsible for:

**User Account Lifecycle**:
- Creating new user accounts
- Setting appropriate roles and permissions
- Managing volunteer expiration dates
- Resetting passwords when requested
- Deactivating accounts when needed

**System Security**:
- Monitoring activity logs for suspicious behavior
- Enforcing password policies
- Managing access control
- Responding to security incidents

**Data Integrity**:
- Ensuring proper note attribution
- Auditing bulk operations
- Monitoring system usage
- Maintaining kennel location data

**User Support**:
- Assisting with login issues
- Training new users
- Documenting procedures
- Escalating technical issues

---

## User Management

### Accessing User Management

**[SCREENSHOT: User dropdown menu with "User Management" option]**

1. Click your **username** (top right)
2. Select **"User Management"**
3. User management screen loads

**[SCREENSHOT: User management screen overview]**

### Understanding User Roles

**[SCREENSHOT: Role comparison table]**

| Feature | Device | Volunteer | Staff | Admin |
|---------|--------|-----------|-------|-------|
| View animals | No | Yes | Yes | Yes |
| Create notes | No | Yes | Yes | Yes |
| Edit/delete notes | No | No | Yes | Yes |
| Change note status | No | No | Yes | Yes |
| AI summaries | No | No | Yes | Yes |
| View activity logs (notes) | No | No | Yes | Yes |
| View activity logs (auth) | No | No | No | Yes |
| User management | No | No | No | Yes |
| Location management | No | No | No | Yes |
| Force password change | No | No | No | Yes |

**Role Descriptions**:

**Device**:
- API-only access for automated systems
- No web interface login
- Cannot be created through web UI (backend only)

**Volunteer**:
- Time-limited field access
- Can view and create notes
- Cannot edit/delete after submission
- Account expires on specified date

**Staff**:
- Full operational access
- Manage all animal data and notes
- View note-related activity logs
- No user management capabilities

**Admin**:
- Everything staff can do
- Plus user account management
- Plus full activity log access
- Plus system configuration

### Creating a New User

**[SCREENSHOT: "Create User" button]**

1. On User Management screen, click **"+ Create User"**
2. Modal opens with form

**[SCREENSHOT: Create user modal]**

**Fill out fields**:

**Username** (required):
- 3-30 characters
- Letters, numbers, underscore, hyphen only
- No spaces
- Must be unique
- Example: `jsmith`, `volunteer_2024`, `dr-johnson`

**Display Name** (optional):
- Friendly name shown in UI
- Can include spaces
- Example: "Dr. Sarah Johnson", "John (Volunteer)"

**Email** (optional but recommended):
- For future password reset features
- Not currently used for notifications
- Example: `jsmith@oaklandanimalservices.org`

**Role** (required):
- Select from dropdown: Volunteer, Staff, Admin
- Cannot create Device accounts via UI

**Password** (required):
- Auto-generated secure password shown
- Copy and send to user securely
- User must change on first login

**Expires At** (for Volunteers only):
- Date when account automatically deactivates
- Format: YYYY-MM-DD or use date picker
- Leave blank for Staff/Admin (no expiration)
- Example: `2024-12-31` for end-of-year volunteer

**[SCREENSHOT: Volunteer account with expiration date set]**

**Step 3: Review and Create**

1. Double-check all information
2. Click **"Create User"**
3. Success message appears
4. User added to table

**[SCREENSHOT: Success message with credentials]**

**Important**: Copy the generated password and send it to the new user through a secure channel (in person, encrypted email, or password manager).

### Creating Multiple Users (Batch Import)

For large volunteer groups, use batch import to create many accounts at once.

**[SCREENSHOT: "Batch Import" button]**

1. Click **"Batch Import"** button
2. Modal opens with CSV template

**[SCREENSHOT: Batch import modal]**

**Step 1: Download Template**

Click **"Download CSV Template"** to get format:

```csv
username,displayName,email,role,expiresAt
jdoe,John Doe,jdoe@email.com,volunteer,2024-12-31
ssmith,Sarah Smith,ssmith@email.com,volunteer,2024-12-31
mjones,Mike Jones,mjones@email.com,staff,
```

**CSV Format Rules**:
- First row is headers (required)
- `username` - required, unique
- `displayName` - optional
- `email` - optional
- `role` - required, must be: volunteer, staff, or admin (lowercase)
- `expiresAt` - optional, YYYY-MM-DD format

**Step 2: Prepare Your CSV**

1. Open template in Excel or Google Sheets
2. Fill in user data (one user per row)
3. Save as CSV file
4. Verify formatting is correct

**Step 3: Upload CSV**

1. Click **"Choose File"** or drag-and-drop
2. Select your CSV file
3. Click **"Import Users"**
4. System validates and creates accounts

**[SCREENSHOT: Batch import success showing created accounts]**

**Step 4: Export Credentials**

1. Click **"Download Credentials"** button
2. CSV file downloads with usernames and temporary passwords
3. Distribute securely to new users

**Batch Import Validation**:
- Duplicate usernames are skipped
- Invalid roles cause row to fail
- Invalid dates cause row to fail
- Errors are reported per-row
- Valid rows are created even if some fail

### Viewing and Searching Users

**[SCREENSHOT: User management table with search]**

**User Table Columns**:
- **Username**: Login identifier
- **Display Name**: Friendly name
- **Role**: Volunteer, Staff, Admin
- **Email**: Contact email
- **Expires**: Expiration date (volunteers only)
- **Created**: Account creation date
- **Actions**: Edit, Reset Password, Delete

**Search Users**:
1. Use search box at top of table
2. Type username or display name
3. Results filter in real-time

**Filter by Role**:
- Click role filter dropdown
- Select: All, Volunteers, Staff, Admins
- Table updates instantly

**Sort by Column**:
- Click column header to sort
- Click again to reverse order
- Sorts by: username, role, expiration, created date

### Editing User Accounts

**[SCREENSHOT: Edit user button in actions column]**

1. Find user in table
2. Click **"Edit"** button (pencil icon)
3. Modal opens with current values

**[SCREENSHOT: Edit user modal]**

**You can change**:
- Display name
- Email
- Role (Volunteer ↔ Staff ↔ Admin)
- Expiration date (for volunteers)

**You cannot change**:
- Username (permanent identifier)
- Created date (historical record)

**Common scenarios**:

**Extending volunteer access**:
1. Edit volunteer account
2. Update "Expires At" to new date
3. Save changes
4. User can continue accessing portal

**Promoting volunteer to staff**:
1. Edit volunteer account
2. Change role from "Volunteer" to "Staff"
3. Remove expiration date (leave blank)
4. Save changes

**Demoting staff to volunteer**:
1. Edit staff account
2. Change role from "Staff" to "Volunteer"
3. Set expiration date
4. Save changes

### Resetting User Passwords

**[SCREENSHOT: Reset password button in actions]**

When a user forgets their password or needs a new one:

1. Find user in table
2. Click **"Reset Password"** button (key icon)
3. Confirmation modal appears

**[SCREENSHOT: Reset password confirmation]**

4. Click **"Reset Password"**
5. New temporary password generated
6. Copy password and send to user securely

**[SCREENSHOT: New password shown in modal]**

**Important**:
- User's old password stops working immediately
- New password is shown once (copy it!)
- User must change password on next login
- Password reset is logged in activity log

### Deleting User Accounts

**[SCREENSHOT: Delete user button in actions]**

**When to delete**:
- Volunteer term ended (prefer: let account expire naturally)
- Staff member left organization
- Duplicate account created by mistake
- Security concern requires immediate access removal

**How to delete**:
1. Find user in table
2. Click **"Delete"** button (trash icon)
3. Confirmation modal appears

**[SCREENSHOT: Delete user confirmation warning]**

**Warning message**:
```
Are you sure you want to delete user "jsmith"?

This action:
- Immediately revokes all access
- Preserves all notes created by this user
- Cannot be undone
- Is logged in activity log

Consider setting an expiration date instead if this is a volunteer.
```

4. Type username to confirm
5. Click **"Delete User"**

**What happens**:
- User cannot log in immediately
- All notes by this user remain in system (author preserved)
- Activity log entries remain visible
- Deletion is logged with your admin username

**Best practice**: For volunteers, set expiration dates rather than deleting. This maintains better audit trail and allows re-activation if needed.

---

## Activity Logging and Auditing

Activity logs provide a complete audit trail of meaningful system events.

### Accessing Activity Logs

**[SCREENSHOT: User dropdown with "Activity Log" option]**

1. Click your **username** (top right)
2. Select **"Activity Log"**
3. Activity log screen loads

**[SCREENSHOT: Activity log screen with filters]**

### Understanding Log Entries

Each log entry shows:
- **Timestamp**: When the action occurred (newest first)
- **Actor**: Who performed the action
- **Action**: What they did (CREATED, DELETED, etc.)
- **Tag**: Category (behaviorNote, observerNote, authEvent)
- **Details**: Additional context (expand to see)

**[SCREENSHOT: Sample log entries with details expanded]**

### Event Types

**behaviorNote** (Behavioral Observations):
- `CREATED` - New behavior note added
- `DELETED` - Behavior note removed
- `BULK_DELETED` - Multiple behavior notes deleted (by pet)

**observerNote** (Medical Observations):
- `CREATED` - New medical note added
- `DELETED` - Medical note removed
- `STATUS_CHANGED` - Note status changed (Raised ↔ Resolved)
- `BULK_DELETED` - Multiple medical notes deleted (by pet)

**authEvent** (Admin-only):
- `PASSWORD_CHANGED` - User changed their password
- `PASSWORD_RESET` - Admin reset user's password
- `USER_CREATED` - New user account created
- `USER_UPDATED` - User account modified (role, expiration, etc.)
- `USER_DELETED` - User account deleted

**Not logged** (intentionally):
- Logins/logouts (too noisy)
- Token refreshes (automatic)
- Animal views (read-only)
- Search queries (too frequent)

### Filtering Activity Logs

**[SCREENSHOT: Activity log filter interface]**

**Filter by Tag**:
- **All**: Show everything
- **Notes**: behaviorNote + observerNote (staff can see these)
- **Auth Events**: authEvent only (admin-only, staff blocked)
- **Behavior Notes**: behaviorNote only
- **Observer Notes**: observerNote only

**Filter by Actor**:
1. Click **"Filter by User"** dropdown
2. Select specific username
3. See only their actions

**Filter by Action**:
1. Click **"Filter by Action"** dropdown
2. Select: CREATED, DELETED, STATUS_CHANGED, etc.
3. See only that action type

**Filter by Date Range**:
1. Click **"From"** date picker
2. Select start date
3. Click **"To"** date picker
4. Select end date
5. Logs filter to date range

**[SCREENSHOT: Date range picker in action]**

**Combine Filters**:
- Filters work together (AND logic)
- Example: `Actor=jsmith + Action=DELETED + Tag=observerNote`
- Shows only medical notes deleted by jsmith

### Common Audit Scenarios

**"Who deleted this note?"**
1. Filter by Action: DELETED
2. Filter by Tag: observerNote or behaviorNote
3. Search results for relevant timestamp
4. Expand details to see note content

**"What did this user do today?"**
1. Filter by Actor: [username]
2. Filter by Date Range: Today
3. Review all their actions

**"Who has been creating accounts?"**
1. Filter by Tag: authEvent
2. Filter by Action: USER_CREATED
3. See all account creations

**"Track down suspicious activity"**
1. Filter by Date Range: [suspicious timeframe]
2. Filter by Actor: [suspected user]
3. Review all their actions
4. Check for unusual patterns

**"Audit volunteer activity before expiration"**
1. Filter by Actor: [volunteer username]
2. Review all notes created
3. Verify quality before account expires

### Exporting Logs

**[SCREENSHOT: Export button on activity log screen]**

For external audits or long-term archival:

1. Apply desired filters
2. Click **"Export"** button
3. CSV file downloads with visible entries

**CSV includes**:
- Timestamp (ISO 8601 format)
- Actor (username)
- Action type
- Tag
- Full JSON details

**Use cases**:
- Annual security audits
- Compliance reporting
- Backup of critical changes
- Analysis in Excel/Sheets

### Access Control for Activity Logs

**Staff access**:
- Can view `behaviorNote` and `observerNote` logs
- **Cannot** view `authEvent` logs
- Blocked with 403 Forbidden if attempting to view auth events

**Admin access**:
- Can view all tags including `authEvent`
- No restrictions

**Why separate permissions?**:
- Auth events contain sensitive info (password resets, account changes)
- Only admins need visibility into account management
- Separates operational (notes) from administrative (users) concerns

---

## Location Management

Location management allows admins to configure kennel locations and ensure QR codes point to correct URLs.

### Accessing Location Management

**[SCREENSHOT: User dropdown with "Locations" option]**

1. Click your **username** (top right)
2. Select **"Locations"**
3. Location management screen loads

**[SCREENSHOT: Location management screen]**

### Viewing Kennel Locations

**[SCREENSHOT: Location list table]**

Table shows:
- **Type**: Dog, Cat, Other
- **Location**: Kennel identifier (e.g., "E:5", "Cat W:12")
- **QR Code**: View or regenerate
- **Animals**: How many animals currently at location
- **Actions**: Edit, Delete, Print QR

### Adding a New Location

**[SCREENSHOT: "Add Location" button]**

1. Click **"+ Add Location"**
2. Modal opens with form

**[SCREENSHOT: Add location modal]**

**Fill out fields**:

**Type** (required):
- Select: Dog, Cat, or Other
- Determines which section of shelter

**Location** (required):
- Kennel identifier (e.g., "E:5", "North:12")
- Must be unique within type
- Case-insensitive
- Format: `[Section]:[Number]` or custom

**Examples**:
- Dog kennels: `E:1`, `E:2`, `W:1`, `North:3`
- Cat kennels: `Cat A:7`, `Kitten Room:2`
- Other: `Small Animals:1`, `Isolation:1`

3. Click **"Add Location"**
4. QR code generated automatically

### Generating QR Codes

**[SCREENSHOT: QR code display and download]**

For each location, QR code encodes:
```
https://portal.oaklandanimalservices.org/?type=dog&location=e:5
```

**To view/download QR code**:
1. Click **"View QR"** button for location
2. Modal shows QR code
3. Click **"Download PNG"** for printing

**[SCREENSHOT: QR code download modal]**

**Printing QR codes**:
1. Download PNG file
2. Open in image editor or Word
3. Resize to ~2 inches square
4. Print on waterproof label paper
5. Apply to kennel door

**Best practices**:
- Print at high quality (300+ DPI)
- Use waterproof/laminated labels
- Position at eye level on kennel door
- Include human-readable text below QR code
- Replace damaged codes immediately

### Editing Locations

**[SCREENSHOT: Edit location button]**

1. Find location in table
2. Click **"Edit"** button
3. Modal opens with current values

**You can change**:
- Type (Dog ↔ Cat ↔ Other)
- Location identifier

**Warning**: Changing location identifier may break existing QR codes. Regenerate and reprint after editing.

### Deleting Locations

**[SCREENSHOT: Delete location confirmation]**

**When to delete**:
- Kennel permanently removed
- Shelter layout changed
- Duplicate location created by mistake

**How to delete**:
1. Click **"Delete"** button
2. Confirm deletion

**Warning**: Cannot delete locations with animals currently assigned. Transfer animals first.

### Bulk Import Locations

For setting up new shelter sections:

**[SCREENSHOT: Bulk import locations modal]**

1. Click **"Bulk Import"** button
2. Download CSV template
3. Fill in locations (one per row)
4. Upload CSV
5. QR codes generated for all

**CSV format**:
```csv
type,location
dog,E:1
dog,E:2
dog,E:3
cat,Cat A:1
cat,Cat A:2
```

---

## Security Best Practices

### Password Policies

**Current requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Recommended policies**:
- Force password change for new accounts
- Reset passwords if user suspects compromise
- Don't share admin credentials
- Use password manager for strong passwords

### Account Management Best Practices

**Volunteer accounts**:
- Always set expiration dates
- Review access 1 week before expiration
- Extend if volunteer continuing, let expire if not
- Don't delete unless security concern

**Staff accounts**:
- Create on first day of employment
- Deactivate on last day of employment
- No expiration dates for permanent staff
- Review role assignments quarterly

**Admin accounts**:
- Limit to 2-3 admins minimum (backup coverage)
- Review admin access semi-annually
- Remove admin privileges when staff changes roles
- Never share admin credentials

### Monitoring for Suspicious Activity

**Red flags in activity logs**:
- Unusual late-night logins
- Bulk deletions by single user
- Password reset requests from unknown IPs
- Multiple failed login attempts
- Account changes outside business hours

**Investigation steps**:
1. Filter activity log by actor
2. Review all recent actions
3. Check note content if deletions occurred
4. Contact user to verify legitimate activity
5. Reset password if compromise suspected
6. Delete account if confirmed malicious

### Responding to Security Incidents

**If you suspect account compromise**:
1. Reset user's password immediately
2. Review activity log for their actions
3. Check for deleted notes or unauthorized changes
4. Contact user to verify recent activity
5. Document incident in separate log
6. Consider temporary account suspension

**If data breach suspected**:
1. Document what data may be affected
2. Notify shelter management immediately
3. Review all admin account activity
4. Reset all admin passwords
5. Export activity logs for investigation
6. Engage IT security team if available

### Regular Security Audits

**Monthly**:
- Review active volunteer accounts
- Check for accounts needing expiration updates
- Verify staff role assignments are correct

**Quarterly**:
- Audit admin account holders
- Review unusual activity log patterns
- Check for inactive accounts to deactivate

**Annually**:
- Full access control review
- Export complete activity log archive
- Document all security incidents

---

## Troubleshooting User Issues

### "I can't log in"

**Possible causes and solutions**:

**Wrong username/password**:
- Verify they're using correct username (check case)
- Reset their password if forgotten
- Confirm Caps Lock is off

**Account expired** (volunteers):
- Check expiration date in user table
- Extend expiration if appropriate
- Explain account lifecycle to user

**Browser issues**:
- Clear browser cache and cookies
- Try different browser
- Ensure JavaScript enabled
- Check if HTTPS working

**Account locked** (future feature):
- Check if account is active
- Review recent failed login attempts
- Unlock if legitimate user

### "I don't see the create note button"

**Check role**:
- Volunteers and staff both can create notes
- Ensure role assignment is correct
- Verify they're logged in (not timed out)

**Browser compatibility**:
- Confirm using supported browser
- Update browser to latest version
- Disable problematic extensions

### "My account expires tomorrow, can you extend it?"

**For volunteers continuing service**:
1. Find their account in user table
2. Click "Edit"
3. Update expiration date
4. Inform user extension is complete

**For volunteers ending service**:
- Let account expire naturally
- Explain all their notes are preserved
- Thank them for their service

### "Can you recover a deleted note?"

**If recently deleted**:
- Check activity log for deletion event
- Details may contain note content
- Recreate note if content visible
- Note: recreation won't preserve original timestamp

**If deleted long ago**:
- May not be recoverable
- Check if backup system exists
- Document for future prevention
- Remind users to contact admin before deleting

### "QR code won't scan"

**Troubleshooting steps**:

**Code damage**:
- Inspect physical QR code
- Regenerate if damaged
- Reprint and replace label

**Camera permissions**:
- Guide user to grant camera access
- Browser settings → Permissions
- Allow camera for portal site

**Lighting issues**:
- Try different angle
- Use phone flashlight
- Ensure code not in glare

**Backup option**:
- Use manual search as fallback
- Type kennel location directly

---

## Best Practices for Admins

### User Onboarding

**For new volunteers**:
1. Create account with expiration date
2. Send credentials securely (in person or encrypted)
3. Provide 5-minute training on QR scanning
4. Show how to add notes
5. Demonstrate duplicate detection

**For new staff**:
1. Create account (no expiration)
2. Send credentials + change password instructions
3. Provide 15-minute training on full features
4. Demonstrate search and AI summaries
5. Explain status tracking (Raised/Resolved)

**For new admins**:
1. Create admin account
2. Provide this admin guide
3. Training on user management
4. Training on activity log auditing
5. Security best practices review

### Documentation and Training

**Maintain training materials**:
- Keep user guides updated
- Create video tutorials for common tasks
- Document shelter-specific procedures
- Provide quick reference cards

**Regular training**:
- Monthly volunteer refreshers
- Quarterly staff updates
- Annual security awareness training

### Communication with Users

**Password resets**:
- Send via secure channel only
- Never email plaintext passwords
- Confirm user identity before resetting

**Account expiration notices**:
- Warn volunteers 1 week before expiration
- Offer extension if continuing service
- Thank them if service ending

**System updates**:
- Notify users of new features
- Explain changes to workflows
- Provide updated documentation

---

## Related Guides

- [Getting Started Guide](./01-Getting-Started.md) - Basic navigation
- [Staff Guide](./02-Staff-Guide.md) - Note management features
- [Volunteer Guide](./03-Volunteer-Guide.md) - Volunteer workflows

---

**Questions?** Contact your system administrator or technical support team for additional assistance with administrative functions.
