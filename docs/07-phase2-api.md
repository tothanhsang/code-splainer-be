# 📘 Phase 2: AI Code Review Assistant - API Documentation

## 🎯 Overview

Phase 2 provides AI-powered code review capabilities that analyze code changes in the context of the entire codebase.

**Key Features:**
- ✅ Upload entire codebase for context
- ✅ Review code changes with AI
- ✅ Detect bugs, performance issues, security vulnerabilities
- ✅ Check convention compliance
- ✅ Provide improvement suggestions

## 🔄 Two-Step Workflow

### Step 1: Upload Project Context
Upload the entire codebase so AI can understand the project structure and conventions.

### Step 2: Review Changes
Upload code changes (diff or modified files) and get comprehensive AI review.

---

## 📡 API Endpoints

### 1. Upload Project Context

**Endpoint:** `POST /api/code-review/upload-context`

**Purpose:** Upload toàn bộ codebase để AI học và lưu trữ context.

**Request:**
```http
POST /api/code-review/upload-context
Content-Type: multipart/form-data

Body:
- codebase: File ZIP chứa toàn bộ source code (max 50MB)
```

**Example with curl:**
```bash
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@my-project.zip"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contextId": "a1b2c3d4e5f6...",
    "stats": {
      "totalFiles": 45,
      "totalLines": 3250,
      "filesByExtension": {
        ".ts": 30,
        ".tsx": 10,
        ".json": 5
      }
    },
    "message": "Project context uploaded successfully. You can now submit code changes for review."
  }
}
```

**Notes:**
- Context is stored in Redis for 24 hours
- Save the `contextId` for the next step
- Only text files are processed (binary files are skipped)
- Common directories like `node_modules/`, `.git/`, `dist/` are automatically excluded

---

### 2. Review Changes

**Endpoint:** `POST /api/code-review/review-changes`

**Purpose:** Review code changes với context đã upload.

**Request:**
```http
POST /api/code-review/review-changes
Content-Type: multipart/form-data

Body:
- contextId: string (from step 1)
- changeDescription: string (mô tả thay đổi)
- changes: File ZIP hoặc .patch/.diff file
```

**Example with curl:**
```bash
# With ZIP file
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=a1b2c3d4e5f6..." \
  -F "changeDescription=Fixed cart logic and optimized database queries" \
  -F "changes=@changed-files.zip"

# With diff file
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=a1b2c3d4e5f6..." \
  -F "changeDescription=Added user authentication" \
  -F "changes=@changes.patch"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "overallQuality": "Code changes are generally good with some minor issues to address",
      "summary": {
        "totalIssues": 5,
        "criticalIssues": 1,
        "filesReviewed": 3
      },
      "potentialBugs": [
        {
          "file": "src/cart.service.ts",
          "line": 45,
          "severity": "high",
          "issue": "Potential null pointer exception when cart.items is undefined",
          "suggestion": "Add null check: if (!cart.items) return [];"
        }
      ],
      "performanceIssues": [
        {
          "file": "src/database.ts",
          "line": 120,
          "severity": "medium",
          "issue": "N+1 query problem in loop",
          "suggestion": "Use batch query or JOIN instead of querying in loop"
        }
      ],
      "securityVulnerabilities": [
        {
          "file": "src/auth.controller.ts",
          "line": 30,
          "severity": "critical",
          "issue": "SQL injection vulnerability - user input not sanitized",
          "suggestion": "Use parameterized queries or ORM"
        }
      ],
      "conventionViolations": [
        {
          "file": "src/utils.ts",
          "line": 15,
          "severity": "low",
          "issue": "Function name should be camelCase",
          "suggestion": "Rename Calculate_Total to calculateTotal"
        }
      ],
      "improvements": [
        {
          "file": "src/cart.service.ts",
          "line": 60,
          "type": "refactoring",
          "suggestion": "Extract complex logic into separate function for better readability"
        }
      ],
      "positivePoints": [
        "Good error handling in cart.service.ts",
        "Well-structured code with clear separation of concerns",
        "Comprehensive input validation"
      ]
    },
    "stats": {
      "totalIssues": 5,
      "issuesBySeverity": {
        "critical": 1,
        "high": 1,
        "medium": 1,
        "low": 2
      },
      "issuesByCategory": {
        "bugs": 1,
        "performance": 1,
        "security": 1,
        "convention": 2
      }
    },
    "filesReviewed": [
      "src/cart.service.ts",
      "src/database.ts",
      "src/auth.controller.ts"
    ]
  }
}
```

---

### 3. Quick Review (One-Step)

**Endpoint:** `POST /api/code-review/quick-review`

**Purpose:** Upload codebase và changes cùng lúc (không cần lưu context).

**Request:**
```http
POST /api/code-review/quick-review
Content-Type: multipart/form-data

Body:
- codebase: File ZIP chứa toàn bộ source code
- changes: File ZIP hoặc .patch/.diff file
- changeDescription: string
```

**Example with curl:**
```bash
curl -X POST http://localhost:3001/api/code-review/quick-review \
  -F "codebase=@my-project.zip" \
  -F "changes=@changed-files.zip" \
  -F "changeDescription=Added user authentication feature"
```

**Response:**
Same structure as `/review-changes` endpoint, plus:
```json
{
  "success": true,
  "data": {
    "review": { ... },
    "stats": { ... },
    "projectStats": {
      "totalFiles": 45,
      "totalLines": 3250,
      "filesByExtension": { ... }
    },
    "filesReviewed": [ ... ]
  }
}
```

**Use Cases:**
- One-time reviews
- Small projects
- Quick checks without storing context

---

## 🎯 Review Output Structure

### Issue Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| `critical` | Must fix before merge | Immediate action |
| `high` | Should fix before merge | High priority |
| `medium` | Should fix soon | Medium priority |
| `low` | Nice to fix | Low priority |

### Issue Categories

1. **Potential Bugs** - Logic errors, null pointers, edge cases
2. **Performance Issues** - Slow queries, inefficient loops, memory leaks
3. **Security Vulnerabilities** - SQL injection, XSS, insecure data handling
4. **Convention Violations** - Coding style, naming conventions, project patterns
5. **Improvements** - Refactoring suggestions, best practices

---

## 📝 Best Practices

### Preparing Codebase ZIP

```bash
# Exclude unnecessary files
zip -r codebase.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "build/*" \
  -x "coverage/*"
```

### Creating Diff File

```bash
# Git diff for uncommitted changes
git diff > changes.patch

# Git diff for specific commit
git diff HEAD~1 HEAD > changes.patch

# Git diff for specific files
git diff -- src/cart.service.ts src/database.ts > changes.patch
```

### Writing Good Change Descriptions

**Good:**
```
"Added user authentication with JWT tokens. 
Implemented login/logout endpoints and password hashing with bcrypt."
```

**Bad:**
```
"Updated files"
```

---

## 🔍 Testing Examples

### Test 1: Upload Context

```bash
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@test-project.zip"

# Save the contextId from response
```

### Test 2: Review Changes

```bash
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=YOUR_CONTEXT_ID" \
  -F "changeDescription=Fixed authentication bug" \
  -F "changes=@changes.patch"
```

### Test 3: Quick Review

```bash
curl -X POST http://localhost:3001/api/code-review/quick-review \
  -F "codebase=@small-project.zip" \
  -F "changes=@my-changes.zip" \
  -F "changeDescription=Refactored user service"
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Please upload codebase file (.zip)"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Project context not found or expired. Please upload codebase again."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Code review failed: [error details]"
}
```

---

## 🚀 Integration Examples

### JavaScript/TypeScript

```typescript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Step 1: Upload context
const uploadContext = async () => {
  const form = new FormData();
  form.append('codebase', fs.createReadStream('project.zip'));
  
  const response = await axios.post(
    'http://localhost:3001/api/code-review/upload-context',
    form,
    { headers: form.getHeaders() }
  );
  
  return response.data.data.contextId;
};

// Step 2: Review changes
const reviewChanges = async (contextId: string) => {
  const form = new FormData();
  form.append('contextId', contextId);
  form.append('changeDescription', 'Fixed authentication');
  form.append('changes', fs.createReadStream('changes.patch'));
  
  const response = await axios.post(
    'http://localhost:3001/api/code-review/review-changes',
    form,
    { headers: form.getHeaders() }
  );
  
  return response.data.data.review;
};
```

### Python

```python
import requests

# Upload context
with open('project.zip', 'rb') as f:
    response = requests.post(
        'http://localhost:3001/api/code-review/upload-context',
        files={'codebase': f}
    )
    context_id = response.json()['data']['contextId']

# Review changes
with open('changes.patch', 'rb') as f:
    response = requests.post(
        'http://localhost:3001/api/code-review/review-changes',
        files={'changes': f},
        data={
            'contextId': context_id,
            'changeDescription': 'Fixed authentication'
        }
    )
    review = response.json()['data']['review']
```

---

## 💡 Tips

1. **Context Size:** Keep codebase under 50MB for optimal performance
2. **File Filtering:** System automatically skips binary files and common build directories
3. **Cache Duration:** Context is cached for 24 hours
4. **Diff Format:** Use standard Git diff format for best results
5. **Description Quality:** Better descriptions lead to better reviews

---

### 4. Get Context Information

**Endpoint:** `GET /api/code-review/context/:contextId`

**Purpose:** Lấy metadata và trạng thái của project context đã upload.

**Parameters:**
- `contextId` (path parameter): ID của context đã upload

**Example with curl:**
```bash
curl -X GET http://localhost:3001/api/code-review/context/a1b2c3d4e5f6...
```

**Response (Context Exists):**
```json
{
  "success": true,
  "data": {
    "contextId": "a1b2c3d4e5f6789...",
    "exists": true,
    "stats": {
      "totalFiles": 45,
      "totalLines": 3250,
      "sizeInBytes": 245678,
      "filesByExtension": {
        ".ts": 30,
        ".tsx": 10,
        ".json": 5
      }
    },
    "expiresIn": 82800,
    "createdAt": "2025-01-17T10:30:00.000Z"
  }
}
```

**Response (Context Not Found):**
```json
{
  "success": true,
  "data": {
    "contextId": "a1b2c3d4e5f6789...",
    "exists": false
  }
}
```

**Use Case - Check Before Review:**
```typescript
async function checkContextBeforeReview(contextId: string) {
  const response = await fetch(
    `http://localhost:3001/api/code-review/context/${contextId}`
  );
  
  const { data } = await response.json();
  
  if (!data.exists) {
    alert("Context expired! Please upload codebase again.");
    return false;
  }
  
  if (data.expiresIn < 3600) { // Less than 1 hour
    alert(`Warning: Context expires in ${Math.floor(data.expiresIn / 60)} minutes`);
  }
  
  return true;
}
```

**Context Expiration:**
- Default TTL: 24 hours (86400 seconds)
- Check `expiresIn` field for remaining time
- Re-upload if context expired

---

## 📚 Related Documentation

- [Phase 2 Guide](./06-phase2-guide.md)
- [Phase 2 Testing](./08-phase2-testing.md)
- [Phase 1: Spec Analyzer](./04-phase1-guide.md)
- [Genkit Guide](./05-genkit-guide.md)
- [Getting Started](./03-getting-started.md)
