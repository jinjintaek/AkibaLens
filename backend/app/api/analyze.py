from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.analyze import AnalyzeResponse
from app.services.figure_identifier import (
    current_analysis_mode,
    current_model_name,
    identify_figure_from_image,
)
from app.services.candidate_reranker import rerank_product_candidates
from app.services.marketplace_search import build_marketplace_links
from app.services.product_retrieval import retrieve_product_candidates

router = APIRouter(tags=["analysis"])

ACCEPTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 8 * 1024 * 1024


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_figure(image: UploadFile = File(...)) -> AnalyzeResponse:
    if image.content_type not in ACCEPTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비어 있는 이미지 파일은 분석할 수 없습니다.",
        )

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지는 8MB 이하만 업로드할 수 있습니다.",
        )

    try:
        identification = await identify_figure_from_image(
            image_bytes=image_bytes,
            filename=image.filename or "uploaded-image",
            content_type=image.content_type,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    retrieved_candidates = await retrieve_product_candidates(identification)
    ranked_candidates = await rerank_product_candidates(
        identification=identification,
        retrieved_candidates=retrieved_candidates,
    )

    return AnalyzeResponse(
        filename=image.filename or "uploaded-image",
        content_type=image.content_type,
        file_size=len(image_bytes),
        mode=current_analysis_mode(),
        model=current_model_name(),
        identification=identification,
        marketplace_links=build_marketplace_links(identification),
        retrieved_candidates=retrieved_candidates,
        ranked_candidates=ranked_candidates,
    )
