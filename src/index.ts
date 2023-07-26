import { S3 } from "aws-sdk";
import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";

dotenvConfig(); // Load the environment variables from .env file

// Configure AWS SDK with your MinIO credentials from environment variables
const s3 = new S3({
  endpoint: process.env.MINIO_ENDPOINT,
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  s3ForcePathStyle: true, // Necessary for MinIO compatibility
});

// Initialize Supabase client with your credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseBucketName = process.env.SUPABASE_BUCKET_NAME!;

const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Function to upload file to Supabase Storage
async function uploadToSupabaseStorage(
  fileName: string,
  fileData: Uint8Array,
  contentType?: string
): Promise<void> {
  const { data, error } = await supabaseClient.storage
    .from(supabaseBucketName)
    .upload(fileName, fileData, {
      contentType: contentType ?? undefined,
      cacheControl: "public, max-age=31536000",
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
  }

  console.log("File uploaded successfully:", data);
}

async function downloadFileFromS3(filePath: string, newFilePath: string) {
  try {
    const fileData = await s3
      .getObject({
        Bucket: process.env.MINIO_BUCKET_NAME!,
        Key: filePath,
      })
      .promise();

    // Save the file to your local server
    const contentType = fileData.ContentType;

    uploadToSupabaseStorage(newFilePath, fileData.Body as Uint8Array, contentType);
  } catch (error) {
    console.error("Error:", error);
  }
}

const delay = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

// Download person photo
async function downloadPersonImageInBatches() {
  try {
    const batchSize = 10; // Number of files to download in each iteration

    // Start with an offset of 0
    let offset = 0;
    let hasMoreFiles = true;

    while (hasMoreFiles) {
      // Fetch a batch of records from the "films" table containing the file paths
      const { data, error } = await supabaseClient
        .from("people")
        .select("photo_path")
        .not("photo_path", "is", null)
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error("Supabase query error:", error);
        break;
      }

      if (data && data.length > 0) {
        // Iterate through each film record and download the corresponding file
        for (const person of data) {
          const photoPath = person.photo_path;
          const newPhotoPath = photoPath;
          await downloadFileFromS3(photoPath, photoPath);
        }

        // Update the offset to fetch the next batch of files
        offset += batchSize;
        await delay(3000);
      } else {
        // No more files to download
        hasMoreFiles = false;
        console.log("All files downloaded.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Start the download process in batches
downloadPersonImageInBatches();
