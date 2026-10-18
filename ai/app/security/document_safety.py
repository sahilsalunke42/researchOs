from __future__ import annotations

import ipaddress
import logging
import socket
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Allowed schemes for paper downloads
ALLOWED_SCHEMES = {"http", "https"}

# Blocked IP ranges: private, loopback, link-local, multicast, reserved
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

# Trusted academic domains (if restricted, or general allowlist)
TRUSTED_ACADEMIC_DOMAINS = {
    "arxiv.org",
    "semanticscholar.org",
    "api.semanticscholar.org",
    "openalex.org",
    "api.openalex.org",
    "doi.org",
    "crossref.org",
    "ncbi.nlm.nih.gov",
    "pubmed.ncbi.nlm.nih.gov",
}


def is_ip_blocked(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return any(ip in net for net in BLOCKED_NETWORKS)
    except ValueError:
        return True


def validate_download_url(url: str, enforce_trusted_domains: bool = False) -> str:
    """
    Validates a URL against SSRF attacks:
    - Enforces http/https scheme.
    - Resolves hostname via DNS.
    - Rejects private, loopback, link-local, and reserved IP addresses.
    - Optionally restricts to trusted academic domains.
    """
    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string")

    parsed = urlparse(url.strip())
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError(f"Invalid URL scheme: '{parsed.scheme}'. Only http and https are allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL must contain a valid hostname")

    # Reject localhost directly
    if hostname.lower() in {"localhost", "localhost.localdomain", "127.0.0.1", "::1"}:
        raise ValueError("Requests to localhost are forbidden")

    if enforce_trusted_domains:
        domain_match = any(
            hostname.lower() == domain or hostname.lower().endswith("." + domain)
            for domain in TRUSTED_ACADEMIC_DOMAINS
        )
        if not domain_match:
            raise ValueError(f"Domain '{hostname}' is not in the trusted academic domains allowlist")

    # Resolve IP addresses for the hostname to prevent DNS rebinding / private IP access
    try:
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
        for family, _, _, _, sockaddr in addr_info:
            ip = sockaddr[0]
            if is_ip_blocked(ip):
                raise ValueError(f"Access to private/reserved IP address '{ip}' ({hostname}) is forbidden")
    except socket.gaierror as exc:
        raise ValueError(f"Failed to resolve hostname: '{hostname}'") from exc

    return url.strip()
