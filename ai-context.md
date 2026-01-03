Give me the complete code modifications required to comply with the following instructions for my existing codebase.

All code must be written in **English**, and **no code comments** such as `//` or `#` are allowed.
Do not fake functionality — everything requested must be fully and correctly implemented.
Provide the **complete files** (new or modified) needed to meet the requirements.

If some functionality already exists and is correctly implemented, do **not** rewrite it; simply confirm that it is already done.

Keep in mind that I may **not provide the entire codebase** because it is large.
Do **not** assume that files are missing — focus **only** on the files I share when fixing or extending functionality.

---

## Project Goal

Help me create a **mobile application to track my exercise journey**.

I am a full-stack developer with experience in **React, JavaScript, TailwindCSS, Material UI, and Vite**, but I am **new to mobile development**.
The project must be built so I can work entirely inside **VS Code**, which is why I chose Expo.

---

## Tech Stack (Required)

- Expo
- React Native
- TypeScript
- NativeWind (Tailwind for React Native)
- React Navigation
- Zustand
- expo-sqlite
- npm
- @expo/vector-icons (use real icons only, no emojis)

---

## Application Pages and Requirements

### Intro Page

Shown only if the user has not yet provided their initial data:

- Full name
- Age
- Height
- Weight

Once completed, this page must not appear again unless the user resets the app.

---

### Today’s Page

Displays the current day’s training:

- List of exercises with:

  - Icon
  - Exercise name
  - Sets and reps

- A timer fixed near the bottom center with:

  - Start
  - Pause
  - Edit elapsed time

- A button to mark today’s training as **Done / Undone**

---

### Weekly Page

Provides an overview from **Monday to Sunday**:

- Clearly show:

  - Completed vs incomplete days
  - Current day
  - Time of day when training was marked as done

- Tapping a day opens a **read-only clone of Today’s Page** for that specific past date:

  - Only the Done / Undone status can be changed
  - No edits to exercises or timer

#### Weekly Statistics Tab

Include meaningful metrics such as:

- Total sets and reps per exercise
- Total training time for the week
- Days trained early vs late
- Days with no training

---

### Monthly Page

Similar to the Weekly Page but scoped to a full month:

- Calendar-style view with Done / Undone indicators
- Statistics tab with:

  - Total days trained
  - Training streaks (excluding valid rest days)
  - Total sets and reps per exercise
  - Charts or visual summaries where appropriate

Be creative with useful and insightful metrics.

---

### My Exercises Page

Used to configure the **training plan per weekday (Monday–Sunday)**:

- Each day can contain any number of exercises
- Each exercise includes:

  - User-selected icon
  - Name
  - Number of sets
  - Reps per set

- Ability to:

  - Edit exercises at any time
  - Copy one day’s plan and paste it into another day

#### Critical Behavior

At **midnight**, the current day becomes a past day:

- That day’s training plan must be **snapshotted and preserved**
- Future changes to the weekly plan must **not** affect past days
- Past days:

  - Can only toggle Done / Undone

- Today’s training:

  - Can still modify exercises, timer, and completion status

This separation is essential for historical accuracy.

---

### Settings Page

Primary focus: **data persistence and portability**

Features:

- Export all user data to a JSON file
- Import data from a previously exported JSON file
- Persist all data using **expo-sqlite**
- If the app is uninstalled and reinstalled:

  - Automatically detect existing SQLite data
  - Allow the user to continue where they left off

- Provide a **dangerous action**:

  - Permanently delete all data
  - Fully reset the app to a clean state

---

## Additional Requirements

- Use clean, modular architecture
- Avoid large files; separate responsibilities clearly
- Use Zustand correctly to minimize unnecessary re-renders
- Use React Navigation following best practices
- Ensure all UI text is clear and user-friendly

The final result should be a **robust, maintainable, and well-structured mobile application**, suitable for long-term personal use and further expansion.
