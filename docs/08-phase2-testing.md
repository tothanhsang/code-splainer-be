# 🧪 Phase 2: Testing Guide

## 🚀 Quick Start Testing

### 1. Start the Server

```bash
cd code-splainer-be
pnpm dev
```

Server should start on `http://localhost:3001`

---

## 📝 Test Scenario 1: Two-Step Workflow

### Step 1: Upload Project Context

```bash
# Create a test project
mkdir test-project
cd test-project

# Create some sample files
cat > index.ts << 'EOF'
export function calculateTotal(items: any[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

export function getUser(id: string) {
  const query = `SELECT * FROM users WHERE id = ${id}`;
  return db.query(query);
}
EOF

cat > cart.service.ts << 'EOF'
import { calculateTotal } from './index';

export class CartService {
  addItem(cart, item) {
    cart.items.push(item);
    cart.total = calculateTotal(cart.items);
    return cart;
  }
  
  removeItem(cart, itemId) {
    cart.items = cart.items.filter(i => i.id !== itemId);
    return cart;
  }
}
EOF

# Zip the project
cd ..
zip -r test-project.zip test-project/

# Upload to API
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@test-project.zip" \
  | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "contextId": "abc123...",
    "stats": {
      "totalFiles": 2,
      "totalLines": 25,
      "filesByExtension": {
        ".ts": 2
      }
    },
    "message": "Project context uploaded successfully..."
  }
}
```

**Save the `contextId` for next step!**

---

### Step 2: Review Changes

```bash
# Create changes
cd test-project

# Modify index.ts to fix SQL injection
cat > index.ts << 'EOF'
export function calculateTotal(items: any[]) {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}

export function getUser(id: string) {
  // Fixed: Use parameterized query
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}
EOF

# Create diff
git init
git add .
git commit -m "Initial"
# Make changes above
git diff HEAD > ../changes.patch

cd ..

# Submit for review
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=YOUR_CONTEXT_ID_HERE" \
  -F "changeDescription=Fixed SQL injection and improved calculateTotal function" \
  -F "changes=@changes.patch" \
  | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "overallQuality": "Good improvements! Security issue fixed.",
      "summary": {
        "totalIssues": 2,
        "criticalIssues": 0,
        "filesReviewed": 1
      },
      "potentialBugs": [],
      "performanceIssues": [],
      "securityVulnerabilities": [],
      "conventionViolations": [
        {
          "file": "index.ts",
          "severity": "low",
          "issue": "Consider adding type annotations",
          "suggestion": "Add proper TypeScript types for items parameter"
        }
      ],
      "improvements": [
        {
          "file": "index.ts",
          "type": "best-practice",
          "suggestion": "Good use of reduce() for array operations"
        }
      ],
      "positivePoints": [
        "Fixed SQL injection vulnerability",
        "Added null check for items array",
        "Improved code readability"
      ]
    },
    "stats": {
      "totalIssues": 2,
      "issuesBySeverity": {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 2
      }
    }
  }
}
```

---

## 📝 Test Scenario 2: Quick Review (One-Step)

```bash
# Use the same test-project.zip and changes.patch from above

curl -X POST http://localhost:3001/api/code-review/quick-review \
  -F "codebase=@test-project.zip" \
  -F "changes=@changes.patch" \
  -F "changeDescription=Fixed SQL injection and improved performance" \
  | jq '.'
```

**Expected Response:**
Same as Step 2 above, plus project stats.

---

## 📝 Test Scenario 3: Testing with Real Project

### Prepare Your Project

```bash
# Navigate to your project
cd /path/to/your/project

# Create ZIP (exclude unnecessary files)
zip -r ../my-project.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "build/*" \
  -x "coverage/*" \
  -x ".next/*"

# Upload context
curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@../my-project.zip" \
  | jq '.data.contextId'
```

### Create Changes to Review

```bash
# Make some changes to your code
# Then create diff
git diff > my-changes.patch

# Or for specific files
git diff -- src/auth.ts src/user.service.ts > my-changes.patch

# Review
curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=YOUR_CONTEXT_ID" \
  -F "changeDescription=Added user authentication with JWT" \
  -F "changes=@my-changes.patch" \
  | jq '.'
```

---

## 🧪 Test Cases

### Test Case 1: SQL Injection Detection

**Code with Issue:**
```typescript
function getUser(id: string) {
  return db.query(`SELECT * FROM users WHERE id = ${id}`);
}
```

**Expected:** AI should detect SQL injection vulnerability with `critical` severity.

---

### Test Case 2: Null Pointer Detection

**Code with Issue:**
```typescript
function processCart(cart) {
  return cart.items.map(item => item.price);
}
```

**Expected:** AI should detect potential null pointer when `cart.items` is undefined.

---

### Test Case 3: Performance Issue

**Code with Issue:**
```typescript
for (let i = 0; i < users.length; i++) {
  const orders = await db.query('SELECT * FROM orders WHERE user_id = ?', [users[i].id]);
  users[i].orders = orders;
}
```

**Expected:** AI should detect N+1 query problem.

---

### Test Case 4: Convention Violation

**Code with Issue:**
```typescript
function Calculate_Total(items) {
  // ...
}
```

**Expected:** AI should suggest camelCase naming convention.

---

## 📊 Testing Checklist

### Basic Functionality
- [ ] Server starts without errors
- [ ] Health check endpoint works (`/health`)
- [ ] Upload context endpoint accepts ZIP files
- [ ] Context is stored in Redis
- [ ] Review changes endpoint works
- [ ] Quick review endpoint works

### File Handling
- [ ] ZIP files are extracted correctly
- [ ] Binary files are skipped
- [ ] Diff/patch files are parsed correctly
- [ ] Large files are handled (up to 50MB)
- [ ] Invalid files return proper errors

### AI Review Quality
- [ ] Detects SQL injection
- [ ] Detects null pointer issues
- [ ] Detects performance problems
- [ ] Checks convention compliance
- [ ] Provides actionable suggestions
- [ ] Includes positive feedback

### Error Handling
- [ ] Missing files return 400 error
- [ ] Invalid ZIP returns 400 error
- [ ] Expired context returns 404 error
- [ ] AI errors return 500 with details

### Caching
- [ ] Repeated reviews use cache
- [ ] Cache hit logs appear
- [ ] Cache expires after 1 hour

---

## 🐛 Common Issues & Solutions

### Issue 1: "Project context not found"

**Cause:** Context expired (24 hours) or Redis not running

**Solution:**
```bash
# Check Redis
redis-cli ping

# If not running, start Redis
redis-server

# Re-upload context
```

---

### Issue 2: "ZIP file too large"

**Cause:** File exceeds 50MB limit

**Solution:**
```bash
# Check file size
ls -lh my-project.zip

# Exclude more files
zip -r project.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "*.log"
```

---

### Issue 3: "No valid changes found"

**Cause:** ZIP contains only binary files or diff is empty

**Solution:**
```bash
# Check diff content
cat changes.patch

# Ensure you have actual changes
git status
git diff
```

---

### Issue 4: AI returns incomplete review

**Cause:** Project context too large, AI token limit exceeded

**Solution:**
- Reduce codebase size
- Focus on specific modules
- Use smaller context window

---

## 📈 Performance Testing

### Test Response Times

```bash
# Time the upload
time curl -X POST http://localhost:3001/api/code-review/upload-context \
  -F "codebase=@test-project.zip"

# Time the review
time curl -X POST http://localhost:3001/api/code-review/review-changes \
  -F "contextId=abc123" \
  -F "changeDescription=Test" \
  -F "changes=@changes.patch"
```

**Expected Times:**
- Upload context: < 5 seconds (small project)
- Review changes: < 10 seconds (first time)
- Review changes: < 1 second (cached)

---

## 🎯 Success Criteria

✅ All endpoints return proper responses  
✅ AI detects at least 3 types of issues  
✅ Suggestions are actionable and specific  
✅ Caching works correctly  
✅ Error handling is comprehensive  
✅ Performance is acceptable  

---

## 📚 Next Steps

After testing:
1. ✅ Verify all test cases pass
2. ✅ Check logs for errors
3. ✅ Test with real projects
4. ✅ Optimize prompts if needed
5. ✅ Add more test cases

---

## 🎉 Ready for Demo!

Once all tests pass, Phase 2 is ready for demonstration! 🚀
