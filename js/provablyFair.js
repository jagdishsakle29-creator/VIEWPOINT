/**
 * High Performance Provably Fair System
 * Uses deterministic hashing for zero-latency instant shuffle
 */
class ProvablyFair {
  constructor() {
    this.serverSeed = this.generateRandomHex(64);
    this.clientSeed = this.generateRandomHex(24);
    this.nonce = 1;
    this.serverSeedHash = this.fastHash(this.serverSeed);
  }

  generateRandomHex(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
  }

  // Fast synchronous SHA-256 implementation for zero UI lag
  fastHash(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';
    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let currentLength = 0;
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i % 4) * 8);
      currentLength++;
    }
    words[ascii[lengthProperty] >> 2] |= 0x80 << ((3 - ascii[lengthProperty] % 4) * 8);
    words[(((ascii[lengthProperty] + 8) >> 6) << 4) + 15] = asciiBitLength;

    for (let j = 0; j < words[lengthProperty]; j += 16) {
      const w = words.slice(j, j + 16);
      const oldHash = hash.slice(0);
      for (i = 0; i < 64; i++) {
        const i2 = i + j;
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & hash[5]) ^ ((~e) & hash[6]);
        const temp1 = (hash[7] + s1 + ch + k[i] + (w[i] = (i < 16) ? w[i] : (
          w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0)) | 0;
        const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
        const temp2 = (s0 + maj) | 0;

        hash = [(temp1 + temp2) | 0, a, hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  computeHash() {
    this.serverSeedHash = this.fastHash(this.serverSeed);
    return this.serverSeedHash;
  }

  rotateServerSeed() {
    const oldServerSeed = this.serverSeed;
    this.serverSeed = this.generateRandomHex(64);
    this.computeHash();
    this.nonce = 1;
    return oldServerSeed;
  }

  setClientSeed(seed) {
    if (seed && seed.trim().length > 0) {
      this.clientSeed = seed.trim();
    }
  }

  /**
   * Deterministically generates bomb indices instantly
   */
  generateMineIndices(totalTiles = 25, mineCount = 3) {
    const combinedString = `${this.serverSeed}:${this.clientSeed}:${this.nonce}`;
    const hash = this.fastHash(combinedString);
    this.nonce++;

    const tiles = Array.from({ length: totalTiles }, (_, i) => i);
    let hashIdx = 0;

    for (let i = tiles.length - 1; i > 0; i--) {
      const hexChunk = hash.substr((hashIdx % (hash.length - 4)), 4);
      hashIdx += 4;
      const randInt = parseInt(hexChunk, 16) || 0;
      const j = randInt % (i + 1);
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    const mineIndices = new Set(tiles.slice(0, mineCount));
    return {
      mineIndices,
      hash,
      serverSeedHash: this.serverSeedHash,
      clientSeed: this.clientSeed,
      nonce: this.nonce - 1
    };
  }
}

window.provablyFair = new ProvablyFair();
