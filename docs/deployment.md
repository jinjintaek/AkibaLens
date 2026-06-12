# AkibaLens Deployment Guide

작성일: 2026-06-12

이 문서는 AkibaLens MVP를 포트폴리오 데모용으로 배포하기 위한 최소 절차를 정리한다.

권장 구성:

```text
Frontend: Vercel
Backend: Render
```

## 1. Backend 배포 - Render

Render에서 새 Web Service를 만든다.

권장 설정:

| Field | Value |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

이 repo에는 Render Blueprint용 `render.yaml`도 포함되어 있다.

### Backend 환경 변수

Render Environment Variables에 아래 값을 설정한다.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.2
OPENAI_IMAGE_DETAIL=high
OPENAI_IDENTIFICATION_WEB_SEARCH=false
CANDIDATE_RERANKING_ENABLED=true
SEARCH_PROVIDER=openai
SEARCH_RESULT_LIMIT=3
BACKEND_CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

초기에는 프론트 배포 URL을 알 수 없으므로 `BACKEND_CORS_ORIGINS`는 임시로 로컬 또는 예상 Vercel URL을 넣고, 프론트 배포 후 다시 수정한다.

예:

```env
BACKEND_CORS_ORIGINS=http://localhost:3000,https://akibalens.vercel.app
```

## 2. Frontend 배포 - Vercel

Vercel에서 새 프로젝트를 만들고 GitHub repo를 연결한다.

권장 설정:

| Field | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

### Frontend 환경 변수

Vercel Environment Variables에 아래 값을 설정한다.

```env
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend.onrender.com
```

`NEXT_PUBLIC_API_BASE_URL`은 브라우저에 노출되는 값이므로 API secret을 넣으면 안 된다. Render backend URL만 넣는다.

## 3. 배포 후 확인

현재 배포 URL:

- Frontend: https://frontend-ten-lake-39.vercel.app
- Backend: https://akibalens.onrender.com
- Backend health check: https://akibalens.onrender.com/api/health

### Backend 확인

```bash
curl -s https://akibalens.onrender.com/api/health
```

정상 응답:

```json
{"status":"ok","service":"akibalens-api"}
```

### Frontend 확인

Vercel URL에 접속해서 다음 흐름을 확인한다.

1. 이미지 업로드
2. `상품 찾기` 클릭
3. 캐릭터/작품 식별 결과 표시
4. 쇼핑몰 검색 링크 표시
5. 예상 가격 비교 표시

## 4. 주의사항

- Render 무료 인스턴스는 cold start가 있어 첫 요청이 느릴 수 있다.
- 이미지 분석은 OpenAI API 비용이 발생한다.
- 현재 가격 비교는 실시간 가격 파싱이 아니라 MVP preview 값이다.
- Web Search는 reverse image search가 아니라 Vision이 만든 텍스트 단서를 기반으로 검색한다.
- 배포 후에는 README에 Vercel 데모 URL과 Render health URL을 추가한다.
