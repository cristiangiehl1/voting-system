import { v2 as cloudinary } from "cloudinary"

export type UploadResult = {
  publicId: string
  url: string
  secureUrl: string
}

export type CloudinaryConfig = {
  cloudName: string
  apiKey: string
  apiSecret: string
}

function loadConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary configuracao ausente. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
    )
  }

  return { cloudName, apiKey, apiSecret }
}

export class CloudinaryService {
  private cloudinary: typeof cloudinary

  constructor(config?: CloudinaryConfig) {
    const resolved = config ?? loadConfig()
    this.cloudinary = cloudinary
    this.cloudinary.config({
      cloud_name: resolved.cloudName,
      api_key: resolved.apiKey,
      api_secret: resolved.apiSecret,
    })
  }

  async uploadImage(
    file: Buffer,
    options?: { folder?: string; publicId?: string; invalidate?: boolean }
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: options?.folder ?? "voting-system",
          public_id: options?.publicId,
          resource_type: "image",
          invalidate: options?.invalidate,
          overwrite: options?.invalidate,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"))
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
          })
        }
      )
      uploadStream.end(file)
    })
  }

  async uploadFromUrl(
    url: string,
    options?: { folder?: string; publicId?: string }
  ): Promise<UploadResult> {
    const result = await this.cloudinary.uploader.upload(url, {
      folder: options?.folder ?? "voting-system",
      public_id: options?.publicId,
      resource_type: "image",
    })

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId)
  }

  getUrl(
    publicId: string,
    options?: { width?: number; height?: number }
  ): string {
    return this.cloudinary.url(publicId, {
      secure: true,
      width: options?.width,
      height: options?.height,
      crop: options?.width || options?.height ? "fill" : undefined,
    })
  }
}

export const cloudinaryService = new CloudinaryService()
