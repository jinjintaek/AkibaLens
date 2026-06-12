"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";

type FigureIdentification = {
  character: string;
  series: string;
  manufacturer: string;
  productLine: string;
  estimatedProductName: string;
  confidence: string;
  subjectCandidates: SubjectCandidate[];
  visualFeatures: string[];
  notes: string;
  keywords: {
    ja: string[];
    en: string[];
  };
  searchQueries: {
    ja: string[];
    en: string[];
  };
  unknownFields: string[];
  candidateStrategy: string;
  productCandidates: ProductCandidate[];
  marketplaceLinks: MarketplaceLink[];
  retrievedCandidates: RetrievedCandidate[];
  rankedCandidates: RankedProductCandidate[];
};

type ProductCandidate = {
  productName: string;
  manufacturer: string;
  productLine: string;
  evidence: string;
  confidence: string;
};

type SubjectCandidate = {
  character: string;
  series: string;
  evidence: string;
  confidence: string;
};

type MarketplaceLink = {
  shop: string;
  query: string;
  url: string;
  note: string;
};

type RetrievedCandidate = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  query: string;
};

type RankedProductCandidate = {
  rank: number;
  title: string;
  url: string;
  source: string;
  score: number;
  verdict: string;
  evidence: string;
  concerns: string;
};

type PriceComparisonRow = {
  shop: string;
  price: number;
  condition: string;
  confidence: string;
  sourceUrl: string;
  note: string;
};

type AnalyzeApiResponse = {
  filename: string;
  content_type: string;
  file_size: number;
  mode: string;
  identification: {
    character: string;
    series: string;
    manufacturer: string;
    product_line: string;
    estimated_product_name: string;
    confidence: string;
    subject_candidates: {
      character: string;
      series: string;
      evidence: string;
      confidence: string;
    }[];
    visual_features: string[];
    notes: string;
    keywords: {
      ja: string[];
      en: string[];
    };
    search_queries: {
      ja: string[];
      en: string[];
    };
    unknown_fields: string[];
    candidate_strategy: string;
    product_candidates: {
      product_name: string;
      manufacturer: string;
      product_line: string;
      evidence: string;
      confidence: string;
    }[];
  };
  marketplace_links: {
    shop: string;
    query: string;
    url: string;
    note: string;
  }[];
  retrieved_candidates: {
    title: string;
    url: string;
    snippet: string;
    source: string;
    query: string;
  }[];
  ranked_candidates: {
    rank: number;
    title: string;
    url: string;
    source: string;
    score: number;
    verdict: string;
    evidence: string;
    concerns: string;
  }[];
};

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 8 * 1024 * 1024;
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function validateImage(file: File) {
  if (!acceptedTypes.includes(file.type)) {
    return "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.";
  }

  if (file.size > maxFileSize) {
    return "이미지는 8MB 이하만 업로드할 수 있습니다.";
  }

  return null;
}

const shopPriceSeeds: Record<string, { price: number; condition: string }> = {
  AmiAmi: {
    price: 4980,
    condition: "pre-owned / 확인 필요",
  },
  Mandarake: {
    price: 5500,
    condition: "중고 재고 / 확인 필요",
  },
  "Suruga-ya": {
    price: 5280,
    condition: "중고 또는 신품 / 확인 필요",
  },
};

function formatYen(price: number) {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function buildPriceComparisonRows(
  marketplaceLinks: MarketplaceLink[],
  retrievedCandidates: RetrievedCandidate[],
) {
  const rows: PriceComparisonRow[] = marketplaceLinks.map((link) => {
    const matchedCandidate = retrievedCandidates.find((candidate) => {
      const source = candidate.source.toLowerCase();

      if (link.shop === "AmiAmi") {
        return source.includes("amiami");
      }

      if (link.shop === "Mandarake") {
        return source.includes("mandarake");
      }

      if (link.shop === "Suruga-ya") {
        return source.includes("suruga-ya");
      }

      return false;
    });
    const seed = shopPriceSeeds[link.shop] ?? {
      price: 0,
      condition: "확인 필요",
    };

    return {
      shop: link.shop,
      price: seed.price,
      condition: seed.condition,
      confidence: matchedCandidate ? "검색 후보 있음" : "검색 링크 생성",
      sourceUrl: matchedCandidate?.url ?? link.url,
      note: matchedCandidate
        ? matchedCandidate.title
        : "실시간 가격 파싱 전 단계의 MVP 표시값입니다.",
    };
  });

  return rows.filter((row) => row.price > 0);
}

function summarizePrices(rows: PriceComparisonRow[]) {
  if (rows.length === 0) {
    return null;
  }

  const prices = rows.map((row) => row.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const average = Math.round(
    prices.reduce((total, price) => total + price, 0) / prices.length,
  );
  const cheapest = rows.find((row) => row.price === min);

  return {
    min,
    max,
    average,
    cheapestShop: cheapest?.shop ?? "",
  };
}

export default function UploadExperience() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FigureIdentification | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<string | null>(null);

  const fileMeta = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return `${selectedFile.name} / ${formatFileSize(selectedFile.size)}`;
  }, [selectedFile]);

  const priceRows = useMemo(() => {
    if (!result) {
      return [];
    }

    return buildPriceComparisonRows(
      result.marketplaceLinks,
      result.retrievedCandidates,
    );
  }, [result]);

  const priceSummary = useMemo(() => summarizePrices(priceRows), [priceRows]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setResult(null);
      setAnalysisMeta(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
    setAnalysisMeta(null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError("분석할 피규어 이미지를 먼저 업로드해주세요.");
      return;
    }

    setError(null);
    setResult(null);
    setAnalysisMeta(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(`${apiBaseUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | AnalyzeApiResponse
        | { detail?: string };

      if (!response.ok) {
        setError(
          "detail" in payload && payload.detail
            ? payload.detail
            : "이미지 분석 요청에 실패했습니다.",
        );
        return;
      }

      const data = payload as AnalyzeApiResponse;

      setResult({
        character: data.identification.character,
        series: data.identification.series,
        manufacturer: data.identification.manufacturer,
        productLine: data.identification.product_line,
        estimatedProductName: data.identification.estimated_product_name,
        confidence: data.identification.confidence,
        subjectCandidates: data.identification.subject_candidates.map(
          (candidate) => ({
            character: candidate.character,
            series: candidate.series,
            evidence: candidate.evidence,
            confidence: candidate.confidence,
          }),
        ),
        visualFeatures: data.identification.visual_features,
        notes: data.identification.notes,
        keywords: data.identification.keywords,
        searchQueries: data.identification.search_queries,
        unknownFields: data.identification.unknown_fields,
        candidateStrategy: data.identification.candidate_strategy,
        productCandidates: data.identification.product_candidates.map(
          (candidate) => ({
            productName: candidate.product_name,
            manufacturer: candidate.manufacturer,
            productLine: candidate.product_line,
            evidence: candidate.evidence,
            confidence: candidate.confidence,
          }),
        ),
        marketplaceLinks: data.marketplace_links,
        retrievedCandidates: data.retrieved_candidates,
        rankedCandidates: data.ranked_candidates,
      });
      setAnalysisMeta(
        `${data.mode.toUpperCase()} / ${data.filename} / ${formatFileSize(
          data.file_size,
        )}`,
      );
    } catch {
      setError(
        "백엔드 분석 서버에 연결할 수 없습니다. FastAPI 서버가 실행 중인지 확인해주세요.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReset() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    setAnalysisMeta(null);
    setIsAnalyzing(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-ink md:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="border-b-4 border-ocean pb-6">
          <p className="text-sm font-semibold uppercase text-ocean">
            AkibaLens MVP
          </p>
          <h1 className="mt-2 max-w-5xl text-3xl font-bold leading-tight">
            피규어 사진으로 상품 후보와 가격 확인 링크를 찾습니다.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            사진 한 장을 업로드하면 캐릭터와 작품을 추정하고, 일본 쇼핑몰에서
            확인할 수 있는 상품 후보와 검색 링크를 정리합니다. 확실하지 않은
            제조사와 라인업은 단정하지 않고 후보와 근거를 함께 보여줍니다.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">사진 업로드</h2>
                <p className="mt-1 text-sm text-slate-600">
                  JPG, PNG, WEBP / 최대 8MB
                </p>
              </div>
              {selectedFile ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-fit rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  초기화
                </button>
              ) : null}
            </div>

            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-5 flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition ${
                isDragging
                  ? "border-ocean bg-mist"
                  : "border-slate-300 bg-slate-50 hover:border-ocean hover:bg-mist"
              }`}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleInputChange}
              />

              {previewUrl ? (
                <div className="w-full">
                  <div className="mx-auto flex max-h-[420px] max-w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="업로드한 피규어 미리보기"
                      className="max-h-[420px] w-auto max-w-full object-contain"
                    />
                  </div>
                  <p className="mt-4 break-all text-sm font-semibold text-slate-700">
                    {fileMeta}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    다른 이미지를 선택하려면 이 영역을 다시 클릭하세요.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ocean text-2xl font-bold text-white">
                    +
                  </div>
                  <p className="mt-5 text-lg font-bold">
                    피규어 이미지를 드래그하거나 클릭해서 업로드
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    매장 진열대, 박스, 단독 피규어 사진 모두 MVP 테스트에 사용할
                    수 있습니다.
                  </p>
                </div>
              )}
            </label>

            {error ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="rounded-md bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                  {isAnalyzing ? "찾는 중..." : "상품 찾기"}
              </button>
              <div className="flex items-center text-sm text-slate-500">
                {selectedFile
                  ? "이미지를 백엔드 분석 API로 전송합니다."
                  : "이미지를 업로드하면 분석 버튼이 활성화됩니다."}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-xl font-bold">상품 식별 결과</h2>
              <p className="mt-1 text-sm text-slate-600">
                이미지 분석 결과와 검색 후보를 함께 확인합니다.
              </p>
            </div>

            <div className="mt-5 min-h-[360px]">
              {isAnalyzing ? (
                <div className="flex h-[360px] flex-col items-center justify-center rounded-lg bg-slate-50 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-ocean" />
                  <p className="mt-4 font-semibold text-slate-700">
                    이미지에서 상품 후보를 찾는 중
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-5">
                  <dl className="grid gap-3">
                    <ResultRow label="캐릭터" value={result.character} />
                    <ResultRow label="작품" value={result.series} />
                    <ResultRow
                      label="제조사"
                      value={result.manufacturer}
                      fallback="확인 필요"
                    />
                    <ResultRow
                      label="라인업"
                      value={result.productLine}
                      fallback="확인 필요"
                    />
                    <ResultRow
                      label="추정 상품명"
                      value={result.estimatedProductName}
                      fallback="상품 후보 확인 필요"
                    />
                    <ResultRow label="신뢰도" value={result.confidence} />
                  </dl>

                  {analysisMeta ? (
                    <div className="rounded-lg border border-cyan-100 bg-mist px-4 py-3 text-sm font-semibold text-ocean">
                      {analysisMeta}
                    </div>
                  ) : null}

                  {result.subjectCandidates.length > 0 ? (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <h3 className="text-sm font-bold text-slate-800">
                        캐릭터 후보
                      </h3>
                      <div className="mt-3 space-y-3">
                        {result.subjectCandidates.map((candidate) => (
                          <div
                            key={`${candidate.series}-${candidate.character}-${candidate.evidence}`}
                            className="rounded-md border border-slate-200 bg-white p-3"
                          >
                            <p className="font-semibold text-ink">
                              {candidate.character || "캐릭터 확인 필요"} /{" "}
                              {candidate.series || "작품 확인 필요"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-ocean">
                              {candidate.confidence}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {candidate.evidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      이미지에서 보이는 특징
                    </h3>
                    <TagList items={result.visualFeatures} emptyText="추출된 특징이 없습니다." />
                  </div>

                  <div className="rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      쇼핑몰 검색어
                    </h3>
                    <div className="mt-3 space-y-3">
                      <KeywordGroup label="일본어" keywords={result.searchQueries.ja} />
                      <KeywordGroup label="영어" keywords={result.searchQueries.en} />
                    </div>
                  </div>

                  {result.marketplaceLinks.length > 0 ? (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <h3 className="text-sm font-bold text-slate-800">
                        쇼핑몰 검색 링크
                      </h3>
                      <div className="mt-3 grid gap-3">
                        {result.marketplaceLinks.map((link) => (
                          <a
                            key={link.shop}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-slate-200 bg-white p-3 transition hover:border-ocean hover:bg-mist"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-bold text-ink">{link.shop}</p>
                              <span className="text-sm font-bold text-ocean">
                                열기
                              </span>
                            </div>
                            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                              {link.query}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {link.note}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {priceRows.length > 0 && priceSummary ? (
                    <div className="rounded-lg border border-cyan-100 bg-mist p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">
                            예상 가격 비교
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            현재는 실시간 가격 수집 전 단계입니다. 링크를 열어
                            실제 재고와 가격을 확인하세요.
                          </p>
                        </div>
                        <div className="rounded-md bg-white px-3 py-2 text-sm font-bold text-ocean">
                          최저 예상가: {formatYen(priceSummary.min)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MetricCard
                          label="최저가"
                          value={formatYen(priceSummary.min)}
                          helper={priceSummary.cheapestShop}
                        />
                        <MetricCard
                          label="평균가"
                          value={formatYen(priceSummary.average)}
                          helper="예상값"
                        />
                        <MetricCard
                          label="가격 범위"
                          value={`${formatYen(priceSummary.min)} - ${formatYen(
                            priceSummary.max,
                          )}`}
                          helper="쇼핑몰 확인 필요"
                        />
                      </div>

                      <div className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-white">
                        <div className="grid grid-cols-[1fr_0.8fr_1fr_0.7fr] bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-500">
                          <span>쇼핑몰</span>
                          <span>가격</span>
                          <span>상태</span>
                          <span>링크</span>
                        </div>
                        {priceRows.map((row) => (
                          <div
                            key={`${row.shop}-${row.sourceUrl}`}
                            className="grid grid-cols-[1fr_0.8fr_1fr_0.7fr] items-center border-t border-slate-100 px-3 py-3 text-sm"
                          >
                            <div>
                              <p className="font-bold text-ink">{row.shop}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                                {row.note}
                              </p>
                            </div>
                            <p className="font-bold text-ocean">
                              {formatYen(row.price)}
                            </p>
                            <p className="text-xs leading-5 text-slate-500">
                              {row.condition}
                              <br />
                              {row.confidence}
                            </p>
                            <a
                              href={row.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-bold text-ocean hover:underline"
                            >
                              열기
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {result.rankedCandidates.length > 0 ? (
                    <div className="rounded-lg border border-cyan-100 bg-white p-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          가능성 높은 상품 후보
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          검색 결과를 이미지 단서와 다시 비교해 가능성이 높은 순서로 정렬합니다.
                        </p>
                      </div>
                      <div className="mt-3 space-y-3">
                        {result.rankedCandidates.map((candidate) => (
                          <a
                            key={`${candidate.rank}-${candidate.url}`}
                            href={candidate.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-ocean hover:bg-mist"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase text-ocean">
                                  후보 #{candidate.rank} / {candidate.source}
                                </p>
                                <p className="mt-1 font-bold text-ink">
                                  {candidate.title}
                                </p>
                              </div>
                              <span className="w-fit rounded-md bg-ocean px-2 py-1 text-xs font-bold text-white">
                                {candidate.score}/100
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              {candidate.verdict}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {candidate.evidence}
                            </p>
                            {candidate.concerns ? (
                              <p className="mt-2 rounded-md bg-white px-3 py-2 text-xs leading-5 text-slate-500">
                                확인 필요: {candidate.concerns}
                              </p>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      검색된 상품 페이지
                    </h3>
                    {result.retrievedCandidates.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {result.retrievedCandidates.map((candidate) => (
                          <a
                            key={`${candidate.url}-${candidate.query}`}
                            href={candidate.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-slate-200 bg-white p-3 transition hover:border-ocean hover:bg-mist"
                          >
                            <p className="font-bold text-ink">{candidate.title}</p>
                            <p className="mt-1 text-xs font-semibold uppercase text-ocean">
                              {candidate.source}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {candidate.snippet}
                            </p>
                            <p className="mt-2 break-words text-xs text-slate-400">
                              검색어: {candidate.query}
                            </p>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        관련 상품 페이지를 찾지 못했습니다. 위 쇼핑몰 검색 링크로
                        직접 확인해보세요.
                      </p>
                    )}
                  </div>

                  {result.productCandidates.length > 0 ? (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <h3 className="text-sm font-bold text-slate-800">
                        AI가 추정한 상품명
                      </h3>
                      <div className="mt-3 space-y-3">
                        {result.productCandidates.map((candidate) => (
                          <div
                            key={`${candidate.productName}-${candidate.evidence}`}
                            className="rounded-md border border-slate-200 bg-white p-3"
                          >
                            <p className="font-semibold text-ink">
                              {candidate.productName || "이름 없는 후보"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {candidate.manufacturer || "제조사 확인 필요"} /{" "}
                              {candidate.productLine || "라인업 확인 필요"} /{" "}
                              {candidate.confidence}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {candidate.evidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-slate-200 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      다음 확인 방법
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {result.candidateStrategy}
                    </p>
                    {result.unknownFields.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          추가 확인이 필요한 정보
                        </p>
                        <TagList items={result.unknownFields} emptyText="" />
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600">
                    {result.notes}
                  </div>
                </div>
              ) : (
                <div className="flex h-[360px] flex-col justify-center rounded-lg bg-slate-50 p-6 text-center">
                  <p className="text-lg font-bold text-slate-800">
                    아직 분석 결과가 없습니다.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    이미지를 업로드한 뒤 상품 찾기를 시작하면 캐릭터, 작품,
                    상품 후보, 가격 확인 링크가 이곳에 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ResultRow({
  label,
  value,
  fallback = "Unknown",
}: {
  label: string;
  value: string;
  fallback?: string;
}) {
  const displayValue = value?.trim() ? value : fallback;
  const isFallback = !value?.trim();

  return (
    <div className="grid gap-1 rounded-md border border-slate-200 px-4 py-3 sm:grid-cols-[150px_1fr]">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className={`font-semibold ${isFallback ? "text-slate-400" : "text-ink"}`}>
        {displayValue}
      </dd>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-md border border-cyan-100 bg-white p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function KeywordGroup({
  label,
  keywords,
}: {
  label: string;
  keywords: string[];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {keywords.length > 0 ? keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
          >
            {keyword}
          </span>
        )) : (
          <span className="text-sm text-slate-400">No queries generated</span>
        )}
      </div>
    </div>
  );
}

function TagList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
