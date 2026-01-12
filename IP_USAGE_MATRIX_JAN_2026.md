# IP Usage Matrix - January 12, 2026

## Analysis Criteria
**Blacklist Threshold**: IPs used >10 times with 100% failure rate (never succeeded on any API)

---

## Complete IP Usage Matrix

### Category 1: IPs Meeting Blacklist Criteria (>10 uses, 100% failure)

| Rank | IP Address | Total Uses | Successes | Failures | Success Rate | Failure Patterns | Current Status |
|------|------------|------------|-----------|----------|--------------|------------------|----------------|
| 1 | **209.97.150.167** | **18** | **0** | **18** | **0%** | Failed across 3 different ports (80, 3128, 8080) - ERR_TUNNEL_CONNECTION_FAILED, toBeVisible failed | ✅ IN BLACKLIST |
| 2 | **183.88.214.84** | **15** | **0** | **15** | **0%** | Port 8080 - Consistent failures across all tests | ✅ IN BLACKLIST |
| 3 | **170.81.241.226** | **12** | **0** | **12** | **0%** | Port 999 - ERR_TIMED_OUT consistently | ✅ IN BLACKLIST |
| 4 | **103.131.19.44** | **11** | **0** | **11** | **0%** | Port 8080 - Multiple connection failures | ✅ IN BLACKLIST |

**Total IPs in this category: 4**

---

### Category 2: IPs Below Threshold but Blacklisted (6-10 uses, 100% failure)

| IP Address | Total Uses | Successes | Failures | Success Rate | Current Status |
|------------|------------|-----------|----------|--------------|----------------|
| 218.54.90.225 | 10 | 0 | 10 | 0% | ✅ IN BLACKLIST |
| 43.225.150.97 | 10 | 0 | 10 | 0% | ✅ IN BLACKLIST |
| 185.200.37.242 | 9 | 0 | 9 | 0% | ✅ IN BLACKLIST |
| 163.61.112.245 | 9 | 0 | 9 | 0% | ✅ IN BLACKLIST |
| 213.154.2.210 | 7 | 0 | 7 | 0% | ✅ IN BLACKLIST |
| 157.20.208.43 | 7 | 0 | 7 | 0% | ✅ IN BLACKLIST |
| 62.133.63.236 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 193.95.53.131 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 113.11.127.179 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 5.75.198.72 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 91.109.204.213 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 8.212.160.196 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 160.251.142.232 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |
| 101.47.17.165 | 6 | 0 | 6 | 0% | ✅ IN BLACKLIST |

**Total IPs in this category: 14**

---

### Category 3: IPs with Partial Success (Not Blacklisted)

| IP Address | Total Uses | Successes | Failures | Success Rate | Status |
|------------|------------|-----------|----------|--------------|--------|
| 41.223.119.156 | 11 | 1 | 10 | 9% | ⚠️ KEPT (Has 1 success) |
| 43.224.118.154 | 10 | 1 | 9 | 10% | ⚠️ KEPT (Has 1 success) |
| 62.60.246.164 | 9 | 2 | 7 | 22% | ⚠️ KEPT (Has successes) |
| 176.126.103.194 | 8 | 1 | 7 | 13% | ⚠️ KEPT (Has 1 success) |
| 202.5.37.220 | 6 | 1 | 5 | 17% | ⚠️ KEPT (Has 1 success) |
| 59.153.18.174 | 7 | 2 | 5 | 29% | ⚠️ KEPT (Has successes) |
| 200.174.198.32 | 6 | 2 | 4 | 33% | ⚠️ KEPT (Has successes) |
| 195.234.68.34 | 7 | 2 | 5 | 29% | ⚠️ KEPT (Has successes) |
| 147.83.77.10 | 7 | 2 | 5 | 29% | ⚠️ KEPT (Has successes) |
| 175.99.220.171 | 7 | 3 | 4 | 43% | ⚠️ KEPT (Has successes) |
| 163.223.78.87 | 7 | 3 | 4 | 43% | ⚠️ KEPT (Has successes) |
| 41.254.48.192 | 7 | 3 | 4 | 43% | ⚠️ KEPT (Has successes) |

**These IPs were NOT blacklisted because they showed at least one successful API connection**

---

### Category 4: High-Performance IPs (>5 uses, >50% success)

| IP Address | Total Uses | Successes | Failures | Success Rate | Status |
|------------|------------|-----------|----------|--------------|--------|
| 194.26.141.202 | 7 | 6 | 1 | **86%** | ✅ EXCELLENT |
| 46.161.6.165 | 8 | 6 | 2 | **75%** | ✅ EXCELLENT |
| 143.110.160.230 | 8 | 5 | 3 | **63%** | ✅ GOOD |
| 65.108.203.37 | 8 | 5 | 3 | **63%** | ✅ GOOD |
| 43.224.116.22 | 7 | 4 | 3 | **57%** | ✅ GOOD |

---

## Summary Statistics

### Overall Metrics
- **Total Unique IPs Analyzed**: 65+
- **IPs meeting blacklist criteria (>10 uses, 100% failure)**: **4**
- **Additional IPs blacklisted (6-10 uses, 100% failure)**: **14**
- **Total IPs currently in BlackList**: **58** (as of January 5, 2026 update)
- **IPs with partial success (kept)**: **12+**
- **High-performance IPs (>50% success)**: **5**

### Blacklist Status Summary
| Category | Count | Action Status |
|----------|-------|---------------|
| >10 uses, 100% failure | 4 | ✅ ALL BLACKLISTED |
| 6-10 uses, 100% failure | 14 | ✅ ALL BLACKLISTED |
| Has at least 1 success | 12+ | ✅ KEPT (Not blacklisted) |
| High performance (>50%) | 5 | ✅ KEPT (Active use) |

---

## Actions Already Completed (January 5, 2026)

### ✅ Files Updated:
1. **BlackListProxies.json**
   - Before: 40 proxies
   - After: 58 proxies
   - Added: 18 IPs (including the 4 meeting >10 uses criteria)

2. **verified-proxies.json**
   - Before: 267 proxies
   - After: 249 proxies  
   - Removed: 18 blacklisted IPs

3. **working-proxies.json**
   - Before: 100 proxies
   - After: 82 proxies
   - Removed: 18 blacklisted IPs

### ✅ Verification Results (January 12, 2026):
- All 4 IPs with >10 uses and 100% failure are **confirmed in BlackListProxies.json**
- All 4 IPs are **confirmed removed from working-proxies.json**
- All 4 IPs are **confirmed removed from verified-proxies.json**

---

## Detailed IP Analysis

### 1. 209.97.150.167 (Worst Performer - 18 failures)
- **Ports tested**: 80, 3128, 8080
- **Failure patterns**: 
  - ERR_TUNNEL_CONNECTION_FAILED
  - expect(locator).toBeVisible() failed
  - Multiple connection issues
- **Conclusion**: Complete failure across all ports and attempts
- **Status**: ✅ Blacklisted and removed from all active lists

### 2. 183.88.214.84 (15 failures)
- **Port**: 8080
- **Failure patterns**: Consistent connection failures
- **Status**: ✅ Blacklisted and removed from all active lists

### 3. 170.81.241.226 (12 failures)
- **Port**: 999
- **Failure patterns**: ERR_TIMED_OUT consistently
- **Status**: ✅ Blacklisted and removed from all active lists

### 4. 103.131.19.44 (11 failures)
- **Port**: 8080
- **Failure patterns**: Multiple connection failures
- **Status**: ✅ Blacklisted and removed from all active lists

---

## Problematic Subnet Patterns Identified

### Critical Subnets (100% failure rate):
- **45.88.0.x:3128** - Entire subnet unreliable (IPs: 98-99, 113-117) - 0% success
- **161.35.70.249** - Multiple ports all failed (80, 3128, 8080)
- **138.68.60.8** - Multiple ports all failed (3128, 8080)
- **198.199.86.11** - Multiple ports all failed (80, 8080)

---

## Conclusion

**No additional action required.** 

The analysis of log files confirms that:
1. Only 4 IPs were used more than 10 times with 100% failure rate
2. All 4 IPs were already added to the blacklist on January 5, 2026
3. All 4 IPs were already removed from working-proxies.json and verified-proxies.json
4. The current state of all proxy files is correct and up-to-date

The blacklist criteria was properly applied: any IP with >10 uses and 100% failure (0 successes) has been identified and blacklisted. IPs with even a single success were retained to allow for potential intermittent connectivity.

---

**Report Generated**: January 12, 2026  
**Data Sources**: LOG_ANALYSIS.md, PROXY_ANALYSIS_RESULTS.md, proxy-analysis.md  
**Analysis Period**: December 28, 2025 - January 5, 2026
