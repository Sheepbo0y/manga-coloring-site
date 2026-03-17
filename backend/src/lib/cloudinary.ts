import { v2 as cloudinary } from 'cloudinary';

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * 上传图片到 Cloudinary
 * @param filePath 本地文件路径
 * @param folder 存储文件夹
 * @returns 上传后的图片 URL
 */
export async function uploadImage(filePath: string, folder: string = 'manga-coloring'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary 上传失败:', error);
    throw new Error('图片上传失败');
  }
}

/**
 * 从 URL 上传图片到 Cloudinary
 * @param imageUrl 图片 URL
 * @param folder 存储文件夹
 * @returns 上传后的图片 URL
 */
export async function uploadImageFromUrl(imageUrl: string, folder: string = 'manga-coloring'): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary URL 上传失败:', error);
    throw new Error('图片上传失败');
  }
}

/**
 * 删除 Cloudinary 图片
 * @param publicId 图片 public_id
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary 删除失败:', error);
  }
}
