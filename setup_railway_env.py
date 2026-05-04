"""
Helper script to generate Railway environment variable for Firebase
Run this and copy the output to Railway's environment variables
"""

import json

# Read firebase config
with open('firebase-config.json', 'r') as f:
    config = json.load(f)

# Convert to single-line JSON
config_str = json.dumps(config, separators=(',', ':'))

print("=" * 80)
print("RAILWAY ENVIRONMENT VARIABLE SETUP")
print("=" * 80)
print("\n1. Go to your Railway project dashboard")
print("2. Click on your service")
print("3. Go to 'Variables' tab")
print("4. Click '+ New Variable'")
print("5. Set Variable Name to: FIREBASE_CONFIG_JSON")
print("6. Copy and paste the value below:\n")
print("-" * 80)
print(config_str)
print("-" * 80)
print("\n7. Click 'Add' and Railway will automatically redeploy")
print("\nDone! Your Firebase credentials will now work on Railway.")
print("=" * 80)
