# HuffManText

A complete lossless Huffman Coding suite with **C++ core**, **Python utilities**, and a **lightweight, modern Web UI** for uploading and downloading real files.

---

## 🌟 Features

* **Lightweight Web App**: Drag-and-drop real file upload & instant download of compressed/decompressed files.
* **Zero External Dependencies**: Small footprint (< 30 KB web app), no bulky `node_modules` or pip packages needed.
* **100% Binary Compatible**: Seamless interoperability between C++, Python, and browser JavaScript.
* **True Lossless Compression**: Perfect reconstruction of any text, code, or binary files.
* **Real-time Statistics**: Shows original size, compressed size, compression ratio, space saved %, and Huffman code table.
* **Dual-engine Support**: Works 100% client-side offline in the browser AND via Python standard library HTTP server.

---

## 🚀 Quick Start: Web App

### Option 1: Start Local Web Server (Recommended)
Run the lightweight built-in Python web server (zero dependencies):
```bash
python3 server.py
```
Open your browser at **[http://localhost:8000](http://localhost:8000)**.

### Option 2: Open Directly in Browser
You can also open `web/index.html` directly in any web browser without running a server.

---

## 🛠️ CLI Usage

### C++

Compile with `g++`:
```bash
# Compile
g++ -O2 compress.cpp -o compress
g++ -O2 decompress.cpp -o decompress

# Compress a file
./compress input.txt compressed.bin

# Decompress back to original
./decompress compressed.bin output.txt
```

### Python

Use `huffman.py` directly from the command line:
```bash
# Compress
python3 huffman.py compress input.txt compressed.bin

# Decompress
python3 huffman.py decompress compressed.bin output.txt
```

---

## 📁 Project Structure

```text
├── compress.cpp          # C++ compression source code
├── decompress.cpp        # C++ decompression source code
├── huffman.py            # Python Huffman module & CLI
├── server.py             # Zero-dependency local web server
├── web/
│   ├── index.html        # Modern, responsive single-page interface
│   ├── style.css         # Clean dark-mode styles (no external CDN required)
│   └── app.js            # Pure JS client-side compression/decompression & download
├── input.txt             # Sample input text
├── compressed.bin        # Sample compressed binary file
├── output.txt            # Sample decompressed output
└── .gitignore            # Git ignore rules for binaries and caches
```

---

## ⚙️ How It Works

1. **Frequency Analysis**: Counts character/byte occurrences using hash maps.
2. **Min Heap (Priority Queue)**: Repeatedly merges least-frequent nodes to construct the optimal Huffman tree.
3. **Prefix Code Generation**: Left branches represent `0`, right branches represent `1`.
4. **Header Serialization**: Preorder tree traversal (`1` + byte for leaf, `0` for branch) followed by `#` and a 32-bit bitstream length.
5. **Bitstream Packing**: Encoded variable-length bits are packed into 8-bit bytes (MSB to LSB).

---

## 👤 Author

**Abhishek Sharma**
