# 🎬 Revid.ai Video Editor (`/editor/[id]`) — Architecture & Implementation Plan

> **Goal:** Replicate the exact design, UX, and functionality of Revid.ai's professional video editor (`revid.ai/editor/new`) inside `apps/revid-ai-studio` under the dynamic route `/editor/[id]` (with `/editor/new` as a quick initializer).

---

## 📸 Reference Analysis: Live `revid.ai/editor/new`

Based on the live interface analysis and screenshot:

```
+-------------------------------------------------------------------------------------------------------------------+
| [Logo] < [Project Title]  (Saved)                 [↶ ↷] [<] [👍 👎]  [📱 9:16 ˅]  [Upgrade]  [Export / Publish ↗] [Avatar]|
+-----+-------------------+-----------------------------------------------------------------------------------------+
| [AI]| SCRIPT    [🔍Search]|                                                                             [Safe zones]|
|     +-------------------+                                                                                       |
| [📜]|                   |                                   +-----------------------+                             |
|*Act*|   [  ≡  ]         |                                   |                       |                             |
|     |  No scenes yet    |                                   |     9:16 Canvas       |                             |
| [T] |Scenes appear here |   (+)                             |    Remotion Player    |                             |
|     |once script gens...|                                   |                       |                             |
| [🎬]|                   |                                   |                       |                             |
|     |                   |                                   |                       |                             |
| [<>]|                   |                                   +-----------------------+                             |
|     |                   |                                                                                   [💬]  |
| [🎵]|                   |                                                                                         |
|     |                   |                                                                                         |
| [💬]|                   |                                                                                         |
+-----+-------------------+-----------------------------------------------------------------------------------------+
| [✂ Split]               |◀  [  ▶  ]  ▶|   00:00.00 / 00:00.02                         [⤢]  135% [──○──]    [⛶]    |
+-------------------------------------------------------------------------------------------------------------------+
| Track 3 [👁] [🔊] | [00:00.00]   1s        2s        3s        4s        5s        6s        7s        8s       ... |
| Track 2 [👁] [🔊] | [========== Scene 1 Clip ==========]  [========== Scene 2 Clip ==========]                    |
| Track 1 [👁] [🔊] | [~~~~~~~~~~~~~~~~~~~~~~~~ Background Music Track ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~]  |
+-------------------------------------------------------------------------------------------------------------------+
```

---

## 🏗️ 1. System & Route Architecture

### 1.1 Route Structure
* **`/editor/new`**:
  - Initializes a new project in the database with default parameters (or loads from URL params like `?prompt=...&duration=30` or `?remix=...`).
  - Automatically generates a unique project ID (e.g., `cuid` or `proj_timestamp_random`).
  - Performs an immediate client-side redirect to `/editor/[id]`.
* **`/editor/[id]`**:
  - Main dynamic workspace route.
  - Fetches the project from the database via `/api/projects/[id]`.
  - Provides real-time autosave with visual sync state (`Saving...` → `Saved`).
  - Fallback to local draft caching if offline or user is not logged in.

### 1.2 State Management (`VideoEditorContext` or `useVideoEditor`)
A centralized state store providing:
* **Project Metadata**: `id`, `title`, `aspectRatio` (`9:16`, `16:9`, `1:1`), `status`, `lastSavedAt`.
* **Timeline & Playback**:
  - `currentTimeInFrames`, `totalDurationInFrames`, `fps: 30`.
  - `isPlaying`, `isMuted`, `zoomLevel` (`50%` - `200%`, default `100%`).
  - `activeSceneIndex`, `activeTrackId`, `selectedBlockId`.
* **Content Layers**:
  - `scenes`: Array of scene objects (`id`, `badge`, `narration`, `visualId`, `visualUrl`, `visualType`, `durationSeconds`, `transition`).
  - `textOverlays`: Array of independent text elements on Track 3.
  - `audioTracks`: Voiceover track + Background music track on Track 1 (`trackUrl`, `volume`, `startSec`, `durationSec`).
  - `captionConfig`: Font, style preset (Hormozi, MrBeast, Karaoke, etc.), position, safe zone padding.
* **History Engine**: Undo/Redo history stack with shortcut bindings (`Ctrl+Z`, `Ctrl+Y`).
* **Active Tool**: `'ai' | 'script' | 'text' | 'media' | 'transitions' | 'audio' | 'captions'`.

---

## 🎨 2. Component Hierarchy Breakdown

### 2.1 Header (`EditorHeader.jsx`)
* **Left**:
  - Green brand icon + Back arrow button `←` (navigates back to dashboard).
  - Project Title: Inline editable with double-click/pencil icon and immediate blur-save.
  - Cloud Sync Indicator: `CloudCheck (Saved)` or `Spinner (Saving...)`.
* **Right**:
  - Undo `↶` & Redo `↷` buttons with disabled states.
  - Share modal button `<`.
  - Feedback buttons `👍` and `👎`.
  - Aspect Ratio dropdown: `📱 9:16` (Shorts/Reels), `📺 16:9` (YouTube), `⏹ 1:1` (Feed).
  - "Upgrade" pill button (direct link to credit top-up modal).
  - "Export / Publish ↗" button (opens the high-res rendering modal).
  - User avatar with current credits badge.

### 2.2 Left Tool Rail (`EditorToolRail.jsx`)
Vertical toolbar (width: 64px) with high-contrast icon buttons:
1. `AI` (Sparkles): Prompt-to-video, URL-to-video, script rewrite.
2. `Script` (Lines/Document - active in screenshot): Scene-by-scene script cards.
3. `Text` (`T`): Add title, subtitle, callout stickers, lower thirds.
4. `Media` (Filmstrip): Background video clips, images, Pexels search, custom upload.
5. `Transitions` (`<>`): Transitions between scenes (Fade, Slide, Zoom, Wipe, Glitch).
6. `Audio` (Music note): AI voiceover selection, background music library, SFX, volume balance.
7. `Captions` (Subtitles): Viral subtitle styles (Hormozi, MrBeast, Neon, etc.), colors, fonts.

### 2.3 Secondary Tool Drawer (`EditorSubpanel.jsx`)
Collapsible side panel (width: 320px - 360px) dynamically rendering the active tool:
* **Script Panel (Screenshot Match)**:
  - Header: "Script" with live search filter `[🔍 Search]`.
  - Empty state when no scenes exist:
    - Central script icon.
    - "No scenes yet. Scenes appear here once your script generates or you add captions."
  - Populated state:
    - Vertical stack of scene cards (`Scene 1`, `Scene 2`, etc.).
    - Narration text editor with auto-resizing textarea.
    - Duration duration stepper / slider (`5s`).
    - Media thumbnail preview with "Change visual" button.
    - TTS voice test button (speaker icon) to hear the preview.
    - Action buttons: Duplicate, Delete, Reorder handle.
  - Floating Quick-Add button `(+)` positioned between the drawer and the canvas for 1-click scene creation.

### 2.4 Canvas & Player Viewport (`EditorCanvas.jsx`)
* **Aspect Ratio Mockup Frame**:
  - 9:16 vertical phone container with rounded bezels, dark background, and subtle drop shadow.
  - Live Remotion Player instance (`@remotion/player`) rendering the unified composition.
* **"Safe Zones" Overlay (`SafeZonesOverlay.jsx`)**:
  - Toggle button on top-right of canvas.
  - Translucent bounding boxes marking:
    - Top header zone (search, tabs).
    - Right sidebar zone (Like, Comment, Bookmark, Share icons).
    - Bottom caption & audio tag zone (TikTok / Instagram Reels descriptions).
  - Ensures text and captions never get occluded on mobile platforms.
* **Floating Support / Help Bubble**: Fixed at bottom-right of the viewport.

### 2.5 Transport Control Bar (`EditorTransportBar.jsx`)
Horizontal bar situated immediately above the timeline:
* **Left**:
  - `✂ Split` button: Splits the clip at the current playhead frame.
* **Center**:
  - `|◀` Seek to start / previous scene marker.
  - `▶` / `⏸` Circular Play / Pause toggle.
  - `▶|` Seek to end / next scene marker.
  - Timecode display: `00:00.00 / 00:00.02` (format: `mm:ss.ms / mm:ss.ms`).
* **Right**:
  - `⤢` Fit to screen / center canvas.
  - Zoom Controller: Zoom readout percentage `135%` + interactive horizontal zoom slider (`50%` to `200%`).
  - `⛶` Fullscreen toggle.

### 2.6 Multi-Track Timeline (`EditorTimeline.jsx`)
Stretched horizontally across the bottom workspace (height: 180px - 220px):
* **Time Ruler**:
  - Bright green playhead badge displaying current timestamp `00:00.00`.
  - Ruler second markers (`1s`, `2s`, `3s`, `4s`...) that dynamically space out according to the zoom slider.
  - Draggable playhead scrubber line spanning across all track lanes.
* **Track Control Headers (Left Column)**:
  - `Track 3`: Captions & Text Overlays (Visibility toggle `👁`, Mute toggle `🔊`, Lock).
  - `Track 2`: Video & Scene Visuals (Visibility toggle `👁`, Mute toggle `🔊`, Lock).
  - `Track 1`: Background Music & Voiceover (Visibility toggle `👁`, Mute toggle `🔊`, Volume slider).
* **Track Lanes Canvas Grid**:
  - Visual blocks for each clip with thumbnail background, scene badge, and duration.
  - Left & right trim handles for interactive drag-to-resize.
  - Click on any block to select it and focus the corresponding scene in the Script drawer.
  - Real-time scrubbing: Clicking or dragging the ruler seeks the Remotion player instantly.

---

## 🗄️ 3. Database & Backend API Specification

### 3.1 Database Model (`prisma/schema.prisma`)
The existing `VideoProject` model already contains the required fields:
```prisma
model VideoProject {
  id              String   @id
  userId          String?
  title           String   @default("Untitled Video")
  prompt          String?  @db.Text
  script          String?  @db.Text
  aspectRatio     String   @default("9:16") @map("aspect_ratio")
  durationSeconds Int      @default(30) @map("duration_seconds")
  voice           String   @default("marcus")
  captionStyle    String   @default("hormozi") @map("caption_style")
  musicTrack      String   @default("lofi") @map("music_track")
  musicVolume     Decimal  @default(0.25) @map("music_volume")
  scenes          Json     @default("[]")
  thumbnailUrl    String?  @map("thumbnail_url")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("video_projects")
}
```

### 3.2 API Endpoints
1. `GET /api/projects/[id]`:
   - Returns project by ID. If not found or if creating a new draft, returns template defaults.
2. `PUT /api/projects/[id]`:
   - Autosaves updated project data (debounced 1000ms from the editor).
3. `POST /api/projects`:
   - Creates a new project and returns the generated `id`.
4. `DELETE /api/projects/[id]`:
   - Deletes a project.

---

## 🗺️ 4. Iterative Implementation Plan

Because building a complete web-based video editor is a multi-step engineering effort, we break it down into clean, testable phases:

| Phase | Description | Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | **Route & State Foundation** | Create `/src/app/editor/[id]/page.js` and `/src/app/editor/new/page.js`, add `GET /api/projects/[id]`, implement `VideoEditorContext` with autosave. |
| **Phase 2** | **Editor Master Shell & Header** | Build top navigation header (editable title, cloud status, undo/redo, 9:16 switcher, export button) matching screenshot. |
| **Phase 3** | **Left Tool Rail & Contextual Drawers** | Build 64px rail with 7 tools (`AI`, `Script`, `Text`, `Media`, `Transitions`, `Audio`, `Captions`) and the Script Drawer (empty state + scene cards + search + `+` button). |
| **Phase 4** | **Canvas Player & Safe Zones** | Integrate Remotion Player with 9:16 phone frame, Safe Zones toggle overlay (TikTok/Reels overlay guide), and floating chat widget. |
| **Phase 5** | **Transport Controls & Multi-Track Timeline** | Build transport bar (`✂ Split`, Play/Pause, Timecode, 135% Zoom slider) and multi-track timeline (Tracks 1/2/3, ruler, playhead scrubber, trim handles). |
| **Phase 6** | **Export, Keyboard Shortcuts & Polish** | Connect Export modal, wire up keyboard shortcuts (`Space` to toggle playback, `Ctrl+Z`, `Ctrl+Y`, `Delete`), and verify end-to-end user workflows. |

---

## 🚀 Execution Order
We execute iteratively:
1. Start with **Phase 1 & Phase 2** to establish `/editor/[id]` and the top header.
2. Build **Phase 3 & Phase 4** to bring the tool rail, script drawer, and canvas with safe zones to life.
3. Complete **Phase 5 & Phase 6** for the full multi-track timeline, transport controls, and export.
