# Trial System Implementation

## Features Implemented

### 1. Trial Button on Pro Page
- Added "Sinab ko'rish (1 soat)" button below contact text
- Redirects to `/auth` for Google sign-in
- Green gradient styling

### 2. Trial Status Hook (`useTrialStatus.ts`)
- Calculates trial time remaining based on `created_at` timestamp (1 hour duration)
- Checks `is_trial_used` and `is_pro` flags
- Updates every minute automatically
- Returns: `isTrialActive`, `isTrialUsed`, `timeRemaining`, `isPro`

### 3. Trial Timer Display
**Profile Page (Large):**
- Shows remaining time in HH:MM format
- Amber gradient card with clock icon
- Displays "Sinov muddati tugadi" warning when expired

**Main Layout (Small):**
- Red text timer in navigation bar
- Shows on both desktop and mobile
- Format: HH:MM

### 4. Access Control Hook (`useProAccess.ts`)
- Checks if user has PRO access or active trial
- Auto-redirects to `/pro` if trial expired
- Shows toast notification
- Used by all PRO pages

### 5. Protected Pages
**Now require PRO access:**
- `/variant` - Test variants (1-61)
- `/mavzuli` - Topic-based tests
- `/darslik` - Video lessons
- `/test-ishlash` - Uses barcha.json only with PRO access

### 6. Database Integration
**Profile fields used:**
- `created_at` - Trial start time
- `is_trial_used` - Trial activation flag (set by trigger)
- `is_pro` - Permanent subscription flag

**Your existing trigger:**
- Automatically sets `is_trial_used = true` on Google sign-in
- 1-hour trial starts from `created_at` timestamp

## How It Works

### Trial Flow:
1. User clicks "Sinab ko'rish" on Pro page
2. Redirected to Auth page
3. Signs in with Google
4. Database trigger sets `is_trial_used = true`
5. Trial timer starts (1 hour from `created_at`)
6. User gets access to PRO features
7. Timer displays in profile and navigation
8. After 1 hour, access blocked automatically

### Access Logic:
```typescript
hasAccess = (is_pro === true) || (is_trial_used === true && timeRemaining > 0)
```

### Bypass Prevention:
- Server-side timestamp (`created_at`) cannot be manipulated
- Access checked on every page load
- Real-time validation via Supabase
- No localStorage/client-side time used
- All PRO pages use `useProAccess` hook

## Testing
1. Click "Sinab ko'rish" → Sign in with Google
2. Check Profile page for trial timer
3. Check navigation bar for small red timer
4. Access PRO features (variants, topics, lessons)
5. Wait 1 hour or manually update `created_at` in database
6. Verify access is blocked and warning shown
