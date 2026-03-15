import axios from 'axios';
import { prisma } from '../lib/prisma';

interface ComfyUIWorkflow {
  prompt: Record<string, unknown>;
  client_id: string;
}

export class ComfyUIService {
  private baseUrl: string;
  private clientId: string;

  constructor() {
    this.baseUrl = process.env.COMFYUI_API_URL || 'http://localhost:8188';
    this.clientId = `manga-coloring-${Date.now()}`;
  }

  /**
   * 提交上色工作流到 ComfyUI
   */
  async submitColorization(
    jobId: string,
    imageUrl: string
  ): Promise<string> {
    try {
      // 构建 ComfyUI 工作流（这里使用一个通用的上色工作流模板）
      const workflow = this.buildColorizationWorkflow(imageUrl);

      const response = await axios.post(
        `${this.baseUrl}/prompt`,
        {
          prompt: workflow,
          client_id: this.clientId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const comfyuiJobId = response.data.prompt_id;

      // 更新数据库中的任务状态
      await prisma.colorization.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          comfyuiJobId,
          progress: 5,
        },
      });

      return comfyuiJobId;
    } catch (error) {
      console.error('提交 ComfyUI 任务失败:', error);
      throw new Error('无法连接到 ComfyUI 服务');
    }
  }

  /**
   * 构建上色工作流
   */
  private buildColorizationWorkflow(imageUrl: string): Record<string, unknown> {
    // 这是一个示例工作流，实际使用时需要根据你的 ComfyUI 配置调整
    return {
      '1': {
        inputs: {
          image: imageUrl,
          upload: 'image',
        },
        class_type: 'LoadImage',
      },
      '2': {
        inputs: {
          image: ['1', 0],
        },
        class_type: 'ImageToLatent',
      },
      '3': {
        inputs: {
          samples: ['2', 0],
          model: 'colorization_model_v1',
        },
        class_type: 'ColorizationModel',
      },
      '4': {
        inputs: {
          samples: ['3', 0],
        },
        class_type: 'LatentToImage',
      },
      '5': {
        inputs: {
          images: ['4', 0],
          filename_prefix: 'colorized',
        },
        class_type: 'SaveImage',
      },
    };
  }

  /**
   * 获取任务进度
   */
  async getProgress(comfyuiJobId: string): Promise<{
    progress: number;
    status: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/history/${comfyuiJobId}`
      );

      const history = response.data;
      if (!history || !history[comfyuiJobId]) {
        return { progress: 0, status: 'PENDING' };
      }

      const job = history[comfyuiJobId];
      if (job.status?.completed) {
        return { progress: 100, status: 'COMPLETED' };
      }

      // 根据实际 ComfyUI 返回的进度信息调整
      const progress = job.progress?.value || 50;
      return { progress, status: 'RUNNING' };
    } catch (error) {
      console.error('获取 ComfyUI 进度失败:', error);
      return { progress: 0, status: 'FAILED' };
    }
  }

  /**
   * 获取任务结果
   */
  async getResult(comfyuiJobId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/history/${comfyuiJobId}`
      );

      const history = response.data;
      if (!history || !history[comfyuiJobId]) {
        return null;
      }

      const job = history[comfyuiJobId];
      if (job.outputs) {
        // 获取输出图片的 URL
        for (const nodeId in job.outputs) {
          const output = job.outputs[nodeId];
          if (output.images && output.images.length > 0) {
            const image = output.images[0];
            return `${this.baseUrl}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}`;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('获取 ComfyUI 结果失败:', error);
      return null;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`);
      return response.data.models || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  /**
   * 检查 ComfyUI 服务状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/system_stats`);
      return true;
    } catch {
      return false;
    }
  }
}

export const comfyUIService = new ComfyUIService();
