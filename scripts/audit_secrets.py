#!/usr/bin/env python3
"""
Secrets Hygiene CI Audit Script for RevivePay AI
Scans built distribution assets (dist/) and frontend source files (src/)
to ensure zero API secret keys, database credentials, or private keys are bundled.
"""

import os
import re
import sys

PATTERNS = [
    (r"sk_live_[0-9a-zA-Z]{24,}", "Live Stripe/OpenAI Secret Key"),
    (r"rzp_live_[0-9a-zA-Z]{14,}", "Live Razorpay Secret Key"),
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token"),
    (r"-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----", "Private Cryptographic Key"),
    (r"postgres(?:ql)?://[^:]+:[^@]+@[^:]+:\d+/[^\s\"']+", "PostgreSQL Raw Connection String with Password"),
    (r"whsec_[0-9a-zA-Z]{20,}", "Live Webhook Signing Secret"),
]

def scan_directory(target_dir: str):
    leaks = []
    if not os.path.exists(target_dir):
        print(f"Directory '{target_dir}' does not exist. Skipping scan.")
        return leaks

    for root, _, files in os.walk(target_dir):
        for file in files:
            if file.endswith((".js", ".css", ".html", ".map", ".ts", ".tsx")):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        for pattern, desc in PATTERNS:
                            matches = re.findall(pattern, content)
                            if matches:
                                leaks.append((file_path, desc, matches))
                except Exception as e:
                    print(f"Warning reading {file_path}: {e}")
    return leaks

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(base_dir, "dist")
    src_dir = os.path.join(base_dir, "src")

    print(f"🔒 Running Secrets Hygiene CI Audit on '{dist_dir}' and '{src_dir}'...")
    dist_leaks = scan_directory(dist_dir)
    src_leaks = scan_directory(src_dir)
    all_leaks = dist_leaks + src_leaks

    if all_leaks:
        print("\n❌ CRITICAL: Leaked credentials detected!")
        for file_path, desc, matches in all_leaks:
            print(f"  - File: {file_path}")
            print(f"    Issue: {desc}")
            print(f"    Match Count: {len(matches)}")
        sys.exit(1)
    else:
        print("\n✅ SECRETS HYGIENE CHECK PASSED: Zero secret keys or private credentials detected in frontend bundle.")
        sys.exit(0)

if __name__ == "__main__":
    main()
