import asyncio
import base64
from io import BytesIO
from statistics import pstdev

from openai import OpenAI, OpenAIError
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.schemas.analyze import (
    FigureIdentification,
    ProductCandidate,
    SearchKeywords,
    SubjectCandidate,
)


FIGURE_IDENTIFICATION_PROMPT = """
You are AkibaLens, an assistant for identifying anime/game figures from images.

Your job is to identify anime/game figure subjects and extract strong visual
evidence for product retrieval.

Be aggressive about recognizing likely character and series from visual
appearance. The user often photographs loose figures without boxes in Akihabara,
so packaging text is usually absent. If a character/series is plausible, return
the best hypothesis even when not 100% certain, and set confidence to low or
medium. Do not leave character or series as unknown just because packaging text
is absent.

Always provide subject_candidates with the top 1-3 plausible character/series
hypotheses when a humanoid anime/game figure is visible. Each candidate must
include visual evidence. The top candidate should also populate character and
series. Use "Unknown" only when there is truly no recognizable subject.

Do NOT overclaim manufacturer, product_line, scale, or exact product name unless
there is visible text, a highly distinctive sculpt/base, or very strong product
evidence. Those fields can stay empty while character/series are still filled.

Return structured information useful for product candidate retrieval:
- character and series if visually inferable
- manufacturer/product_line only when visible or strongly evidenced
- estimated_product_name as a search-oriented candidate, not a guaranteed answer
- confidence: low, medium, or high
- subject_candidates: top character/series hypotheses for retrieval
- visual_features: concrete visible details such as pose, outfit, weapon, base,
  colorway, repaint label, price tag text, visible scale clues, packaging text
- search_queries: marketplace-ready Japanese and English queries with enough
  visual detail to find the exact figure
- unknown_fields: fields that cannot be determined from the image alone
- candidate_strategy: short Korean explanation of how to search next
- product_candidates: include 1-3 plausible product candidates when character,
  series, pose, outfit, or setting strongly suggest a known figure. Mark them
  low/medium confidence if not certain.

If uncertain, keep confidence low or medium, but still provide the most useful
character/series hypotheses and retrieval queries. A low-confidence candidate is
better than no candidate when the goal is marketplace retrieval.
Do not invent manufacturer, product line, scale, or exact product names.
Prefer useful marketplace search queries over overconfident exact matches.
If visible packaging or label text exists, use it as evidence.
If web search is available, use it to verify visually plausible candidates
against official or reference product pages before finalizing character, series,
manufacturer, product_line, and estimated_product_name. Web evidence is
especially important for loose figures without boxes.
If no anime/game figure or figure packaging is clearly visible, do not guess.
In that case, return empty strings for unknown fields, confidence "low", empty
arrays, and explain that no identifiable figure is visible in notes.
""".strip()

FIGURE_SEARCH_DOMAINS = [
    "goodsmile.com",
    "nendo.guide",
    "amiami.com",
    "mandarake.co.jp",
    "suruga-ya.jp",
    "myfigurecollection.net",
]


def _mock_identification() -> FigureIdentification:
    return FigureIdentification(
        character="Gojo Satoru",
        series="Jujutsu Kaisen",
        manufacturer="Good Smile Company",
        product_line="POP UP PARADE",
        estimated_product_name="POP UP PARADE Gojo Satoru",
        confidence="medium",
        subject_candidates=[
            SubjectCandidate(
                character="Gojo Satoru",
                series="Jujutsu Kaisen",
                evidence="White hair, black outfit, raised hand pose.",
                confidence="medium",
            )
        ],
        visual_features=[
            "black outfit",
            "white hair",
            "raised hand pose",
            "standing figure",
        ],
        keywords=SearchKeywords(
            ja=["五条悟 フィギュア", "呪術廻戦 五条悟 POP UP PARADE"],
            en=["Gojo Satoru figure", "Jujutsu Kaisen Gojo POP UP PARADE"],
        ),
        search_queries=SearchKeywords(
            ja=[
                "呪術廻戦 五条悟 フィギュア 黒服 立ちポーズ",
                "五条悟 フィギュア POP UP PARADE",
            ],
            en=[
                "Jujutsu Kaisen Gojo Satoru black outfit figure standing pose",
                "Gojo Satoru POP UP PARADE figure",
            ],
        ),
        unknown_fields=[],
        candidate_strategy=(
            "캐릭터와 작품명을 기준으로 검색한 뒤, 포즈와 의상 특징이 일치하는 "
            "상품 후보를 비교합니다."
        ),
        product_candidates=[
            ProductCandidate(
                product_name="POP UP PARADE Gojo Satoru",
                manufacturer="Good Smile Company",
                product_line="POP UP PARADE",
                evidence="Mock candidate for UI testing.",
                confidence="medium",
            )
        ],
        notes=(
            "Mock response. Configure OPENAI_API_KEY to use real OpenAI Vision "
            "analysis."
        ),
    )


def _unidentifiable_image(reason: str) -> FigureIdentification:
    return FigureIdentification(
        character="",
        series="",
        manufacturer="",
        product_line="",
        estimated_product_name="",
        confidence="low",
        subject_candidates=[],
        visual_features=[],
        keywords=SearchKeywords(ja=[], en=[]),
        search_queries=SearchKeywords(ja=[], en=[]),
        unknown_fields=[
            "character",
            "series",
            "manufacturer",
            "product_line",
            "estimated_product_name",
        ],
        candidate_strategy="식별 가능한 피규어가 보이는 이미지를 다시 업로드해야 합니다.",
        product_candidates=[],
        notes=reason,
    )


def _is_low_information_image(image_bytes: bytes) -> bool:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            normalized = image.convert("RGB").resize((32, 32))
    except UnidentifiedImageError:
        return True

    pixels = list(normalized.getdata())
    flattened = [value for pixel in pixels for value in pixel]
    extrema = normalized.getextrema()
    channel_ranges = [high - low for low, high in extrema]

    return max(channel_ranges) < 8 or pstdev(flattened) < 4


def _to_data_url(image_bytes: bytes, content_type: str) -> str:
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{content_type};base64,{encoded_image}"


def _identify_with_openai(
    image_bytes: bytes,
    filename: str,
    content_type: str,
) -> FigureIdentification:
    client = OpenAI(api_key=settings.openai_api_key)
    image_url = _to_data_url(image_bytes, content_type)

    request_kwargs = {
        "model": settings.openai_model,
        "input": [
            {
                "role": "system",
                "content": FIGURE_IDENTIFICATION_PROMPT,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Identify this anime/game figure for shopping research. "
                            "Inspect the image carefully and generate strong "
                            "retrieval clues for exact product search. "
                            f"Uploaded filename: {filename}. Return only the "
                            "structured fields."
                        ),
                    },
                    {
                        "type": "input_image",
                        "image_url": image_url,
                        "detail": settings.openai_image_detail,
                    },
                ],
            },
        ],
        "text_format": FigureIdentification,
    }

    if (
        settings.search_provider.lower() == "openai"
        and settings.openai_identification_web_search
    ):
        request_kwargs["tools"] = [
            {
                "type": "web_search",
                "filters": {
                    "allowed_domains": FIGURE_SEARCH_DOMAINS,
                },
            }
        ]
        request_kwargs["tool_choice"] = "auto"

    response = client.responses.parse(**request_kwargs)

    if response.output_parsed is None:
        raise RuntimeError("OpenAI did not return a structured identification.")

    return response.output_parsed


async def identify_figure_from_image(
    image_bytes: bytes,
    filename: str,
    content_type: str,
) -> FigureIdentification:
    if _is_low_information_image(image_bytes):
        return _unidentifiable_image(
            "이미지에 식별 가능한 피규어 또는 패키지 정보가 충분히 보이지 않습니다."
        )

    if not settings.openai_api_key:
        return _mock_identification()

    try:
        return await asyncio.to_thread(
            _identify_with_openai,
            image_bytes,
            filename,
            content_type,
        )
    except OpenAIError as exc:
        error_text = str(exc)
        if "insufficient_quota" in error_text or "exceeded your current quota" in error_text:
            raise RuntimeError(
                "OpenAI quota가 부족합니다. Free 플랜 사용량 또는 billing/API "
                "credits 상태를 확인해주세요."
            ) from exc

        raise RuntimeError(f"OpenAI Vision request failed: {exc}") from exc


def current_analysis_mode() -> str:
    return "openai" if settings.openai_api_key else "mock"


def current_model_name() -> str | None:
    return settings.openai_model if settings.openai_api_key else None
