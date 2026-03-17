import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/Input';
import { ImageUpload } from '@/components/ImageUpload';
import { artworkApi, userApi } from '@/lib/api';

export function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const res = await userApi.getCredits();
      setCredits(res.data.credits);
    } catch (error: any) {
      console.error('加载次数失败:', error);
    }
  };

  const handleFileSelect = (file: File | Blob) => {
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('请选择要上传的图片');
      return;
    }

    if (!title.trim()) {
      toast.error('请输入作品标题');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('title', title);
      if (description) {
        formData.append('description', description);
      }
      if (tags) {
        const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tagArray));
      }

      setUploadProgress(30);

      const response = await artworkApi.upload(formData);

      setUploadProgress(100);

      // 更新剩余次数
      if (response.data.data?.remainingCredits !== undefined) {
        setCredits(response.data.data.remainingCredits);
      }

      toast.success('作品上传成功，已开始处理！');

      // 跳转到作品详情页
      const artworkId = response.data.data?.artwork?.id;
      if (artworkId) {
        setTimeout(() => {
          navigate(`/artwork/${artworkId}`);
        }, 500);
      }
    } catch (error: any) {
      // 处理次数不足的情况
      if (error.response?.status === 403 && error.response?.data?.error === '免费次数已用完') {
        toast.error('免费次数已用完，明天配置 Seedream API Key 后可充值');
      } else {
        const message = error.response?.data?.error || error.message || '上传失败';
        toast.error(message);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <CloudArrowUpIcon className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">上传作品</h1>
          </div>
          <p className="text-gray-600">
            上传黑白漫画图片，AI 将自动为您上色
          </p>
          {credits !== null && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                当前剩余次数：<span className="font-bold text-lg">{credits}</span>
                {credits <= 0 && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    次数已用完，明天配置 Seedream API Key 后可充值
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              选择图片
            </h2>
            <ImageUpload
              onFileSelect={handleFileSelect}
              maxSize={10 * 1024 * 1024}
              disabled={uploading}
            />
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              基本信息
            </h2>
            <div className="space-y-4">
              <Input
                label="作品标题"
                placeholder="请输入作品标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />

              <TextArea
                label="作品描述"
                placeholder="简单描述一下你的作品（可选）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />

              <Input
                label="标签"
                placeholder="用逗号分隔多个标签，如：风景，夏日，海滩"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={uploading}
            >
              取消
            </Button>
            <Button type="submit" loading={uploading}>
              {uploading ? '上传中...' : '开始上色'}
            </Button>
          </div>
        </form>

        {/* Processing Info */}
        {uploading && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  正在上传并处理...
                </span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                处理时间取决于图片大小和队列长度，通常需要 1-5 分钟
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
