import json

# Read all three files
with open('BlackListProxies.json', 'r') as f:
    blacklist = json.load(f)

with open('verified-proxies.json', 'r') as f:
    verified = json.load(f)
    
with open('working-proxies.json', 'r') as f:
    working = json.load(f)

# Get all blacklisted IPs
blacklisted_ips = {proxy['host'] for proxy in blacklist}

# Find IPs with 9+ failures and 100% failure rate
print('=== IPs WITH 9+ FAILURES ===')
high_failure_count = 0
for proxy in blacklist:
    if proxy.get('failures', 0) >= 9:
        high_failure_count += 1
        print(f"  {proxy['host']}:{proxy['port']} - {proxy['failures']} failures")

print(f'\nTotal IPs with 9+ failures: {high_failure_count}')

# Check for blacklisted IPs in verified list
found_in_verified = []
for proxy in verified:
    if proxy['host'] in blacklisted_ips:
        found_in_verified.append(f"{proxy['host']}:{proxy['port']}")

# Check for blacklisted IPs in working list
found_in_working = []
for proxy in working:
    if proxy['host'] in blacklisted_ips:
        found_in_working.append(f"{proxy['host']}:{proxy['port']}")

print(f'\n=== RESULTS ===')
print(f'Total blacklisted IPs: {len(blacklisted_ips)}')
print(f'Blacklisted IPs in verified-proxies.json: {len(found_in_verified)}')
if found_in_verified:
    for ip in found_in_verified:
        print(f'  - {ip}')

print(f'\nBlacklisted IPs in working-proxies.json: {len(found_in_working)}')
if found_in_working:
    for ip in found_in_working:
        print(f'  - {ip}')
