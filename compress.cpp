#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <queue>
#include <unordered_map>

using namespace std;

struct Node {
    char ch;
    int freq;
    Node *left;
    Node *right;
    Node(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
};

struct compare {
    bool operator()(Node* l, Node* r) {
        return l->freq > r->freq;
    }
};

void generateCodes(Node* root, string str, unordered_map<char, string> &huffmanCode) {
    if (!root) return;
    if (!root->left && !root->right) {
        huffmanCode[root->ch] = str.empty() ? "0" : str;
    }
    generateCodes(root->left, str + "0", huffmanCode);
    generateCodes(root->right, str + "1", huffmanCode);
}

void saveTree(Node* root, ofstream &out) {
    if (!root->left && !root->right) {
        char marker = '1';
        out.write(&marker, 1);
        out.write(&root->ch, 1);
    } else {
        char marker = '0';
        out.write(&marker, 1);
        saveTree(root->left, out);
        saveTree(root->right, out);
    }
}

int main(int argc, char* argv[]) {
    string inputFile = "input.txt";
    string outputFile = "compressed.bin";
    if (argc >= 2) inputFile = argv[1];
    if (argc >= 3) outputFile = argv[2];

    ifstream in(inputFile, ios::binary);
    if (!in.is_open()) {
        cout << "Unable to open " << inputFile << "\n";
        return 1;
    }

    string text((istreambuf_iterator<char>(in)), istreambuf_iterator<char>());
    in.close();

    if (text.empty()) {
        cout << inputFile << " is empty\n";
        return 0;
    }

    unordered_map<char, int> freq;
    for (char c : text) {
        freq[c]++;
    }

    priority_queue<Node*, vector<Node*>, compare> pq;
    for (auto pair : freq) {
        pq.push(new Node(pair.first, pair.second));
    }

    if (pq.size() == 1) {
        Node* only = pq.top(); pq.pop();
        Node* top = new Node('$', only->freq);
        top->left = only;
        pq.push(top);
    } else {
        while (pq.size() > 1) {
            Node* left = pq.top(); pq.pop();
            Node* right = pq.top(); pq.pop();
            Node* top = new Node('$', left->freq + right->freq);
            top->left = left;
            top->right = right;
            pq.push(top);
        }
    }

    Node* root = pq.top();

    unordered_map<char, string> huffmanCode;
    generateCodes(root, "", huffmanCode);

    string encodedString = "";
    for (char c : text) {
        encodedString += huffmanCode[c];
    }

    ofstream out(outputFile, ios::binary);
    if (!out.is_open()) {
        cout << "Cannot create " << outputFile << "\n";
        return 1;
    }

    saveTree(root, out);
    char delimiter = '#';
    out.write(&delimiter, 1);

    int bitLength = encodedString.size();
    out.write(reinterpret_cast<char*>(&bitLength), sizeof(bitLength));

    while (encodedString.size() % 8 != 0) {
        encodedString += '0';
    }

    for (size_t i = 0; i < encodedString.size(); i += 8) {
        char byte = 0;
        for (int j = 0; j < 8; j++) {
            byte = (byte << 1);
            if (encodedString[i + j] == '1') {
                byte |= 1;
            }
        }
        out.write(&byte, 1);
    }

    out.close();

    cout << "Compressed successfully to " << outputFile << "!\n";
    cout << "Original bits: " << text.size() * 8 << " (" << text.size() << " bytes)\n";
    cout << "Compressed bits: " << bitLength << " (~" << (bitLength + 7) / 8 << " bytes data)\n";
    cout << "Compression ratio: " << (double)(bitLength) / (text.size() * 8) << "\n";

    return 0;
}
