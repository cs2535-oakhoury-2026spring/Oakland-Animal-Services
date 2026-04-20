# Getting Started with Oakland Animal Services Portal

## Overview

The Oakland Animal Services Portal is a web-based application for managing animal data, medical observations, and behavioral assessments. This guide will help you access the system for the first time and understand the basics.

---

## System Requirements

### Supported Devices
- **Smartphones**: iPhone (iOS 14+), Android (8.0+)
- **Tablets**: iPad, Android tablets, Surface
- **Desktop/Laptop**: Windows, Mac, Linux

### Supported Browsers
- Chrome (recommended)
- Safari
- Firefox
- Edge
- Internet Explorer (not supported)

### Internet Connection
- Required for all features
- Minimum 3G/4G cellular or Wi-Fi
- HTTPS-only (secure connection)

---

## First-Time Login

### Step 1: Receive Your Credentials

Your administrator will provide:
- **Username**: Your unique login identifier
- **Temporary Password**: Must be changed on first login
- **Portal URL**: `https://portal.oaklandanimalservices.org`

**[SCREENSHOT: Email with login credentials]**

### Step 2: Access the Portal

1. Open your web browser
2. Navigate to the portal URL
3. Bookmark the page for quick access

**[SCREENSHOT: Login screen]**

### Step 3: Enter Your Credentials

1. Type your **username** (case-sensitive)
2. Type your **temporary password**
3. Click **"Sign In"**

**[SCREENSHOT: Login form filled out]**

### Step 4: Change Your Password

On first login, you'll be prompted to create a new password.

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@, #, $, etc.)

**[SCREENSHOT: Force password change screen]**

**Tips for Strong Passwords**:
- Use a passphrase: "MyDog@OAS2024!"
- Avoid common words or personal info
- Don't reuse passwords from other sites
- Consider using a password manager

### Step 5: Explore Your Home Screen

After login, you'll see different screens based on your role:

**Staff/Volunteer**: Home screen with quick kennel search and recent animals
**[SCREENSHOT: Home screen for staff]**

**Admin**: Home screen with additional user management options
**[SCREENSHOT: Home screen for admin]**

---

## Understanding Your Role

The portal has four user types, each with different capabilities:

### Staff
**Access**: All animal data, notes, search
**Can**:
- View all animals
- Create and edit medical/behavioral notes
- Search and filter observations
- Use AI behavioral summaries
- View activity logs

**Cannot**:
- Manage user accounts
- Change other users' passwords
- Delete bulk records

### Volunteer
**Access**: Animal viewing and basic note creation
**Can**:
- View animals via QR code scanning
- Add medical and behavioral notes
- See existing observations

**Cannot**:
- Edit or delete notes after submission
- Access user management
- View full activity logs
- Change account expiration date

**Note**: Volunteer accounts expire automatically on the date set by administrators.

### Admin
**Access**: Everything staff can do, plus user management
**Can**:
- All staff capabilities
- Create/edit/delete user accounts
- Set volunteer expiration dates
- View full activity logs (including auth events)
- Reset passwords
- Manage locations

**Cannot**:
- [Currently no restrictions beyond system limits]

### Device
**Access**: API-only access for automated systems
**Can**:
- Make programmatic API calls
- Integrate with external systems

**Cannot**:
- Log in to web interface
- Access is via API keys only

---

## Interface Overview

### Top Navigation Bar

**[SCREENSHOT: Top navigation bar with labels]**

**Left side**:
- **Back button** (when viewing specific animal)
- **Home icon** (return to home screen)

**Right side**:
- **User dropdown** (profile, settings, logout)
- **Dark mode toggle** (sun/moon icon)

### User Dropdown Menu

**[SCREENSHOT: User dropdown expanded]**

Click your username to access:
- **Profile**: View your account details
- **Change Password**: Update your password
- **Activity Log**: View recent system activity (staff/admin only)
- **User Management**: Manage accounts (admin only)
- **Locations**: Manage kennel locations (admin only)
- **Logout**: Sign out of the portal

---

## Dark Mode

Dark mode reduces eye strain during evening shifts or in low-light environments.

### Enabling Dark Mode

1. Click your **username** in the top-right
2. Click the **moon icon** (☾) or toggle switch
3. Interface switches to dark theme instantly

**[SCREENSHOT: Dark mode toggle in action]**

### Light Mode

1. Click your **username** in the top-right
2. Click the **sun icon** (☀) or toggle switch
3. Interface switches to light theme instantly

**Your preference is saved** and will persist across sessions and devices (using localStorage).

---

## QR Code Scanning

The fastest way to access an animal's information is by scanning the QR code on their kennel.

### Step 1: Navigate to Scan

From the home screen, click **"Scan QR Code"** button.

**[SCREENSHOT: Home screen with scan button highlighted]**

### Step 2: Grant Camera Permission

On first use, your browser will ask for camera access.

**[SCREENSHOT: Browser camera permission prompt]**

Click **"Allow"** to enable scanning.

**Privacy Note**: Video never leaves your device and is not stored or uploaded.

### Step 3: Point at QR Code

**[SCREENSHOT: QR code scanning in progress]**

1. Hold phone steady, about 6-12 inches from QR code
2. Ensure good lighting (use flashlight if needed)
3. Code scans automatically when detected
4. Portal navigates to animal's page

**Tips**:
- QR codes are located on kennel doors
- Scan works best with rear camera
- Steady hands = faster scan
- Clean/undamaged QR codes scan better

### Troubleshooting QR Scanning

**"Camera access denied"**:
- Go to browser settings → Permissions
- Enable camera for portal site
- Refresh page and try again

**QR code won't scan**:
- Check lighting (too dark or too bright)
- Clean QR code if dirty/damaged
- Try different angle or distance
- Report damaged codes to admin for replacement

**No QR code on kennel**:
- Use manual search on home screen
- Type kennel location (e.g., "Dog E:5")
- Click search to find animals

---

## Manual Animal Search

If QR scanning isn't available, use manual search on the home screen.

**[SCREENSHOT: Manual search interface]**

### Search by Kennel Location

1. Select **animal type** (Dog, Cat, Other)
2. Type **kennel location** (e.g., "E:5", "W:12")
3. Click **"Search"** or press Enter
4. Results show all animals at that location

**Format Examples**:
- Dog kennels: "E:5", "W:12", "North:3"
- Cat kennels: "Cat A:7", "Kitten Room:2"
- Other: "Small Animals:1"

### Search by Animal ID

If you know the animal's ID number:

1. Type ID in search box (e.g., "21870649")
2. Click **"Search"**
3. Portal navigates directly to animal's page

---

## Navigating Animal Profiles

Once you access an animal (via QR code or search), you'll see their complete profile.

**[SCREENSHOT: Full animal profile view - desktop]**
**[SCREENSHOT: Full animal profile view - mobile]**

### Mobile Layout (phones, small tablets)

**Top Section**:
- Animal photo
- Name, ID, species, breed
- Age, sex, handler level
- "More Details" expandable section

**Tabs** (swipe or tap):
- **Summary**: AI-powered behavioral insights
- **Medical**: Observation notes with search
- **Behavior**: Behavioral assessments and compatibility

### Desktop Layout (large tablets, computers)

**Left Column** (fixed):
- Animal photo and profile card
- Basic info always visible

**Right Column** (scrollable):
- Tab content area
- More space for notes and details

---

## Understanding Handler Level Colors

Animals are color-coded based on handling requirements:

**[SCREENSHOT: Handler level indicator examples]**

| Color | Level | Meaning |
|-------|-------|---------|
| 🟢 Green | Any Handler | Gentle, safe for all staff including new volunteers |
| 🟡 Yellow | Experienced | Needs experienced handler, some behavioral concerns |
| 🔵 Blue | Specialized | Requires specialized training or techniques |
| 🟣 Pink | Extra Caution | Significant behavioral issues, senior staff only |

The colored dot appears next to the animal's name and in the handler level field.

---

## Getting Help

### In-App Help
- Hover over ⓘ icons for tooltips
- Check field labels for guidance
- Error messages explain what went wrong

### Admin Support
- Contact your shelter administrator
- Email: [admin contact info]
- Phone: [admin phone number]
- In-person: [admin location/hours]

### Technical Issues
- Clear browser cache and cookies
- Try different browser
- Check internet connection
- Restart device
- Report persistent issues to admin

---

## Security Best Practices

### Protecting Your Account

**Do**:
- Log out when leaving a shared computer
- Use a strong, unique password
- Change password if you suspect compromise
- Report suspicious activity to admin
- Lock your device when not in use

**Don't**:
- Share your login credentials
- Write down passwords in plain text
- Use public/unsecured Wi-Fi without VPN
- Leave logged-in devices unattended
- Reuse passwords from other sites

### Session Management

**Automatic timeout**: Your session expires after 15 minutes of inactivity.

**Refresh tokens**: Stay logged in across browser refreshes (7-day limit).

**Logout**: Always click "Logout" when done, especially on shared devices.

---

## Mobile Tips

### Adding to Home Screen (iOS)

1. Open portal in Safari
2. Tap Share button (□↑)
3. Tap "Add to Home Screen"
4. Name the shortcut
5. Tap "Add"

**[SCREENSHOT: iOS add to home screen process]**

Now you can access the portal like a native app!

### Adding to Home Screen (Android)

1. Open portal in Chrome
2. Tap menu (⋮)
3. Tap "Add to Home Screen"
4. Name the shortcut
5. Tap "Add"

**[SCREENSHOT: Android add to home screen process]**

### Mobile Data Usage

The portal is data-efficient:
- Average session: ~2-5 MB
- Images cached after first load
- Most data is text (very small)

**Tip**: Connect to Wi-Fi when possible to save cellular data.

---

## What's Next?

Now that you understand the basics, explore role-specific guides:

**Staff**: See [Staff User Guide](./02-Staff-Guide.md) for:
- Creating and editing notes
- Searching observations
- Using AI behavioral summaries
- Tracking note status

**Volunteers**: See [Volunteer User Guide](./03-Volunteer-Guide.md) for:
- QR code scanning workflow
- Adding medical and behavioral notes
- Avoiding duplicate observations

**Admins**: See [Admin User Guide](./04-Admin-Guide.md) for:
- User account management
- Setting volunteer expiration dates
- Viewing activity logs
- Managing kennel locations
