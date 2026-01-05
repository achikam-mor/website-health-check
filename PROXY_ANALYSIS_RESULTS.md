# Proxy Analysis Results - January 5, 2026

## Summary

Analyzed log file containing multiple test runs to identify proxies with 100% failure rates (>5 attempts, 0 successes).

### Actions Taken
- **18 IPs added to blacklist**
- **18 IPs removed from verified-proxies.json**
- **18 IPs removed from working-proxies.json**

---

## Complete Proxy Analysis Matrix

| IP Address | Total Attempts | Successes | Failures | Success Rate | Action |
|------------|----------------|-----------|----------|--------------|--------|
| **209.97.150.167** | 18 | 0 | 18 | 0% | ✅ BLACKLISTED |
| **183.88.214.84** | 15 | 0 | 15 | 0% | ✅ BLACKLISTED |
| **170.81.241.226** | 12 | 0 | 12 | 0% | ✅ BLACKLISTED |
| **103.131.19.44** | 11 | 0 | 11 | 0% | ✅ BLACKLISTED |
| **218.54.90.225** | 10 | 0 | 10 | 0% | ✅ BLACKLISTED |
| **43.225.150.97** | 10 | 0 | 10 | 0% | ✅ BLACKLISTED |
| **185.200.37.242** | 9 | 0 | 9 | 0% | ✅ BLACKLISTED |
| **163.61.112.245** | 9 | 0 | 9 | 0% | ✅ BLACKLISTED |
| **157.20.208.43** | 7 | 0 | 7 | 0% | ✅ BLACKLISTED |
| **213.154.2.210** | 7 | 0 | 7 | 0% | ✅ BLACKLISTED |
| **62.133.63.236** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **193.95.53.131** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **113.11.127.179** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **5.75.198.72** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **91.109.204.213** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **8.212.160.196** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **160.251.142.232** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| **101.47.17.165** | 6 | 0 | 6 | 0% | ✅ BLACKLISTED |
| 41.223.119.156 | 11 | 1 | 10 | 9% | Kept (has 1 success) |
| 43.224.118.154 | 10 | 1 | 9 | 10% | Kept (has 1 success) |
| 62.60.246.164 | 9 | 2 | 7 | 22% | Kept (has successes) |
| 176.126.103.194 | 8 | 1 | 7 | 13% | Kept (has 1 success) |
| 202.5.37.220 | 6 | 1 | 5 | 17% | Kept (has 1 success) |
| 59.153.18.174 | 7 | 2 | 5 | 29% | Kept (has successes) |
| 200.174.198.32 | 6 | 2 | 4 | 33% | Kept (has successes) |
| 195.234.68.34 | 7 | 2 | 5 | 29% | Kept (has successes) |
| 46.161.6.165 | 8 | 6 | 2 | 75% | Kept (good performance) |
| 147.83.77.10 | 7 | 2 | 5 | 29% | Kept (has successes) |
| 143.110.160.230 | 8 | 5 | 3 | 63% | Kept (good performance) |
| 43.224.116.22 | 7 | 4 | 3 | 57% | Kept (good performance) |
| 65.108.203.37 | 8 | 5 | 3 | 63% | Kept (good performance) |
| 175.99.220.171 | 7 | 3 | 4 | 43% | Kept (has successes) |
| 163.223.78.87 | 7 | 3 | 4 | 43% | Kept (has successes) |
| 41.254.48.192 | 7 | 3 | 4 | 43% | Kept (has successes) |
| 45.186.6.104 | 5 | 1 | 4 | 20% | Kept (below 6 attempts) |
| 194.26.141.202 | 7 | 6 | 1 | 86% | Kept (excellent performance) |

---

## Blacklist Criteria

An IP was added to the blacklist if it met BOTH of the following conditions:
1. **Used more than 5 times** across all test runs
2. **100% failure rate** - Failed on ALL APIs in EVERY test run (0 successes)

---

## File Updates Summary

### BlackListProxies.json
- **Before:** 40 proxies
- **After:** 58 proxies
- **Added:** 18 new blacklisted IPs

### verified-proxies.json  
- **Before:** 267 proxies
- **After:** 249 proxies
- **Removed:** 18 blacklisted IPs

### working-proxies.json
- **Before:** 100 proxies
- **After:** 82 proxies
- **Removed:** 18 blacklisted IPs

---

## Most Problematic IPs (Highest Failure Counts)

1. **209.97.150.167** - Failed 18 times across 3 different ports (80, 3128, 8080)
2. **183.88.214.84:8080** - Failed 15 times consistently  
3. **170.81.241.226:999** - Failed 12 times consistently
4. **103.131.19.44:8080** - Failed 11 times consistently
5. **218.54.90.225:80** & **43.225.150.97:1120** - Each failed 10 times

---

## Notes

- All removed IPs showed consistent failure patterns across multiple test sessions
- No IP was blacklisted if it had even a single successful attempt
- Some IPs with low success rates (<20%) were kept because they had at least one success
- The analysis was based on manual review of the complete log file containing all test runs
