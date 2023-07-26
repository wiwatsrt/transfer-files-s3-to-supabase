# Transfer files from s3 to Supabase

The TypeScript script facilitates file transfer between a MinIO server and Supabase Storage, 
using the AWS SDK for MinIO interaction and the @supabase/supabase-js and @supabase/storage 
packages for Supabase Storage.

The script operates in batches, downloading files from MinIO, 
saving them locally, and then uploading them to the specified Supabase Storage bucket.

## Installation

```bash
git clone https://github.com/wiwatsrt/transfer-files-s3-to-supabase.git
cd transfer-files-s3-to-supabase
pnpm install
pnpm start
