# Staff User Guide - Oakland Animal Services Portal

## Overview

This guide is for **staff members** at Oakland Animal Services who have full access to animal data, notes, and search capabilities. As a staff member, you can view all animals, create and edit medical and behavioral notes, use AI-powered summaries, and track observation status.

---

## Table of Contents

1. [Accessing Animal Information](#accessing-animal-information)
2. [Medical Observations (Observer Notes)](#medical-observations-observer-notes)
3. [Behavioral Assessments](#behavioral-assessments)
4. [AI-Powered Behavioral Summaries](#ai-powered-behavioral-summaries)
5. [Search and Filtering](#search-and-filtering)
6. [Status Tracking](#status-tracking)
7. [Best Practices](#best-practices)

---

## Accessing Animal Information

### Via QR Code (Fastest)

**[SCREENSHOT: Staff scanning kennel QR code]**

1. From home screen, click **"Scan QR Code"**
2. Point camera at kennel QR code
3. Portal automatically loads animal's profile

**Use case**: When making rounds or responding to specific kennel

### Via Home Screen Search

**[SCREENSHOT: Home screen search interface]**

1. Browse **recently viewed animals** (quick access to frequent cases)
2. Or use **search bar** at top
3. Type kennel location (e.g., "Dog E:5") or animal ID
4. Click **Search**

**Use case**: When you know the kennel location but don't have physical access

### Via Animal List

**[SCREENSHOT: Animal list page if implemented]**

1. Click **"All Animals"** from home screen
2. Filter by species, status, or handler level
3. Click any animal to view profile

**Use case**: Reviewing all animals needing specific care

---

## Medical Observations (Observer Notes)

Medical observations track veterinary concerns, symptoms, and treatment needs reported by any staff member.

### Viewing Medical Notes

**[SCREENSHOT: Medical tab showing list of notes]**

1. Navigate to animal's profile
2. Click **"Medical"** tab
3. Notes display chronologically (newest first)

**Each note shows**:
- **Author**: Who created the note
- **Timestamp**: When it was created
- **Case Title**: Brief description (e.g., "Limping", "Ear Infection")
- **Status**: Raised (needs attention) or Resolved
- **Content**: Full observation details

### Creating a Medical Note

**[SCREENSHOT: Create note button highlighted]**

1. On Medical tab, click **"+ New Note"**
2. Modal opens with form

**[SCREENSHOT: Create medical note modal]**

**Fill out fields**:
- **Case Title**: Short summary (e.g., "Coughing", "Eye Discharge")
- **Observation**: Detailed description
  ```
  Example: "Dog has been coughing intermittently for the past 2 hours. 
  Cough is dry and seems to occur more frequently when excited. 
  No other symptoms observed. Eating and drinking normally."
  ```
- **Status**: Choose "Raised" (default for new concerns)

3. Click **"Submit"**

**Tips**:
- Be specific about timing ("started 2 hours ago" vs "recently")
- Include severity if relevant ("mild", "moderate", "severe")
- Note any triggers or patterns observed
- Mention what's normal vs abnormal for this animal

### Duplicate Note Prevention

**[SCREENSHOT: Similar notes preview while typing]**

As you type, the system searches for similar existing notes:

**"Similar notes found"** section appears showing:
- Matching keywords highlighted
- Author and timestamp of existing notes
- Similarity score

**If you see your observation already reported**:
- Skip creating duplicate
- Update status of existing note if resolved
- Add comment to existing note (if feature available)

**If your observation adds new information**:
- Create the note anyway
- Reference the related note ("Follow-up to Jane's observation...")

### Editing Medical Notes

**[SCREENSHOT: Edit note modal]**

1. Click **three-dot menu (⋮)** on note card
2. Select **"Edit"**
3. Modify case title or content
4. Click **"Save"**

**Note**: Original author and timestamp are preserved. Edit history may be tracked in activity logs.

### Changing Note Status

**[SCREENSHOT: Status dropdown on note card]**

**Raised → Resolved** when:
- Vet has examined and treated
- Symptom has cleared up
- Issue no longer requires attention

**How to change**:
1. Click **status dropdown** on note
2. Select **"Resolved"**
3. Status updates immediately

**Visual changes**:
- Raised notes: Orange/yellow indicator
- Resolved notes: Green indicator or moved to separate section

### Deleting Medical Notes

1. Click **three-dot menu (⋮)** on note card
2. Select **"Delete"**
3. Confirm deletion

**Warning**: Deletions are tracked in activity logs. Only delete notes created in error, not resolved issues (change status instead).

---

## Behavioral Assessments

Behavioral notes track handling observations, temperament, compatibility with other animals, and adoption readiness.

### Viewing Behavioral Notes

**[SCREENSHOT: Behavior tab showing compatibility boxes and notes]**

1. Navigate to animal's profile
2. Click **"Behavior"** tab

**Top section - Compatibility Indicators**:

**[SCREENSHOT: Compatibility boxes with color coding]**

| Indicator | What It Shows |
|-----------|---------------|
| **Kids Over 12** | Safe with older children |
| **Kids Under 12** | Safe with young children |
| **Live with Cats** | Can coexist with cats |
| **Dog-to-Dog** | Interactions with other dogs |

**Color coding**:
- **Green**: Yes / Gentle / Safe
- **Orange**: Maybe / Use Caution
- **Red**: No / Unlikely / Unsafe
- **Gray**: Unknown / Not Tested

### Creating a Behavioral Note

**[SCREENSHOT: Create behavior note button]**

1. On Behavior tab, click **"+ New Behavior Note"**
2. Modal opens with form

**[SCREENSHOT: Create behavior note modal]**

**Fill out fields**:
- **Observation Title**: Brief summary (e.g., "Playful with volunteers", "Reactive to large dogs")
- **Behavioral Notes**: Detailed assessment
  ```
  Example: "Dog showed excellent leash manners during 20-minute walk. 
  Responded well to sit and stay commands. Became excited when 
  seeing other dogs but calmed quickly with redirection. 
  No pulling or lunging. Would recommend for active adopter."
  ```

3. Click **"Submit"**

**What to include**:
- **Temperament**: Friendly, shy, energetic, calm, anxious
- **Handling notes**: Requires experienced handler, gentle with everyone, etc.
- **Interactions**: How they behave with people, other animals, in various situations
- **Training level**: Knows commands, house-trained, crate-trained
- **Adoption recommendations**: Ideal home environment, experience level needed

### Editing Behavioral Notes

1. Click **three-dot menu (⋮)** on behavior note card
2. Select **"Edit"**
3. Modify title or content
4. Click **"Save"**

### Deleting Behavioral Notes

1. Click **three-dot menu (⋮)** on behavior note card
2. Select **"Delete"**
3. Confirm deletion

**Note**: Behavioral assessments are critical for adoptions. Only delete duplicates or errors.

---

## AI-Powered Behavioral Summaries

The AI summary feature uses OpenAI GPT-4o to analyze all behavioral notes and answer specific questions.

### Accessing AI Summaries

**[SCREENSHOT: Summary tab interface]**

1. Navigate to animal's profile
2. Click **"Summary"** tab
3. AI interface appears

### Asking Questions

**[SCREENSHOT: AI prompt input and response]**

**Use the prompt box to ask**:
- "Summarize this animal's behavioral history"
- "Is this dog good with children?"
- "What are the main behavioral concerns?"
- "Describe this cat's temperament"
- "What type of home would be best for this animal?"
- "Any aggression incidents reported?"

**How to ask**:
1. Type your question in the text box
2. Click **"Ask AI"** or press Ctrl+Enter (Cmd+Enter on Mac)
3. Response appears in 3-5 seconds

**[SCREENSHOT: AI response example]**

**Response includes**:
- Summary of relevant behavioral notes
- Key patterns or concerns
- Recommendations based on observations

### AI Summary Best Practices

**Good prompts**:
- "Summarize behavioral concerns for adoption packet"
- "Describe interactions with other dogs"
- "What handling precautions should volunteers know?"

**Poor prompts**:
- "Good dog?" (too vague)
- Medical questions (AI only sees behavioral notes)
- Predictions (AI can't predict future behavior, only summarize past)

**Limitations**:
- AI only analyzes behavioral notes, not medical notes
- Summaries are based on available data (garbage in, garbage out)
- Not a substitute for professional behavioral assessment
- No behavioral notes = no meaningful summary

### Use Cases for AI Summaries

**Adoption counseling**: Quickly brief potential adopters on temperament

**Staff briefings**: New staff can get up to speed on complex cases

**Follow-up planning**: Identify patterns for training interventions

**Documentation**: Generate summaries for transfer paperwork

---

## Search and Filtering

### Medical Note Search

**[SCREENSHOT: Medical search interface with results]**

The medical note search uses intelligent matching to find relevant observations.

**How to search**:
1. On Medical tab, use **search box** at top
2. Type keywords (e.g., "limping", "eye", "vomiting")
3. Results update automatically after 300ms pause

**Search features**:
- **Keyword matching**: Finds notes containing your terms
- **Smart stemming**: "limping" matches "limp", "limped"
- **Fuzzy matching**: Handles minor typos
- **Highlighted matches**: Keywords shown in **bold**

**[SCREENSHOT: Search results with highlighted keywords]**

**Example searches**:
- `cough` → Finds "coughing", "coughs", "dry cough"
- `ear infection` → Finds both words anywhere in note
- `diarrhea` → Finds related terms and exact matches

**Clear search**: Click **X** icon or delete all text

### Filtering by Status

**[SCREENSHOT: Status filter buttons/dropdown]**

Filter medical notes by status:
- **All**: Show all notes (default)
- **Raised**: Only active concerns
- **Resolved**: Only resolved issues

**Use cases**:
- View "Raised" to see what needs veterinary attention
- View "Resolved" to check treatment history

### Behavioral Note Search

**[SCREENSHOT: Behavior search interface]**

1. On Behavior tab, use **search box**
2. Type keywords (e.g., "aggressive", "playful", "cats")
3. Results filter in real-time

**Example searches**:
- `kids` → Find all notes about child interactions
- `leash` → Find leash training observations
- `reactive` → Find reactivity reports

---

## Status Tracking

### Understanding Note Status

Medical observations use a two-state system:

**Raised** (Orange):
- New concern that needs attention
- Awaiting veterinary review
- Active symptom or issue
- Requires follow-up

**Resolved** (Green):
- Issue has been addressed
- Treatment completed
- Symptom cleared
- No further action needed

### Workflow Example

**Day 1 - 9:00 AM**:
Staff A creates note: "Dog limping on left front leg" - Status: **Raised**

**Day 1 - 2:00 PM**:
Vet examines dog, prescribes rest and medication

**Day 1 - 2:15 PM**:
Staff B changes status to: **Resolved**, adds comment: "Vet examined, minor strain, prescribed rest"

**Day 3**:
Staff C reviews resolved notes to confirm dog is recovering

### When to Change Status

**Change to Resolved when**:
- Vet has examined and treated
- Symptom is gone
- Follow-up completed
- Issue is documented but non-urgent (e.g., "old scar noted")

**Don't change to Resolved if**:
- Still waiting for vet
- Symptom persists
- Treatment ongoing
- Follow-up needed

---

## Best Practices

### Writing Effective Medical Notes

**Be Specific**:
- Bad: "Dog seems sick"
- Good: "Dog vomited twice this morning, once clear liquid, once with food. Appetite normal otherwise."

**Include Timeline**:
- Bad: "Ear infection"
- Good: "Right ear has foul odor and dark discharge, first noticed this morning during feeding"

**Note Severity**:
- Bad: "Coughing"
- Good: "Persistent dry cough, occurs every 10-15 minutes, worsens with activity"

**Describe What's Normal**:
- Bad: "Drinking a lot"
- Good: "Water bowl refilled 3 times today (normally once). Otherwise acting normal."

### Writing Effective Behavioral Notes

**Focus on Observations, Not Assumptions**:
- Bad: "Dog is mean"
- Good: "Dog growled and lunged when approached while eating. Allowed handling once food removed."

**Provide Context**:
- Bad: "Good with kids"
- Good: "Interacted calmly with 10-year-old visitor for 15 minutes. Gentle taking treats. Tolerated petting and hugging."

**Document Triggers**:
- Bad: "Sometimes aggressive"
- Good: "Shows teeth when reached for while in kennel. Friendly once out of kennel. Resource guarding behavior."

**Include Positive Behaviors**:
- Bad: "Reactive dog"
- Good: "Reactive to large dogs on leash (barking, lunging). Calm with small dogs. Excellent recall and sit command."

### Avoiding Duplicate Notes

**Before creating a note**:
1. Search existing notes for your keywords
2. Check recent notes on the animal's profile
3. Watch for "similar notes" suggestions while typing

**If similar note exists**:
- Update status if issue resolved
- Add timestamp comment ("Still limping as of 2 PM")
- Only create new note if genuinely new information

### Collaboration Tips

**Shift Handoffs**:
- Review raised medical notes before shift ends
- Brief incoming staff on urgent cases
- Update statuses based on day's events

**Veterinary Coordination**:
- Mark urgent notes clearly in title
- Include all relevant symptoms in one note
- Update status after vet sees animal

**Volunteer Management**:
- Thank volunteers for thorough notes
- Follow up on their observations
- Provide feedback on note quality

---

## Common Questions

**Q: Can I edit notes created by other staff?**
A: Yes, staff can edit any notes. However, edits are logged in activity system. Best practice is to add a new note if adding information, rather than changing someone else's observation.

**Q: What if I accidentally delete a note?**
A: Contact your administrator immediately. Deletions are logged and may be recoverable from backups.

**Q: How long are notes kept?**
A: Notes remain in the system indefinitely unless explicitly deleted. Resolved notes stay visible in history.

**Q: Can I attach photos to notes?**
A: Not currently. This feature is planned for future release.

**Q: What's the difference between Medical and Behavioral tabs?**
A: Medical tab is for health concerns (symptoms, injuries, treatments). Behavioral tab is for temperament, training, and compatibility assessments.

**Q: How accurate is the AI summary?**
A: AI summarizes existing behavioral notes using OpenAI GPT-4o. Quality depends on the quality and quantity of notes available. Always verify AI summaries against original notes.

**Q: Can I print or export notes?**
A: Not currently. This feature is planned for future release. Take screenshots if needed for temporary documentation.

**Q: Who can see my notes?**
A: All staff and volunteers can see all notes. Notes are not private.

---

## Keyboard Shortcuts

**General**:
- `Ctrl/Cmd + K`: Focus search box
- `Esc`: Close modals or cancel actions

**AI Summary**:
- `Ctrl/Cmd + Enter`: Submit AI prompt

**Navigation**:
- `Tab`: Move between form fields
- `Enter`: Submit forms

---

## Troubleshooting

**Search not working**:
- Check spelling
- Try simpler keywords
- Clear search and try again
- Refresh page

**Can't create note**:
- Check all required fields filled
- Ensure you're logged in
- Check internet connection
- Try refreshing page

**Status won't change**:
- Refresh page
- Log out and back in
- Report persistent issues to admin

**AI summary not responding**:
- Check internet connection
- Ensure animal has behavioral notes
- Try simpler prompt
- Report to admin if persists

---

## Related Guides

- [Getting Started Guide](./01-Getting-Started.md) - Basic navigation and login
- [Admin User Guide](./04-Admin-Guide.md) - User management and activity logs

---

**Need help?** Contact your shelter administrator or refer to the Getting Started guide for general navigation.
