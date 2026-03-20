export async function uploadToCloudinary(file: File): Promise<string> {
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

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'smear/climbs')

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

    throw new Error(
      `Photo upload failed (status ${res.status}${res.statusText ? ` ${res.statusText}` : ''})${errorDetail}`
    )
  }

  const data = await res.json()
  return data.secure_url as string
}
