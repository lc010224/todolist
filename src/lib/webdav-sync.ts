// WebDAV 同步配置存储
export interface SyncConfig {
  enabled: boolean;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
  lastSynced: string | null;
  autoSync: boolean;
}

// 默认配置
export const defaultSyncConfig: SyncConfig = {
  enabled: false,
  webdavUrl: '',
  webdavUsername: '',
  webdavPassword: '',
  lastSynced: null,
  autoSync: false,
};

// 获取/保存配置
export function getSyncConfig(): SyncConfig {
  if (typeof window === 'undefined') return defaultSyncConfig;
  const stored = localStorage.getItem('sync-config');
  if (stored) {
    try {
      return { ...defaultSyncConfig, ...JSON.parse(stored) };
    } catch {
      return defaultSyncConfig;
    }
  }
  return defaultSyncConfig;
}

export function saveSyncConfig(config: Partial<SyncConfig>): SyncConfig {
  if (typeof window === 'undefined') return defaultSyncConfig;
  const current = getSyncConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('sync-config', JSON.stringify(updated));
  return updated;
}

// WebDAV 请求封装
async function webdavRequest(
  url: string,
  method: string,
  username: string,
  password: string,
  body?: string,
  contentType?: string
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body) {
    headers['Content-Type'] = contentType || 'application/xml';
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body,
    credentials: 'include',
  });
  
  return response;
}

// PROPFIND 请求 - 获取文件信息
async function propfind(
  url: string,
  username: string,
  password: string,
  depth: '0' | '1' = '1'
): Promise<boolean> {
  const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <prop>
    <getlastmodified/>
    <getcontentlength/>
    <resourcetype/>
  </prop>
</propfind>`;

  try {
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Depth': depth,
      },
      body: propfindBody,
    });
    return response.ok;
  } catch {
    return false;
  }
}

// 测试连接
export async function testWebDAVConnection(
  url: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !username || !password) {
    return { success: false, message: '请填写完整的 WebDAV 配置' };
  }

  try {
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const testUrl = `${baseUrl}/todolist-sync-test.txt`;
    
    // 测试写入
    const putResponse = await fetch(testUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Content-Type': 'text/plain',
      },
      body: 'test',
    });

    if (!putResponse.ok && putResponse.status !== 201 && putResponse.status !== 204) {
      return { success: false, message: `连接失败 (${putResponse.status})` };
    }

    // 测试读取
    const getResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      },
    });

    if (!getResponse.ok) {
      return { success: false, message: '无法读取文件' };
    }

    // 删除测试文件
    await fetch(testUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      },
    });

    return { success: true, message: '连接成功' };
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' };
  }
}

// 同步数据文件路径
const DATA_FILE = '/todolist-data.json';

// 上传数据
export async function uploadData(
  data: string,
  config: SyncConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.webdavUrl) {
    return { success: false, message: '同步未启用' };
  }

  try {
    const baseUrl = config.webdavUrl.endsWith('/') 
      ? config.webdavUrl.slice(0, -1) 
      : config.webdavUrl;
    const fileUrl = `${baseUrl}${DATA_FILE}`;

    const response = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.webdavUsername}:${config.webdavPassword}`),
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      saveSyncConfig({ lastSynced: new Date().toISOString() });
      return { success: true, message: '同步成功' };
    }

    return { success: false, message: `上传失败 (${response.status})` };
  } catch (error: any) {
    return { success: false, message: error.message || '上传失败' };
  }
}

// 下载数据
export async function downloadData(
  config: SyncConfig
): Promise<{ success: boolean; data: string | null; message: string }> {
  if (!config.enabled || !config.webdavUrl) {
    return { success: false, data: null, message: '同步未启用' };
  }

  try {
    const baseUrl = config.webdavUrl.endsWith('/') 
      ? config.webdavUrl.slice(0, -1) 
      : config.webdavUrl;
    const fileUrl = `${baseUrl}${DATA_FILE}`;

    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.webdavUsername}:${config.webdavPassword}`),
      },
    });

    if (response.ok) {
      const text = await response.text();
      return { success: true, data: text, message: '下载成功' };
    }

    if (response.status === 404) {
      return { success: false, data: null, message: '暂无云端数据' };
    }

    return { success: false, data: null, message: `下载失败 (${response.status})` };
  } catch (error: any) {
    return { success: false, data: null, message: error.message || '下载失败' };
  }
}

// 获取服务器上的数据更新时间
export async function getServerLastModified(
  config: SyncConfig
): Promise<Date | null> {
  if (!config.enabled || !config.webdavUrl) return null;

  try {
    const baseUrl = config.webdavUrl.endsWith('/') 
      ? config.webdavUrl.slice(0, -1) 
      : config.webdavUrl;
    const fileUrl = `${baseUrl}${DATA_FILE}`;

    const response = await fetch(fileUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.webdavUsername}:${config.webdavPassword}`),
      },
    });

    if (response.ok) {
      const lastModified = response.headers.get('Last-Modified');
      return lastModified ? new Date(lastModified) : null;
    }
    return null;
  } catch {
    return null;
  }
}
