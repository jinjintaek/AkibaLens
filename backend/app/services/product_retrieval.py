import html
import re
from urllib.parse import quote_plus, unquote, urlparse, parse_qs

import httpx
from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings
from app.schemas.analyze import (
    FigureIdentification,
    ProductRetrievalResult,
    RetrievedCandidate,
)

SEARCH_TARGETS = [
    "goodsmile.com",
    "nendo.guide",
    "amiami.com",
    "mandarake.co.jp",
    "suruga-ya.jp",
    "myfigurecollection.net",
]

OPENAI_WEB_SEARCH_PROMPT = """
You are AkibaLens product retrieval.

Use web search to find likely anime/game figure product pages for the provided
vision analysis. The image may be a loose figure without box text, so search
using the character/series candidates, visual features, outfit, pose, base,
accessories, and product-line clues.

Treat the vision character/series as hypotheses, not facts. If visual features
strongly conflict with a candidate, prefer product pages whose title/snippet
matches the visual features and explain the uncertainty.

Prioritize official or marketplace/reference pages:
- goodsmile.com
- amiami.com
- order.mandarake.co.jp
- suruga-ya.jp
- myfigurecollection.net
- nendo.guide

Return the best product candidate pages, not generic category/search pages.
Prefer exact product pages that include character, series, manufacturer, or
lineup information. If the exact product is uncertain, include the strongest
near matches and make the snippet explain why it may match.

Return only structured candidates.
""".strip()


def _clean_duckduckgo_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    if "duckduckgo.com" in parsed.netloc:
        uddg = parse_qs(parsed.query).get("uddg")
        if uddg:
            return unquote(uddg[0])
    return raw_url


def _strip_tags(value: str) -> str:
    value = re.sub(r"<.*?>", "", value)
    return html.unescape(value).strip()


def _source_from_url(url: str) -> str:
    netloc = urlparse(url).netloc.replace("www.", "")
    return netloc or "unknown"


def _build_queries(identification: FigureIdentification) -> list[str]:
    queries: list[str] = []

    if identification.visual_features:
        queries.append(" ".join(identification.visual_features[:7]) + " anime figure")
        queries.append(" ".join(identification.visual_features[:7]) + " Nendoroid")

    queries.extend(identification.search_queries.en[:2])
    queries.extend(identification.search_queries.ja[:2])

    for candidate in identification.subject_candidates[:2]:
        if candidate.character and candidate.series and "unknown" not in candidate.character.lower():
            queries.append(f"{candidate.series} {candidate.character} figure")
            queries.append(f"{candidate.series} {candidate.character} Nendoroid")

    if identification.character.lower() != "unknown" and identification.series.lower() != "unknown":
        queries.append(f"{identification.series} {identification.character} figure")
        queries.append(f"{identification.series} {identification.character} anime figure")

    if identification.estimated_product_name:
        queries.append(identification.estimated_product_name)

    deduped: list[str] = []
    for query in queries:
        cleaned = query.strip()
        if cleaned and cleaned not in deduped:
            deduped.append(cleaned)

    return deduped[:6]


def _google_search_available() -> bool:
    return bool(settings.google_search_api_key and settings.google_search_engine_id)


def _openai_search_available() -> bool:
    return bool(settings.openai_api_key)


def _build_openai_search_input(
    identification: FigureIdentification,
    queries: list[str],
    limit: int,
) -> str:
    subject_candidates = [
        {
            "character": candidate.character,
            "series": candidate.series,
            "evidence": candidate.evidence,
            "confidence": candidate.confidence,
        }
        for candidate in identification.subject_candidates[:3]
    ]

    return (
        "Find likely product pages for this anime/game figure.\n\n"
        f"Return up to {limit} candidates.\n"
        f"Top character: {identification.character or 'Unknown'}\n"
        f"Top series: {identification.series or 'Unknown'}\n"
        f"Manufacturer clue: {identification.manufacturer or 'Unknown'}\n"
        f"Product line clue: {identification.product_line or 'Unknown'}\n"
        f"Estimated product: {identification.estimated_product_name or 'Unknown'}\n"
        f"Subject candidates: {subject_candidates}\n"
        f"Visual features: {identification.visual_features}\n"
        f"Japanese search queries: {identification.search_queries.ja}\n"
        f"English search queries: {identification.search_queries.en}\n"
        f"Consolidated retrieval queries: {queries}\n\n"
        "For each candidate, fill:\n"
        "- title: product/page title\n"
        "- url: exact URL\n"
        "- snippet: short Korean explanation of why this page may match\n"
        "- source: domain name\n"
        "- query: the query or clue that found this candidate\n"
    )
    

async def _retrieve_with_openai_web_search(
    queries: list[str],
    identification: FigureIdentification,
    limit: int,
) -> list[RetrievedCandidate]:
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    model = settings.openai_search_model or settings.openai_model

    response = await client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": OPENAI_WEB_SEARCH_PROMPT,
            },
            {
                "role": "user",
                "content": _build_openai_search_input(
                    identification=identification,
                    queries=queries,
                    limit=limit,
                ),
            },
        ],
        tools=[
            {
                "type": "web_search",
                "filters": {
                    "allowed_domains": SEARCH_TARGETS,
                },
            }
        ],
        tool_choice="auto",
        text_format=ProductRetrievalResult,
    )

    if response.output_parsed is None:
        return []

    candidates: list[RetrievedCandidate] = []
    seen_urls: set[str] = set()

    for candidate in response.output_parsed.candidates:
        if not candidate.title or not candidate.url or candidate.url in seen_urls:
            continue
        seen_urls.add(candidate.url)
        candidates.append(
            RetrievedCandidate(
                title=candidate.title,
                url=candidate.url,
                snippet=candidate.snippet,
                source=candidate.source or _source_from_url(candidate.url),
                query=candidate.query,
            )
        )
        if len(candidates) >= limit:
            break

    return candidates


def _parse_google_results(payload: dict, query: str) -> list[RetrievedCandidate]:
    results: list[RetrievedCandidate] = []

    for item in payload.get("items", []):
        title = str(item.get("title") or "").strip()
        url = str(item.get("link") or "").strip()
        snippet = str(item.get("snippet") or "").strip()

        if not title or not url:
            continue

        results.append(
            RetrievedCandidate(
                title=title,
                url=url,
                snippet=snippet,
                source=_source_from_url(url),
                query=query,
            )
        )

    return results


async def _retrieve_with_google(
    client: httpx.AsyncClient,
    queries: list[str],
    limit: int,
) -> list[RetrievedCandidate]:
    candidates: list[RetrievedCandidate] = []
    seen_urls: set[str] = set()

    for query in queries:
        response = await client.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                "key": settings.google_search_api_key,
                "cx": settings.google_search_engine_id,
                "q": query,
                "num": min(limit, 10),
                "hl": "ja",
            },
        )

        if response.status_code >= 400:
            return []

        for result in _parse_google_results(response.json(), query):
            if result.url in seen_urls:
                continue
            seen_urls.add(result.url)
            candidates.append(result)
            if len(candidates) >= limit:
                return candidates

    return candidates


async def _retrieve_with_duckduckgo(
    client: httpx.AsyncClient,
    queries: list[str],
    limit: int,
) -> list[RetrievedCandidate]:
    candidates: list[RetrievedCandidate] = []
    seen_urls: set[str] = set()

    for query in queries:
        target_query = f"{query} ({' OR '.join('site:' + target for target in SEARCH_TARGETS[:3])})"
        response = await client.get(
            f"https://html.duckduckgo.com/html/?q={quote_plus(target_query)}"
        )
        response.raise_for_status()

        for result in _parse_duckduckgo_results(response.text, query):
            if result.url in seen_urls:
                continue
            seen_urls.add(result.url)
            candidates.append(result)
            if len(candidates) >= limit:
                return candidates

    return candidates


def _parse_duckduckgo_results(html_text: str, query: str) -> list[RetrievedCandidate]:
    results: list[RetrievedCandidate] = []
    pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="(?P<url>[^"]+)"[^>]*>'
        r"(?P<title>.*?)</a>.*?"
        r'<a[^>]+class="result__snippet"[^>]*>(?P<snippet>.*?)</a>',
        re.DOTALL,
    )

    for match in pattern.finditer(html_text):
        url = _clean_duckduckgo_url(html.unescape(match.group("url")))
        title = _strip_tags(match.group("title"))
        snippet = _strip_tags(match.group("snippet"))

        if not title or not url:
            continue

        source = _source_from_url(url)
        if not any(target in source for target in SEARCH_TARGETS):
            continue

        results.append(
            RetrievedCandidate(
                title=title,
                url=url,
                snippet=snippet,
                source=source,
                query=query,
            )
        )

    return results


async def retrieve_product_candidates(
    identification: FigureIdentification,
    limit: int | None = None,
) -> list[RetrievedCandidate]:
    limit = limit or settings.search_result_limit
    queries = _build_queries(identification)
    if not queries:
        return []

    async with httpx.AsyncClient(
        timeout=10,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
            )
        },
        follow_redirects=True,
    ) as client:
        try:
            if settings.search_provider.lower() == "openai" and _openai_search_available():
                openai_candidates = await _retrieve_with_openai_web_search(
                    queries=queries,
                    identification=identification,
                    limit=limit,
                )
                if openai_candidates:
                    return openai_candidates

            if settings.search_provider.lower() == "google" and _google_search_available():
                google_candidates = await _retrieve_with_google(client, queries, limit)
                if google_candidates:
                    return google_candidates

            return await _retrieve_with_duckduckgo(client, queries, limit)
        except (httpx.HTTPError, OpenAIError, ValueError):
            return []
