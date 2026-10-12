#!/usr/bin/env python3
"""Synchronize publicly listed *standalone* charging connectors from All Spares.
Read-only, politely throttled crawler. Keeps supplier URLs and photo attribution.
Never imports charging daughterboards/flat cables or products without model lists.
"""
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://all-spares.com"
CATEGORY = BASE + "/en/spares/connectors/charge-connectors/"
OUTPUT = Path("data/all_spares_connectors.json")
HEADERS = {"User-Agent": "TawafuqCatalogImporter/1.0 (+catalog metadata; contact site administrator)"}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)
DELAY = 1.0

def get(url):
    for attempt in range(3):
        try:
            response = SESSION.get(url, timeout=25)
            response.raise_for_status()
            time.sleep(DELAY)
            return BeautifulSoup(response.text, "html.parser")
        except requests.RequestException as exc:
            print("Fetch failed", url, exc)
            time.sleep(2 * (attempt + 1))
    return None

def product_links(soup):
    links = []
    for anchor in soup.select("a[href]"):
        url = urljoin(BASE, anchor.get("href", ""))
        parsed = urlparse(url)
        if parsed.netloc not in ("all-spares.com", "www.all-spares.com"):
            continue
        if re.match(r"^/en/charge-connector(?:-|/)", parsed.path):
            links.append(url.split("?")[0])
    return list(dict.fromkeys(links))

def extract_models(soup):
    label = soup.find(string=re.compile(r"Charge Connector is compatible with the following models of", re.I))
    if label:
        parent = label.parent
        for node in (parent, parent.parent if parent else None):
            if node:
                ul = node.find_next("ul")
                if ul:
                    values = [li.get_text(" ", strip=True) for li in ul.find_all("li", recursive=False)]
                    values = [v for v in values if v and not v.lower().startswith(("charge connector", "price"))]
                    if values:
                        return list(dict.fromkeys(values))
    return []

def product_id(soup):
    text = soup.get_text(" ", strip=True)
    match = re.search(r"\bid\s*:\s*(\d{5,8})\b", text, re.I)
    if match:
        return match.group(1)
    for selector in ('[itemprop="sku"]', '[data-product-id]', '[data-id]'):
        for node in soup.select(selector)[:12]:
            candidate = node.get("content") or node.get("data-product-id") or node.get("data-id") or node.get_text(" ", strip=True)
            if re.fullmatch(r"\d{5,8}", str(candidate).strip()):
                return str(candidate).strip()
    return None

def image_url(soup):
    candidates = []
    for img in soup.select('img'):
        if 'charge connector' in img.get('alt', '').lower():
            for key in ('data-zoom-image', 'data-src', 'src'):
                if img.get(key):
                    candidates.append(img[key])
    for attr in (("meta[property='og:image']", "content"),
                 ("meta[name='twitter:image']", "content"),
                 ("img[itemprop='image']", "src")):
        node = soup.select_one(attr[0])
        if node and node.get(attr[1]):
            candidates.append(node.get(attr[1]))
    for img in soup.select("img"):
        alt = img.get("alt", "").lower()
        if "charge connector" in alt:
            for name in ("data-src", "data-zoom-image", "src"):
                if img.get(name):
                    candidates.append(img[name])
    for raw in candidates:
        url = urljoin(BASE, raw)
        if url.startswith("https://") and any(host in urlparse(url).netloc for host in ("all-spares.com", "psgsm.net")):
            if not any(word in url.lower() for word in ("logo", "placeholder", "no-image")):
                return url
    return None

def product(url):
    soup = get(url)
    if not soup:
        return None
    models = extract_models(soup)
    if not models:
        return None
    pid = product_id(soup)
    if not pid:
        print("No product ID", url)
        return None
    text = soup.get_text(" ", strip=True)
    title = soup.h1.get_text(" ", strip=True) if soup.h1 else "Charge Connector"
    pins = re.search(r"Charge connector number of pins:\s*(\d+)\s*pin", text, re.I)
    plug = re.search(r"Charge connector plug type:\s*(Micro USB type-B|USB type C|USB type-C|Micro USB)", text, re.I)
    return {
        "id": pid,
        "title": title,
        "url": url,
        "image_url": image_url(soup),
        "pins": int(pins.group(1)) if pins else None,
        "plug_type": plug.group(1) if plug else None,
        "models": models,
    }

def main():
    urls = []
    for page in range(1, 16):
        soup = get(CATEGORY if page == 1 else CATEGORY + "?page=" + str(page))
        if not soup:
            break
        new = [url for url in product_links(soup) if url not in urls]
        if not new:
            print("No new products on page", page)
            break
        urls.extend(new)
        print("Page", page, "new products", len(new), "total", len(urls), flush=True)
        if len(urls) >= 195:
            break
    if not urls:
        raise RuntimeError("No charge-connector product links discovered; refusing to replace catalog")
    records = []
    for i, url in enumerate(urls, 1):
        item = product(url)
        if item:
            records.append(item)
        if i % 20 == 0:
            print("Processed", i, "of", len(urls), "valid", len(records), flush=True)
    if len(records) < 10:
        raise RuntimeError("Too few products parsed; preserving previous catalog")
    # No photos or model lists are fabricated. Only publicly listed connector models.
    result = {
        "source": CATEGORY,
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "products_scanned": len(urls),
        "products_with_models": len(records),
        "products": sorted(records, key=lambda item: int(item["id"])),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("Wrote", OUTPUT, "products", len(records))

if __name__ == "__main__":
    main()
