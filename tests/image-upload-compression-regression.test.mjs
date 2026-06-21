import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const imageUploader = fs.readFileSync(
  new URL('../src/components/ImageUploader.tsx', import.meta.url),
  'utf8'
);
const uploadHelper = fs.readFileSync(
  new URL('../src/lib/client-image-upload.ts', import.meta.url),
  'utf8'
);
const uploadRoute = fs.readFileSync(
  new URL('../src/app/api/upload/route.ts', import.meta.url),
  'utf8'
);

test('admin image uploads are compressed before being sent to OSS', () => {
  assert.match(
    uploadHelper,
    /MAX_IMAGE_UPLOAD_DIMENSION\s*=\s*1600/,
    'Expected uploads to be resized to a bounded long edge'
  );
  assert.match(
    uploadHelper,
    /IMAGE_UPLOAD_MIME_TYPE\s*=\s*'image\/webp'/,
    'Expected compressible uploads to be converted to WebP'
  );
  assert.match(
    uploadHelper,
    /async function compressImageForUpload\(file: File\)/,
    'Expected a dedicated compression step before upload'
  );
  assert.match(
    uploadHelper,
    /canvas\.toBlob/,
    'Expected browser canvas encoding to reduce image payload size'
  );
  assert.match(
    imageUploader,
    /uploadImageFile\(file\)/,
    'Expected the drop zone to delegate compression and upload to the shared helper'
  );
});

test('animated GIF uploads are preserved instead of being flattened by compression', () => {
  assert.match(
    uploadHelper,
    /if \(file\.type === 'image\/gif'\) \{\s*return file;\s*\}/,
    'Expected GIF files to bypass canvas compression'
  );
});

test('uploaded images are stored with long-lived browser cache headers', () => {
  assert.match(
    uploadRoute,
    /Cache-Control/,
    'Expected OSS uploads to include browser cache headers'
  );
  assert.match(
    uploadRoute,
    /public, max-age=31536000, immutable/,
    'Expected immutable one-year cache for content-addressed upload names'
  );
});
