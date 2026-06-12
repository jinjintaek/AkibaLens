from openai import AsyncOpenAI, OpenAIError

from app.core.config import settings
from app.schemas.analyze import (
    CandidateRerankResult,
    FigureIdentification,
    RankedProductCandidate,
    RetrievedCandidate,
)


RERANK_PROMPT = """
You are AkibaLens candidate reranker.

Rank retrieved product pages against the original vision analysis. Do not browse
the web. Use only the provided identification data and retrieved page metadata.

Score each candidate from 0 to 100:
- character match
- series match
- product line / manufacturer match
- visual feature match
- source quality, with official product pages preferred

Be strict. If the product page title/snippet does not support the claimed
character or series, lower the score and explain the concern. A useful near
match should not be scored as an exact match.

Return candidates ordered from strongest to weakest.
""".strip()


def _build_rerank_input(
    identification: FigureIdentification,
    candidates: list[RetrievedCandidate],
) -> str:
    candidate_payload = [
        {
            "title": candidate.title,
            "url": candidate.url,
            "source": candidate.source,
            "snippet": candidate.snippet,
            "query": candidate.query,
        }
        for candidate in candidates
    ]

    product_candidates = [
        {
            "product_name": candidate.product_name,
            "manufacturer": candidate.manufacturer,
            "product_line": candidate.product_line,
            "evidence": candidate.evidence,
            "confidence": candidate.confidence,
        }
        for candidate in identification.product_candidates
    ]

    subject_candidates = [
        {
            "character": candidate.character,
            "series": candidate.series,
            "evidence": candidate.evidence,
            "confidence": candidate.confidence,
        }
        for candidate in identification.subject_candidates
    ]

    return (
        "Identification:\n"
        f"- character: {identification.character}\n"
        f"- series: {identification.series}\n"
        f"- manufacturer: {identification.manufacturer}\n"
        f"- product_line: {identification.product_line}\n"
        f"- estimated_product_name: {identification.estimated_product_name}\n"
        f"- confidence: {identification.confidence}\n"
        f"- visual_features: {identification.visual_features}\n"
        f"- subject_candidates: {subject_candidates}\n"
        f"- product_candidates_from_vision: {product_candidates}\n\n"
        f"Retrieved candidates:\n{candidate_payload}\n\n"
        "Rank every retrieved candidate. Keep title, url, and source exactly as provided."
    )


async def rerank_product_candidates(
    identification: FigureIdentification,
    retrieved_candidates: list[RetrievedCandidate],
) -> list[RankedProductCandidate]:
    if not settings.candidate_reranking_enabled or not settings.openai_api_key:
        return []

    if not retrieved_candidates:
        return []

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    model = settings.openai_search_model or settings.openai_model

    try:
        response = await client.responses.parse(
            model=model,
            input=[
                {
                    "role": "system",
                    "content": RERANK_PROMPT,
                },
                {
                    "role": "user",
                    "content": _build_rerank_input(
                        identification=identification,
                        candidates=retrieved_candidates,
                    ),
                },
            ],
            text_format=CandidateRerankResult,
        )
    except OpenAIError:
        return []

    if response.output_parsed is None:
        return []

    return response.output_parsed.candidates
