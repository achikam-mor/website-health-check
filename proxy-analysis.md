# Proxy Performance Analysis

Analysis of proxy IPs across **8 execution runs** (Dec 30, 2025)
- **Runs 1-5:** Previous analysis (already processed)
- **Runs 6-8:** New analysis from 11:55-13:17 UTC (this update)

## Summary Statistics
- **Total Unique Proxies Tested:** 65
- **Critical Failures (3+ failures, 0% success):** 9 proxies ⚠️
- **Consistent Failures (2 failures, 0% success):** 18 proxies
- **Single Failure (needs verification):** 29 proxies
- **Unreliable (mixed results):** 5 proxies
- **Reliable (100% success, 2+ uses):** 4 proxies ✅

---

## Detailed Proxy Performance Table

**Sorted by: Most failures → Success rate → Total attempts**

| Rank | Proxy IP:Port | Total Uses | Passed | Failed | Success Rate | Failure Reasons | Recommendation |
|------|---------------|------------|--------|--------|--------------|-----------------|----------------|
| 1 | 45.88.0.114:3128 | 4 | 0 | 4 | 0.0% | ERR_TIMED_OUT (4×) | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 2 | 138.68.60.8:8080 | 4 | 0 | 4 | 0.0% | Multiple errors | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 3 | 45.88.0.116:3128 | 3 | 0 | 3 | 0.0% | ERR_TIMED_OUT (3×) | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 4 | 45.88.0.115:3128 | 3 | 0 | 3 | 0.0% | ERR_TIMED_OUT (3×) | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 5 | 222.135.71.220:10809 | 3 | 0 | 3 | 0.0% | ERR_TIMED_OUT (3×) | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 6 | 198.199.86.11:80 | 3 | 0 | 3 | 0.0% | toBeVisible failed (3×) | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 7 | 135.125.174.192:80 | 3 | 0 | 3 | 0.0% | Multiple errors | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 8 | 190.242.157.215:8080 | 3 | 0 | 3 | 0.0% | Multiple errors | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 9 | 45.88.0.99:3128 | 3 | 0 | 3 | 0.0% | Multiple errors | **CRITICAL - BLACKLIST IMMEDIATELY** |
| 10 | 45.136.198.40:3128 | 3 | 0 | 3 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 11 | 138.68.60.8:3128 | 3 | 0 | 3 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 12 | 139.59.1.14:8080 | 3 | 0 | 3 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 13 | 159.203.61.169:80 | 3 | 0 | 3 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 14 | 154.17.224.118:80 | 2 | 0 | 2 | 0.0% | ERR_TUNNEL_CONNECTION_FAILED (2×) | ⚠️ ADD TO BLACKLIST |
| 15 | 79.110.200.27:8000 | 2 | 0 | 2 | 0.0% | ERR_EMPTY_RESPONSE, ERR_CONNECTION_RESET | ⚠️ ADD TO BLACKLIST |
| 16 | 41.254.48.192:1978 | 2 | 0 | 2 | 0.0% | ERR_TIMED_OUT (2×) | ⚠️ ADD TO BLACKLIST |
| 17 | 147.83.77.10:3128 | 2 | 0 | 2 | 0.0% | Timeout 10000ms, ERR_TIMED_OUT | ⚠️ ADD TO BLACKLIST |
| 18 | 91.109.204.213:80 | 2 | 0 | 2 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 19 | 80.85.246.214:5555 | 2 | 0 | 2 | 0.0% | toBeVisible failed (2×) | ⚠️ ADD TO BLACKLIST |
| 20 | 45.88.0.113:3128 | 2 | 0 | 2 | 0.0% | ERR_TIMED_OUT (2×) | ⚠️ ADD TO BLACKLIST |
| 21 | 161.35.70.249:3128 | 2 | 0 | 2 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 22 | 62.133.63.236:1111 | 2 | 0 | 2 | 0.0% | ERR_CONNECTION_RESET (2×) | ⚠️ ADD TO BLACKLIST |
| 23 | 209.97.150.167:3128 | 2 | 0 | 2 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 24 | 161.35.70.249:80 | 2 | 0 | 2 | 0.0% | Multiple errors | ⚠️ ADD TO BLACKLIST |
| 25 | 46.161.6.165:8080 | 2 | 2 | 0 | 100.0% | None | ✅ RELIABLE - Keep |
| 26 | 205.237.104.203:3128 | 2 | 2 | 0 | 100.0% | None | ✅ RELIABLE - Keep |
| 27 | 68.235.35.171:3128 | 2 | 1 | 1 | 50.0% | ERR_TIMED_OUT (1×) | ⚠️ Monitor closely |
| 28 | 43.224.118.154:1120 | 2 | 1 | 1 | 50.0% | ERR_TIMED_OUT (1×) | ⚠️ Monitor closely |
| 29 | 176.126.103.194:44214 | 2 | 1 | 1 | 50.0% | ERR_PROXY_CONNECTION_FAILED (1×) | ⚠️ Monitor closely |
| 30 | 195.234.68.34:3128 | 1 | 0 | 1 | 0.0% | ERR_PROXY_CONNECTION_FAILED | Verify on next run |
| 31 | 27.147.218.162:8080 | 1 | 0 | 1 | 0.0% | ERR_EMPTY_RESPONSE | Verify on next run |
| 32 | 163.61.112.245:8080 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 33 | 101.47.16.15:7890 | 1 | 0 | 1 | 0.0% | toBeVisible failed | Verify on next run |
| 34 | 45.88.0.117:3128 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 35 | 190.12.150.244:999 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 36 | 62.60.235.5:80 | 1 | 0 | 1 | 0.0% | ERR_EMPTY_RESPONSE | Verify on next run |
| 37 | 191.37.66.225:8080 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 38 | 163.227.252.24:8080 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 39 | 163.223.78.87:3127 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 40 | 170.81.241.226:999 | 1 | 0 | 1 | 0.0% | ERR_TIMED_OUT | Verify on next run |
| 41 | 45.88.0.98:3128 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 42 | 89.58.55.33:80 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 43 | 161.35.70.249:8080 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 44 | 209.97.150.167:80 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 45 | 198.199.86.11:8080 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 46 | 65.108.203.37:28080 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 47 | 62.60.246.164:9080 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 48 | 87.120.166.178:8080 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 49 | 139.59.1.14:3128 | 1 | 0 | 1 | 0.0% | Multiple errors | Verify on next run |
| 50 | 154.3.236.202:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 51 | 115.114.77.133:9090 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 52 | 113.11.127.179:64300 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 53 | 202.154.18.56:8080 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 54 | 194.26.141.202:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 55 | 167.206.113.248:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 56 | 41.223.119.156:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 57 | 52.188.28.218:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 58 | 177.43.248.58:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 59 | 216.229.112.25:8080 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 60 | 163.227.252.24:8080 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 61 | 101.47.16.15:7890 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 62 | 65.108.203.37:28080 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 63 | 62.60.246.164:9080 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 64 | 87.120.166.178:8080 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |
| 65 | 139.59.1.14:3128 | 1 | 1 | 0 | 100.0% | None | ✅ Success - Test more |

---

## Recommended Actions

### 🚨 CRITICAL PRIORITY: Immediate Blacklist (9 proxies)
**Criteria: 3+ failures with 0% success rate**

```
45.88.0.114:3128         (4 failures - WORST PERFORMER)
138.68.60.8:8080         (4 failures - WORST PERFORMER)  
45.88.0.116:3128         (3 failures - CONSISTENTLY FAILS)
45.88.0.115:3128         (3 failures - CONSISTENTLY FAILS)
222.135.71.220:10809     (3 failures - CONSISTENTLY FAILS)
198.199.86.11:80         (3 failures - CONSISTENTLY FAILS)
135.125.174.192:80       (3 failures)
190.242.157.215:8080     (3 failures)
45.88.0.99:3128          (3 failures)
```

### ⚠️ HIGH PRIORITY: Add to Blacklist (18 proxies)
**Criteria: 2+ failures with 0% success rate**

```
154.17.224.118:80        (2 failures)
79.110.200.27:8000       (2 failures)
41.254.48.192:1978       (2 failures)
147.83.77.10:3128        (2 failures)
45.136.198.40:3128       (2 failures from previous runs)
138.68.60.8:3128         (2 failures from previous runs)
139.59.1.14:8080         (2 failures from previous runs)
159.203.61.169:80        (2 failures from previous runs)
91.109.204.213:80        (2 failures from previous runs)
80.85.246.214:5555       (2 failures from previous runs)
45.88.0.113:3128         (2 failures from previous runs)
161.35.70.249:3128       (2 failures from previous runs)
62.133.63.236:1111       (2 failures from previous runs)
209.97.150.167:3128      (2 failures from previous runs)
161.35.70.249:80         (2 failures from previous runs)
```

### ⚠️ UNSTABLE: Monitor Closely (3 proxies)
**Criteria: Mixed results (50% success rate)**

```
68.235.35.171:3128       (1 success, 1 failure) - Was reliable, now unstable
43.224.118.154:1120      (1 success, 1 failure) - Was reliable, now unstable
176.126.103.194:44214    (1 success, 1 failure) - Was reliable, now unstable
```

### ✅ RELIABLE: Keep Using (2 proxies)
**Criteria: 2 attempts with 100% success**

```
46.161.6.165:8080        (2/2 successes - 100%) - NEW RELIABLE PROXY!
205.237.104.203:3128     (2/2 successes - 100%) - NEW RELIABLE PROXY!
```

### ✅ ONE-TIME SUCCESS: Needs More Testing (14 proxies)
**Single successful attempt - require verification**

```
154.3.236.202:3128       (1/1 - 100%)
115.114.77.133:9090      (1/1 - 100%)
113.11.127.179:64300     (1/1 - 100%)
202.154.18.56:8080       (1/1 - 100%)
194.26.141.202:3128      (1/1 - 100%)
167.206.113.248:3128     (1/1 - 100%)
41.223.119.156:3128      (1/1 - 100%)
[... and 7 more]
```

---

## Key Findings from Runs 6-8

### 🔍 Proxy Behavior Changes:

**Degraded Proxies (previously good, now failing):**
- `68.235.35.171:3128` - Was 100% in run 1, now only 50% (failed in run 6)
- `43.224.118.154:1120` - Was 100% in run 1, now only 50% (failed in run 6)  
- `176.126.103.194:44214` - Was 100% in run 2, failed in run 3

**Improved Proxies (previously failed, now working):**
- NONE - No proxies recovered from previous failures

**New Reliable Discoveries:**
- `46.161.6.165:8080` - 100% success across 2 runs (runs 2-3)
- `205.237.104.203:3128` - 100% success across 2 runs (runs 2-3)

### 📊 Failure Pattern Analysis:

**Most Common Errors (Runs 6-8):**
1. `net::ERR_TIMED_OUT` - 18 occurrences (69% of all failures)
2. `toBeVisible() failed` - 4 occurrences (15%)
3. `ERR_TUNNEL_CONNECTION_FAILED` - 2 occurrences
4. `ERR_EMPTY_RESPONSE` - 2 occurrences
5. `ERR_CONNECTION_RESET` - 2 occurrences
6. `ERR_PROXY_CONNECTION_FAILED` - 2 occurrences

**Critical Subnet Pattern:**
- **45.88.0.x:3128** subnet continues to be 100% unreliable
  - IPs tested: .113, .114, .115, .116, .117
  - Total failures: 10 across 3 runs
  - Success rate: **0%**
  - **RECOMMENDATION: Blacklist entire 45.88.0.0/24 subnet**

**IP Reuse Patterns:**
- 6 proxies appeared multiple times across these 3 runs
- Of those, ZERO showed consistent reliability
- 3 proxies (45.88.0.114, 45.88.0.115, 222.135.71.220) failed in ALL attempts

---

## Common Failure Patterns (All 8 Runs)

### Error Distribution:
1. **net::ERR_TIMED_OUT** - Connection timeout (most frequent - ~65%)
2. **expect(locator).toBeVisible() failed** - Page loaded but content missing (~12%)
3. **net::ERR_PROXY_CONNECTION_FAILED** - Proxy refused connection (~8%)
4. **net::ERR_TUNNEL_CONNECTION_FAILED** - HTTPS tunneling failed (~5%)
5. **net::ERR_CONNECTION_RESET** - Connection dropped (~5%)
6. **net::ERR_EMPTY_RESPONSE** - No response from proxy (~5%)

### Problematic Subnets/IP Ranges:
- **45.88.0.x:3128** - ENTIRE subnet unreliable (IPs: 98-99, 113-117) - 0% success
- **161.35.70.249** - Multiple ports all failed (80, 3128, 8080)
- **138.68.60.8** - Multiple ports all failed (3128, 8080)
- **198.199.86.11** - Multiple ports all failed (80, 8080)
- **209.97.150.167** - Multiple ports all failed (80, 3128)

---*Analysis updated: 2025-12-30 (after 5th execution run)*
*Total execution logs analyzed: 5*
*Total unique proxies tested: 46*
