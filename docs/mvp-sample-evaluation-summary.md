# AkibaLens MVP Sample Evaluation Summary

작성일: 2026-06-12

이 문서는 AkibaLens MVP의 샘플 이미지 5장 평가 결과를 포트폴리오 설명용으로 요약한 문서이다.

기존 상세 문서:

- `docs/evaluation.md`: 파일명에 상품 힌트가 포함된 초기 평가
- `docs/evaluation-no-filename-hints.md`: 파일명 힌트를 제거한 재평가
- `docs/sample-evaluation-results.json`: 초기 평가 원본 JSON
- `docs/sample-evaluation-results-no-filename-hints.json`: 힌트 제거 평가 원본 JSON

## 평가 목적

AkibaLens의 MVP 목표는 피규어 사진만으로 사용자가 검색을 시작할 수 있는 정보를 제공하는 것이다.

따라서 이번 평가는 다음 질문에 답하기 위해 진행했다.

1. 이미지 한 장만으로 캐릭터와 작품을 식별할 수 있는가?
2. 제조사, 라인업, 상품명까지 추정할 수 있는가?
3. Vision 결과를 이용해 일본 쇼핑몰 검색 후보를 만들 수 있는가?
4. 현재 MVP가 실제 사용자에게 어느 정도 유용한가?

## 평가 방식

### 입력 데이터

`sample/` 폴더의 이미지 5장을 사용했다.

| Sample | Expected Character | Expected Series | Expected Product Hint |
| --- | --- | --- | --- |
| `sample_01.png` | Katsuki Bakugo | My Hero Academia | Grandista |
| `sample_02.png` | Satoru Gojo | Jujutsu Kaisen | Luminasta |
| `sample_03.png` | Monkey D. Luffy | One Piece | Ichiban Kuji |
| `sample_04.png` | Reze | Chainsaw Man | Nendoroid |
| `sample_05.png` | Tanjiro Kamado | Demon Slayer | Ichiban Kuji |

### 실행 흐름

```text
Sample Image
-> OpenAI Vision Identification
-> Search Query Generation
-> OpenAI Web Search Product Retrieval
-> Candidate Reranking
-> Marketplace Links / Price Preview UI
```

### 중요한 평가 조건

초기 평가에서는 파일명에 `nendoroid`, `luminasta`, `grandista`, `ichibankuji` 같은 정답 힌트가 포함되어 있었다.

이후 더 공정한 평가를 위해 파일명을 `sample_01.png` 형태로 변경하고 재평가했다. 이 문서의 핵심 결론은 파일명 힌트를 제거한 재평가를 기준으로 한다.

## 최종 요약 결과

| Metric | Result | Interpretation |
| --- | ---: | --- |
| Character identification | 4 / 5 | 캐릭터/작품 검색 시작점 제공에는 유효함 |
| Series identification | 4 / 5 | Reze 케이스에서 작품까지 함께 오식별 |
| Product line / lineup hint | 0-1 / 5 | 이미지 한 장만으로 라인업 확정은 아직 어려움 |
| Useful retrieval candidates | 3 / 5 | Vision 단서가 맞으면 검색 후보도 유용함 |
| Exact product page confidence | 0 / 5 | 정확한 상품 페이지 확정은 아직 미해결 |

## 샘플별 평가표

| Sample | Character | Series | Product / Line | Retrieval | Verdict |
| --- | --- | --- | --- | --- | --- |
| `sample_01.png` | Correct | Correct | Partial: Banpresto detected, Grandista missed | Partial: Banpresto/Bakugo candidates | Partial Success |
| `sample_02.png` | Correct | Correct | Failed: Luminasta missed | Partial: Gojo figure candidates, but broad | Partial Success |
| `sample_03.png` | Correct | Correct | Failed: Ichiban Kuji missed | Partial: Luffy smoke/effect candidates | Partial Success |
| `sample_04.png` | Failed: predicted Mizore Yoroizuka | Failed: predicted Sound! Euphonium | Failed: Nendoroid-style but wrong subject | Failed: wrong query direction | Failure |
| `sample_05.png` | Correct | Correct | Failed: Ichiban Kuji missed | Partial: general Tanjiro candidates | Partial Success |

## 케이스별 해석

### `sample_01.png` - Bakugo

캐릭터와 작품은 정확히 맞췄고, Banpresto 계열 피규어라는 단서도 잡았다.

다만 expected hint인 Grandista까지는 식별하지 못했다. Bakugo는 Banpresto 계열 내에서도 유사 라인업이 많기 때문에 단일 이미지로 Grandista, KING OF ARTIST, THE AMAZING HEROES 등을 구분하기 어렵다.

판정: 부분 성공

### `sample_02.png` - Gojo

Gojo와 Jujutsu Kaisen은 정확히 맞췄다.

하지만 Luminasta 라인업은 잡지 못했고, POP UP PARADE, figma, action figure 등 넓은 후보로 퍼졌다. 캐릭터 식별은 강하지만 라인업 확정에는 추가 단서가 필요하다.

판정: 부분 성공

### `sample_03.png` - Luffy

Luffy와 One Piece는 정확히 맞췄다.

연기/구름 이펙트, 전투 포즈 같은 시각 단서는 잘 잡았지만 Ichiban Kuji 여부는 확정하지 못했다. 이 케이스는 상품 이미지 비교나 박스/받침대 정보가 필요하다.

판정: 부분 성공

### `sample_04.png` - Reze

가장 중요한 실패 케이스다.

expected는 Reze / Chainsaw Man / Nendoroid였지만, 모델은 Mizore Yoroizuka / Sound! Euphonium으로 잘못 식별했다.

초기 파일명 힌트가 있었을 때는 Reze와 Nendoroid를 맞췄지만, 파일명 힌트를 제거하자 실패했다. 이는 label leakage가 실제로 평가 결과를 낙관적으로 만들 수 있음을 보여준다.

판정: 실패

### `sample_05.png` - Tanjiro

Tanjiro와 Demon Slayer는 정확히 맞췄다.

하지만 Ichiban Kuji 라인업은 놓쳤고, 일반 Tanjiro 피규어 후보로 넓게 검색되었다. 캐릭터 식별은 강하지만 정확한 쿠지 상품명 확정은 어렵다.

판정: 부분 성공

## 발견한 문제

### 1. 파일명 힌트가 평가 결과를 왜곡했다

초기 샘플 파일명에는 정답에 가까운 정보가 들어 있었다.

예:

- `reze_nendoroid`
- `gojo_luminasta`
- `bakugo_grandista`
- `luffy_ichibankuji`

파일명을 제거하자 라인업 식별 성능이 크게 떨어졌다. 따라서 포트폴리오에서는 초기 평가보다 힌트 제거 평가를 중심으로 설명하는 것이 더 정직하고 설득력 있다.

### 2. Vision 모델은 reverse image search가 아니다

현재 구조는 이미지를 웹 상품 이미지 DB와 직접 비교하지 않는다.

실제 동작은 다음에 가깝다.

```text
이미지 분석
-> 텍스트 단서 생성
-> 텍스트 검색
-> 검색 후보 정리
```

따라서 첫 Vision 단계에서 캐릭터를 잘못 추정하면 검색도 잘못된 방향으로 진행된다.

### 3. 캐릭터 식별과 상품 식별은 난이도가 다르다

캐릭터/작품 식별은 비교적 잘 된다.

하지만 정확한 상품명, 제조사, 라인업은 훨씬 어렵다. 특히 prize figure 계열은 같은 캐릭터의 유사 포즈, 유사 의상, 유사 베이스가 많아 혼동이 자주 발생한다.

### 4. 가격 비교는 아직 preview 단계다

현재 가격 비교 UI는 실제 쇼핑몰 가격을 자동 파싱한 결과가 아니다.

MVP에서는 검색 링크와 후보 페이지를 제공하고, 사용자가 직접 현재 재고와 가격을 확인하는 흐름으로 제한했다.

## 해결 방향

### 이미 반영한 개선

- 파일명 힌트를 제거한 재평가 수행
- Vision 결과를 정답 확정이 아니라 후보 탐색 단서로 사용
- OpenAI Web Search 기반 product retrieval 추가
- 검색 후보를 점수화하는 candidate reranking 1차 구현
- UI 문구를 사용자 친화적으로 정리
- 가격 비교를 preview로 명시하여 과도한 확정 표현 방지

### 다음 개선 우선순위

1. Staged UI
   - 1단계: 캐릭터/작품 결과 먼저 표시
   - 2단계: 상품 후보 검색 진행
   - 3단계: 가격 링크/가격 preview 표시

2. 데모용 평가셋 확장
   - 최소 10-20장으로 확장
   - 박스 있음/없음, 진열장 반사, 가격표 포함 여부를 분리

3. 추가 이미지 업로드 UX
   - 첫 이미지로 확신이 낮으면 박스, 받침대, 가격표 사진을 추가로 받는다.

4. 상품 후보 reranking 개선
   - 캐릭터 일치
   - 작품 일치
   - 라인업 키워드 일치
   - 포즈/복장/소품 일치
   - 쇼핑몰 신뢰도

5. 가격 수집 정책 검토
   - AmiAmi, Mandarake, Suruga-ya의 robots/policy와 HTML 구조 확인
   - 실제 파싱이 부담되면 MVP에서는 검색 링크 기반 UX 유지

## 포트폴리오 관점의 의미

이 평가는 단순히 “AI가 잘 맞췄다”를 보여주는 자료가 아니다.

오히려 다음 점에서 포트폴리오 가치가 있다.

1. 실제 문제에서 출발했다.
2. 빠르게 MVP를 구현했다.
3. 실제 샘플로 end-to-end 평가했다.
4. label leakage 문제를 발견하고 제거했다.
5. 캐릭터 식별과 상품 식별의 난이도 차이를 분석했다.
6. 현재 한계를 인정하고 다음 개선 방향을 설계했다.

즉, AkibaLens는 단순 API wrapper가 아니라, 실제 사용자 문제를 AI product workflow로 검증한 프로젝트라고 설명할 수 있다.

## 최종 결론

AkibaLens MVP는 “사진 한 장으로 검색 시작점을 만들어준다”는 핵심 가치는 달성했다.

파일명 힌트를 제거한 평가에서도 캐릭터/작품 식별은 5장 중 4장에서 성공했다. 이는 일본 여행객이나 피규어 입문자가 검색을 시작하는 데 충분히 의미 있는 수준이다.

다만 정확한 상품명, 제조사, 라인업, 실제 가격까지 자동 확정하는 것은 아직 MVP 범위를 넘는다. 이 부분은 candidate reranking, 추가 이미지 입력, 상품 페이지 이미지 비교, 가격 수집 정책 검토를 통해 점진적으로 개선해야 한다.

현재 단계의 가장 적절한 포지셔닝은 다음과 같다.

> AkibaLens is an AI-powered figure search assistant that turns a photo into useful product candidates, Japanese search queries, and marketplace links, while clearly showing uncertainty.
