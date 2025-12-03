import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 将 base 设置为 './' 可以使用相对路径引用资源
  // 这样无论部署在根目录还是子目录(如 /wordmaster)，都能正确找到 js/css 文件
  base: './',
});