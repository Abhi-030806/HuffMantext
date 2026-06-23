# HuffManText

A C++ implementation of Huffman Coding for lossless text compression and decompression.

## Features

* Compresses text files into binary format
* Decompresses files back to the original text
* Uses Huffman Tree serialization for accurate reconstruction
* Calculates compression ratio
* File-based input and output

## Data Structures Used

* `unordered_map` for frequency counting
* `priority_queue` (Min Heap) for Huffman Tree construction
* Binary Tree for encoding and decoding

## Workflow

### Compression

1. Read text from `input.txt`
2. Build Huffman Tree
3. Generate Huffman Codes
4. Encode text
5. Save compressed data to `compressed.bin`

### Decompression

1. Read `compressed.bin`
2. Reconstruct Huffman Tree
3. Decode binary data
4. Write original text to `output.txt`

## Files

```text
compress.cpp
decompress.cpp
input.txt
compressed.bin
output.txt
```

## Concepts Demonstrated

* Huffman Coding
* Greedy Algorithms
* Trees
* Heaps (Priority Queue)
* Recursion
* Binary File Handling

## Author

Abhishek Sharma
