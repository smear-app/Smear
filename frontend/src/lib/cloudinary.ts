const MAX_IMAGE_DIMENSION = 2000
const JPEG_QUALITY = 0.78

function getUploadErrorMessage(prefix: string, status: number, statusText: string, errorDetail: string) {
  return `${prefix} (status ${status}${statusText ? ` ${statusText}` : ''})${errorDetail}`
}

function readImageDimensions(file: File): Promise<{ width: number; height: number; image: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: image.naturalWidth, height: image.naturalHeight, image })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Selected image could not be read for compression'))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Image compression failed before upload'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  const { width, height, image } = await readImageDimensions(file)
  const largestDimension = Math.max(width, height)
  const scale = largestDimension > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestDimension : 1
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Image compression is unavailable in this browser')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const shouldConvertToJpeg = file.type !== 'image/png'
  const outputType = shouldConvertToJpeg ? 'image/jpeg' : 'image/png'
  const blob = await canvasToBlob(canvas, outputType, shouldConvertToJpeg ? JPEG_QUALITY : undefined)

  if (blob.size >= file.size && scale === 1) {
    return file
  }

  const nextName = shouldConvertToJpeg
    ? file.name.replace(/\.[^.]+$/, '') || 'upload'
    : file.name

  return new File(
    [blob],
    shouldConvertToJpeg ? `${nextName}.jpg` : nextName,
    { type: outputType, lastModified: file.lastModified },
  )
}

export async function uploadToCloudinary(file: File, folder = 'smear/climbs'): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    throw new Error(
      'Environment variable VITE_CLOUDINARY_CLOUD_NAME is missing. It must be set for Cloudinary uploads to work.'
    )
  }

  if (!uploadPreset) {
    throw new Error(
      'Environment variable VITE_CLOUDINARY_UPLOAD_PRESET is missing. It must be set for Cloudinary uploads to work.'
    )
  }

  const preparedFile = await compressImageForUpload(file)
  const formData = new FormData()
  formData.append('file', preparedFile)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    let errorDetail = ''
    try {
      const errorBody = await res.json()
      const cloudinaryMessage =
        (errorBody && errorBody.error && errorBody.error.message) ||
        (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody))
      if (cloudinaryMessage) {
        errorDetail = `: ${cloudinaryMessage}`
      }
    } catch {
      // Ignore JSON parse errors and fall back to status-only message
    }

    throw new Error(getUploadErrorMessage('Photo upload failed', res.status, res.statusText, errorDetail))
  }

  const data = await res.json()
  return data.secure_url as string
}
