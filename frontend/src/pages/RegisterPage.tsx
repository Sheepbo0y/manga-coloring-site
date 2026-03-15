import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password) {
      toast.error('请填写所有必填字段');
      return;
    }

    if (username.length < 3) {
      toast.error('用户名至少需要 3 个字符');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    if (password.length < 6) {
      toast.error('密码至少需要 6 个字符');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({ username, email, password });

      const { user, token } = response.data;

      setUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('注册成功');
      navigate('/');
    } catch (error: unknown) {
      const message =
        error instanceof Error || typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || '注册失败'
          : '注册失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          创建账号
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          已有账号？{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            立即登录
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              autoComplete="username"
              maxLength={20}
            />

            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Input
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <div className="text-sm text-gray-500">
              <p>注册即表示您同意我们的</p>
              <div className="flex space-x-2">
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  服务条款
                </a>
                <span>和</span>
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  隐私政策
                </a>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              注册
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
