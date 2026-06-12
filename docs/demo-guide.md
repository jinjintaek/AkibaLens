# AkibaLens Demo Guide

작성일: 2026-06-12

이 문서는 AkibaLens를 포트폴리오/면접에서 시연할 때 사용할 데모 가이드이다.

## Demo URLs

- Frontend: https://frontend-ten-lake-39.vercel.app
- Backend health check: https://akibalens.onrender.com/api/health
- GitHub: https://github.com/jinjintaek/AkibaLens

주의:

- Backend는 Render free tier라서 첫 요청이 50초 이상 걸릴 수 있다.
- 데모 직전 `/api/health`를 한 번 열어 서버를 깨워두면 좋다.
- 이미지 분석은 OpenAI API 비용이 발생한다.

## 1분 소개 스크립트

AkibaLens는 일본 여행 중 아키하바라나 중고 피규어샵에서 박스 없이 진열된 피규어를 발견했을 때, 정확한 캐릭터명이나 상품명을 몰라 검색과 가격 비교가 어려운 문제를 해결하기 위한 AI 쇼핑 보조 MVP입니다.

사용자가 피규어 사진을 업로드하면 OpenAI Vision으로 캐릭터와 작품을 추정하고, 그 결과로 일본어/영어 검색어를 만들고, OpenAI Web Search를 통해 상품 후보를 찾습니다. 이후 후보를 다시 점수화해서 AmiAmi, Mandarake, Suruga-ya 같은 일본 쇼핑몰에서 확인할 수 있는 링크와 가격 preview를 제공합니다.

이 프로젝트의 핵심은 “정확한 상품 확정”보다 “검색 시작점을 만들어주는 것”입니다. 실제 평가에서 캐릭터/작품 식별은 5장 중 4장에서 성공했지만, Grandista, Luminasta, Ichiban Kuji 같은 정확한 라인업 식별은 아직 어렵다는 한계도 확인했습니다.

## 데모 순서

1. Frontend URL 접속
   - https://frontend-ten-lake-39.vercel.app

2. 샘플 이미지 업로드
   - 권장 시작 샘플: `sample/sample_01.png`
   - 이유: Bakugo / My Hero Academia / Banpresto 단서가 잘 잡히고, 검색 후보와 reranking이 잘 보인다.

3. `상품 찾기` 클릭
   - 첫 요청은 Render cold start와 OpenAI 호출 때문에 느릴 수 있다.

4. 결과 설명
   - 캐릭터/작품 식별
   - 제조사/라인업의 불확실성
   - 일본어 검색어
   - 쇼핑몰 검색 링크
   - 가능성 높은 상품 후보 reranking
   - 가격 비교 preview가 실시간 가격 파싱은 아니라는 점

5. 한계 설명
   - Web Search는 reverse image search가 아니다.
   - Vision이 만든 텍스트 단서를 기반으로 검색한다.
   - 정확한 상품명/라인업에는 추가 이미지, 상품 페이지 이미지 비교, 더 강한 reranking이 필요하다.

## 추천 샘플

| Sample | Expected | Demo Use |
| --- | --- | --- |
| `sample_01.png` | Bakugo / My Hero Academia / Grandista hint | 성공 데모용. 캐릭터, 작품, Banpresto 단서가 잘 잡힘 |
| `sample_02.png` | Gojo / Jujutsu Kaisen / Luminasta hint | 캐릭터 식별은 좋지만 라인업이 넓게 퍼지는 예시 |
| `sample_04.png` | Reze / Chainsaw Man / Nendoroid hint | 실패/한계 설명용. 파일명 힌트 제거 후 오식별된 케이스 |

## 면접에서 강조할 포인트

- 실제 개인 경험에서 출발한 문제 정의
- 자체 모델 학습 대신 API 기반 MVP로 빠르게 검증한 선택
- Vision 단독으로는 상품명/라인업 확정이 어렵다는 문제 발견
- Web Search 기반 retrieval과 candidate reranking으로 개선
- 파일명에 정답이 들어가면 평가가 왜곡되는 label leakage 발견
- 샘플 파일명을 익명화한 뒤 재평가
- 로컬 개발을 넘어서 Vercel + Render로 실제 배포 완료

## 예상 질문과 답변

### 왜 직접 CV 모델을 학습하지 않았나요?

MVP 목표는 사용자 문제가 실제로 존재하고, 사진 기반 검색 보조 흐름이 유용한지 검증하는 것이었습니다. 2-4주 내 작동 가능한 제품을 만들기 위해 자체 모델 학습보다 OpenAI Vision과 Web Search를 조합하는 방식을 선택했습니다. 추후 충분한 데이터와 사용성이 검증되면 CLIP, SigLIP, fine-tuned vision model을 검토할 수 있습니다.

### 왜 정확한 상품명을 항상 맞추지 못하나요?

피규어 상품 식별은 캐릭터 식별보다 어렵습니다. 같은 캐릭터가 여러 제조사, 여러 라인업, 여러 포즈로 출시되기 때문입니다. 특히 prize figure는 Grandista, Luminasta, Ichiban Kuji, THE AMAZING HEROES처럼 유사한 상품군이 많습니다. 현재 MVP는 정확한 확정보다 후보 탐색과 검색 시작점 제공에 초점을 맞췄습니다.

### 가격 비교는 실제 가격인가요?

현재는 실시간 가격 파싱이 아니라 preview입니다. 각 쇼핑몰의 검색 링크와 상품 후보를 제공하고, 사용자가 직접 현재 재고와 가격을 확인하는 구조입니다. 실제 가격 파싱은 각 사이트의 정책, robots, HTML 구조를 확인한 뒤 별도 단계로 구현해야 합니다.

### 가장 중요한 기술적 배움은 무엇인가요?

첫째, Vision API 결과를 그대로 정답처럼 보여주면 위험하다는 점입니다. 둘째, 파일명 같은 숨은 힌트가 평가를 왜곡할 수 있다는 점입니다. 셋째, AI product에서는 모델 성능뿐 아니라 불확실성을 UI에 어떻게 표현하는지가 중요하다는 점입니다.

## 현재 한계

- 정확한 상품명/라인업 식별은 아직 불안정하다.
- Web Search는 이미지 유사도 검색이 아니다.
- 실시간 가격 파싱은 구현하지 않았다.
- Render free tier cold start로 첫 요청이 느릴 수 있다.
- OpenAI API 비용이 발생한다.

## 다음 개선

1. Staged UI
   - 캐릭터/작품 결과를 먼저 보여주고, 상품 검색은 별도 단계로 표시

2. 추가 이미지 업로드
   - 박스, 받침대, 가격표 사진을 추가로 받아 정확도 개선

3. 상품 페이지 이미지 비교
   - 검색 결과의 상품 이미지와 업로드 이미지를 비교

4. 평가셋 확장
   - 20장 이상으로 늘리고 박스 있음/없음, 반사, 매장 진열 등 조건 분리

5. 가격 수집 검토
   - AmiAmi, Mandarake, Suruga-ya 정책 확인 후 실제 가격 파싱 여부 결정
