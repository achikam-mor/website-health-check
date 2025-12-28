# Log Analysis & Fixes - December 28, 2025

## Issues Identified

### 1. Duplicate UI-Proxy Sessions (2 users per UI proxy)

**Problem:** Playwright is running with 2 workers, which creates duplicate browser sessions for each UI proxy (Proxyium, CroxyProxy, VPNBook, Blockaway).

**Evidence from logs:**
```
Running 2 tests using 2 workers
🎯 AD-CLICKING ENABLED FOR THIS USER: PROXYIUM (appears twice)
🎯 AD-CLICKING ENABLED FOR THIS USER: CROXYPROXY (appears twice)
```

**Root Cause:** No Playwright configuration file exists, so it defaults to using multiple workers.

**✅ FIXED:** Created `playwright.config.ts` with `workers: 1`

---

### 2. Error Categories & Root Causes

#### Network/Proxy Errors:
- **ERR_TUNNEL_CONNECTION_FAILED**: Proxy cannot establish tunnel to target (most common)
- **ERR_EMPTY_RESPONSE**: Proxy returns empty responses (overloaded/misconfigured)
- **ERR_TIMED_OUT**: Requests exceed 120-second timeout (very slow proxies)
- **ERR_CONNECTION_RESET**: Connection drops during communication (unstable)
- **ERR_PROXY_CONNECTION_FAILED**: Cannot connect to proxy server (proxy is down)

#### Browser/Page Errors:
- **expect(locator).toBeVisible() failed on body**: Page loads but body hidden (UI proxy blocking)
- **browserContext.route: Target closed**: Critical browser crash (200.59.191.233)

---

### 3. Problematic Proxies (High Failure Rate)

Based on failure analysis, these proxies should be **REMOVED**:

| Proxy | Port | Failures | Issues |
|-------|------|----------|--------|
| 138.68.60.8 | 8080 | **9 pages** | Most failures, body visibility issues |
| 185.129.117.221 | 80 | **8 pages** | ERR_TUNNEL_CONNECTION_FAILED |
| 12.50.107.217 | 80 | **8 pages** | Multiple connection failures |
| 200.59.191.233 | 999 | **7 pages + CRASH** | Browser crash - CRITICAL |
| 5.180.172.130 | 80 | **7 pages** | ERR_CONNECTION_RESET |
| 172.238.22.205 | 80 | **6 pages** | ERR_TUNNEL_CONNECTION_FAILED |
| 89.116.88.19 | 80 | **6 pages** | Mixed timeout/tunnel errors |
| 209.97.150.167 | 8080 | **6 pages** | Body visibility failures |

**Note:** 200.59.191.233 caused a critical browser crash and should be removed immediately.

---

## Files Changed

### 1. playwright.config.ts (NEW)
- Set `workers: 1` to prevent duplicate UI proxy sessions
- Configured timeout: 18 minutes
- Disabled retries (not needed for health checks)

### 2. scripts/remove-problematic-proxies.mjs (NEW)
- Script to automatically remove the 8 problematic proxies
- Updates both `working-proxies.json` and `verified-proxies.json`

---

## Actions Required

### On THIS PC:
1. **No compilation needed** - This is a Node.js/Playwright project, no compilation step required

2. **Run the cleanup script:**
   ```powershell
   node scripts/remove-problematic-proxies.mjs
   ```
   This will remove the 8 problematic proxies from your JSON files.

### Git Commands:
After running the cleanup script, commit the changes:

```bash
git add playwright.config.ts
git add scripts/remove-problematic-proxies.mjs
git add working-proxies.json
git add verified-proxies.json
git commit -m "fix: prevent duplicate UI proxy sessions and remove problematic proxies

- Add playwright.config.ts with workers: 1 to prevent duplicate sessions
- Remove 8 high-failure proxies causing connection issues
- Add cleanup script for future maintenance"
git push
```

### On PC2 (if needed):
- No action required on PC2
- Changes will sync via git

---

## Expected Results After Fix

1. **Single UI proxy session per test run** instead of duplicate
   - Logs will show each UI proxy message only ONCE
   
2. **Fewer errors** from API proxies
   - Removed 8 worst performing proxies
   - Should reduce overall failure rate
   
3. **Better reliability**
   - No more browser crashes from 200.59.191.233
   - Faster execution (no duplicate work)

---

## Testing Recommendation

After applying fixes, monitor the next few test runs:
- Verify only 1 instance of each UI proxy message appears
- Check if overall failure rate decreases
- If more proxies consistently fail (4+ pages), run the analysis again

---

## Notes

- The 4 UI proxies (Proxyium, CroxyProxy, VPNBook, Blockaway) showing "body not visible" errors are **expected** - these are web-based proxies that sometimes inject additional content that hides the body element temporarily
- Direct connection and most API proxies are working correctly
- Consider increasing the proxy pool if you need more diversity after removing these 8 proxies
