/**
 * 输入验证工具函数
 * 用于验证和过滤用户输入，防止注入攻击
 */

// 用户名验证规则
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: '用户名不能为空' };
  }
  
  // 用户名长度限制
  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: '用户名长度必须在3-20个字符之间' };
  }
  
  // 用户名只能包含字母、数字、下划线和连字符
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字、下划线和连字符' };
  }
  
  return { valid: true };
}

// 密码验证规则
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' };
  }
  
  // 密码长度限制
  if (password.length < 6 || password.length > 128) {
    return { valid: false, error: '密码长度必须在6-128个字符之间' };
  }
  
  return { valid: true };
}

// 搜索关键词验证
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: '搜索关键词不能为空' };
  }
  
  // 搜索关键词长度限制
  if (query.length > 100) {
    return { valid: false, error: '搜索关键词长度不能超过100个字符' };
  }
  
  // 过滤危险字符
  const dangerousChars = /<script|javascript:|data:|vbscript:|on\w+=/i;
  if (dangerousChars.test(query)) {
    return { valid: false, error: '搜索关键词包含非法字符' };
  }
  
  return { valid: true };
}

// 视频ID验证
export function validateVideoId(videoId: string): { valid: boolean; error?: string } {
  if (!videoId || typeof videoId !== 'string') {
    return { valid: false, error: '视频ID不能为空' };
  }
  
  // 视频ID长度限制
  if (videoId.length > 200) {
    return { valid: false, error: '视频ID长度不能超过200个字符' };
  }
  
  return { valid: true };
}

// URL验证
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL不能为空' };
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'URL格式不正确' };
  }
}

// 通用字符串验证（防XSS）
export function sanitizeString(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // 截断长度
  let sanitized = input.slice(0, maxLength);
  
  // 转义HTML特殊字符
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

// 验证JSON数据
export function validateJsonData(data: any, requiredFields: string[]): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '数据格式不正确' };
  }
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      return { valid: false, error: `缺少必需字段: ${field}` };
    }
  }
  
  return { valid: true };
}

// 验证分页参数
export function validatePagination(page?: string, limit?: string): { 
  valid: boolean; 
  error?: string;
  page?: number;
  limit?: number;
} {
  let pageNum = 1;
  let limitNum = 20;
  
  if (page) {
    pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 10000) {
      return { valid: false, error: '页码参数不正确' };
    }
  }
  
  if (limit) {
    limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return { valid: false, error: '每页数量参数不正确' };
    }
  }
  
  return { valid: true, page: pageNum, limit: limitNum };
}