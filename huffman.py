"""Huffman Coding implementation in Python.
Binary compatible with the C++ compress.cpp and decompress.cpp format.
"""

import heapq
import struct
from typing import Dict, Tuple, Optional


class HuffmanNode:
    def __init__(self, ch: Optional[int], freq: int, left: Optional['HuffmanNode'] = None, right: Optional['HuffmanNode'] = None, order: int = 0):
        self.ch = ch  # Byte value (0-255) or None for internal node
        self.freq = freq
        self.left = left
        self.right = right
        self.order = order

    def __lt__(self, other: 'HuffmanNode') -> bool:
        if self.freq != other.freq:
            return self.freq < other.freq
        return self.order < other.order


def build_huffman_tree(data: bytes) -> Optional[HuffmanNode]:
    if not data:
        return None

    freq: Dict[int, int] = {}
    for b in data:
        freq[b] = freq.get(b, 0) + 1

    heap = []
    order = 0
    for b, f in freq.items():
        heapq.heappush(heap, HuffmanNode(b, f, order=order))
        order += 1

    if len(heap) == 1:
        only = heapq.heappop(heap)
        parent = HuffmanNode(None, only.freq, left=only, order=order)
        heapq.heappush(heap, parent)

    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        parent = HuffmanNode(None, left.freq + right.freq, left=left, right=right, order=order)
        order += 1
        heapq.heappush(heap, parent)

    return heap[0]


def generate_codes(root: Optional[HuffmanNode]) -> Dict[int, str]:
    codes: Dict[int, str] = {}

    def _traverse(node: Optional[HuffmanNode], prefix: str):
        if not node:
            return
        if node.left is None and node.right is None:
            codes[node.ch] = prefix if prefix else "0"
            return
        _traverse(node.left, prefix + "0")
        _traverse(node.right, prefix + "1")

    _traverse(root, "")
    return codes


def serialize_tree(root: Optional[HuffmanNode]) -> bytes:
    buf = bytearray()

    def _serialize(node: Optional[HuffmanNode]):
        if not node:
            return
        if node.left is None and node.right is None:
            buf.extend(b'1')
            buf.append(node.ch)
        else:
            buf.extend(b'0')
            _serialize(node.left)
            _serialize(node.right)

    _serialize(root)
    return bytes(buf)


def deserialize_tree(data: bytes, offset: int = 0) -> Tuple[Optional[HuffmanNode], int]:
    if offset >= len(data):
        return None, offset

    marker = chr(data[offset])
    offset += 1

    if marker == '1':
        if offset >= len(data):
            return None, offset
        ch = data[offset]
        offset += 1
        return HuffmanNode(ch, 0), offset
    elif marker == '0':
        left, offset = deserialize_tree(data, offset)
        right, offset = deserialize_tree(data, offset)
        return HuffmanNode(None, 0, left=left, right=right), offset

    return None, offset


def compress(data: bytes) -> bytes:
    """Compress bytes using Huffman coding to binary format."""
    if not data:
        return b''

    root = build_huffman_tree(data)
    codes = generate_codes(root)

    bit_parts = [codes[b] for b in data]
    bit_str = ''.join(bit_parts)
    bit_len = len(bit_str)

    padded_len = (bit_len + 7) // 8 * 8
    bit_str_padded = bit_str.ljust(padded_len, '0')

    packed = bytearray()
    for i in range(0, padded_len, 8):
        byte_val = int(bit_str_padded[i:i + 8], 2)
        packed.append(byte_val)

    tree_bytes = serialize_tree(root)

    out = bytearray()
    out.extend(tree_bytes)
    out.extend(b'#')
    out.extend(struct.pack('<I', bit_len))
    out.extend(packed)
    return bytes(out)


def decompress(data: bytes) -> bytes:
    """Decompress binary Huffman data to original bytes."""
    if not data:
        return b''

    root, offset = deserialize_tree(data, 0)
    if not root:
        raise ValueError("Failed to deserialize Huffman tree from binary data.")

    if offset < len(data) and data[offset:offset + 1] == b'#':
        offset += 1

    if offset + 4 > len(data):
        raise ValueError("Invalid format: missing bit length header.")

    bit_len = struct.unpack('<I', data[offset:offset + 4])[0]
    offset += 4
    packed = data[offset:]

    bits = [f'{b:08b}' for b in packed]
    bit_str = ''.join(bits)[:bit_len]

    out = bytearray()
    curr = root
    for bit in bit_str:
        curr = curr.left if bit == '0' else curr.right
        if curr is None:
            raise ValueError("Corrupted Huffman bitstream.")
        if curr.left is None and curr.right is None:
            out.append(curr.ch)
            curr = root

    return bytes(out)


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 3:
        print("Usage: python3 huffman.py [compress|decompress] <input_file> <output_file>")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    in_file = sys.argv[2]
    out_file = sys.argv[3]

    with open(in_file, 'rb') as f:
        content = f.read()

    if cmd == 'compress':
        res = compress(content)
        with open(out_file, 'wb') as f:
            f.write(res)
        print(f"Compressed {len(content)} bytes -> {len(res)} bytes ({out_file})")
    elif cmd == 'decompress':
        res = decompress(content)
        with open(out_file, 'wb') as f:
            f.write(res)
        print(f"Decompressed {len(content)} bytes -> {len(res)} bytes ({out_file})")
    else:
        print(f"Unknown command {cmd}")
        sys.exit(1)
