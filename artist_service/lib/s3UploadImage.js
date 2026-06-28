import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, "");

const encodeS3Key = (key) => key.split("/").map(encodeURIComponent).join("/");

const getS3Client = () => {
  const region = process.env.AWS_REGION || "us-east-1";

  const endpoint = process.env.S3_ENDPOINT;
  const forcePathStyle = String(process.env.S3_FORCE_PATH_STYLE || "").toLowerCase() === "true";

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  return new S3Client({
    region,
    ...(accessKeyId && secretAccessKey
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          },
        }
      : {}),
    ...(endpoint ? { endpoint } : {}),
    ...(endpoint ? { forcePathStyle } : {}),
  });
};

const getS3ObjectUrl = ({ bucketName, region, key }) => {
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (publicBaseUrl) {
    return `${normalizeBaseUrl(publicBaseUrl)}/${encodeS3Key(key)}`;
  }

  // Default AWS S3 virtual-hosted style URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${encodeS3Key(key)}`;
};

const parseBase64Image = (input) => {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new Error("profileImage must be a non-empty base64 string");
  }

  const trimmed = input.trim();

  // data:<mime>;base64,<payload>
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (dataUrlMatch) {
    const contentType = dataUrlMatch[1].toLowerCase();
    const base64Payload = dataUrlMatch[2];
    return { contentType, base64Payload };
  }

  // Raw base64 (no data URL). We'll infer content-type from magic bytes.
  return { contentType: null, base64Payload: trimmed };
};

const inferImageContentType = (buffer) => {
  // JPEG
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // GIF
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif";
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("ascii") === "GIF87a") return "image/gif";
  // WEBP (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

const extensionForContentType = (contentType) => {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
};

export const uploadArtistProfileImageBase64ToS3 = async ({ artistId, profileImageBase64 }) => {
  const bucketName = process.env.S3_ARTIST_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("S3_ARTIST_BUCKET_NAME is not set");
  }

  const region = process.env.AWS_REGION || "us-east-1";
  const maxBytes = Number(process.env.PROFILE_IMAGE_MAX_BYTES || 5 * 1024 * 1024);

  const { contentType: declaredContentType, base64Payload } = parseBase64Image(profileImageBase64);

  let buffer;
  try {
    buffer = Buffer.from(base64Payload, "base64");
  } catch {
    throw new Error("Invalid base64 encoding for profileImage");
  }

  if (!buffer || buffer.length === 0) {
    throw new Error("profileImage decoded to empty content");
  }

  if (buffer.length > maxBytes) {
    throw new Error(`profileImage exceeds max size (${maxBytes} bytes)`);
  }

  const inferred = inferImageContentType(buffer);
  const finalContentType = declaredContentType || inferred;
  if (!finalContentType) {
    throw new Error("Unable to determine image content-type; send a data URL like data:image/png;base64,...");
  }

  const allowed = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
  if (!allowed.has(finalContentType)) {
    throw new Error(`Unsupported image content-type: ${finalContentType}`);
  }

  const ext = extensionForContentType(finalContentType);
  if (!ext) {
    throw new Error(`Unsupported image content-type: ${finalContentType}`);
  }

  const key = `artists/${artistId}/profile-${randomUUID()}.${ext}`;

  const acl = process.env.S3_OBJECT_ACL;
  const s3Client = getS3Client();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: finalContentType,
      ...(acl ? { ACL: acl } : {}),
    }),
  );

  return {
    url: getS3ObjectUrl({ bucketName, region, key }),
    key,
    contentType: finalContentType,
    sizeBytes: buffer.length,
  };
};

export const deleteArtistProfileImageFromS3 = async ({ key }) => {
  const bucketName = process.env.S3_ARTIST_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("S3_ARTIST_BUCKET_NAME is not set");
  }

  if (!key) {
    return;
  }

  const s3Client = getS3Client();
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
};
