# Oakland Animal Services Portal -- User Guide

## Executive Summary

Oakland Animal Services (OAS) processes over 7,000 animals per year. Until now, nearly every workflow -- visitor check-ins, animal matching, medical record keeping -- relied on paper forms or disorganised systems. Data was fragmented, hard to access, and absent from decision-making.

This portal replaces those paper processes with a web-based system accessible from any phone, tablet, or computer. Each kennel in the shelter has a QR code. When a volunteer or staff member scans it, they are taken directly to the current animal's profile where they can view details, add medical observations, log behavioral notes, and request AI-generated summaries.

The system uses role-based access control so that volunteers, staff, and administrators each see only the features relevant to their responsibilities. All actions are logged for accountability.

**Key capabilities:**

- QR-code-based kennel lookup -- scan and go directly to the animal's profile
- Medical observation notes -- log health concerns with status tracking (Raised/Resolved)
- Behavioral notes -- record temperament, compatibility, and handling observations
- AI summarization -- ask questions about an animal and get answers generated from its notes
- Activity audit log -- full history of who did what and when
- User management -- create accounts, set roles, manage volunteer expiration dates
- Location management -- view kennel assignments and generate QR code PDFs
- Dark mode -- toggle between light and dark themes

**Technical stack:** React 18 frontend, Node.js/Express backend, AWS DynamoDB database, JWT authentication, OpenAI GPT for AI summaries.

---

## Getting Started (All Users)

### Logging In

1. Open your browser and navigate to the portal URL provided by your administrator.
2. Enter your username and password, then click "Sign In."
3. If this is your first login, you will be prompted to change your temporary password before proceeding.

### Navigation

After logging in, a dropdown menu in the top-right corner provides access to all available screens. The options you see depend on your role:

| Screen | Volunteer | Staff | Admin |
|--------|-----------|-------|-------|
| Available Animals (home) | Yes | Yes | Yes |
| Kennel Locations | Yes | Yes | Yes |
| Activity Log | No | Yes | Yes |
| User Management | No | Yes | Yes |

### Home Screen

The home screen displays a paginated list of all animals currently in the shelter. Each card shows the animal's photo, name, species, breed, age, and kennel location. Click any card to open that animal's detail page.

Use the search bar at the top to filter animals by name or kennel location.

### QR Code Scanning

Each kennel has a printed QR code. Scanning it with your phone's camera opens the portal directly to the animal(s) at that kennel. If multiple animals share a kennel, you will see a selection screen to choose which one to view.

### Dark Mode

Click the moon/sun icon in the navigation dropdown to toggle between light and dark themes. Your preference is saved locally and persists across sessions.

### Changing Your Password

Open the dropdown menu and click "Change Password." Enter your current password and a new one that meets the requirements (8+ characters, uppercase, lowercase, number, special character).

---

## Animal Detail Page (All Users)

When you open an animal's profile, you see three tabs:

### Summary Tab

Displays the animal's photo, name, breed, age, weight, handler level, and kennel location.

The Summary tab also contains the **AI chat interface**. Type a question about the animal and click "Ask AI" (or press Ctrl/Cmd+Enter). The system sends the animal's notes to OpenAI and returns a summary. You can choose which note types to include (medical, behavioral, or both).

### Medical Observations Tab

Lists all medical/observer notes for the animal, sorted by date. Each note card shows the case title, content, author, timestamp, and status (Raised or Resolved).

- **Raised** (orange) -- an active concern needing attention
- **Resolved** (green) -- the issue has been addressed

Use the search bar to filter notes by keyword. Results highlight matching terms. The search uses fuzzy matching (Levenshtein distance), so minor typos in your search query will still return relevant results.

### Behavior Notes Tab

Lists all behavioral notes with case title, content, author, and timestamp. Use the search bar to filter by keyword. The same typo-tolerant fuzzy search is available here.

---

## Volunteer Guide

Volunteers have time-limited accounts that expire on a date set by administrators. Your expiration date is shown in the navigation dropdown. When your account expires, you can no longer log in, but your existing notes remain in the system. Contact your administrator to renew access.

### What You Can Do

- View all animal profiles and their details
- Scan QR codes to look up animals by kennel
- Create medical observation notes
- Create behavioral notes
- Search and filter existing notes
- Use AI summaries
- Toggle dark mode
- Change your password

### What You Cannot Do

- Edit or delete notes after submission
- Change note status (Raised/Resolved)
- Access the Activity Log
- Access User Management
- Create or manage other user accounts

### Scanning QR Codes

To look up an animal by scanning its kennel QR code:
1. Open your phone's camera app and point it at the QR code on the kennel. Or use a QR code scanning app if your camera does not support scanning.
2. Tap the notification that appears to open the portal in your browser.
3. You will be taken directly to the animal(s) at that kennel. If multiple animals share the kennel, select the one you want to view.
4. If an animal is missing from the location page try  hitting the refresh button on your browser. If the issue persists, contact staff to report a potential issue.

### Creating a Medical Observation

1. Open an animal's profile and go to the Medical Observations tab.
2. Click "+ New Note."
3. Enter a case title (brief summary) and the observation details. You can also click the **microphone button** next to the text field to dictate your observation using speech-to-text (supported in Chrome and most modern browsers).
4. As you type (or dictate), a **Similar Notes** panel appears showing existing notes that match what you are writing. This uses keyword extraction and fuzzy matching to detect potential duplicates. On desktop, the panel appears as a sidebar next to the form; on mobile, it appears below the form. Review the highlighted matches and consider whether your observation adds new information before submitting.
5. Click "Submit." The note is saved immediately with status "Raised."

### Creating a Behavioral Note

1. Open an animal's profile and go to the Behavior Notes tab.
2. Click "+ New Behavior Note."
3. Enter a case title and your observations. The microphone button is available here as well for speech-to-text input.
4. As with medical notes, a Similar Notes panel will appear if existing behavior notes match what you are typing.
5. Click "Submit."

### Tips for Good Notes

- Be specific: "Dog limping on left front leg, noticed at 9 AM during walk" instead of "Dog seems hurt."
- Include timing: when you first noticed the issue.
- Describe severity: frequency, duration, how it affects the animal.
- Note what is normal too: "Eating and drinking normally" is useful context.

---

## Staff Guide

Staff members have full operational access to animal data and notes management.

### Everything Volunteers Can Do, Plus:

**Edit and delete notes** -- Click the three-dot menu on any note card to edit its content or delete it. A confirmation prompt appears before deletion.

**Change note status** -- Toggle a medical note between Raised and Resolved by clicking the status badge. Use this to mark issues as addressed after veterinary review.

**Staff comments on notes** -- Add a staff comment to any medical note to provide follow-up context (e.g., "Vet examined, minor strain, prescribed rest").

**Activity Log** -- Navigate to Activity Log from the dropdown menu. This screen shows a chronological record of all note-related actions (created, deleted, status changed). You can filter by:
- Actor (who performed the action)
- Action type (CREATED, DELETED, STATUS_CHANGED, etc.)
- Date range
- Note type (medical, behavioral)

Staff cannot see authentication-related logs (logins, password changes) -- only admins can.

**User Management (limited)** -- Staff can access the User Management screen but only see the Volunteers tab. Staff can:
- View volunteer accounts
- Batch import volunteers via CSV
- Reset volunteer passwords

Staff cannot create staff/admin accounts, delete users, or manage non-volunteer accounts.

---

## Admin Guide

Admins have full system access including all staff capabilities plus user and system management.

### Everything Staff Can Do, Plus:

**Full User Management** -- The User Management screen shows tabs for Volunteers, Staff, Devices, and Admin accounts. Admins can:

- **Create users** -- Click "+ Create User" and fill in username, password, role, and optional expiration date. The "Force Password Change" option requires the user to set a new password on first login.
- **Delete users** -- Remove accounts entirely (with confirmation).
- **Reset passwords** -- Force a password reset for any user.
- **Edit expiration dates** -- Extend or shorten volunteer account expiration.
- **Batch import** -- Upload a CSV file to create multiple volunteer accounts at once.
- **Bulk actions** -- Select multiple volunteers to apply batch expiry updates or tag assignments.
- **Tags** -- Assign organizational tags to users for grouping and filtering (e.g., training group, shift assignment). Tags can be applied individually or in bulk to multiple selected users. Can also be used to assign volunteers to events or specific roles within the shelter.

**Full Activity Log** -- Admins see an additional "Auth Events" toggle that reveals authentication-related logs:
- User logins and logouts
- Password changes and resets
- Account creation and deletion
- Role changes

Admins can also **export activity logs** to PDF for record-keeping.

**Location Management** -- The Kennel Locations screen shows all occupied kennels with their current animals. Admins can:
- Search and filter locations by species or kennel number
- Upload custom location lists via CSV
- Select specific kennels and generate a PDF of QR codes for printing
- Customize QR code size, paper format, and label options before export

### Security Responsibilities

- Review volunteer accounts regularly and let unused accounts expire
- Limit admin accounts to 2-3 people for backup coverage
- Monitor the activity log for unusual patterns (bulk deletions, late-night logins, repeated failed attempts)
- Reset passwords immediately if account compromise is suspected
- Never share admin credentials

---

## Access Level Summary

| Feature | Volunteer | Staff | Admin |
|---------|-----------|-------|-------|
| View animals | Yes | Yes | Yes |
| Create notes | Yes | Yes | Yes |
| Edit/delete notes | No | Yes | Yes |
| Change note status | No | Yes | Yes |
| Staff comments on notes | No | Yes | Yes |
| AI summaries | Yes | Yes | Yes |
| Activity log (notes) | No | Yes | Yes |
| Activity log (auth events) | No | No | Yes |
| Export activity logs | No | No | Yes |
| User management (volunteers) | No | Yes | Yes |
| User management (all roles) | No | No | Yes |
| Create/delete users | No | No | Yes |
| Location management | Yes | Yes | Yes |
| QR code PDF export | Yes | Yes | Yes |
| Dark mode | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes |
