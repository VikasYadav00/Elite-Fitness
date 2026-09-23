# Elite Fitness — Cross-Platform Mobile Application (Flutter)

A cross-platform mobile application for **Elite Fitness Gym Management System**, built with Flutter (iOS & Android).

---

## 📱 Features & Modules

### 🏢 Owner App
1. **Dashboard**: Real-time KPI cards (Active Members, Daily Check-ins, Monthly Revenue, Expiring Soon), monthly revenue bar chart, and quick shortcuts.
2. **Member Management**: List, search, filter by status (Active, Expiring, Expired, Frozen), add new member bottom sheet, member details, freeze/unfreeze membership.
3. **Membership Plans**: Full pricing tier management (Monthly, Quarterly, Annual, VIP), feature check-lists, add/edit plan.
4. **Financials & Payments**: Payment transactions log (Cash, UPI, Card, NetBanking), gym expense management (Rent, Utilities, Salaries, Maintenance), net profit calculations.
5. **Attendance & Check-in**: Today's real-time check-in log, peak hour indicators, turnstile QR scanner, and manual check-in dialog.
6. **Trainers**: Coach profiles, client assignments, ratings, direct call & WhatsApp shortcuts, add trainer modal.
7. **Workouts & Nutrition Templates**: Exercise routines (sets × reps × weight) and nutrition charts with macronutrient tracking (Protein, Carbs, Fats, Calories).
8. **Leads CRM**: Inquiries funnel (New, Contacted, Trial, Converted), source tracking (Instagram, Walk-in, Google), instant conversion to registered member.
9. **Push Broadcasts**: Instant announcements to app members with audience segmentation (All, Active, Expiring, Expired, Trainers) and delivery logs.
10. **Business Reports**: Analytics, monthly revenue trends, plan distribution breakdowns, PDF & Excel export.
11. **Gym Settings**: Gym profile, address, GST, automated WhatsApp/SMS alert toggles, role switcher, and logout.

---

### 🏋️ Member App
1. **Home / Dashboard**: Personalized welcome greeting, plan countdown progress bar, quick entry QR pass shortcut, today's workout highlight, hydration cup tracker, and gym attendance streak.
2. **Workout Routine**: Day-by-day split (Chest, Back, Legs, Shoulders, HIIT, Recovery), exercise target muscles, interactive set checkboxes (`Set 1`, `Set 2`, `Set 3`, `Set 4`), and workout completion logging.
3. **Diet & Nutrition**: Daily calorie target bar, macro breakdown (Protein, Carbs, Fats), meal schedules (Breakfast, Snacks, Lunch, Pre-Workout, Dinner) with interactive meal checklists.
4. **Digital QR Entry Pass**: Anti-screenshot pass with live ticking digital clock, registration ID, member photo/avatar, and turnstile QR barcode.
5. **Member Profile**: Personal details, body metrics (Weight, Height, BMI, Body Fat %), membership renewal CTA, check-in history, emergency contacts, and role switcher.

---

## 🚀 How to Run the App

### 1. Prerequisites
- [Flutter SDK](https://flutter.dev) (v3.0.0+)
- Android Studio / Xcode / VS Code with Flutter extension
- Node.js backend running on port `5000`

### 2. Backend URL Configuration
In `lib/core/auth/api_service.dart`:
- **Android Emulator**: Uses `http://10.0.2.2:5000/api` (default)
- **Physical Device**: Replace with your computer's local IP, e.g. `http://192.168.1.100:5000/api`
- **iOS Simulator**: Uses `http://localhost:5000/api`

### 3. Install Dependencies
```bash
flutter pub get
```

### 4. Run Locally
```bash
# Run on connected Android or iOS device
flutter run

# Or run on Chrome for quick browser testing
flutter run -d chrome
```

---

## 🎨 Design System
- **Theme**: Material 3 Dark
- **Background**: `#0B0F17` (Deep Dark Navy)
- **Surface / Cards**: `#1A2235` (Glassmorphism dark card)
- **Primary / Brand Accent**: `#F59E0B` (Elite Amber)
- **Success / Active**: `#10B981` (Emerald Green)
- **Danger / Due**: `#EF4444` (Crimson Red)
- **Typography**: Clean modern sans-serif with high contrast hierarchy.
