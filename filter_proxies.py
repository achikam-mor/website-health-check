import json

# Read all files
with open('BlackListProxies.json', 'r', encoding='utf-8') as f:
    blacklist = json.load(f)

with open('verified-proxies.json', 'r', encoding='utf-8') as f:
    verified = json.load(f)

# Create set of blacklisted IPs for fast lookup
blacklisted_ips = {proxy['host'] for proxy in blacklist}

print(f"Total blacklisted IPs: {len(blacklisted_ips)}")
print(f"Total verified proxies before filtering: {len(verified)}")

# Filter out blacklisted proxies from verified list
filtered_verified = [proxy for proxy in verified if proxy['host'] not in blacklisted_ips]

print(f"Total verified proxies after filtering: {len(filtered_verified)}")
print(f"Removed {len(verified) - len(filtered_verified)} blacklisted proxies from verified list")

# Get top 100 proxies (already sorted by responseTime ascending)
top_100 = filtered_verified[:100]

print(f"\nTop 100 proxies selected")
print(f"Best responseTime: {top_100[0]['responseTime']}ms ({top_100[0]['host']})")
print(f"100th best responseTime: {top_100[-1]['responseTime']}ms ({top_100[-1]['host']})")

# Save filtered verified-proxies.json
with open('verified-proxies.json', 'w', encoding='utf-8') as f:
    json.dump(filtered_verified, f, indent=4, ensure_ascii=False)

# Save top 100 to working-proxies.json
with open('working-proxies.json', 'w', encoding='utf-8') as f:
    json.dump(top_100, f, indent=4, ensure_ascii=False)

print(f"\n✓ verified-proxies.json updated ({len(filtered_verified)} proxies)")
print(f"✓ working-proxies.json updated (100 best proxies)")
