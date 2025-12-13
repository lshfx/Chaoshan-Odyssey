/**
 * 图片路径处理工具
 * 用于在 TypeScript 文件中统一处理图片路径
 */

import { IMG_HOST } from '@/config/constants'

/**
 * 为相对路径添加完整的主机地址
 * @param path 相对路径（如 'avatars/chen_linger.webp'）
 * @returns 完整的URL路径
 */
export function getFullImagePath(path: string): string {
  if (!path) return ''

  // 如果已经是完整URL，直接返回
  if (path.startsWith('http')) return path

  // 如果包含 /static/，移除它
  if (path.startsWith('/static/')) {
    path = path.replace('/static/', '')
  }

  return IMG_HOST + path
}

/**
 * 批量处理图片路径数组
 * @param paths 路径数组
 * @returns 处理后的完整URL数组
 */
export function processImagePaths(paths: string[]): string[] {
  return paths.map(path => getFullImagePath(path))
}