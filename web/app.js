// Huffman Coding Web Application
// Client-side lossless binary compression & decompression

class HuffmanNode {
  constructor(ch, freq, left = null, right = null, order = 0) {
    this.ch = ch; // byte value 0-255 or null
    this.freq = freq;
    this.left = left;
    this.right = right;
    this.order = order;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeCharDisplay(byte) {
  if (byte === 32) return '␣ [space]';
  if (byte === 10) return '\\n [newline]';
  if (byte === 13) return '\\r [return]';
  if (byte === 9) return '\\t [tab]';
  if (byte >= 33 && byte <= 126) return String.fromCharCode(byte);
  return `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`;
}

// Huffman Compress
function huffmanCompress(uint8Data) {
  if (!uint8Data || uint8Data.length === 0) {
    throw new Error('File is empty.');
  }

  const freq = new Map();
  for (let i = 0; i < uint8Data.length; i++) {
    const b = uint8Data[i];
    freq.set(b, (freq.get(b) || 0) + 1);
  }

  const nodes = [];
  let order = 0;
  for (const [b, f] of freq.entries()) {
    nodes.push(new HuffmanNode(b, f, null, null, order++));
  }

  const sortNodes = (arr) => {
    arr.sort((a, b) => (a.freq !== b.freq ? a.freq - b.freq : a.order - b.order));
  };

  if (nodes.length === 1) {
    const only = nodes.shift();
    nodes.push(new HuffmanNode(null, only.freq, only, null, order++));
  }

  while (nodes.length > 1) {
    sortNodes(nodes);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new HuffmanNode(null, left.freq + right.freq, left, right, order++);
    nodes.push(parent);
  }

  const root = nodes[0];
  const codes = new Map();

  function genCodes(node, prefix = '') {
    if (!node) return;
    if (!node.left && !node.right) {
      codes.set(node.ch, prefix === '' ? '0' : prefix);
      return;
    }
    genCodes(node.left, prefix + '0');
    genCodes(node.right, prefix + '1');
  }
  genCodes(root);

  const treeBytes = [];
  function saveTree(node) {
    if (!node.left && !node.right) {
      treeBytes.push(49); // ASCII '1'
      treeBytes.push(node.ch);
    } else {
      treeBytes.push(48); // ASCII '0'
      saveTree(node.left);
      saveTree(node.right);
    }
  }
  saveTree(root);

  let bitLen = 0;
  for (let i = 0; i < uint8Data.length; i++) {
    bitLen += codes.get(uint8Data[i]).length;
  }

  const packedBytes = [];
  let currentByte = 0;
  let bitCount = 0;

  for (let i = 0; i < uint8Data.length; i++) {
    const code = codes.get(uint8Data[i]);
    for (let j = 0; j < code.length; j++) {
      currentByte = (currentByte << 1) | (code[j] === '1' ? 1 : 0);
      bitCount++;
      if (bitCount === 8) {
        packedBytes.push(currentByte);
        currentByte = 0;
        bitCount = 0;
      }
    }
  }

  if (bitCount > 0) {
    currentByte = currentByte << (8 - bitCount);
    packedBytes.push(currentByte);
  }

  const totalLen = treeBytes.length + 1 + 4 + packedBytes.length;
  const result = new Uint8Array(totalLen);
  result.set(treeBytes, 0);
  let pos = treeBytes.length;
  result[pos++] = 35; // '#'

  const view = new DataView(result.buffer, result.byteOffset, result.byteLength);
  view.setUint32(pos, bitLen, true);
  pos += 4;

  result.set(packedBytes, pos);

  return {
    compressedData: result,
    codes,
    freq,
    bitLen
  };
}

// Huffman Decompress
function huffmanDecompress(uint8Data) {
  if (!uint8Data || uint8Data.length < 6) {
    throw new Error('Invalid or corrupted compressed file.');
  }

  let offset = 0;
  function loadTree() {
    if (offset >= uint8Data.length) return null;
    const marker = String.fromCharCode(uint8Data[offset++]);
    if (marker === '1') {
      if (offset >= uint8Data.length) return null;
      const ch = uint8Data[offset++];
      return new HuffmanNode(ch, 0);
    } else if (marker === '0') {
      const left = loadTree();
      const right = loadTree();
      return new HuffmanNode(null, 0, left, right);
    }
    return null;
  }

  const root = loadTree();
  if (!root) {
    throw new Error('Failed to deserialize Huffman tree.');
  }

  if (offset < uint8Data.length && uint8Data[offset] === 35) {
    offset++;
  }

  if (offset + 4 > uint8Data.length) {
    throw new Error('Invalid file: Missing bit length header.');
  }

  const view = new DataView(uint8Data.buffer, uint8Data.byteOffset, uint8Data.byteLength);
  const bitLen = view.getUint32(offset, true);
  offset += 4;

  const packed = uint8Data.subarray(offset);
  const decoded = [];
  let curr = root;
  let bitsRead = 0;

  for (let i = 0; i < packed.length && bitsRead < bitLen; i++) {
    const byte = packed[i];
    for (let b = 7; b >= 0 && bitsRead < bitLen; b--) {
      const bit = (byte >> b) & 1;
      bitsRead++;
      curr = bit === 0 ? curr.left : curr.right;
      if (!curr) {
        throw new Error('Invalid bit sequence during decoding.');
      }
      if (!curr.left && !curr.right) {
        decoded.push(curr.ch);
        curr = root;
      }
    }
  }

  return new Uint8Array(decoded);
}

// UI & Interaction
document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabCompress = document.getElementById('tabCompress');
  const tabDecompress = document.getElementById('tabDecompress');
  const compressSection = document.getElementById('compressSection');
  const decompressSection = document.getElementById('decompressSection');

  tabCompress.addEventListener('click', () => {
    tabCompress.classList.add('active');
    tabDecompress.classList.remove('active');
    compressSection.classList.remove('hidden');
    decompressSection.classList.add('hidden');
  });

  tabDecompress.addEventListener('click', () => {
    tabDecompress.classList.add('active');
    tabCompress.classList.remove('active');
    decompressSection.classList.remove('hidden');
    compressSection.classList.add('hidden');
  });

  // Compress State
  let compressFile = null;
  let compressedResult = null;

  const cDropZone = document.getElementById('compressDropZone');
  const cFileInput = document.getElementById('compressFileInput');
  const cDetails = document.getElementById('compressDetails');
  const cFileName = document.getElementById('cFileName');
  const cFileSize = document.getElementById('cFileSize');
  const btnRunCompress = document.getElementById('btnRunCompress');
  const cResults = document.getElementById('compressResults');
  const btnDownloadCompressed = document.getElementById('btnDownloadCompressed');

  // Decompress State
  let decompressFile = null;
  let decompressedResult = null;

  const dDropZone = document.getElementById('decompressDropZone');
  const dFileInput = document.getElementById('decompressFileInput');
  const dDetails = document.getElementById('decompressDetails');
  const dFileName = document.getElementById('dFileName');
  const dFileSize = document.getElementById('dFileSize');
  const btnRunDecompress = document.getElementById('btnRunDecompress');
  const dResults = document.getElementById('decompressResults');
  const btnDownloadDecompressed = document.getElementById('btnDownloadDecompressed');
  const dPreviewText = document.getElementById('dPreviewText');

  // Helper for Drag and Drop setup
  function setupDragAndDrop(dropZone, fileInput, onFileSelected) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelected(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelected(e.target.files[0]);
      }
    });
  }

  // Handle Compress File Select
  setupDragAndDrop(cDropZone, cFileInput, (file) => {
    compressFile = file;
    compressedResult = null;
    cFileName.textContent = file.name;
    cFileSize.textContent = formatBytes(file.size);
    cDetails.classList.remove('hidden');
    cResults.classList.add('hidden');
  });

  // Run Compression
  btnRunCompress.addEventListener('click', async () => {
    if (!compressFile) return;

    btnRunCompress.disabled = true;
    btnRunCompress.querySelector('.btn-text').textContent = 'Compressing...';

    try {
      const buffer = await compressFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const t0 = performance.now();
      const result = huffmanCompress(uint8);
      const t1 = performance.now();

      compressedResult = result.compressedData;

      const origSize = uint8.length;
      const compSize = result.compressedData.length;
      const savings = origSize > 0 ? (((origSize - compSize) / origSize) * 100).toFixed(1) : 0;
      const ratio = origSize > 0 ? (compSize / origSize).toFixed(3) : 1;

      document.getElementById('cOrigSize').textContent = `${formatBytes(origSize)} (${origSize} B)`;
      document.getElementById('cCompSize').textContent = `${formatBytes(compSize)} (${compSize} B)`;
      document.getElementById('cSavings').textContent = `${savings}%`;
      document.getElementById('cRatio').textContent = `${ratio}x`;

      // Render Code Table
      document.getElementById('cUniqueChars').textContent = result.codes.size;
      const tbody = document.getElementById('cCodeTableBody');
      tbody.innerHTML = '';

      const sortedSymbols = Array.from(result.codes.entries()).sort(
        (a, b) => result.freq.get(b[0]) - result.freq.get(a[0])
      );

      sortedSymbols.slice(0, 50).forEach(([byte, code]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeCharDisplay(byte)}</td>
          <td>${byte}</td>
          <td>${result.freq.get(byte)}</td>
          <td><code style="color:var(--primary); font-weight:bold;">${code}</code></td>
          <td>${code.length}</td>
        `;
        tbody.appendChild(tr);
      });

      cResults.classList.remove('hidden');
    } catch (err) {
      alert(`Compression error: ${err.message}`);
    } finally {
      btnRunCompress.disabled = false;
      btnRunCompress.querySelector('.btn-text').textContent = 'Compress Again';
    }
  });

  // Download Compressed File
  btnDownloadCompressed.addEventListener('click', () => {
    if (!compressedResult || !compressFile) return;
    const blob = new Blob([compressedResult], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const downloadName = compressFile.name.endsWith('.bin') ? compressFile.name : `${compressFile.name}.bin`;
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Handle Decompress File Select
  setupDragAndDrop(dDropZone, dFileInput, (file) => {
    decompressFile = file;
    decompressedResult = null;
    dFileName.textContent = file.name;
    dFileSize.textContent = formatBytes(file.size);
    dDetails.classList.remove('hidden');
    dResults.classList.add('hidden');
  });

  // Run Decompression
  btnRunDecompress.addEventListener('click', async () => {
    if (!decompressFile) return;

    btnRunDecompress.disabled = true;
    btnRunDecompress.querySelector('.btn-text').textContent = 'Decompressing...';

    try {
      const buffer = await decompressFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const decompressed = huffmanDecompress(uint8);
      decompressedResult = decompressed;

      document.getElementById('dInputSize').textContent = formatBytes(uint8.length);
      document.getElementById('dOutputSize').textContent = `${formatBytes(decompressed.length)} (${decompressed.length} B)`;

      // Attempt text preview
      try {
        const textDecoder = new TextDecoder('utf-8', { fatal: true });
        const decodedString = textDecoder.decode(decompressed.subarray(0, 10000));
        dPreviewText.value = decodedString + (decompressed.length > 10000 ? '\n\n... [Preview truncated]' : '');
      } catch (e) {
        dPreviewText.value = `[Binary file restored: ${decompressed.length} bytes. Download to view.]`;
      }

      dResults.classList.remove('hidden');
    } catch (err) {
      alert(`Decompression error: ${err.message}`);
    } finally {
      btnRunDecompress.disabled = false;
      btnRunDecompress.querySelector('.btn-text').textContent = 'Decompress Again';
    }
  });

  // Download Restored File
  btnDownloadDecompressed.addEventListener('click', () => {
    if (!decompressedResult || !decompressFile) return;
    const blob = new Blob([decompressedResult], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    let originalName = decompressFile.name;
    if (originalName.endsWith('.bin')) {
      originalName = originalName.slice(0, -4);
    } else {
      originalName = `restored_${originalName}`;
    }
    if (!originalName) originalName = 'restored_file.txt';

    a.href = url;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});
