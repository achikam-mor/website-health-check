import json

# Read all three files
with open('BlackListProxies.json', 'r') as f:
    blacklist = json.load(f)

with open('verified-proxies.json', 'r') as f:
    verified = json.load(f)
    
with open('working-proxies.json', 'r') as f:
    working = json.load(f)

# Create set of blacklisted IPs
blacklisted_ips = {proxy['host'] for proxy in blacklist}

print(f'Total blacklisted IPs: {len(blacklisted_ips)}')
print(f'Original verified proxies: {len(verified)}')
print(f'Original working proxies: {len(working)}')

# Filter out blacklisted IPs
verified_clean = [proxy for proxy in verified if proxy['host'] not in blacklisted_ips]
working_clean = [proxy for proxy in working if proxy['host'] not in blacklisted_ips]

# Show what was removed
removed_from_verified = len(verified) - len(verified_clean)
removed_from_working = len(working) - len(working_clean)

if removed_from_verified > 0:
    print(f'\n✓ Removed {removed_from_verified} blacklisted IPs from verified-proxies.json:')
    for proxy in verified:
        if proxy['host'] in blacklisted_ips:
            print(f"  - {proxy['host']}:{proxy['port']}")

if removed_from_working > 0:
    print(f'\n✓ Removed {removed_from_working} blacklisted IPs from working-proxies.json:')
    for proxy in working:
        if proxy['host'] in blacklisted_ips:
            print(f"  - {proxy['host']}:{proxy['port']}")

# Save cleaned files
with open('verified-proxies.json', 'w') as f:
    json.dump(verified_clean, f, indent=4)

with open('working-proxies.json', 'w') as f:
    json.dump(working_clean, f, indent=4)

print(f'\n=== FINAL RESULTS ===')
print(f'Verified proxies after cleanup: {len(verified_clean)} (removed {removed_from_verified})')
print(f'Working proxies after cleanup: {len(working_clean)} (removed {removed_from_working})')
print(f'\n✅ Files updated successfully!')
