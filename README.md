<div align="center">

  <img src="assets/images/AppIcons/playstore.png" alt="Exercise Tracker" width="180" />

  <br>

# Exercise Tracker

**A mobile fitness companion for planning, tracking, and analyzing your daily workouts — built with React Native and Expo.**

  <br>

![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-FF6D3B?style=flat-square)
![i18n](https://img.shields.io/badge/Languages-EN%20%7C%20ES-22C55E?style=flat-square)
![Privacy](https://img.shields.io/badge/Data-Device--Only-64748B?style=flat-square&logo=lock&logoColor=white)
![License](https://img.shields.io/badge/License-Community_v1.0-blue?style=flat-square)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Why I Built This](#why-i-built-this)
- [Features](#features)
- [App Screens](#app-screens)
  - [Onboarding](#-onboarding)
  - [Today](#-today)
  - [Weekly](#-weekly)
  - [Monthly](#-monthly)
  - [My Exercises](#-my-exercises)
  - [Settings](#-settings)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Building for Android](#building-for-android)
- [License](#license)

---

## Overview

**Exercise Tracker** is a privacy-first mobile app that helps you build and maintain a consistent workout routine. Define your weekly exercise plan once, then track your daily progress with an intuitive interface. All data stays on your device — no accounts, no cloud, no tracking.

The app provides weekly, monthly, and annual statistics with charts and breakdowns so you can visualize your training consistency over time. It also includes body measurement tracking for monitoring physical progress alongside your workout habits.

---

## Why I Built This

Most fitness apps are either overengineered with features I don't need, locked behind subscriptions, or require sending personal data to remote servers. I wanted something simple:

- _Define my weekly routine once and follow it every day._
- _See at a glance whether I trained today and how the week is going._
- _Track my consistency over weeks, months, and the full year._
- _Keep everything on my phone — no accounts, no sign-ups, no cloud sync._

This app is that tool. It focuses on **habit consistency** rather than complex rep-max tracking, making it suitable for anyone from beginners to intermediate lifters who just want to show up and get the work done.

---

## Features

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Weekly plan templates</strong></td>
      <td>Define exercises for each day of the week with sets, reps, estimated time, and training reference URLs</td>
    </tr>
    <tr>
      <td><strong>Daily progress tracking</strong></td>
      <td>Increment sets and reps with press-and-hold acceleration (4-tier speed ramp), mark days complete with timestamps</td>
    </tr>
    <tr>
      <td><strong>Training timer</strong></td>
      <td>Built-in timer tracks total training duration per session</td>
    </tr>
    <tr>
      <td><strong>Rest day management</strong></td>
      <td>Set weekly rest day patterns or override individual days — notifications are automatically skipped on rest days</td>
    </tr>
    <tr>
      <td><strong>Drag-and-drop reordering</strong></td>
      <td>Rearrange exercises in your weekly plan with smooth drag gestures</td>
    </tr>
    <tr>
      <td><strong>Copy & paste days</strong></td>
      <td>Duplicate an entire day's exercise plan to another day of the week</td>
    </tr>
    <tr>
      <td><strong>Weekly / Monthly / Annual statistics</strong></td>
      <td>Charts for completion rates, early vs. late training distribution, streaks, and per-exercise breakdowns</td>
    </tr>
    <tr>
      <td><strong>Body measurements</strong></td>
      <td>Track weight, height, BMI, and 7 body perimeters (neck, waist, hip, bicep, thigh, calf, shoulder) with progress charts</td>
    </tr>
    <tr>
      <td><strong>Smart notifications</strong></td>
      <td>Randomized motivational reminders (2 per day, 7 AM – 9 PM) with 14 unique messages — automatically skips rest days</td>
    </tr>
    <tr>
      <td><strong>Import / Export</strong></td>
      <td>Full JSON backup and restore with comprehensive validation (10+ checks) — never lose your data</td>
    </tr>
    <tr>
      <td><strong>Internationalization</strong></td>
      <td>Complete UI support for English and Spanish, including notification messages</td>
    </tr>
    <tr>
      <td><strong>Dark / Light theme</strong></td>
      <td>System-independent theme toggle persisted across sessions</td>
    </tr>
    <tr>
      <td><strong>28 exercise icons</strong></td>
      <td>Custom SVG gym icons and icon-font icons for visually identifying each exercise</td>
    </tr>
    <tr>
      <td><strong>Privacy by design</strong></td>
      <td>Zero network requests for data — everything lives exclusively on your device in a local SQLite database</td>
    </tr>
  </tbody>
</table>

---

## App Screens

### Onboarding

A one-time setup screen where you enter your name, birthday, and gender. A language toggle lets you switch between English and Spanish before entering the app.

---

### Today

The main daily view. Shows today's exercises pulled from your weekly plan template, with interactive set/rep counters that accelerate on long press (4 speed tiers: 180ms → 100ms → 50ms → 25ms). A training timer tracks your session duration. Mark the day as complete when you're done — the timestamp is recorded for early/late training statistics.

---

### Weekly

A 7-day calendar showing completion status for each day of the current week. Tap any day to view or edit its exercises. The weekly statistics page provides charts including training time distribution (early vs. late training), completion rates, and per-exercise breakdowns displayed as icon cards in a two-column grid.

---

### Monthly

A full month calendar grid with color-coded completion indicators. Navigate between months to review past performance. Access monthly statistics with streak tracking, pie charts, and exercise breakdowns. A button opens annual statistics for the displayed year — covering all 12 months at once.

---

### My Exercises

The weekly plan editor. Select a day of the week, then add, edit, delete, or reorder exercises using drag-and-drop. Each exercise supports a custom name, icon (28 options), sets, reps, estimated time, and an optional training reference URL. Mark entire days as rest days, or copy one day's plan to another.

---

### Settings

User profile management, language and theme toggles, data export/import, and a full data reset option. The body statistics section lets you record weight, height, and 7 body perimeters over time, with long-term progress charts for visualizing trends.

---

## Tech Stack

| Category             | Technology                                       |
| -------------------- | ------------------------------------------------ |
| Framework            | Expo 54 (Managed Workflow)                       |
| Runtime              | React Native 0.81 + React 19                    |
| Language             | TypeScript 5.9                                   |
| Navigation           | React Navigation 7 (Bottom Tabs + Native Stack) |
| State management     | Zustand 5                                        |
| Database             | expo-sqlite 16 (local SQLite)                    |
| Notifications        | expo-notifications 0.32                          |
| Internationalization | i18next 25 + react-i18next 16                   |
| Charts               | react-native-chart-kit 6                         |
| Drag & drop          | react-native-draggable-flatlist 4                |
| Icons                | @expo/vector-icons 15 + custom SVGs              |
| Animations           | react-native-reanimated 4                        |
| File handling        | expo-file-system + expo-document-picker + expo-sharing |

---

## Project Structure

```
exercise-tracker/
├── assets/
│   └── images/AppIcons/         # App icons (Play Store, App Store)
├── src/
│   ├── components/
│   │   ├── AddRecordModal.tsx   # Body measurement modal
│   │   ├── CustomHeader.tsx     # Reusable navigation header
│   │   ├── DatePicker.tsx       # Custom date wheel selector
│   │   ├── ExerciseList.tsx     # Exercise list renderer
│   │   ├── ExerciseModal.tsx    # Add/edit exercise (28 icons)
│   │   ├── ExerciseStatsGrid.tsx# 2-column stats card grid
│   │   ├── SvgIcons.tsx         # Custom SVG gym icons
│   │   ├── Timer.tsx            # Training session timer
│   │   └── TimePicker.tsx       # Time selection component
│   ├── contexts/
│   │   └── ThemeContext.tsx      # Light/dark theme provider
│   ├── database/
│   │   └── init.ts              # SQLite init + versioned migrations
│   ├── i18n/
│   │   ├── index.ts             # i18next configuration
│   │   └── locales/
│   │       ├── en.json          # English translations
│   │       └── es.json          # Spanish translations
│   ├── navigation/
│   │   └── MainTabs.tsx         # Bottom tab navigator
│   ├── screens/
│   │   ├── AnnualStatsScreen.tsx
│   │   ├── BodyStatisticsScreen.tsx
│   │   ├── DayDetailScreen.tsx
│   │   ├── IntroScreen.tsx
│   │   ├── LongTermStatsScreen.tsx
│   │   ├── MonthlyScreen.tsx
│   │   ├── MonthlyStatsScreen.tsx
│   │   ├── MyExercisesScreen.tsx
│   │   ├── RecordDetailScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── TodayScreen.tsx
│   │   ├── WeeklyScreen.tsx
│   │   └── WeeklyStatsScreen.tsx
│   ├── services/
│   │   └── dailyReminderService.ts  # Notification scheduling
│   ├── store/
│   │   ├── bodyRecordsStore.ts  # Body records state (Zustand)
│   │   ├── exerciseStore.ts     # Exercises & plans state (Zustand)
│   │   └── userStore.ts         # User profile state (Zustand)
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── App.tsx                      # Entry point
├── app.json                     # Expo configuration
├── package.json
├── tsconfig.json
└── LICENSE.md
```

---

## Database Schema

The app uses a local SQLite database with versioned migration support. Current schema version: **2**.

| Table                | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `user_info`          | User profile (name, birthday, gender, language, theme)          |
| `body_records`       | Body measurements (weight, height, 7 perimeters)               |
| `weekly_plan`        | Exercise templates per day of week (the reusable weekly plan)   |
| `weekly_rest_days`   | Weekly rest day pattern (which days of the week are rest days)  |
| `daily_snapshot`     | Daily copy of exercises (allows per-day edits without affecting the template) |
| `daily_completion`   | Completion status, timestamp, training time, and rest day flag  |
| `schema_version`     | Migration tracking (ensures safe upgrades)                      |

Migrations are applied automatically on app startup. The export/import system includes schema versioning and comprehensive validation to ensure safe data transfers between app versions.

---

## Getting Started

### Prerequisites

- **[Node.js](https://nodejs.org/)** >= 18 and **npm**
- **[Expo Go](https://expo.dev/go)** installed on your phone (for development)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/FernandoPV02/exercise-tracker.git
cd exercise-tracker

# 2. Install dependencies
npm install

# 3. Start the development server (tunnel mode for Expo Go)
npm run dev
```

Scan the QR code with Expo Go on your phone to open the app.

### Available Scripts

| Script               | Command                            | Description                        |
| -------------------- | ---------------------------------- | ---------------------------------- |
| `npm run dev`        | `expo start --tunnel`              | Start dev server in tunnel mode    |
| `npm run android`    | `expo start --android`             | Start for Android emulator         |
| `npm run ios`        | `expo start --ios`                 | Start for iOS simulator            |
| `npm run web`        | `expo start --web`                 | Start for web browser              |
| `npm run lint`       | `expo lint`                        | Run ESLint                         |
| `npm run build-android` | `eas build -p android --profile preview` | Build Android APK via EAS |

---

## Building for Android

The project uses [EAS Build](https://docs.expo.dev/build/introduction/) for creating APKs.

```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Build Android APK (preview profile)
npm run build-android
```

---

## License

This project is licensed under the **Exercise Tracker Community License v1.0** — see [LICENSE.md](LICENSE.md) for details.

- Personal and non-commercial use is permitted.
- Commercial use requires prior written authorization.
- Forks must remain public and carry this same license.
- Attribution to the original author is mandatory.

---

<div align="center">
  <br>
  <sub>
    Developed by <a href="https://www.linkedin.com/in/fernando-pinto-villarroel/">Fernando Pinto Villarroel</a>
    <br>
    A personal project — not affiliated with any organization.
  </sub>
  <br><br>
</div>
