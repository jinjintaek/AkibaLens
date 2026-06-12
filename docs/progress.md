# AkibaLens Progress Tracker

프로젝트 진행 상황을 간단히 추적하기 위한 체크리스트입니다.

## Phase 1. Project Setup

- [x] `frontend/` 디렉터리 생성
- [x] `backend/` 디렉터리 생성
- [x] Next.js 기본 파일 구성
- [x] FastAPI 기본 파일 구성
- [x] 환경 변수 샘플 작성
- [x] Frontend 의존성 설치
- [x] Backend 의존성 설치
- [x] Frontend 로컬 실행 확인
- [x] Backend 로컬 실행 확인
- [x] README 실행 방법 업데이트

검증 결과:

- `npm run build` 성공
- `npm run dev` 성공: `http://localhost:3000`
- FastAPI 서버 실행 성공: `http://127.0.0.1:8000`
- Backend health check 성공: `{"status":"ok","service":"akibalens-api"}`
- Browser 확인 성공: 메인 페이지 title `AkibaLens`, H1 정상 표시

메모:

- `npm install` 중 `2 moderate severity vulnerabilities` audit 경고가 확인됨. MVP scaffold 단계에서는 보류하고, 배포 전 `npm audit` 기준으로 재검토한다.
- Node v23 환경에서 Next.js 실행 시 `Type Stripping is an experimental feature` 경고가 표시됨. build와 dev 실행은 정상 동작한다.

## Phase 2. Image Upload UI

- [x] 이미지 업로드 화면 구현
- [x] 이미지 미리보기 구현
- [x] 파일 형식/크기 검증
- [x] 분석 버튼 구현
- [x] 로딩 상태 구현
- [x] 에러 상태 구현

검증 결과:

- `npm run build` 성공
- Browser 확인 성공: `Image Upload`, `Figure Identification`, 분석 버튼, 빈 결과 상태 표시
- 업로드 전 분석 버튼 비활성화 확인
- AI 연결 전 mock 분석 결과 표시 흐름 구현

메모:

- Browser 자동화 환경에서 파일 입력 자동 주입 메서드가 제공되지 않아 실제 파일 선택은 수동 확인 대상으로 남김.
- Next.js dev 서버가 켜진 상태에서 `npm run build`를 실행하면 `.next` 캐시 충돌로 dev 서버가 500 상태가 될 수 있음. build 검증 후 dev 서버를 재시작하면 정상 복구됨.

## Phase 3. Vision API Integration

- [x] `/api/analyze` endpoint 구현
- [x] 이미지 파일 업로드 처리
- [x] Vision API 클라이언트 구현
- [x] 피규어 식별 프롬프트 작성
- [x] 구조화된 JSON 응답 반환
- [x] Frontend와 분석 API 연결

검증 결과:

- Backend 문법 검사 성공: `py_compile`
- Frontend build 성공: `npm run build`
- Backend health check 성공
- `/api/analyze` multipart 이미지 업로드 성공
- Frontend 화면에서 FastAPI 분석 API 연결 문구 확인
- OpenAI SDK 설치 및 Responses API 이미지 입력 연결 성공
- 실제 OpenAI 요청 도달 확인
- OpenAI credits 충전 후 quota 에러 해소 확인
- 저정보/빈 이미지 입력 시 식별 불가 응답 확인

현재 구현 방식:

- `OPENAI_API_KEY`가 있으면 OpenAI Vision 호출
- `OPENAI_API_KEY`가 없으면 `backend/app/services/figure_identifier.py`에서 mock 식별 결과 반환
- 식별 가능한 정보가 거의 없는 이미지는 OpenAI 호출 전에 `confidence: low`로 처리
- Frontend는 `NEXT_PUBLIC_API_BASE_URL` 기준으로 `/api/analyze`에 이미지 전송

남은 작업:

- 실제 피규어 이미지로 식별 품질 테스트

## Phase 3.5. Product Candidate Retrieval Prep

- [x] Vision 응답 스키마를 검색 단서 중심으로 개편
- [x] `visual_features` 추가
- [x] `search_queries` 추가
- [x] `unknown_fields` 추가
- [x] `candidate_strategy` 추가
- [x] `product_candidates` 자리 추가
- [x] UI를 정답 표시에서 후보 검색 단서 표시로 개편
- [x] `subject_candidates` 추가
- [x] 캐릭터/작품 후보는 적극 추정하고 제조사/라인업은 보수적으로 처리하도록 프롬프트 튜닝

목표:

- Vision 모델이 제조사/라인업을 억지로 확정하지 않도록 한다.
- 캐릭터/작품은 포장 없이도 후보를 제시하도록 한다.
- 피규어 실물 사진에서 캐릭터, 작품, 포즈, 의상, 무기, 색상, 태그 등 검색 단서를 추출한다.
- 다음 Phase 4에서 이 검색 쿼리로 AmiAmi, Mandarake, Suruga-ya 후보 검색을 진행한다.

## Phase 4. Marketplace Search

- [x] 검색 키워드 생성 로직 구현
- [x] AmiAmi 검색 URL 생성
- [x] Mandarake 검색 URL 생성
- [x] Suruga-ya 검색 URL 생성
- [x] 무료 DuckDuckGo HTML 기반 product retrieval 실험 구현
- [x] `retrieved_candidates` 응답/화면 표시 추가
- [x] Google Custom Search API 설정값 추가
- [x] Google Custom Search 기반 product retrieval 1차 구현
- [x] OpenAI Web Search 기반 product retrieval 1차 구현
- [x] 응답 속도 개선을 위해 기본값을 `Vision 식별 + Web Search 상품 후보 검색`으로 조정
- [x] 검색 후보를 근거 기반으로 재정렬하는 candidate reranking 1차 구현
- [ ] 검색 결과 공통 스키마 정의

검증 기준:

- `/api/analyze` 응답에 `marketplace_links` 포함
- Frontend에서 쇼핑몰별 검색 링크 버튼 표시
- 실제 가격 수집/파싱은 아직 하지 않고 검색 결과 페이지로 이동하는 링크만 제공

메모:

- DuckDuckGo HTML 검색은 202/challenge 응답이 나올 수 있어 안정적이지 않음.
- Bing HTML은 접근 가능하지만 캐릭터명 없는 순수 시각 키워드만으로는 샘플 Reze Nendoroid 후보를 찾지 못함.
- 정확한 RAG를 위해서는 Google Custom Search, SerpAPI, Brave Search API, 또는 OpenAI Web Search tool 같은 검색 API 검토가 필요함.
- `SEARCH_PROVIDER=google`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`가 있으면 Google Custom Search를 먼저 사용하고 실패 시 DuckDuckGo 실험 로직으로 fallback한다.
- Google Custom Search JSON API는 신규 고객 접근 제한으로 403이 발생할 수 있어 MVP 기본 provider를 OpenAI Web Search로 전환한다.
- `OPENAI_IDENTIFICATION_WEB_SEARCH=false`가 기본값이다. 식별 단계는 빠르게 Vision만 수행하고, 상품 후보 검색 단계에서만 OpenAI Web Search를 사용한다.
- `CANDIDATE_RERANKING_ENABLED=true`이면 검색 후보 3개를 Vision 단서와 비교해 점수/근거/우려점으로 재정렬한다.

## Phase 5. Price Comparison UI

- [x] 가격 비교 mock 데이터 작성
- [x] 쇼핑몰별 가격 테이블 구현
- [x] 최저가 표시
- [x] 평균 가격/가격 범위 표시
- [x] 상품 링크 표시
- [x] 실제 사용자에게 보이는 주요 UI 문구를 한국어 중심으로 정리

메모:

- 현재 가격 비교는 실시간 가격 파싱이 아니라 MVP용 preview 값이다.
- AmiAmi, Mandarake, Suruga-ya 검색 링크와 검색 후보 URL을 연결해 사용자가 직접 현재 가격/재고를 확인할 수 있게 했다.
- 실제 가격 수집은 다음 단계에서 쇼핑몰별 정책과 HTML 구조를 확인한 뒤 구현한다.
- 개발자용 영어 라벨을 줄이고 `사진 업로드`, `상품 식별 결과`, `쇼핑몰 검색 링크`, `예상 가격 비교`, `가능성 높은 상품 후보`처럼 사용자가 바로 이해할 수 있는 문구로 정리했다.

## Phase 6. Database Storage

- [ ] PostgreSQL 연결 설정
- [ ] 분석 요청 테이블 설계
- [ ] 식별 결과 테이블 설계
- [ ] 마켓플레이스 결과 테이블 설계
- [ ] 저장/조회 API 구현

## Phase 7. Deployment

- [ ] Frontend Vercel 배포
- [ ] Backend Railway 또는 Render 배포
- [ ] Production 환경 변수 설정
- [ ] CORS 설정 확인
- [ ] 실제 이미지 3~5개 데모 테스트

## Current Milestone

첫 번째 구체적 목표:

> 피규어 이미지 1장을 업로드하고, AI가 생성한 상품 후보를 화면에 깔끔하게 표시한다.

최근 산출물:

- [x] AkibaLens 중간 개발 리포트 HTML/PDF 생성
  - `docs/akibalens-interim-report.html`
  - `docs/akibalens-interim-report.pdf`
- [x] 샘플 이미지 5장 평가 결과 저장
  - `docs/sample-evaluation-results.json`
  - `docs/evaluation.md`
- [x] 파일명 힌트 제거 후 샘플 이미지 5장 재평가
  - `docs/sample-evaluation-results-no-filename-hints.json`
  - `docs/evaluation-no-filename-hints.md`
- [x] MVP 샘플 평가 결과를 포트폴리오용 요약 문서로 정리
  - `docs/mvp-sample-evaluation-summary.md`
