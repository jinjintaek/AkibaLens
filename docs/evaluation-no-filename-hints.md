# AkibaLens Sample Evaluation - No Filename Hints

평가일: 2026-06-12

이 문서는 샘플 이미지 파일명을 `sample_01.png` 형식으로 변경한 뒤 다시 실행한 평가 결과를 정리한다.

목적은 파일명에 포함된 `nendoroid`, `ichibankuji`, `grandista`, `luminasta` 같은 정답 힌트가 모델 결과에 영향을 주는지 확인하는 것이다.

## 평가 환경

- 입력 이미지: `sample/sample_01.png` ~ `sample/sample_05.png`
- 파일명 힌트: 제거됨
- 분석 흐름:
  1. OpenAI Vision으로 피규어 식별 및 검색 단서 추출
  2. OpenAI Web Search로 상품 후보 페이지 검색
  3. 결과를 구조화된 JSON으로 저장
- 원본 결과 파일:
  - `docs/sample-evaluation-results-no-filename-hints.json`

현재 설정:

- `SEARCH_PROVIDER=openai`
- `OPENAI_IDENTIFICATION_WEB_SEARCH=false`
- `SEARCH_RESULT_LIMIT=3`

## 파일 매핑

| Current File | Expected Character | Expected Series | Expected Product Hint |
| --- | --- | --- | --- |
| `sample_01.png` | Katsuki Bakugo | My Hero Academia | Grandista |
| `sample_02.png` | Satoru Gojo | Jujutsu Kaisen | Luminasta |
| `sample_03.png` | Monkey D. Luffy | One Piece | Ichiban Kuji |
| `sample_04.png` | Reze | Chainsaw Man | Nendoroid |
| `sample_05.png` | Tanjiro Kamado | Demon Slayer | Ichiban Kuji |

## 요약 결과

| File | Character Result | Series Result | Product / Line Result | Retrieval Result | Verdict |
| --- | --- | --- | --- | --- | --- |
| `sample_01.png` | Katsuki Bakugo correct | My Hero Academia correct | Banpresto correct, Grandista missed | Suruga-ya Banpresto candidates | Partial Success |
| `sample_02.png` | Satoru Gojo correct | Jujutsu Kaisen correct | Luminasta missed | POP UP PARADE / figma / action figure candidates | Partial Success |
| `sample_03.png` | Monkey D. Luffy correct | ONE PIECE correct | Ichiban Kuji missed | Smoke/effect Luffy candidates | Partial Success |
| `sample_04.png` | Incorrect: Mizore Yoroizuka | Incorrect: Sound! Euphonium | Nendoroid-style but wrong subject | Generic or wrong Nendoroid candidates | Failure |
| `sample_05.png` | Kamado Tanjiro correct | Demon Slayer correct | Ichiban Kuji missed | General Tanjiro figure candidates | Partial Success |

## Scorecard

| Metric | With Filename Hints | No Filename Hints | Change |
| --- | ---: | ---: | --- |
| Character identification | 5 / 5 | 4 / 5 | Reze failed without filename hint |
| Series identification | 5 / 5 | 4 / 5 | Reze series also failed |
| Product line / lineup hint | 4 / 5 | 0-1 / 5 | Filename hints had large impact |
| Useful retrieval candidates | 5 / 5 | 3 / 5 | Retrieval degraded when Vision clue was weak |
| Exact product page confidence | 2 / 5 | 0 / 5 | Exact product matching remains unsolved |

## Case Notes

### 1. `sample_01.png` - Bakugo

성공한 부분:

- 캐릭터: `Katsuki Bakugo`
- 작품: `My Hero Academia`
- 제조사 단서: `Banpresto`

실패한 부분:

- expected product hint인 `Grandista`는 잡지 못했다.
- 검색 후보는 Combination Battle, THE AMAZING HEROES-DX, KING OF ARTIST 등으로 분산됐다.

해석:

- 캐릭터/작품/제조사까지는 이미지에서 충분히 잡을 수 있다.
- 하지만 Banpresto 계열은 유사 라인업이 많아 세부 라인업을 이미지 한 장으로 확정하기 어렵다.

### 2. `sample_02.png` - Gojo

성공한 부분:

- 캐릭터: `Satoru Gojo`
- 작품: `Jujutsu Kaisen`

실패한 부분:

- expected product hint인 `Luminasta`는 나오지 않았다.
- 검색 후보가 POP UP PARADE, figma, threezero action figure 등으로 퍼졌다.

해석:

- 파일명에 `luminasta`가 있을 때는 Luminasta 후보가 강하게 나왔지만, 힌트를 제거하자 일반 Gojo 피규어 후보로 넓어졌다.
- 이 케이스는 filename leakage가 상품 라인업 추정에 큰 영향을 줬음을 보여준다.

### 3. `sample_03.png` - Luffy

성공한 부분:

- 캐릭터: `Monkey D. Luffy`
- 작품: `ONE PIECE`

실패한 부분:

- expected product hint인 `Ichiban Kuji`는 잡지 못했다.
- Gear 4 / smoke effect / general Luffy figure 후보로 흘렀다.

해석:

- 시각 단서인 루피, 연기/구름 이펙트, 전투 포즈는 잡았다.
- 하지만 Ichiban Kuji인지, P.O.P인지, Figuarts ZERO인지, prize figure인지 구분하는 것은 이미지 단독으로 어렵다.

### 4. `sample_04.png` - Reze

실패 케이스다.

예상:

- Reze
- Chainsaw Man
- Nendoroid

실제:

- `Mizore Yoroizuka`
- `Sound! Euphonium`
- Nendoroid-style figure

해석:

- 파일명 힌트가 있었던 이전 평가에서는 `Reze / Chainsaw Man / Nendoroid`를 맞췄다.
- 파일명 힌트를 제거하자 비슷한 시각 특징을 가진 다른 캐릭터로 오식별했다.
- 특히 “보라색/짙은 머리, 초록 눈, 조용한 표정, 꽃 소품” 같은 단서가 여러 캐릭터와 겹칠 수 있다.
- 이 케이스는 현재 MVP가 정확한 캐릭터 식별에서 여전히 불안정할 수 있음을 보여준다.

### 5. `sample_05.png` - Tanjiro

성공한 부분:

- 캐릭터: `Kamado Tanjiro`
- 작품: `Demon Slayer`

실패한 부분:

- expected product hint인 `Ichiban Kuji`는 나오지 않았다.
- VIBRATION STARS, FIGURIZMα, Grandista 같은 일반 prize figure 후보가 제안됐다.

해석:

- 캐릭터 식별은 강하다.
- 하지만 Ichiban Kuji 같은 판매/경품 라인업은 박스, 받침대, 상품 페이지 이미지 비교 없이는 확정이 어렵다.

## 핵심 인사이트

### 1. 파일명 힌트는 실제로 결과에 영향을 줬다

이전 평가에서는 파일명에 상품 라인업 힌트가 포함되어 있었다.

예:

- `reze_nendoroid.png`
- `gojo_luminasta.png`
- `bakugo_grandista.png`
- `luffy_ichibankuji_b.png`

파일명을 제거한 뒤 라인업 추정 성능이 크게 떨어졌다. 따라서 이전 평가 결과는 낙관적으로 해석해야 한다.

### 2. 캐릭터/작품 식별은 여전히 쓸 만하다

파일명 힌트를 제거해도 5장 중 4장에서 캐릭터와 작품을 맞췄다.

즉, AkibaLens의 기본 가치인 “검색 시작점 제공”은 여전히 유효하다.

### 3. 정확한 상품명/라인업 식별은 별도 문제다

Grandista, Luminasta, Ichiban Kuji 같은 라인업은 단순 캐릭터 식별보다 훨씬 어렵다.

필요한 추가 정보:

- 박스 사진
- 받침대/로고/각인
- 전체 포즈
- 상품 페이지 이미지와의 비교
- 여러 후보 페이지 reranking

### 4. 현재 OpenAI Web Search는 reverse image search가 아니다

OpenAI Web Search는 Vision 결과로 생성된 텍스트 쿼리를 기반으로 검색한다. 이미지 자체를 웹 이미지 DB와 직접 비교하는 구조가 아니다.

따라서 Vision이 Reze를 Mizore로 잘못 잡으면 검색도 Mizore 방향으로 진행된다.

## 결론

파일명 힌트 제거 후에도 AkibaLens는 캐릭터/작품 식별에서 4/5 성능을 보였다. 이는 MVP의 기본 방향이 유효하다는 신호다.

하지만 정확한 상품명과 라인업 식별은 아직 불안정하다. 특히 박스 없는 피규어 사진에서는 비슷한 헤어스타일, 복장, 포즈를 가진 캐릭터와 상품이 많아 오식별 가능성이 있다.

따라서 다음 개발 우선순위는 다음과 같다.

1. Candidate reranking
2. 상품 후보 페이지 이미지/제목/스니펫 기반 비교
3. 어려운 케이스에서 추가 질문 또는 “박스/받침대 사진 추가 업로드” UX
4. 정답 확정이 아니라 후보 탐색 중심 UI 강화

이 평가는 AkibaLens 포트폴리오에서 중요한 의미를 가진다. 단순히 “잘 맞았다”가 아니라, AI 평가에서 label leakage를 발견하고 제거했으며, 그 결과를 바탕으로 다음 개선 방향을 도출했기 때문이다.
