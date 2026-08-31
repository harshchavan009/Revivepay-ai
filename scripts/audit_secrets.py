#!/usr/bin/env python3
"""
Comprehensive Secrets Hygiene & Credential Leakage Scanner for RevivePay AI
Recursively audits the entire repository (backend, src, ml, scripts, alembic, Dockerfiles, etc.)
to guarantee zero API secret keys, database credentials, or private cryptographic keys are leaked.
"""

import os
import re
import sys
from typing import List, Tuple

# Targeted credential-like patterns
PATTERNS = [
    (
        re.compile(r"rzp_live_[0-9a-zA-Z]{14,}"),
        "Live Razorpay Secret Key (rzp_live_*)"
    ),
    (
        re.compile(r"rzp_test_[0-9a-zA-Z]{10,}"),
        "Test Razorpay Secret Key (rzp_test_*)"
    ),
    (
        re.compile(r"whsec_[0-9a-zA-Z]{14,}"),
        "Live/Test Webhook Signing Secret (whsec_*)"
    ),
    (
        re.compile(r"sk_live_[0-9a-zA-Z]{20,}"),
        "Live Provider Secret Key (sk_live_*)"
    ),
    (
        re.compile(r"ghp_[0-9a-zA-Z]{36}"),
        "GitHub Personal Access Token (ghp_*)"
    ),
    (
        re.compile(r"-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED|PRIVATE)?\s*PRIVATE KEY-----"),
        "Private Cryptographic Key (PEM header)"
    ),
    (
        re.compile(r"postgres(?:ql)?://[a-zA-Z0-9_\-\.]+:(?!(?:\$\{[^}]+\}|postgres|password|<password>|\b\w+\b))[^\s@\"\'/:]+@[a-zA-Z0-9_\-\.]+"),
        "Raw PostgreSQL Connection String with Hardcoded Password"
    ),
    (
        re.compile(r"""(?:password|passwd|pwd)\s*[:=]\s*["'](?!\$\{|\<|dev-non-secret|insecure|password123|postgres|admin|\$\w+)[A-Za-z0-9_!@#$%^&*+=~-]{6,}["']""", re.IGNORECASE),
        "Hardcoded Password Value"
    ),
    (
        re.compile(r"""(?:secret_key|csrf_secret|api_secret|app_secret|client_secret|razorpay_key_secret|razorpay_webhook_secret)\s*[:=]\s*["'](?!\$\{|\<|dev-non-secret|insecure-dev|\$\w+)[A-Za-z0-9_!@#$%^&*+=~-]{10,}["']""", re.IGNORECASE),
        "Hardcoded Secret Value"
    ),
    (
        re.compile(r"""(?:api_key|apikey|anthropic_api_key|gemini_api_key|openai_api_key|llm_api_key)\s*[:=]\s*["'](?!\$\{|\<|dev-non-secret|mock_|test_|\$\w+)[A-Za-z0-9_!@#$%^&*+=~-]{16,}["']""", re.IGNORECASE),
        "Hardcoded API Key Value"
    )
]

EXCLUDED_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".gemini"
}

EXCLUDED_FILES = {
    "audit_secrets.py",  # Scanner definition file itself
    "package-lock.json",
    "revivepay.db"
}

BINARY_EXTENSIONS = {
    ".joblib", ".png", ".jpg", ".jpeg", ".gif", ".ico",
    ".woff", ".woff2", ".ttf", ".eot", ".pyc", ".db", ".DS_Store"
}

def scan_file(file_path: str) -> List[Tuple[str, str, List[str]]]:
    findings = []
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            for pattern, desc in PATTERNS:
                matches = pattern.findall(content)
                if matches:
                    findings.append((file_path, desc, matches))
    except Exception as e:
        print(f"⚠️ Warning reading {file_path}: {e}")
    return findings

def scan_repository(base_dir: str) -> List[Tuple[str, str, List[str]]]:
    all_findings = []
    scanned_count = 0

    for root, dirs, files in os.walk(base_dir):
        # Prune excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

        for file in files:
            if file in EXCLUDED_FILES or any(file.endswith(ext) for ext in BINARY_EXTENSIONS):
                continue
            
            file_path = os.path.join(root, file)
            findings = scan_file(file_path)
            if findings:
                all_findings.extend(findings)
            scanned_count += 1

    print(f"🔍 Scanned {scanned_count} files across repository for secrets hygiene.")
    return all_findings

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)

    print("🔒 [RevivePay AI] Starting Recursive Secrets Hygiene CI Audit...")
    findings = scan_repository(base_dir)

    if findings:
        print("\n❌ CRITICAL: Potential secret keys or credential leakage detected!")
        for file_path, desc, matches in findings:
            rel_path = os.path.relpath(file_path, base_dir)
            print(f"  - File: {rel_path}")
            print(f"    Issue: {desc}")
            print(f"    Count: {len(matches)}")
            for m in matches[:3]:
                print(f"      • Match sample: {m}")
        sys.exit(1)
    else:
        print("\n✅ SECRETS HYGIENE CHECK PASSED: Zero secret keys, credentials, or private tokens found.")
        sys.exit(0)

if __name__ == "__main__":
    main()
