from urllib.parse import quote_plus

from app.schemas.analyze import FigureIdentification, MarketplaceLink


def _pick_query(identification: FigureIdentification, language: str) -> str:
    queries = identification.search_queries.ja if language == "ja" else identification.search_queries.en
    keywords = identification.keywords.ja if language == "ja" else identification.keywords.en

    if queries:
        return queries[0]

    if keywords:
        return " ".join(keywords[:4])

    if identification.character and identification.series:
        suffix = "フィギュア" if language == "ja" else "figure"
        return f"{identification.series} {identification.character} {suffix}"

    if not identification.character and not identification.series:
        return ""

    fallback_parts = [
        identification.series,
        identification.character,
        "フィギュア" if language == "ja" else "figure",
    ]

    return " ".join(part for part in fallback_parts if part).strip()


def build_marketplace_links(
    identification: FigureIdentification,
) -> list[MarketplaceLink]:
    ja_query = _pick_query(identification, "ja")
    en_query = _pick_query(identification, "en")

    if not ja_query and not en_query:
        return []

    amiami_query = en_query or ja_query
    japanese_query = ja_query or en_query

    return [
        MarketplaceLink(
            shop="AmiAmi",
            query=amiami_query,
            url=(
                "https://www.amiami.com/eng/search/list/"
                f"?s_keywords={quote_plus(amiami_query)}"
            ),
            note="English AmiAmi search using the strongest generated query.",
        ),
        MarketplaceLink(
            shop="Mandarake",
            query=japanese_query,
            url=(
                "https://order.mandarake.co.jp/order/listPage/list"
                f"?keyword={quote_plus(japanese_query)}&lang=en"
            ),
            note="Mandarake search usually works best with Japanese keywords.",
        ),
        MarketplaceLink(
            shop="Suruga-ya",
            query=japanese_query,
            url=(
                "https://www.suruga-ya.jp/search"
                f"?category=&search_word={quote_plus(japanese_query)}"
            ),
            note="Suruga-ya Japanese search URL generated from the top query.",
        ),
    ]
