from pydantic import BaseModel, Field


class SearchKeywords(BaseModel):
    ja: list[str] = Field(default_factory=list)
    en: list[str] = Field(default_factory=list)


class ProductCandidate(BaseModel):
    product_name: str
    manufacturer: str
    product_line: str
    evidence: str
    confidence: str


class SubjectCandidate(BaseModel):
    character: str
    series: str
    evidence: str
    confidence: str


class MarketplaceLink(BaseModel):
    shop: str
    query: str
    url: str
    note: str


class RetrievedCandidate(BaseModel):
    title: str
    url: str
    snippet: str
    source: str
    query: str


class ProductRetrievalResult(BaseModel):
    candidates: list[RetrievedCandidate] = Field(default_factory=list)


class RankedProductCandidate(BaseModel):
    rank: int
    title: str
    url: str
    source: str
    score: int = Field(ge=0, le=100)
    verdict: str
    evidence: str
    concerns: str


class CandidateRerankResult(BaseModel):
    candidates: list[RankedProductCandidate] = Field(default_factory=list)


class FigureIdentification(BaseModel):
    character: str
    series: str
    manufacturer: str
    product_line: str
    estimated_product_name: str
    confidence: str
    subject_candidates: list[SubjectCandidate] = Field(default_factory=list)
    visual_features: list[str] = Field(default_factory=list)
    keywords: SearchKeywords
    search_queries: SearchKeywords
    unknown_fields: list[str] = Field(default_factory=list)
    candidate_strategy: str
    product_candidates: list[ProductCandidate] = Field(default_factory=list)
    notes: str


class AnalyzeResponse(BaseModel):
    filename: str
    content_type: str
    file_size: int
    mode: str
    model: str | None = None
    identification: FigureIdentification
    marketplace_links: list[MarketplaceLink] = Field(default_factory=list)
    retrieved_candidates: list[RetrievedCandidate] = Field(default_factory=list)
    ranked_candidates: list[RankedProductCandidate] = Field(default_factory=list)
