# Railway S3 Image Storage Design

## Summary

This change replaces the current filesystem or Railway Volume image storage flow with Railway Object Storage via its S3-compatible endpoint. Railway S3 becomes the only image source in all environments, including local development. All uploaded image files must be converted to WebP before storage, regardless of original format.

## Goals

- Use Railway Object Storage as the single backend for uploaded images.
- Keep the existing admin upload UX and `/api/upload` API contract unchanged.
- Enforce server-side image normalization so every uploaded image is stored as `.webp`.
- Store and serve full bucket-backed URLs instead of local `/uploads/...` paths.
- Remove filesystem and Volume-based upload behavior from the application and documentation.

## Non-Goals

- No client-direct upload flow in this change.
- No multi-provider storage abstraction for future backends.
- No migration job for historical local files beyond documenting that existing records may need manual replacement if they still point at `/uploads/...`.

## Environment Configuration

The application will use the following environment variables:

- `S3_ENDPOINT=https://t3.storageapi.dev`
- `S3_REGION=auto`
- `S3_BUCKET_NAME=arranged-pocket-inebj1wqp`
- `S3_ACCESS_KEY_ID=tid_mgKvwxtTNCPyjXOCbEcp_GSUQuJyVDxCcVlUaDHsybglNevwcZ`
- `S3_SECRET_ACCESS_KEY=<provided by operator in .env>`

The previous `UPLOAD_DIR` configuration is removed from runtime and documentation. If any required S3 variable is missing, the upload flow should fail fast with a clear server-side error instead of falling back to local disk.

## Architecture

### Storage Layer

`src/lib/storage.ts` will be rewritten from filesystem helpers to S3-backed helpers:

- `saveImageAsWebp(buffer, opts)` will:
  - Decode the upload with `sharp`
  - Auto-rotate using EXIF metadata when present
  - Resize down to the configured max width without enlargement
  - Convert the result to WebP
  - Upload the WebP buffer to Railway Object Storage
  - Return the final public URL, size, width, and height
- `deleteUpload(publicUrl)` will:
  - Accept only URLs that belong to the configured bucket base URL
  - Derive the object key from the URL
  - Delete the object from Railway Object Storage
  - Ignore missing-object delete failures

Object keys will preserve the current `subdir` pattern, such as `hero/<generated>.webp` and `properties/<generated>.webp`, so the app keeps logical grouping without changing the upload API.

### Upload API

`src/app/api/upload/route.ts` will keep its current request and response shape:

- Input remains multipart form data with one or more `files`
- Optional `subdir` query parameter remains supported
- Response continues to return an array of uploaded file results

The behavioral rule becomes explicit: every accepted image upload is converted to WebP before storage. Returned URLs always point to the Railway bucket object.

### Data Model Impact

No Prisma schema changes are required. Existing string URL fields already support storing absolute bucket URLs.

The app will start writing absolute S3-backed URLs into:

- `PropertyImage.url`
- `HeroSlide.imageUrl`

### Serving Behavior

The frontend and admin UI currently render stored URLs directly in `<img>` tags. Because absolute URLs are already supported by browsers, no rendering change is required for these paths as long as the bucket objects are publicly readable via their final URL format.

## Error Handling

- Missing S3 configuration: reject uploads with a server error and log the misconfiguration.
- Invalid or unsupported image payload: preserve current per-file failure tolerance and continue processing other files in the batch.
- S3 upload failure: log the failed file and continue other files in the request.
- S3 delete failure for missing objects: ignore.
- S3 delete failure for other reasons: log the error but do not block related record deletion paths unless the current API already treats it as fatal.

## Documentation Changes

`README.md` and `.env.example` will be updated to reflect:

- Railway Object Storage instead of Railway Volume
- Required S3 environment variables
- Railway S3 as the only image backend in both local and deployed environments
- Explicit statement that every upload image type is converted to WebP before storage

## Testing Strategy

Tests should cover:

- Upload helper converts JPEG/PNG input buffers into `.webp` object uploads
- Returned URL format is bucket-backed and includes the requested subdirectory
- Delete helper only attempts deletion for URLs owned by the configured bucket
- Upload route preserves response structure for successful and mixed-success batches

If the codebase does not have an existing test harness for API or storage helpers, add focused tests around the storage helper behavior first, then verify with a production build after implementation.

## Rollout Notes

- Existing database rows that still point to `/uploads/...` will not automatically become valid bucket URLs.
- New uploads after deployment will use Railway S3 immediately.
- If historical local assets exist, they require separate migration or manual re-upload outside this change.
