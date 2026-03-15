import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-dark-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold">漫画上色</span>
            </div>
            <p className="text-gray-400 text-sm">
              使用先进的 AI 技术为黑白漫画上色，让经典作品焕发新的生机。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="hover:text-white transition-colors"
                >
                  画廊
                </Link>
              </li>
              <li>
                <Link
                  to="/upload"
                  className="hover:text-white transition-colors"
                >
                  上传
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="hover:text-white transition-colors"
                >
                  个人中心
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {['风景', '人物', '建筑', '自然', '古风', '现代'].map((tag) => (
                <Link
                  key={tag}
                  to={`/gallery?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-dark-800 rounded-full text-xs text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">联系我们</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>邮箱：support@manga-coloring.com</li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition-colors inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 漫画上色网站。All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
