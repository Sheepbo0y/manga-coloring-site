import axios from 'axios';

const API_KEY = process.env.SEEDREAM_API_KEY || process.env.MODELVERSE_API_KEY || '';
const BASE_URL = 'https://api.modelverse.cn/v1';

export interface SeedreamResponse {
  url: string;
}

/**
 * 使用豆包 Seedream 4.5 API 进行图片上色
 *
 * @param imageUrl - 原图 URL（黑白漫画）
 * @param prompt - 可选的提示词，用于指导上色风格
 * @returns 彩色图片的 URL
 */
export async function colorizeImage(
  imageUrl: string,
  prompt?: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error('MODELVERSE_API_KEY 未配置');
  }

  // 构建上色提示词
  const defaultPrompt = '专业漫画上色，高质量，鲜艳色彩，动漫风格，细腻上色，无水印';
  const finalPrompt = prompt || defaultPrompt;

  try {
    const response = await axios.post(
      `${BASE_URL}/images/generations`,
      {
        model: 'doubao-seedream-4.5',
        prompt: `${finalPrompt} --image ${imageUrl}`,
        size: '2K',
        response_format: 'url',
        watermark: false,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 分钟超时
      }
    );

    const result = response.data;

    if (result.error) {
      throw new Error(`API 错误：${JSON.stringify(result.error)}`);
    }

    if (!result.data || !result.data[0] || !result.data[0].url) {
      throw new Error('未获取到图片 URL');
    }

    return result.data[0].url;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`请求失败：${error.message}`);
    }
    throw error;
  }
}

/**
 * 检查 API Key 是否配置
 */
export function isConfigured(): boolean {
  return !!API_KEY;
}
