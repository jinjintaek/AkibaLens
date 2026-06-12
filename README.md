# AkibaLens

Snap a figure. Find it instantly.

MVP Goal:
Identify anime figures from images and compare prices across Japanese marketplaces.

AkibaLens는 일본 여행 중 아키하바라, 돈키호테, 중고 피규어샵 등에서 피규어와 굿즈를 구매하려는 사용자를 위한 AI 기반 쇼핑 보조 서비스입니다.

사용자가 피규어 사진을 업로드하면 AI Vision Model이 캐릭터, 작품명, 제조사, 시리즈명, 추정 상품명을 식별하고, 일본 쇼핑몰 가격 정보를 검색하여 구매 판단을 돕는 것을 목표로 합니다.

## Current MVP Status

현재 AkibaLens는 로컬 데모 기준으로 다음 end-to-end 흐름이 동작합니다.

```text
Image Upload
-> OpenAI Vision Identification
-> Product Retrieval with OpenAI Web Search
-> Candidate Reranking
-> Marketplace Links
-> Price Comparison Preview
```

구현 완료:

- 이미지 업로드 및 미리보기
- JPG, PNG, WEBP 파일 검증
- FastAPI `/api/analyze` 이미지 분석 endpoint
- OpenAI Vision 기반 캐릭터/작품/검색 단서 추출
- OpenAI Web Search 기반 상품 후보 검색
- 검색 후보 3개에 대한 candidate reranking
- AmiAmi, Mandarake, Suruga-ya 검색 링크 생성
- 가격 비교 preview UI
- 샘플 이미지 5장 평가 및 label leakage 제거 재평가

아직 MVP preview 단계인 부분:

- 가격 비교 값은 실시간 파싱이 아니라 mock/preview 값입니다.
- 정확한 상품명/라인업 확정은 아직 불안정합니다.
- Web Search는 reverse image search가 아니라 Vision이 만든 텍스트 단서를 기반으로 검색합니다.
- 배포 설정 파일은 준비되어 있으며, 현재 실제 배포는 Vercel/Render 계정 인증이 필요한 단계입니다.

## Key Evaluation Result

파일명 힌트를 제거한 실제 샘플 5장 재평가 결과:

| Metric | Result | Notes |
| --- | ---: | --- |
| Character identification | 4 / 5 | Reze sample failed without filename hint |
| Series identification | 4 / 5 | Same Reze case failed |
| Product line / lineup hint | 0-1 / 5 | Grandista, Luminasta, Ichiban Kuji are hard from image only |
| Useful retrieval candidates | 3 / 5 | Retrieval quality depends on Vision clue quality |
| Exact product page confidence | 0 / 5 | Needs stronger reranking/image matching |

관련 문서:

- `docs/evaluation.md`
- `docs/evaluation-no-filename-hints.md`
- `docs/mvp-sample-evaluation-summary.md`
- `docs/sample-evaluation-results.json`
- `docs/sample-evaluation-results-no-filename-hints.json`
- `docs/akibalens-interim-report.pdf`
- `docs/deployment.md`

핵심 인사이트:

- 캐릭터/작품 식별은 MVP 가치 검증에 충분히 유효합니다.
- 정확한 상품명/라인업 식별은 별도 candidate reranking과 후보 검증이 필요합니다.
- 파일명에 정답 힌트가 들어가면 평가가 낙관적으로 왜곡될 수 있어, label leakage 제거 평가를 별도로 수행했습니다.

## Local Development

### Backend

```bash
cd backend
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl -s http://127.0.0.1:8000/api/health
```

### Frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

### Environment Variables

Root `.env` example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
BACKEND_CORS_ORIGINS=http://localhost:3000

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
OPENAI_SEARCH_MODEL=
OPENAI_IMAGE_DETAIL=high
OPENAI_IDENTIFICATION_WEB_SEARCH=false
CANDIDATE_RERANKING_ENABLED=true

SEARCH_PROVIDER=openai
SEARCH_RESULT_LIMIT=3
```

`OPENAI_IDENTIFICATION_WEB_SEARCH=false`가 기본값입니다. 식별 단계는 Vision만 사용하고, 상품 후보 검색 단계에서 OpenAI Web Search를 사용해 응답 시간을 줄입니다.

## 프로젝트 배경

본 프로젝트는 AI/Data Science 석사 졸업 후 취업 준비 과정에서 진행하는 개인 프로젝트입니다.

개인적으로 일본 문화, 애니메이션, 포켓몬, 피규어, 일본 여행을 좋아하며, 일본 여행 시 아키하바라와 돈키호테를 자주 방문하고 피규어 및 굿즈를 구매해 왔습니다.

실제 쇼핑 경험에서 피규어를 발견했지만 정확한 상품명, 캐릭터명, 제조사, 시리즈 정보를 몰라 검색과 가격 비교가 어려웠던 문제를 해결하기 위해 AkibaLens를 기획했습니다.

## 핵심 문제

피규어를 오프라인 매장에서 발견했을 때 사용자는 다음과 같은 문제를 자주 겪습니다.

- 피규어 이름을 모름
- 제조사를 모름
- 어떤 시리즈인지 모름
- 캐릭터 이름을 모름
- 일본어 상품명을 모름

이로 인해 다음 문제가 발생합니다.

- 검색 자체가 어려움
- 가격 비교가 어려움
- 구매 결정을 내리기 어려움

특히 라이트 유저, 피규어 입문자, 일본어 검색에 익숙하지 않은 여행객에게 더 큰 문제가 됩니다.

## 프로젝트 목표

사용자가 피규어 사진만 업로드하면 다음 과정을 통해 구매 판단을 쉽게 만드는 것이 목표입니다.

1. 피규어를 식별한다.
2. 상품 정보를 추정한다.
3. 여러 일본 쇼핑몰 가격을 검색한다.
4. 사용자의 구매 판단을 돕는다.

AkibaLens는 상품을 100% 확정하는 서비스가 아니라, 사용자가 검색과 가격 비교를 시작할 수 있도록 신뢰도 높은 상품 후보와 검색 키워드를 제공하는 서비스입니다.

초기 Vision 분석은 제조사와 라인업을 무리하게 확정하지 않습니다. 피규어 실물 사진에서 캐릭터, 작품, 포즈, 의상, 무기, 색상, 태그 등 검색 단서를 추출하고, 이후 마켓플레이스 검색 결과와 비교하여 상품 후보를 좁히는 방식을 사용합니다.

## Target User

### Primary Users

- 일본 애니메이션 팬
- 피규어 입문자
- 일본 여행객
- 포켓몬 팬
- 굿즈 수집가

핵심 타겟은 피규어를 사고 싶지만 정확한 상품명과 시세를 모르는 일본 여행객 및 입문자입니다.

### Secondary Users

- 중고 피규어 구매자
- 해외 직구 사용자

## MVP 목표

MVP는 "이미지 업로드 -> 피규어 식별 -> 일본 쇼핑몰 검색 -> 가격 비교" 흐름을 end-to-end로 구현하는 것을 목표로 합니다.

초기 버전에서는 완벽한 상품 식별보다 사용자가 실제로 검색과 가격 비교를 이어갈 수 있는 정보를 제공하는 데 집중합니다.

## MVP 기능

### 기능 1. Image Upload

사용자가 피규어 사진을 업로드합니다.

입력:

- 피규어 이미지

출력:

- 업로드 이미지 미리보기
- 분석 요청 상태

### 기능 2. Figure Identification

AI Vision Model을 사용하여 업로드된 피규어 이미지를 분석하고 상품 정보를 추정합니다.

입력:

- 피규어 이미지

출력:

- 캐릭터명
- 작품명
- 제조사
- 시리즈명
- 추정 상품명

예시:

| Field | Value |
| --- | --- |
| Character | Gojo Satoru |
| Series | Jujutsu Kaisen |
| Manufacturer | Good Smile Company |
| Product Line | POP UP PARADE |
| Estimated Product Name | POP UP PARADE Gojo Satoru |

### 기능 3. Marketplace Search

식별된 결과를 이용하여 일본 쇼핑몰에서 관련 상품을 검색합니다.

초기 검색 대상:

- AmiAmi
- Mandarake
- Suruga-ya

입력:

- 캐릭터명
- 작품명
- 제조사
- 시리즈명
- 추정 상품명
- 일본어/영어 검색 키워드

출력:

- 쇼핑몰명
- 상품명
- 가격
- 상품 상태
- 상품 URL
- 재고 여부

### 기능 4. Price Comparison

Marketplace Search 결과를 정리하여 사용자가 가격을 쉽게 비교할 수 있도록 제공합니다.

예시:

| Shop | Price |
| --- | ---: |
| AmiAmi | ¥4,980 |
| Mandarake | ¥5,500 |
| Suruga-ya | ¥5,280 |

출력:

- 쇼핑몰별 가격
- 최저가
- 평균 가격
- 가격 범위
- 상품 상태
- 상품 URL
- 구매 판단 참고 정보

## MVP에서 하지 않을 것

초기 버전에서는 빠르게 검증 가능한 MVP 구현에 집중하기 위해 다음 범위는 제외합니다.

- 자체 Computer Vision 모델 학습
- CLIP Fine-tuning
- CNN 기반 이미지 분류 모델 학습
- 복잡한 추천 시스템
- 결제 기능
- 구매 대행 기능

## AI 전략

초기에는 자체 Vision Model을 만들지 않습니다.

우선 다음 모델 중 하나를 활용하여 이미지 식별 성능과 사용자 가치를 검증합니다.

- GPT Vision
- Gemini Vision

초기 검증 목표:

- 피규어 사진만으로 유의미한 상품 후보를 제공할 수 있는지 확인
- 사용자가 검색을 시작할 수 있을 정도의 키워드를 생성할 수 있는지 확인
- 가격 비교 기능과 연결했을 때 구매 판단에 도움이 되는지 확인
- 라이트 유저와 여행객에게 실제 사용 가치가 있는지 확인

이후 필요하면 다음 기술을 검토합니다.

- CLIP
- SigLIP
- Fine-tuned Vision Model
- 피규어 이미지 데이터셋 구축
- 이미지-텍스트 임베딩 기반 유사 상품 검색

## 기술 스택

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

사용자가 피규어 이미지를 업로드하고, AI 식별 결과와 가격 비교 결과를 확인하는 웹 인터페이스를 구현합니다.

### Backend

- FastAPI

이미지 업로드 요청 처리, AI Vision API 호출, 쇼핑몰 검색 파이프라인, 가격 데이터 정규화 로직을 담당합니다.

### Database

- PostgreSQL

분석 결과, 검색 기록, 상품 후보, 쇼핑몰별 가격 정보를 저장합니다.

### AI

- OpenAI Vision API 또는 Gemini Vision API

업로드된 피규어 이미지를 분석하여 캐릭터명, 작품명, 제조사, 시리즈명, 추정 상품명, 검색 키워드를 생성합니다.

### Deployment

- Vercel
- Railway 또는 Render

Frontend는 Vercel에 배포하고, Backend와 Database는 Railway 또는 Render를 활용합니다.

## MVP Architecture

```text
User
  -> Next.js Frontend
  -> FastAPI Backend
  -> Vision API
  -> Marketplace Search
  -> PostgreSQL
  -> Price Comparison Result
  -> Frontend
```

## MVP User Flow

1. 사용자가 피규어 사진을 업로드한다.
2. AI Vision Model이 이미지에서 피규어 정보를 추정한다.
3. 시스템이 추정 결과를 기반으로 일본어/영어 검색 키워드를 생성한다.
4. AmiAmi, Mandarake, Suruga-ya에서 관련 상품을 검색한다.
5. 쇼핑몰별 가격 정보를 표로 정리한다.
6. 사용자는 최저가와 가격 범위를 보고 구매 여부를 판단한다.

## 장기 로드맵

### Phase 2. 가격 추적

식별된 피규어의 쇼핑몰별 가격을 주기적으로 수집하고 저장합니다.

- 상품별 가격 히스토리 저장
- 쇼핑몰별 가격 변동 추적
- 최저가/평균가/최고가 계산
- 가격 추이 그래프 제공

### Phase 3. 가격 하락 알림

사용자가 관심 있는 상품의 가격이 특정 기준 이하로 내려가면 알림을 제공합니다.

- 목표 가격 설정
- 가격 하락 감지
- 이메일 또는 앱 알림
- 재고 재입고 알림 검토

### Phase 4. 위시리스트

사용자가 관심 있는 피규어를 저장하고 관리할 수 있습니다.

- 관심상품 저장
- 상품별 현재 최저가 확인
- 쇼핑몰별 링크 저장
- 가격 변동 상태 표시

### Phase 5. 컬렉션 관리

사용자가 보유 중인 피규어를 등록하고 자신의 컬렉션을 관리할 수 있습니다.

- 보유 피규어 등록
- 구매 가격 기록
- 구매처 기록
- 현재 시세와 비교
- 컬렉션 총 가치 추정

### Phase 6. 중고거래 통합 검색

일본 중고거래 및 경매 플랫폼까지 검색 범위를 확장합니다.

검색 대상:

- Mercari
- Yahoo Auctions
- Rakuten

주요 기능:

- 중고 매물 통합 검색
- 상품 상태 비교
- 배송 가능 여부 확인
- 경매/즉시구매 가격 구분
- 중고 시세 범위 계산

## 프로젝트 목적

이 프로젝트는 다음 세 가지를 동시에 달성하기 위해 진행합니다.

1. 실제 문제 해결
2. 포트폴리오 구축
3. 창업 가능성 검증

목표는 당장 사업화가 아니라 실제 사용 가능한 MVP를 만드는 것입니다.

과도한 엔지니어링을 피하고, 2~4주 내에 동작 가능한 MVP를 만드는 것을 최우선 목표로 합니다.

## MVP 실행 원칙

- 자체 모델 학습보다 기존 Vision API 활용을 우선한다.
- 완벽한 상품 식별보다 유용한 상품 후보 제공을 우선한다.
- 복잡한 추천 시스템보다 가격 비교 기능을 우선한다.
- 자동화된 구매 기능보다 구매 판단 보조에 집중한다.
- 확장 가능한 구조는 고려하되, 초기 구현은 단순하게 유지한다.
- 2~4주 안에 배포 가능한 end-to-end 흐름을 완성한다.

## Local Development

현재 프로젝트는 `frontend/`와 `backend/`를 분리한 구조로 시작합니다.

### 1. 환경 변수 준비

```bash
cp .env.example .env
```

필요한 API key를 `.env`에 입력합니다.

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
DATABASE_URL=
```

### 2. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

기본 주소:

```text
http://localhost:3000
```

### 3. Backend 실행

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

기본 주소:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```
