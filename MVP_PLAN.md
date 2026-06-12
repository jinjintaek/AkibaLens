# AkibaLens MVP Plan

## Phase 0. Scope Definition

Goal: Define the smallest useful MVP that can be shipped within 2 to 4 weeks.

1. Limit MVP input to one uploaded figure image.
2. Treat AI output as product candidates and search keywords, not a guaranteed final identification.
3. Start marketplace search with 1 to 2 shops, then expand to 3 shops.
4. Exclude login, payment, wishlist, and price tracking from MVP.
5. Show only the essential result fields:
   - Character
   - Series
   - Manufacturer
   - Product line
   - Estimated product name
   - Japanese and English search keywords
   - Marketplace search results
   - Lowest price and price range

## Phase 1. Project Setup

Goal: Create the frontend and backend project skeleton.

1. Create a Next.js project.
2. Create a FastAPI project.
3. Organize the initial folder structure.
4. Configure environment variables:
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`
   - API base URL
   - Database URL
5. Verify local development startup.
6. Add local run instructions to `README.md`.

Initial structure:

```text
AkibaLens/
  frontend/
  backend/
  README.md
  MVP_PLAN.md
```

## Phase 2. Image Upload UI

Goal: Let users upload and preview a figure image.

1. Build the upload page.
2. Support file selection or drag and drop.
3. Show an uploaded image preview.
4. Add an analyze button.
5. Display loading state.
6. Display error state.

Use mock data first so the frontend flow can be completed before connecting the AI API.

## Phase 3. Vision API Integration

Goal: Analyze the uploaded image with a Vision API.

1. Add a FastAPI `/api/analyze` endpoint.
2. Handle image file upload.
3. Call OpenAI Vision API or Gemini Vision API.
4. Parse the response into structured JSON.
5. Display the analysis result in the frontend.

Example response:

```json
{
  "character": "Gojo Satoru",
  "series": "Jujutsu Kaisen",
  "manufacturer": "Good Smile Company",
  "product_line": "POP UP PARADE",
  "estimated_product_name": "POP UP PARADE Gojo Satoru",
  "keywords": {
    "en": ["Gojo Satoru figure", "POP UP PARADE Gojo"],
    "ja": ["五条悟 フィギュア", "POP UP PARADE 五条悟"]
  },
  "confidence": "medium"
}
```

## Phase 4. Marketplace Search

Goal: Search Japanese marketplaces using generated keywords.

Initial marketplace order:

1. AmiAmi
2. Mandarake
3. Suruga-ya

Normalize every result into a common schema:

```json
{
  "shop": "AmiAmi",
  "title": "POP UP PARADE Gojo Satoru",
  "price_jpy": 4980,
  "condition": "New",
  "in_stock": true,
  "url": "https://..."
}
```

If official APIs are unavailable, start with server-side HTML parsing or generated search URLs. Check site policy and reliability before relying on scraping.

## Phase 5. Price Comparison UI

Goal: Help users quickly decide whether the shop price is reasonable.

1. Display marketplace results by shop.
2. Sort results by price.
3. Highlight the lowest price.
4. Calculate lowest, average, and highest price.
5. Display product condition.
6. Provide original product links.
7. Show AI identification and search results on the same page.

Suggested result layout:

```text
[Uploaded Image]

[AI Identification]
Character / Series / Manufacturer / Product Candidate / Search Keywords

[Price Summary]
Lowest Price / Average Price / Price Range

[Marketplace Results]
AmiAmi
Mandarake
Suruga-ya
```

## Phase 6. Database Storage

Goal: Store analysis history and marketplace results.

Minimum PostgreSQL tables:

```text
analysis_requests
- id
- image_url or image_path
- created_at
- status

figure_identifications
- id
- request_id
- character
- series
- manufacturer
- product_line
- estimated_product_name
- confidence
- raw_ai_response

marketplace_results
- id
- request_id
- shop
- title
- price_jpy
- condition
- in_stock
- url
- scraped_at
```

For MVP, request-level history is enough. User accounts are not required.

## Phase 7. Deployment

Goal: Deploy a usable MVP.

1. Deploy frontend to Vercel.
2. Deploy backend to Railway or Render.
3. Use Railway PostgreSQL or Supabase for the database.
4. Register production environment variables.
5. Configure CORS.
6. Decide upload file handling:
   - MVP: temporary file handling
   - Later: S3, R2, or another object storage service
7. Test with 10 to 20 real figure images.

## Phase 8. Quality Improvements

Goal: Raise the project to portfolio quality.

1. Handle failure cases:
   - AI identification failure
   - No marketplace results
   - Price parsing failure
2. Improve the AI prompt.
3. Improve search keyword generation.
4. Show confidence and uncertainty clearly.
5. Add demo flow, architecture, limitations, and screenshots to `README.md`.
6. Add focused tests.

## Recommended Implementation Order

1. Create `frontend/` and `backend/`.
2. Build upload UI with mock results.
3. Implement FastAPI `/api/analyze`.
4. Connect the Vision API.
5. Generate search keywords.
6. Implement one marketplace search first, preferably AmiAmi or Mandarake.
7. Build the price comparison UI.
8. Add the remaining marketplaces.
9. Store results in PostgreSQL.
10. Deploy the MVP.

The first concrete milestone is: upload one image, receive an AI-generated product candidate, and display it cleanly in the UI. Marketplace search and persistence should be added after that flow works end to end.
