#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <bitset>

using namespace std;

struct Node {
    char ch;
    int freq;
    Node *left;
    Node *right;
    Node(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
};

Node* loadTree(istream &in) {
    char marker;
    if (!in.read(&marker, 1)) return nullptr;
    if (marker == '1') {
        char ch;
        in.read(&ch, 1);
        return new Node(ch, 0);
    } else if (marker == '0') {
        Node* node = new Node('$', 0);
        node->left = loadTree(in);
        node->right = loadTree(in);
        return node;
    }
    return nullptr;
}

int main(int argc, char* argv[]) {
    string inputFile = "compressed.bin";
    string outputFile = "output.txt";
    if (argc >= 2) inputFile = argv[1];
    if (argc >= 3) outputFile = argv[2];

    ifstream in(inputFile, ios::binary);
    if (!in.is_open()) {
        cout << "Cannot open " << inputFile << "\n";
        return 1;
    }

    Node* root = loadTree(in);
    if (!root) {
        cout << "Failed to parse Huffman tree.\n";
        return 1;
    }

    // Skip delimiter '#' if present
    char delim;
    if (in.peek() == '#') {
        in.read(&delim, 1);
    }

    int bitLength = 0;
    in.read(reinterpret_cast<char*>(&bitLength), sizeof(bitLength));

    string bitString = "";
    char byte;
    while (in.read(&byte, 1)) {
        bitString += bitset<8>(static_cast<unsigned char>(byte)).to_string();
    }
    in.close();

    if (bitString.size() > static_cast<size_t>(bitLength)) {
        bitString = bitString.substr(0, bitLength);
    }

    string decoded = "";
    Node* curr = root;
    for (char bit : bitString) {
        if (bit == '0') {
            curr = curr->left;
        } else {
            curr = curr->right;
        }
        if (!curr->left && !curr->right) {
            decoded += curr->ch;
            curr = root;
        }
    }

    ofstream out(outputFile, ios::binary);
    out.write(decoded.data(), decoded.size());
    out.close();

    cout << "Decompressed successfully to " << outputFile << " (" << decoded.size() << " bytes)!\n";
    return 0;
}
