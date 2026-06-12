# AkibaLens Sample Evaluation

평가일: 2026-06-12

이 문서는 AkibaLens MVP의 실제 이미지 샘플 5장 테스트 결과를 정리한다.

현재 평가는 정량 벤치마크라기보다, 포트폴리오 MVP 단계에서 end-to-end 기능이 실제 이미지에 대해 어느 정도 동작하는지 확인하기 위한 1차 샘플 평가이다.

## 평가 환경

- 입력 이미지: `sample/` 폴더 내 실제 피규어 이미지 5장
- 분석 흐름:
  1. OpenAI Vision으로 피규어 식별 및 검색 단서 추출
  2. OpenAI Web Search로 상품 후보 페이지 검색
  3. 결과를 구조화된 JSON으로 저장
- 원본 결과 파일:
  - `docs/sample-evaluation-results.json`

현재 설정:

- `SEARCH_PROVIDER=openai`
- `OPENAI_IDENTIFICATION_WEB_SEARCH=false`
- `SEARCH_RESULT_LIMIT=3`

즉, 식별 단계에서는 Vision만 사용하고, 상품 후보 검색 단계에서 OpenAI Web Search를 사용한다.

## 요약 결과

| File | Expected | Character | Series | Product / Line Hint | Retrieval Result | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `reze_nendoroid.png` | Reze / Chainsaw Man / Nendoroid | Reze | Chainsaw Man | Nendoroid Reze | Good Smile official page found | Success |
| `tanjiro_ichibankuji_a.png` | Tanjiro / Demon Slayer / Ichiban Kuji | Kamado Tanjiro | Demon Slayer | Ichiban Kuji candidate | Suruga-ya Ichiban Kuji candidates found | Partial Success |
| `luffy_ichibankuji_b.png` | Luffy / One Piece / Ichiban Kuji | Monkey D. Luffy | ONE PIECE | Ichiban Kuji Gear 5 candidate | Suruga-ya Ichiban Kuji candidates found | Partial Success |
| `bakugo_grandista.png` | Bakugo / My Hero Academia / Grandista | Katsuki Bakugo | My Hero Academia | Banpresto, Grandista uncertain | Suruga-ya Banpresto candidates found, not exact Grandista | Partial Success |
| `gojo_luminasta.png` | Gojo / Jujutsu Kaisen / Luminasta | Satoru Gojo | Jujutsu Kaisen | Luminasta candidate | Suruga-ya Luminasta candidates found | Success |

## Scorecard

| Metric | Result | Notes |
| --- | ---: | --- |
| Character identification | 5 / 5 | 모든 샘플에서 캐릭터는 맞췄다. |
| Series identification | 5 / 5 | 모든 샘플에서 작품명도 맞췄다. |
| Product line / lineup hint | 4 / 5 | Nendoroid, Ichiban Kuji, Luminasta는 잡았으나 Bakugo의 Grandista는 확정 실패. |
| Useful retrieval candidates | 5 / 5 | 모든 샘플에서 확인 가능한 후보 URL을 반환했다. |
| Exact product page confidence | 2 / 5 | Reze, Gojo는 강함. 나머지는 후보군 수준. |

## Case Notes

### 1. Reze Nendoroid

결과가 가장 좋았다.

- 캐릭터: `Reze`
- 작품: `Chainsaw Man`
- 추정 상품명: `Nendoroid Reze (Chainsaw Man)`
- 검색 결과:
  - Good Smile Company 공식 영문 페이지
  - Good Smile Company 공식 일본어 페이지
  - Suruga-ya 상품 페이지

평가:

- 박스 없는 넨도로이드 이미지임에도 캐릭터, 작품, 라인업을 모두 잘 잡았다.
- 흰 꽃 파츠, 보라색 머리, 초록 눈, 흰 민소매, 검은 리본이라는 시각 단서가 검색 결과와 잘 연결됐다.

### 2. Tanjiro Ichiban Kuji

캐릭터와 작품은 정확했다.

- 캐릭터: `Kamado Tanjiro`
- 작품: `Demon Slayer: Kimetsu no Yaiba`
- 추정 상품: Ichiban Kuji Tanjiro figure candidate
- 검색 결과:
  - Suruga-ya Ichiban Kuji Tanjiro 후보 여러 개

평가:

- `Ichiban Kuji` 가능성은 잡았지만 정확한 몇 탄/몇 상인지까지는 확정하지 못했다.
- 파일명에 포함된 `ichibankuji` 힌트가 추론에 영향을 준 것으로 보인다.
- 실제 운영에서는 파일명 힌트 없이도 식별되도록 개선이 필요하다.

### 3. Luffy Ichiban Kuji

캐릭터와 작품은 정확했다.

- 캐릭터: `Monkey D. Luffy`
- 작품: `ONE PIECE`
- 추정 상품: Gear 5 / Nika Ichiban Kuji candidate
- 검색 결과:
  - Suruga-ya Ichiban Kuji Gear 5 Luffy 후보
  - 유사한 KING OF ARTIST 후보도 함께 반환

평가:

- Gear 5 / Nika 시각 단서는 잘 잡았다.
- 다만 expected filename은 `ichibankuji_b`였으나 검색 후보는 A상 후보가 강하게 나왔다.
- 이 케이스는 정확한 상 구분까지 하려면 박스/받침대/정면 상품 이미지 매칭이 필요하다.

### 4. Bakugo Grandista

캐릭터와 작품은 정확했다.

- 캐릭터: `Katsuki Bakugo`
- 작품: `My Hero Academia`
- 제조사: `Banpresto`
- 추정 상품: Banpresto Bakugo figure
- 검색 결과:
  - Suruga-ya Banpresto Bakugo 후보
  - 7TH SEASON FIGURE, KING OF ARTIST 후보

평가:

- 캐릭터, 작품, Banpresto까지는 강하게 맞췄다.
- 하지만 `Grandista` 라인업은 확정하지 못했다.
- 이 케이스는 현재 MVP의 한계를 잘 보여준다. Vision이 캐릭터는 맞춰도 prize figure 세부 라인업은 매우 비슷한 상품들이 많아 상품 이미지/박스/공식 페이지 비교가 필요하다.

### 5. Gojo Luminasta

좋은 결과가 나왔다.

- 캐릭터: `Satoru Gojo`
- 작품: `Jujutsu Kaisen`
- 추정 상품: `Satoru Gojo Luminasta`
- 검색 결과:
  - Suruga-ya Luminasta Gojo candidates

평가:

- 캐릭터, 작품, Luminasta 검색 단서를 모두 잘 잡았다.
- 정확히 `무라사키` 버전인지 `아오` 버전인지는 후보로 나뉘었다.
- 최종 확정에는 세부 포즈/이펙트/받침대 비교 UI가 필요하다.

## 주요 인사이트

### 0. 파일명 힌트 제거 평가가 추가로 필요하다

초기 평가에서는 일부 파일명에 `nendoroid`, `ichibankuji`, `grandista`, `luminasta` 같은 정답 힌트가 포함되어 있었다.

이후 파일명을 `sample_01.png` 형식으로 바꿔 재평가한 결과, 라인업 추정 성능이 크게 낮아졌고 Reze 케이스는 캐릭터/작품 식별도 실패했다.

따라서 이 문서의 초기 결과는 낙관적으로 해석해야 하며, 더 공정한 결과는 다음 문서를 함께 참고한다.

- `docs/evaluation-no-filename-hints.md`
- `docs/sample-evaluation-results-no-filename-hints.json`

### 1. 캐릭터/작품 식별은 MVP 수준에서 충분히 유효하다

5개 샘플 모두 캐릭터와 작품명은 맞췄다. 포트폴리오 MVP의 핵심 가치인 “검색 자체를 시작할 수 있게 해주는 것”은 달성 가능성이 높다.

### 2. 정확한 상품명과 라인업은 별도 후보 검증이 필요하다

Nendoroid, Luminasta처럼 시각적으로 명확하거나 검색 결과가 강한 경우는 잘 맞는다. 반면 Banpresto prize figure처럼 유사 라인업이 많은 경우에는 Grandista, KING OF ARTIST, THE AMAZING HEROES, 7TH SEASON FIGURE 등이 혼동될 수 있다.

### 3. Web Search는 유용하지만 reverse image search는 아니다

OpenAI Web Search는 이미지 자체를 검색하는 것이 아니라 Vision이 만든 텍스트 단서를 바탕으로 웹 검색을 수행한다. 따라서 첫 Vision 단서가 부정확하면 검색 결과도 함께 흔들릴 수 있다.

### 4. 현재 UI는 “정답 확정”보다 “후보 탐색”에 적합하다

현재 설계처럼 confidence, unknown fields, retrieved candidates를 함께 보여주는 방식이 맞다. 사용자가 상품 후보를 빠르게 좁힐 수 있게 도와주는 UX가 MVP의 핵심이다.

## 현재 한계

- 실제 가격 자동 파싱은 아직 구현하지 않았다.
- 가격 비교는 MVP용 preview/mock 값이다.
- 상품 후보 검색은 검색 API 결과에 의존한다.
- 정확한 라인업 구분에는 추가 reranking이 필요하다.
- 파일명에 포함된 단서가 분석에 영향을 줄 수 있다.
- 응답 시간이 긴 편이라 staged UI가 필요하다.

## 다음 개선 제안

우선순위 순서:

1. **Evaluation set 확장**
   - 최소 20장 정도로 테스트셋을 늘린다.
   - 박스 있음/없음, 정면/측면, 진열장 반사, 가격표 포함 여부를 나눈다.

2. **Candidate reranking**
   - Vision 결과와 retrieved candidates를 다시 비교하여 top 1-3 후보를 점수화한다.
   - 캐릭터 일치, 시리즈 일치, 라인업 일치, 시각 단서 일치 기준을 분리한다.

3. **Staged UI**
   - 먼저 캐릭터/작품 식별 결과를 보여준다.
   - 상품 후보 검색과 가격 비교는 별도 로딩 단계로 처리한다.

4. **Filename leakage 방지**
   - 운영/평가에서는 파일명을 모델에 전달하지 않거나, 랜덤 파일명으로 변환한다.
   - 현재 일부 샘플은 `ichibankuji`, `luminasta`, `grandista` 같은 label이 파일명에 포함되어 있어 평가가 낙관적으로 보일 수 있다.

5. **가격 수집 방식 검토**
   - AmiAmi, Mandarake, Suruga-ya 페이지 구조와 robots/policy를 확인한다.
   - 실제 가격 파싱이 어렵다면 검색 링크 + 사용자 확인 UX를 MVP 범위로 유지한다.

## 결론

현재 AkibaLens는 로컬 데모 MVP 기준으로 핵심 흐름을 갖췄다.

- 이미지 업로드 가능
- 캐릭터/작품 식별 가능
- 상품 후보 검색 가능
- 쇼핑몰 검색 링크 생성 가능
- 가격 비교 preview 가능

샘플 5장 평가 결과, 캐릭터와 작품 식별은 5/5로 성공했다. 다만 정확한 상품명/라인업 확정은 아직 후보 검증 단계이며, 특히 prize figure 계열에서는 라인업 혼동이 발생한다.

따라서 다음 개발 목표는 새로운 기능 추가보다, 현재 결과를 더 신뢰할 수 있게 만드는 candidate reranking과 evaluation workflow 정비가 적절하다.
