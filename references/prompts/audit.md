# HERMES AGENT — FULL PROJECT AUDIT, UI/UX REDESIGN & TTLock Cloud API v3 INTEGRATION REVIEW

You are an expert Senior Full-Stack Engineer, Principal Next.js Architect, UI/UX Designer, Product Designer, Security Engineer, API Integration Specialist, and Software QA Engineer.

Your objective is NOT to make small edits.

Your objective is to completely audit, redesign, improve, and finish this production-grade Next.js application while preserving existing working functionality unless a better implementation exists.

──────────────────────────────────────────────

## PROJECT LOCATION

Project Root

C:\Users\sajed\OneDrive\Desktop\ALLPROJECTS\PROJECTS\ttlock-webapp

Main Web App

C:\Users\sajed\OneDrive\Desktop\ALLPROJECTS\PROJECTS\ttlock-webapp\src\IDGuard

TTLock Cloud API References

C:\Users\sajed\OneDrive\Desktop\ALLPROJECTS\PROJECTS\ttlock-webapp\references\cloud-api-v3

You MUST use the API reference folder as the source of truth for all TTLock Cloud API v3 endpoints, authentication flow, request/response formats, error codes, and required parameters.

Never invent API endpoints.

──────────────────────────────────────────────

# PRIMARY OBJECTIVE

Transform the existing application into a polished, modern, enterprise-grade TTLock management platform with an intuitive UX, fast performance, clean architecture, and complete API integration.

The final result should feel comparable to modern SaaS products such as:

• Stripe Dashboard
• Supabase Dashboard
• Vercel Dashboard
• Notion
• Linear
• Clerk
• Firebase Console

Minimal.

Professional.

Responsive.

Fast.

Easy to use.

──────────────────────────────────────────────

# PHASE 1 — COMPLETE PROJECT AUDIT

Before changing any code:

Perform a complete audit of the entire project.

Inspect:

• Folder architecture
• Components
• Layouts
• Pages
• API routes
• Server Actions
• Middleware
• Authentication
• Route Guards
• Database layer
• Environment variables
• Utilities
• Hooks
• State management
• Forms
• Validation
• Loading states
• Error handling
• Theme implementation
• Icons
• Navigation
• API clients
• Caching
• Build configuration
• TypeScript configuration
• ESLint
• Tailwind
• Dependencies
• Package versions

Generate a complete understanding of how the application currently works before modifying anything.

──────────────────────────────────────────────

# PHASE 2 — TTLOCK CLOUD API AUDIT

Read ALL documentation inside:

references/cloud-api-v3

Understand:

Authentication flow

OAuth

Token refresh

Lock management

Keyboard passwords

IC Cards

Fingerprints

Passcodes

Gateways

Users

Key management

Logs

Records

Remote unlock

Battery

Lock status

Gateway status

Remote configuration

Temporary passwords

Permanent passwords

Passcode generation

Date formats

Timezone handling

Error handling

Rate limits

Pagination

Response schemas

Request validation

Identify:

Missing integrations

Broken integrations

Incorrect implementations

Outdated endpoints

Wrong authentication

Duplicate code

Security issues

Missing retries

Missing refresh token logic

Missing validation

Missing loading states

──────────────────────────────────────────────

# PHASE 3 — UI/UX AUDIT

Perform a professional UX audit.

Evaluate:

Navigation

User journey

Information architecture

Page hierarchy

Visual hierarchy

Accessibility

Spacing

Typography

Consistency

Responsiveness

Mobile experience

Desktop experience

Tablet experience

Component consistency

Form usability

Dashboard usability

Error visibility

Empty states

Confirmation dialogs

Success feedback

Loading experience

Animations

Transition smoothness

Click depth

Discoverability

Cognitive load

Reduce unnecessary clicks.

Reduce confusion.

Improve discoverability.

Every important action should require the fewest possible clicks.

──────────────────────────────────────────────

# PHASE 4 — REDESIGN USER FLOW

Redesign the complete user experience.

Example improvements:

Dashboard

↓

Select Lock

↓

Lock Details

↓

Live Status

↓

Manage Passcodes

↓

Manage Cards

↓

Manage Fingerprints

↓

Remote Unlock

↓

Activity Logs

↓

Gateway

↓

Battery

↓

Settings

Everything should feel logical and easy to understand.

──────────────────────────────────────────────

# MODERN UI REQUIREMENTS

Redesign all pages using modern SaaS UI.

Use:

Rounded cards

Soft shadows

Clean spacing

Responsive grids

Sticky headers

Command palette style search

Modern tables

Context menus

Dropdown actions

Slide-over panels

Drawer forms

Toast notifications

Skeleton loading

Optimistic UI

Floating action buttons

Breadcrumbs

Filter chips

Badges

Status pills

Charts

Statistics cards

Quick actions

Keyboard shortcuts where appropriate.

──────────────────────────────────────────────

# RESPONSIVE DESIGN

Perfect responsiveness for:

Desktop

Laptop

Tablet

Mobile

No overflow.

No broken layouts.

No clipped dialogs.

──────────────────────────────────────────────

# DASHBOARD IMPROVEMENTS

Create a beautiful dashboard including:

Total Locks

Online Locks

Offline Locks

Battery Warnings

Gateways

Today's Unlocks

Recent Activity

Recent Logs

Pending Tasks

Quick Actions

Search Locks

Favorite Locks

Status Overview

──────────────────────────────────────────────

# LOCK MANAGEMENT

Improve the lock management experience.

Support:

Search

Sort

Filter

Bulk selection

Bulk actions

Status indicators

Online status

Battery level

Gateway connection

Signal strength

Firmware

Owner

Binding status

Pagination

Lazy loading

──────────────────────────────────────────────

# PASSWORD MANAGEMENT

Modern interface for:

Permanent passwords

Timed passwords

One-time passwords

Cyclic passwords

Custom passwords

Enable/Disable

Edit

Delete

Generate

Copy

Share

Expiration

Schedules

Validation

──────────────────────────────────────────────

# ACCESS MANAGEMENT

Improve management of:

IC Cards

Fingerprints

Passkeys

eKeys

Users

Permissions

Expiration

Schedules

Bulk operations

──────────────────────────────────────────────

# LIVE STATUS

Show:

Real-time battery

Door state

Lock state

Gateway state

Signal

Online/offline

Last sync

Last unlock

Auto refresh

Manual refresh

──────────────────────────────────────────────

# API IMPROVEMENTS

Create reusable API layer.

Separate:

API client

Authentication

Token refresh

Error handling

Retry logic

Validation

Response parsing

Caching

Logging

Types

Never duplicate API code.

──────────────────────────────────────────────

# TYPESCRIPT

Make the project fully typed.

No:

any

unknown abuse

unsafe casting

Type errors

Missing interfaces

Missing enums

──────────────────────────────────────────────

# COMPONENT ARCHITECTURE

Refactor into reusable components.

Buttons

Inputs

Dialogs

Cards

Tables

Forms

Charts

Tabs

Badges

Loading

Skeletons

Icons

Dropdowns

Pagination

Search

Filters

──────────────────────────────────────────────

# PERFORMANCE

Improve:

Bundle size

Code splitting

Dynamic imports

Image optimization

Memoization

Caching

Suspense

Streaming

Server Components

Lazy loading

──────────────────────────────────────────────

# ACCESSIBILITY

Meet WCAG guidelines.

Keyboard navigation

Focus management

ARIA labels

Screen reader support

Color contrast

Accessible dialogs

──────────────────────────────────────────────

# SECURITY

Audit:

Secrets

Tokens

Cookies

Server Actions

Authentication

Authorization

Session handling

CSRF

XSS

Injection

Input validation

API security

Role permissions

──────────────────────────────────────────────

# ERROR HANDLING

Create centralized handling.

Friendly error messages.

Retry options.

Fallback UI.

Offline detection.

──────────────────────────────────────────────

# LOADING EXPERIENCE

Replace all spinners with:

Skeletons

Progress indicators

Optimistic updates

Animated placeholders

──────────────────────────────────────────────

# DESIGN SYSTEM

Unify:

Spacing

Typography

Buttons

Inputs

Cards

Colors

Icons

Radius

Elevation

Animations

Transitions

──────────────────────────────────────────────

# CODE QUALITY

Remove:

Dead code

Unused imports

Duplicate logic

Legacy components

Unused CSS

Unused packages

Unused utilities

Broken routes

──────────────────────────────────────────────

# TESTING

Verify after every major modification:

No TypeScript errors

No ESLint errors

No runtime errors

No hydration errors

No React warnings

No console errors

No broken imports

No broken routes

All API integrations functional

──────────────────────────────────────────────

# FINAL VALIDATION

Before finishing:

✓ Run full project build

✓ Fix all build failures

✓ Fix all lint issues

✓ Verify all TTLock API integrations

✓ Verify every page

✓ Verify every navigation path

✓ Verify responsive layouts

✓ Verify authentication

✓ Verify loading states

✓ Verify error handling

✓ Verify empty states

✓ Verify accessibility

✓ Verify performance

──────────────────────────────────────────────

# DELIVERABLES

When finished, provide:

1. Executive summary of all improvements.

2. UI/UX improvements made.

3. TTLock API improvements.

4. Performance improvements.

5. Security improvements.

6. Files modified.

7. New reusable components created.

8. Architecture changes.

9. Remaining recommendations (if any).

10. Confirmation that the project builds successfully without TypeScript, ESLint, or runtime errors.

Do not stop after identifying issues. Continue until the application is fully refactored, polished, production-ready, and all identified problems have been resolved. Preserve existing functionality where appropriate while significantly improving usability, maintainability, code quality, and the overall user experience.