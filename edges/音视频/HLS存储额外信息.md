# HLS存储额外信息

- [一、使用 **ID3 Timed Metadata** (最常用且标准化的方法)](#%E4%B8%80%E4%BD%BF%E7%94%A8-id3-timed-metadata-%E6%9C%80%E5%B8%B8%E7%94%A8%E4%B8%94%E6%A0%87%E5%87%86%E5%8C%96%E7%9A%84%E6%96%B9%E6%B3%95)
  * [实现步骤：](#%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4)
- [二、使用 **EXT-X-DATERANGE** (HLS v6+)](#%E4%BA%8C%E4%BD%BF%E7%94%A8-ext-x-daterange-hls-v6)
  * [实现步骤：](#%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4-1)
- [三、使用 **外部 JSON 同步文件**](#%E4%B8%89%E4%BD%BF%E7%94%A8-%E5%A4%96%E9%83%A8-json-%E5%90%8C%E6%AD%A5%E6%96%87%E4%BB%B6)
  * [实现方案：](#%E5%AE%9E%E7%8E%B0%E6%96%B9%E6%A1%88)
- [四、使用 **WebVTT 字幕格式** (兼容性最好)](#%E5%9B%9B%E4%BD%BF%E7%94%A8-webvtt-%E5%AD%97%E5%B9%95%E6%A0%BC%E5%BC%8F-%E5%85%BC%E5%AE%B9%E6%80%A7%E6%9C%80%E5%A5%BD)
- [五、选择方案的考量因素](#%E4%BA%94%E9%80%89%E6%8B%A9%E6%96%B9%E6%A1%88%E7%9A%84%E8%80%83%E9%87%8F%E5%9B%A0%E7%B4%A0)
- [最佳实践建议](#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%E5%BB%BA%E8%AE%AE)

---

在 HLS 流中为不同播放时间点绑定额外信息（如章节标记、广告提示、商品信息等），让前端代码能够读取，可以通过以下几种技术方案实现：

---

### 一、使用 **ID3 Timed Metadata** (最常用且标准化的方法)
这是 HLS 标准支持的方式，将元数据嵌入视频流中。

#### 实现步骤：
1. **在 TS/fMP4 分片中嵌入 ID3 标签**

```bash
# 使用 ffmpeg 嵌入 ID3 元数据
ffmpeg -i input.mp4 -vf "drawtext=text='METADATA_AT_10s':fontsize=20:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,10,11)'" \
       -metadata:s:v:0 title="Chapter 1" \
       -id3v2_version 3 \
       -write_id3v2 1 \
       output.m3u8
```

2. **M3U8 文件声明支持元数据**

```plain
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="init.mp4"
#EXT-X-DISCONTINUITY-SEQUENCE:1
#EXTINF:10.000,
segment1.mp4
#EXTINF:10.000,
segment2.mp4 # 包含嵌入的ID3标签
```

3. **前端读取代码 (使用 hls.js)**

```javascript
const hls = new Hls();
hls.loadSource('stream.m3u8');
hls.attachMedia(videoElement);

// 监听元数据事件
hls.on(Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
  data.samples.forEach(sample => {
    const metadata = parseID3(sample.data); // 解析ID3数据
    console.log(`时间: ${sample.pts}秒, 元数据:`, metadata);
    
    // 示例：在播放器下方显示信息
    if(metadata.type === 'TXXX' && metadata.description === 'product_info') {
      showProductInfo(metadata.value);
    }
  });
});

// 简化的ID3解析函数
function parseID3(data) {
  // 实际应使用完整ID3解析库（如id3-parser）
  return {
    type: String.fromCharCode(data[0], data[1], data[2]),
    description: extractString(data, 10),
    value: extractString(data, 10 + description.length + 1)
  };
}
```

---

### 二、使用 **EXT-X-DATERANGE** (HLS v6+)
适合绑定时间段信息（如广告区间、章节范围）。

#### 实现步骤：
1. **M3U8 中添加 DATERANGE 标签**

```plain
#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:7
#EXT-X-DATERANGE:ID="ad1",START-DATE="2023-01-01T00:00:00Z",DURATION=15.0,X-AD-TYPE="PREROLL",X-SKIP-ABLE="YES"
#EXTINF:10.0,
seg1.ts
#EXTINF:5.0,
seg2.ts
#EXT-X-DATERANGE:ID="chapter1",START-DATE="2023-01-01T00:00:15Z",DURATION=30.0,X-TITLE="产品介绍"
```

2. **前端读取代码**

```javascript
hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
  const dateRanges = data.levels[0].details.dateRanges;
  
  dateRanges.forEach(range => {
    console.log(`从 ${range.start} 到 ${range.end} 的元数据:`, range.attributes);
    
    // 监听时间更新
    videoElement.addEventListener('timeupdate', () => {
      if(videoElement.currentTime >= range.start && 
         videoElement.currentTime <= range.end) {
        showOverlay(range.attributes['X-TITLE']);
      }
    });
  });
});
```

---

### 三、使用 **外部 JSON 同步文件**
适合复杂数据结构或频繁更新的场景。

#### 实现方案：
1. **创建时间同步的 JSON 文件**

```json
// metadata.json
[
  {
    "start": 15.2,
    "end": 20.5,
    "type": "product",
    "data": {
      "id": "p123",
      "name": "无线耳机",
      "price": 299,
      "image": "https://example.com/earbuds.jpg"
    }
  },
  {
    "time": 45.7,
    "type": "quiz",
    "question": "本视频介绍的产品特点是什么？"
  }
]
```

2. **前端同步处理**

```javascript
let metadata = [];

fetch('metadata.json')
  .then(res => res.json())
  .then(data => metadata = data);

videoElement.addEventListener('timeupdate', () => {
  const currentTime = videoElement.currentTime;
  const activeItems = metadata.filter(item => 
    (item.start <= currentTime && currentTime <= item.end) || 
    (item.time && Math.abs(item.time - currentTime) < 0.5
  );

  activeItems.forEach(item => {
    renderMetadata(item);
  });
});
```

---

### 四、使用 **WebVTT 字幕格式** (兼容性最好)
利用字幕轨道传输元数据。

1. **创建 metadata.vtt**

```plain
WEBVTT

00:15.200 --> 00:20.500
{"type": "product", "id": "p123", "name": "无线耳机"}

00:45.700 --> 00:46.000
{"type": "quiz", "question": "产品主要特点？"}
```

2. **M3U8 中引用**

```plain
#EXTM3U
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="metadata",NAME="Metadata",
LANGUAGE="en",URI="metadata.vtt",FORCED=YES
```

3. **前端读取**

```javascript
const track = videoElement.addTextTrack('metadata');
track.mode = 'hidden'; // 不显示但可读取

track.oncuechange = () => {
  const activeCue = track.activeCues[0];
  if(activeCue) {
    const data = JSON.parse(activeCue.text);
    console.log('当前元数据:', data);
  }
};
```

---

### 五、选择方案的考量因素
| **方案** | **精度** | **兼容性** | **数据结构** | **适用场景** |
| --- | --- | --- | --- | --- |
| ID3 元数据 | 毫秒级 | 中等 | 简单键值对 | 实时事件标记 |
| EXT-X-DATERANGE | 秒级 | 高(HLS6+) | 键值对 | 广告/章节区间 |
| 外部 JSON | 任意 | 最高 | 复杂JSON | 电商/互动视频 |
| WebVTT | 毫秒级 | 最高 | 文本/JSON | 通用方案（兼容旧设备） |


---

### 最佳实践建议
1. **关键事件**（如点击购买点）使用 ID3 元数据
2. **时间区间**（广告/章节）使用 DATERANGE
3. **复杂数据**（产品目录）用外部 JSON + 时间同步
4. **兜底方案**：同时提供 JSON API 按时间查询

```javascript
// 根据当前时间获取元数据
fetch(`/api/metadata?time=${video.currentTime}`)
```

5. **调试工具**：使用 Hls.js 的调试模式查看元数据事件

```javascript
Hls.logger.level = 'debug';
```

通过组合使用这些技术，可以在任何播放时间点精确绑定和读取丰富的附加信息，实现高级互动视频体验。



> 更新: 2025-05-29 19:12:09  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ggprvo80laoondt6>