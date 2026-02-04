// 图标生成脚本
// 运行方式：node icons/generate-icons.js

const fs = require('fs');
const path = require('path');

// 简单的 PNG 生成器（不依赖外部库）
function createSimplePNG(enabled, size, outputPath) {
  const canvasSize = size;
  const bytesPerPixel = 4; // RGBA
  const pixelData = Buffer.alloc(canvasSize * canvasSize * bytesPerPixel);
  const centerX = Math.floor(canvasSize / 2);
  const centerY = Math.floor(canvasSize / 2);
  const radius = Math.floor(canvasSize / 2) - 1;

  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const idx = (y * canvasSize + x) * bytesPerPixel;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        // 在圆内
        if (enabled) {
          // 紫色渐变
          const factor = 1 - (distance / radius);
          pixelData[idx] = Math.floor(102 * factor + 50);     // R
          pixelData[idx + 1] = Math.floor(126 * factor + 50);  // G
          pixelData[idx + 2] = Math.floor(234 * factor + 100); // B
        } else {
          // 灰色
          pixelData[idx] = 156;     // R
          pixelData[idx + 1] = 163;  // G
          pixelData[idx + 2] = 175; // B
        }
        pixelData[idx + 3] = 255; // A
      } else {
        // 透明
        pixelData[idx + 3] = 0; // A
      }

      // 绘制简单的扬声器符号
      if (distance < radius * 0.8) {
        const speakerX = centerX - Math.floor(size / 8);
        const speakerY = centerY - Math.floor(size / 8);
        const speakerW = Math.floor(size / 4);
        const speakerH = Math.floor(size / 4);

        // 矩形主体
        if (x >= speakerX && x < speakerX + speakerW * 0.6 &&
            y >= speakerY && y < speakerY + speakerH) {
          pixelData[idx] = enabled ? 255 : 200;
          pixelData[idx + 1] = enabled ? 255 : 200;
          pixelData[idx + 2] = enabled ? 255 : 200;
          pixelData[idx + 3] = 255;
        }

        // 三角形
        const triangleBaseX = speakerX + speakerW * 0.6;
        const triangleTipX = speakerX + speakerW;
        if (y >= speakerY && y < speakerY + speakerH) {
          const yPos = y - speakerY;
          const leftEdgeX = triangleBaseX + (triangleTipX - triangleBaseX) * (yPos / speakerH) * 0.5;
          if (x >= triangleBaseX && x < leftEdgeX) {
            pixelData[idx] = enabled ? 255 : 200;
            pixelData[idx + 1] = enabled ? 255 : 200;
            pixelData[idx + 2] = enabled ? 255 : 200;
            pixelData[idx + 3] = 255;
          }
        }
      }
    }
  }

  // 创建简单的 PNG 文件（无压缩）
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvasSize, 0);  // width
  ihdr.writeUInt32BE(canvasSize, 4);  // height
  ihdr.writeUInt8(8, 8);              // bit depth
  ihdr.writeUInt8(6, 9);              // color type (RGBA)
  ihdr.writeUInt8(0, 10);             // compression
  ihdr.writeUInt8(0, 11);             // filter
  ihdr.writeUInt8(0, 12);             // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk (image data)
  const zlib = require('zlib');
  const deflate = zlib.deflateSync(pixelData);
  const idatChunk = createChunk('IDAT', deflate);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, png);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 生成所有图标
const iconsDir = path.join(__dirname);
const sizes = [16, 48, 128];
const states = [
  { enabled: true, suffix: 'on' },
  { enabled: false, suffix: 'off' }
];

console.log('正在生成图标...\n');

states.forEach(state => {
  sizes.forEach(size => {
    const filename = `icon-${state.suffix}-${size}.png`;
    const filepath = path.join(iconsDir, filename);
    createSimplePNG(state.enabled, size, filepath);
    console.log(`✓ 生成: ${filename}`);
  });
});

console.log('\n图标生成完成！');
console.log('\n提示：如果想要更美观的图标，请在浏览器中打开 icon-generator.html 文件。');
