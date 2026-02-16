# Dynamic Template Resolution - Complete Execution Flow

This document explains how the refactored ZapClone workflow engine handles dynamic metadata-driven templates using payload data instead of static values.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION TIME                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User creates workflow trigger                                │
│     └─ Provides samplePayload (from real webhook)               │
│                                                                   │
│  2. System extracts available fields from samplePayload          │
│     └─ API: GET /triggers/:id/fields                            │
│     └─ Returns: { path: "issue.title", displayName: "..." }     │
│                                                                   │
│  3. User configures actions with template strings               │
│     └─ Email: "GitHub issue {{issue.number}}: {{issue.title}}" │
│     └─ Templates NOT resolved at config time                    │
│     └─ Stored as-is in Action.metadata                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         RUNTIME / EXECUTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  4. Webhook triggers workflow                                    │
│     └─ POST /webhook/trigger/:zapId                             │
│     └─ Payload: { issue: { number: 42, title: "Bug..." } }     │
│                                                                   │
│  5. System creates ZapRun record                                │
│     └─ payload: actual webhook JSON                              │
│     └─ metadata: {} (for action results)                         │
│                                                                   │
│  6. Kafka message queued: { zapRunId, stage: 0 }               │
│     └─ Sent to 'zap-events' topic                               │
│                                                                   │
│  7. Worker processes message                                     │
│     └─ Fetches: ZapRun with payload + Action with metadata     │
│     └─ Builds execution context:                                │
│        - Merges webhook payload + previous action results       │
│        - Context = { issue: {...}, action_0: {...}, ... }      │
│                                                                   │
│  8. Worker resolves all templates                               │
│     └─ Original metadata: { email, subject, body (template) }  │
│     └─ resolveTemplate(body, executionContext)                 │
│     └─ Replaces {{issue.number}} with 42                       │
│     └─ Replaces {{issue.title}} with "Bug..."                  │
│     └─ Returns: { email, subject, body (resolved) }            │
│                                                                   │
│  9. Worker executes action with resolved values                 │
│     └─ sendEmail(resolved)                                      │
│     └─ Uses actual data, NOT templates                          │
│                                                                   │
│  10. If action produces output (Gemini, etc.)                  │
│      └─ Store under: zapRunMetadata.action_{stage}             │
│      └─ Next action can reference: {{action_0.output}}         │
│                                                                   │
│  11. Queue next action (stage + 1)                             │
│      └─ repeat from step 7                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Example: GitHub Issue → Email Notification

### Configuration Phase (User Setup)

#### 1. Create Zap with Webhook Trigger

```typescript
// Frontend: User creates trigger
POST /zaps/create
{
  "name": "GitHub Issue Alert",
  "availableTriggerId": "webhook",
  "actions": [{
    "availableActionId": "email"
    // "actionMetadata" - set in next step
  }]
}

// Response:
{ "zapId": "zap_123" }
```

#### 2. User Provides Sample Payload

User tests webhook URL and captures real GitHub webhook data:

```typescript
PUT /triggers/trigger_123/sample-payload
{
  "samplePayload": {
    "action": "opened",
    "issue": {
      "number": 42,
      "title": "Fix authentication bug",
      "body": "Users cannot log in with third-party providers",
      "user": {
        "login": "john-developer",
        "email": "john@example.com"
      },
      "labels": ["bug", "critical"],
      "created_at": "2024-02-15T10:30:00Z"
    },
    "repository": {
      "name": "zapclone",
      "owner": "vikash"
    }
  }
}
```

#### 3. Frontend Fetches Available Fields

```typescript
GET /triggers/trigger_123/fields

// Response:
{
  "fields": [
    {
      "path": "action",
      "displayName": "Action",
      "type": "string",
      "value": "opened"
    },
    {
      "path": "issue.number",
      "displayName": "Issue Number",
      "type": "number",
      "value": 42
    },
    {
      "path": "issue.title",
      "displayName": "Issue Title",
      "type": "string",
      "value": "Fix authentication bug"
    },
    {
      "path": "issue.user.email",
      "displayName": "Issue User Email",
      "type": "string",
      "value": "john@example.com"
    },
    {
      "path": "repository.name",
      "displayName": "Repository Name",
      "type": "string",
      "value": "zapclone"
    }
    // ... more fields
  ],
  "totalFields": 28
}
```

#### 4. User Configures Email Action with Templates

```typescript
// Frontend: User creates template in Email configuration tab
// User selects from available fields and builds template

const actionMetadata = {
  email: "john@example.com",
  subject: "[{{repository.name}}] Issue #{{issue.number}} - {{issue.title}}",
  body: "An issue was {{action}} in {{repository.name}}:\n\n" +
        "Issue #{{issue.number}}: {{issue.title}}\n" +
        "Reported by: {{issue.user.login}}\n" +
        "Label: {{issue.labels[0]}}\n\n" +
        "Description:\n{{issue.body}}"
};

// Stored in database - NOT parsed/resolved yet!
```

### Runtime Phase (Execution)

#### 5. Webhook Arrives with Real Data

```typescript
POST /webhook/github/zap_123
{
  "action": "opened",
  "issue": {
    "number": 42,
    "title": "Fix authentication bug",
    "body": "Users cannot log in with third-party providers",
    "user": {
      "login": "john-developer",
      "email": "john@example.com"
    },
    "labels": ["bug", "critical"],
    "created_at": "2024-02-15T10:30:00Z"
  },
  "repository": {
    "name": "zapclone",
    "owner": "vikash"
  }
  // ... more GitHub data
}
```

#### 6. System Creates ZapRun

```prisma
// Created in database
ZapRun {
  id: "run_xyz789"
  zapId: "zap_123"
  payload: { ... actual webhook JSON ... }  // ← ACTUAL DATA
  metadata: {}                               // ← For results of previous actions
  createdAt: 2024-02-15T10:35:00Z
}
```

#### 7. Kafka Message Sent

```typescript
// To 'zap-events' topic
{
  "zapRunId": "run_xyz789",
  "stage": 0  // First action
}
```

#### 8. Worker Processes Action

```typescript
// In worker/src/index.ts - eachMessage handler

// A. Fetch ZapRun and Action
const zapRun = await prisma.zapRun.findFirst({
  where: { id: "run_xyz789" },
  include: { zap: { include: { actions: true } } }
});

// B. Build execution context (merge payload + previous results)
const executionContext = {
  // Original webhook payload
  action: "opened",
  issue: { ... },
  repository: { ... },
  
  // Previous action results (empty for first action)
  // (would be populated in stage > 0)
};

// C. Get action metadata
const currentAction = zapRun.zap.actions[0]; // Email action
const actionMetadata = {
  email: "john@example.com",
  subject: "[{{repository.name}}] Issue #{{issue.number}} - {{issue.title}}",
  body: "An issue was {{action}} in {{repository.name}}:\n\n..."
};

// D. Resolve ALL templates recursively
const resolvedMetadata = resolveTemplatesInObject(actionMetadata, executionContext);
// Result:
{
  email: "john@example.com",  // (no templates, unchanged)
  subject: "[zapclone] Issue #42 - Fix authentication bug",  // ← RESOLVED
  body: "An issue was opened in zapclone:\n\n" +            // ← RESOLVED
        "Issue #42: Fix authentication bug\n" +
        "Reported by: john-developer\n" +
        "Label: bug\n\n" +
        "Description:\n" +
        "Users cannot log in with third-party providers"
}

// E. Send email with resolved values
await sendEmail({
  email: "john@example.com",
  subject: "[zapclone] Issue #42 - Fix authentication bug",
  body: "..."
});

// F. Queue next action (if any)
await producer.send({
  topic: 'zap-events',
  messages: [{
    value: JSON.stringify({ zapRunId: "run_xyz789", stage: 1 })
  }]
});
```

## Key Implementation Details

### 1. Template String Format

- **Valid:** `{{path.to.field}}`  
- **Supports:** Dot notation, array indices, nested objects
- **Examples:**
  - `{{user.name}}`
  - `{{items[0].title}}`
  - `{{data.nested.deep.value}}`

### 2. Template Resolution Safety

The system is **fail-safe**:

```typescript
// If field doesn't exist in payload:
resolveTemplate("Hello {{user.name}}", {})
// ↓
// Returns: "Hello " (empty string, no error)

// If path is partially missing:
resolveTemplate("{{issue.title}}", { issue: {} })
// ↓
// Returns: "" (not "{{issue.title}}", not error)
```

### 3. Execution Context Building

```typescript
function buildExecutionContext(webhookPayload, previousResults) {
  return {
    ...webhookPayload,           // ← Top-level fields from trigger
    ...previousResults           // ← Results from action_0, action_1, etc.
  };
}

// Example: After Gemini action produces content
{
  issue: { ... },
  repository: { ... },
  user: { ... },
  action_0: { output: "Generated summary text" }  // ← Gemini result
}

// Next action can reference: {{action_0.output}}
```

### 4. Template Types  Per Action

#### Email Action Template
```json
{
  "email": "user@example.com",
  "subject": "Template {{with.placeholders}}",
  "body": "Multi-line template"
}
```

#### Slack/Discord Templates
```json
{
  "webhookUrl": "https://...",
  "message": "Formatted message with {{data}} placeholders"
}
```

#### Google Sheet Template
```json
{
  "spreadsheetId": "abc123",
  "row": {
    "column1": "{{data.field1}}",
    "column2": "{{data.field2}}",
    "column3": "{{data.field3}}"
  }
}
```

## Database Schema

### Trigger Model
```prisma
model Trigger {
  id            String   @id @default(uuid())
  zapId         String   @unique
  TriggerId     String
  metadata      Json     @default("{}")      // Trigger config
  samplePayload Json     @default("{}")      // ← NEW: Sample webhook data
  type          AvailableTriggers ...
  zap           Zap ...
}
```

### Action Model (unchanged)
```prisma
model Action {
  id           String      @id @default(uuid())
  zapId        String
  actionId     String
  metadata     Json        @default("{}")    // Template strings stored here
  sortingOrder Int         @default(0)
  type         AvailableAction ...
  zap          Zap ...
}
```

### ZapRun Model
```prisma
model ZapRun {
  id        String   @id @default(uuid())
  zapId     String
  metadata  Json     @default("{}")         // ← Results from actions
  payload   Json     @default("{}")         // ← NEW: Actual webhook payload
  createdAt DateTime @default(now())
  zap       Zap ...
  zapRunOutbox ZapRunOutbox ...
}
```

## Migration Guide (Existing Workflows)

### For Old Workflows Using Direct Values

**Old (static values):**
```json
{
  "email": "user@example.com",
  "subject": "GitHub Issue #42",
  "body": "An issue was opened..."
}
```

**New (templates with payload):**
```json
{
  "email": "{{user.email}}",
  "subject": "GitHub Issue #{{issue.number}}",
  "body": "An issue was {{action}}..."
}
```

### Backward Compatibility

✅ **No breaking changes** - the worker still supports direct values:

```typescript
// If metadata doesn't contain {{...}}, it's returned as-is
resolveTemplate("direct value", payload)
// ↓
// Returns: "direct value" (unchanged)
```

## API Endpoints

### Get Available Fields from Trigger
```
GET /triggers/:triggerId/fields

Response:
{
  "fields": [
    {
      "path": "issue.number",
      "displayName": "Issue Number",
      "type": "number"
    },
    ...
  ],
  "samplePayload": { ... }
}
```

### Update Trigger Sample Payload
```
PUT /triggers/:triggerId/sample-payload

Body:
{
  "samplePayload": { ... }
}

Response:
{
  "message": "Sample payload updated",
  "trigger": { ... }
}
```

### Create ZapRun (webhook endpoint)
```
POST /webhook/:zapId

Body: (any JSON)
{ ... webhook payload ... }

Response:
{
  "zapRunId": "..."
}
```

## Benefits of This Architecture

✅ **Payload-Driven** - No hardcoded fields  
✅ **Flexible** - Works with any JSON structure  
✅ **Safe** - Missing fields don't cause errors  
✅ **Testable** - Can validate templates at config time  
✅ **Composable** - Action results chain into next action templates  
✅ **Backward Compatible** - Direct values still work  
✅ **User-Friendly** - Frontend can show available fields from sample payload  

## Debugging Tips

### View Available Fields
```bash
curl http://localhost:3000/triggers/trigger_123/fields | jq
```

### Check Actual Payload Stored
```bash
psql
SELECT payload FROM "ZapRun" WHERE id = 'run_xyz789';
```

### Check Action Metadata (Templates Before Resolution)
```bash
psql
SELECT metadata FROM "Action" WHERE id = 'action_abc';
```

### Enable Debug Logging
```typescript
// In worker - uncomment for verbose output
console.log({
  original: currentAction.metadata,
  resolved: resolvedMetadata,
  context: executionContext
});
```

---

**Last Updated:** 2024-02-15  
**Version:** 2.0 (Dynamic Templates)
