# Canvas录制HLS

- [解决方案架构](#%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88%E6%9E%B6%E6%9E%84)
- [实现步骤](#%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4)
  * [1. 录制 Canvas 流并添加元数据](#1-%E5%BD%95%E5%88%B6-canvas-%E6%B5%81%E5%B9%B6%E6%B7%BB%E5%8A%A0%E5%85%83%E6%95%B0%E6%8D%AE)
  * [2. 在 Web Worker 中处理视频](#2-%E5%9C%A8-web-worker-%E4%B8%AD%E5%A4%84%E7%90%86%E8%A7%86%E9%A2%91)
  * [3. 主线程处理 Worker 结果](#3-%E4%B8%BB%E7%BA%BF%E7%A8%8B%E5%A4%84%E7%90%86-worker-%E7%BB%93%E6%9E%9C)
- [优化方案：实时流处理](#%E4%BC%98%E5%8C%96%E6%96%B9%E6%A1%88%E5%AE%9E%E6%97%B6%E6%B5%81%E5%A4%84%E7%90%86)
- [实时 Worker (realtime-worker.js)](#%E5%AE%9E%E6%97%B6-worker-realtime-workerjs)
- [关键技术和库](#%E5%85%B3%E9%94%AE%E6%8A%80%E6%9C%AF%E5%92%8C%E5%BA%93)
- [部署考虑](#%E9%83%A8%E7%BD%B2%E8%80%83%E8%99%91)
- [总结](#%E6%80%BB%E7%BB%93)

---

用canavas.captureStream录制的，如何生成hsl视频流，并且为每一秒绑定json数据？

要实现通过 `canvas.captureStream()` 录制视频并生成 HLS 流，同时为每秒绑定 JSON 数据，需要结合多个 Web API 和库来实现。以下是完整解决方案：

### 解决方案架构

### 实现步骤

#### 1. 录制 Canvas 流并添加元数据

```javascript
// 获取 Canvas 和配置
const canvas = document.getElementById('my-canvas');
const stream = canvas.captureStream(30); // 30 FPS
const metadataQueue = []; // 存储时间戳和对应的JSON数据

// 启动定时器：每秒收集元数据
setInterval(() => {
  const time = performance.now() / 1000; // 当前时间(秒)
  const data = {
    time,
    // 你的自定义JSON数据
    interaction: getCanvasInteractions(),
    state: getAppState()
  };
  metadataQueue.push(data);
}, 1000);

// 配置 MediaRecorder
const recorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000 // 2.5 Mbps
});

const chunks = [];
recorder.ondataavailable = (e) => chunks.push(e.data);

recorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  await processRecording(blob, metadataQueue);
};

// 开始录制
recorder.start();
```

#### 2. 在 Web Worker 中处理视频

```javascript
// worker.js
importScripts('https://unpkg.com/@ffmpeg/ffmpeg@0.10.0/dist/ffmpeg.min.js');

let ffmpeg = null;

self.onmessage = async (e) => {
  const { blob, metadata } = e.data;
  
  if (!ffmpeg) {
    const { createFFmpeg } = FFmpeg;
    ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
  }

  // 将Blob写入FFmpeg虚拟文件系统
  const buffer = await blob.arrayBuffer();
  ffmpeg.FS('writeFile', 'input.webm', new Uint8Array(buffer));
  
  // 创建元数据文件
  let metadataScript = '';
  metadata.forEach((entry, index) => {
    metadataScript += `\nmetadata=s='${JSON.stringify(entry)}':k=ID3:v=0`;
  });
  
  ffmpeg.FS('writeFile', 'metadata.txt', new TextEncoder().encode(metadataScript));
  
  // 使用FFmpeg处理视频
  await ffmpeg.run(
    '-i', 'input.webm',
    '-vf', `drawtext=textfile='metadata.txt':fontsize=24:box=1:boxcolor=black@0.5:x=10:y=10`,
    '-c:a', 'copy',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'fast',
    '-f', 'hls',
    '-hls_time', '1',
    '-hls_playlist_type', 'event',
    '-hls_flags', 'split_by_time',
    'output.m3u8'
  );
  
  // 读取生成的HLS文件
  const m3u8 = ffmpeg.FS('readFile', 'output.m3u8');
  const segments = [];
  
  for (let i = 0; ; i++) {
    try {
      const segment = ffmpeg.FS('readFile', `output${i}.ts`);
      segments.push(segment);
    } catch (e) {
      break; // 没有更多片段
    }
  }
  
  // 返回结果给主线程
  self.postMessage({
    m3u8: new Blob([m3u8], { type: 'application/vnd.apple.mpegurl' }),
    segments: segments.map(s => new Blob([s], { type: 'video/mp2t' }))
  }, [m3u8, ...segments]);
};
```

#### 3. 主线程处理 Worker 结果

```javascript
async function processRecording(blob, metadata) {
  const worker = new Worker('worker.js');
  
  worker.postMessage({ blob, metadata }, [
    blob // 转移所有权，提高性能
  ]);
  
  worker.onmessage = (e) => {
    const { m3u8, segments } = e.data;
    
    // 1. 保存或传输HLS文件
    saveFile(m3u8, 'recording.m3u8');
    
    segments.forEach((segment, i) => {
      saveFile(segment, `segment${i}.ts`);
    });
    
    // 2. 或者直接在前端创建可播放的HLS流
    const hlsUrl = URL.createObjectURL(m3u8);
    initHlsPlayer(hlsUrl);
  };
}

function saveFile(blob, fileName) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
}

function initHlsPlayer(m3u8Url) {
  const video = document.getElementById('player');
  
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(m3u8Url);
    hls.attachMedia(video);
    
    // 读取元数据
    hls.on(Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
      data.samples.forEach(sample => {
        const text = new TextDecoder().decode(sample.data);
        const json = JSON.parse(text.match(/{.*}/)[0]);
        console.log(`时间: ${json.time}s, 数据:`, json);
      });
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = m3u8Url;
  }
}
```

### 优化方案：实时流处理

如果需要实时生成 HLS 流（如直播场景），使用以下改进方案：

```javascript
// 使用 MediaRecorder 的分段功能
recorder.start(1000); // 每1000ms生成一个片段

recorder.ondataavailable = async (event) => {
  if (event.data.size > 0) {
    const time = performance.now() / 1000;
    const metadata = {
      time,
      data: getCurrentState() // 当前状态
    };
    
    // 在Web Worker中实时处理片段
    processSegment(event.data, metadata);
  }
};

// Web Worker中的实时处理
async function processSegment(blob, metadata) {
  const worker = new Worker('realtime-worker.js');
  
  worker.postMessage({ 
    blob, 
    metadata,
    segmentIndex: segmentCounter++ 
  });
  
  worker.onmessage = (e) => {
    const { segment, metadata } = e.data;
    appendToHlsPlaylist(segment, metadata);
  };
}
```

### 实时 Worker (realtime-worker.js)

```javascript
importScripts('https://unpkg.com/mux.js@6.3.0/dist/mux.min.js');

const { mp4 } = self.muxjs;

self.onmessage = async (e) => {
  const { blob, metadata, segmentIndex } = e.data;
  const buffer = await blob.arrayBuffer();
  
  // 将WebM转码为MP4
  const data = new Uint8Array(buffer);
  const mp4Data = mp4.tools.inspect(data);
  
  // 添加ID3元数据
  const id3Frame = createId3Frame(metadata);
  mp4Data.boxes.push({
    type: 'id3',
    data: id3Frame
  });
  
  // 生成TS片段
  const segment = mp4.tools.fragment(data, mp4Data);
  
  self.postMessage({
    segment: new Blob([segment], { type: 'video/mp2t' }),
    metadata
  }, [segment]);
};

function createId3Frame(metadata) {
  const encoder = new TextEncoder();
  const jsonStr = JSON.stringify(metadata);
  const data = encoder.encode(jsonStr);
  
  // 简化的ID3帧结构
  const frame = new Uint8Array(10 + data.length);
  const view = new DataView(frame.buffer);
  
  // ID3头部
  view.setUint32(0, 0x49443303); // 'ID3'
  view.setUint16(4, 0); // 版本
  view.setUint8(6, 0); // 标志
  
  // 帧大小
  const size = data.length;
  view.setUint32(7, size, false);
  
  // 数据
  frame.set(data, 10);
  
  return frame;
}
```

### 关键技术和库

1. **核心库**:
   * FFmpeg.wasm: 在浏览器中转码视频
   * mux.js: 实时处理媒体片段
   * hls.js: 播放HLS流
2. **元数据嵌入方法**:
   * **ID3标签**: 标准方法，兼容性好
   * **SEI NALU**: 视频帧内嵌入数据（更高效）
   * **WebVTT**: 通过字幕轨道携带数据
3. **性能优化**:
   * 使用 Web Worker 防止主线程阻塞
   * 分段处理视频
   * 选择合适的视频编码参数（分辨率、比特率）

### 部署考虑

1. **浏览器兼容性**:
   * 需要支持 MediaRecorder 和 WebAssembly
   * 备选方案：使用服务器端转码
2. **服务器端备选方案**:

```python
# Python伪代码：服务器端处理
def process_recording(webm_file, metadata):
    # 1. 使用FFmpeg嵌入元数据
    cmd = [
        'ffmpeg',
        '-i', webm_file,
        '-metadata', f'description={json.dumps(metadata)}',
        '-f', 'hls',
        '-hls_time', '1',
        'output.m3u8'
    ]
    subprocess.run(cmd)
    
    # 2. 或者使用hls.js的服务器端版本
    from hls_parser import HLS
    hls = HLS(webm_file)
    hls.add_metadata(metadata)
    return hls.generate()
```

### 总结

通过结合 `canvas.captureStream()`、`MediaRecorder` 和 Web Assembly 技术（FFmpeg.wasm 或 mux.js），可以在浏览器中实现：

1. 将 Canvas 内容录制为视频
2. 每秒绑定自定义 JSON 数据
3. 生成标准 HLS 流（.m3u8 + .ts 片段）
4. 元数据可通过 ID3 标签在播放时读取

关键点在于：

* 使用定时器精确捕获元数据
* 在视频编码过程中嵌入元数据
* 使用 Web Worker 保持界面响应
* 根据场景选择实时处理或录制后处理

对于性能要求高的场景，推荐使用 mux.js 实现实时分段处理；对于高质量转换，FFmpeg.wasm 是更强大的选择。


> 更新: 2025-07-19 13:59:43  
> 原文: <https://www.yuque.com/viruspc/el3mi0/aq8qbbhcmdgp9wnd>