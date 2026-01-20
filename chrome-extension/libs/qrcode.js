/**
 * QRCode.js - Pure JavaScript QR Code Generator for CUBE Nexum
 * Self-contained implementation that works offline.
 * Version: 1.0.0
 * 
 * Based on QR Code specification ISO/IEC 18004:2015
 */
var QRCode = (function() {
    'use strict';

    // QR Code Error Correction Levels
    var ErrorCorrectionLevel = {
        L: 1,  // ~7% recovery
        M: 0,  // ~15% recovery
        Q: 3,  // ~25% recovery
        H: 2   // ~30% recovery
    };

    // Alphanumeric character set
    var ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

    // QR Code generator polynomials for different error correction codewords
    var GENERATOR_POLYNOMIALS = {
        7: [87, 229, 146, 149, 238, 102, 21],
        10: [251, 67, 46, 61, 118, 70, 64, 94, 32, 45],
        13: [74, 152, 176, 100, 86, 100, 106, 104, 130, 218, 206, 140, 78],
        15: [8, 183, 61, 91, 202, 37, 51, 58, 58, 237, 140, 124, 5, 99, 105],
        16: [120, 104, 107, 109, 102, 161, 76, 3, 91, 191, 147, 169, 182, 194, 225, 120],
        17: [43, 139, 206, 78, 43, 239, 123, 206, 214, 147, 24, 99, 150, 39, 243, 163, 136],
        18: [215, 234, 158, 94, 184, 97, 118, 170, 79, 187, 152, 148, 252, 179, 5, 98, 96, 153],
        20: [17, 60, 79, 50, 61, 163, 26, 187, 202, 180, 221, 225, 83, 239, 156, 164, 212, 212, 188, 190],
        22: [210, 171, 247, 242, 93, 230, 14, 109, 221, 53, 200, 74, 8, 172, 98, 80, 219, 134, 160, 105, 165, 231],
        24: [229, 121, 135, 48, 211, 117, 251, 126, 159, 180, 169, 152, 192, 226, 228, 218, 111, 0, 117, 232, 87, 96, 227, 21],
        26: [173, 125, 158, 2, 103, 182, 118, 17, 145, 201, 111, 28, 165, 53, 161, 21, 245, 142, 13, 102, 48, 227, 153, 145, 218, 70],
        28: [168, 223, 200, 104, 224, 234, 108, 180, 110, 190, 195, 147, 205, 27, 232, 201, 21, 43, 245, 87, 42, 195, 212, 119, 242, 37, 9, 123],
        30: [41, 173, 145, 152, 216, 31, 179, 182, 50, 48, 110, 86, 239, 96, 222, 125, 42, 173, 226, 193, 224, 130, 156, 37, 251, 216, 238, 40, 192, 180]
    };

    // Galois Field operations
    var GF = {
        exp: new Array(512),
        log: new Array(256),
        init: function() {
            var x = 1;
            for (var i = 0; i < 255; i++) {
                this.exp[i] = x;
                this.log[x] = i;
                x <<= 1;
                if (x & 256) x ^= 285;
            }
            for (var i = 255; i < 512; i++) {
                this.exp[i] = this.exp[i - 255];
            }
        },
        multiply: function(x, y) {
            if (x === 0 || y === 0) return 0;
            return this.exp[this.log[x] + this.log[y]];
        }
    };
    GF.init();

    // Reed-Solomon encoder
    function rsEncode(data, nsym) {
        var gen = GENERATOR_POLYNOMIALS[nsym] || generatePolynomial(nsym);
        var res = new Array(data.length + nsym).fill(0);
        
        for (var i = 0; i < data.length; i++) {
            res[i] = data[i];
        }
        
        for (var i = 0; i < data.length; i++) {
            var coef = res[i];
            if (coef !== 0) {
                for (var j = 0; j < gen.length; j++) {
                    res[i + j + 1] ^= GF.multiply(gen[j], coef);
                }
            }
        }
        
        return res.slice(data.length);
    }

    function generatePolynomial(nsym) {
        var g = [1];
        for (var i = 0; i < nsym; i++) {
            var temp = [1, GF.exp[i]];
            var newG = new Array(g.length + 1).fill(0);
            for (var j = 0; j < g.length; j++) {
                for (var k = 0; k < temp.length; k++) {
                    newG[j + k] ^= GF.multiply(g[j], temp[k]);
                }
            }
            g = newG;
        }
        return g.slice(1);
    }

    // QR Code version info
    var VERSION_CAPACITIES = [
        null,
        { L: 17, M: 14, Q: 11, H: 7 },
        { L: 32, M: 26, Q: 20, H: 14 },
        { L: 53, M: 42, Q: 32, H: 24 },
        { L: 78, M: 62, Q: 46, H: 34 },
        { L: 106, M: 84, Q: 60, H: 44 },
        { L: 134, M: 106, Q: 74, H: 58 },
        { L: 154, M: 122, Q: 86, H: 64 },
        { L: 192, M: 152, Q: 108, H: 84 },
        { L: 230, M: 180, Q: 130, H: 98 },
        { L: 271, M: 213, Q: 151, H: 119 },
        { L: 321, M: 251, Q: 177, H: 137 },
        { L: 367, M: 287, Q: 203, H: 155 },
        { L: 425, M: 331, Q: 241, H: 177 },
        { L: 458, M: 362, Q: 258, H: 194 },
        { L: 520, M: 412, Q: 292, H: 220 },
        { L: 586, M: 450, Q: 322, H: 250 },
        { L: 644, M: 504, Q: 364, H: 280 },
        { L: 718, M: 560, Q: 394, H: 310 },
        { L: 792, M: 624, Q: 442, H: 338 },
        { L: 858, M: 666, Q: 482, H: 382 }
    ];

    // Error correction codewords per block
    var EC_CODEWORDS = {
        1: { L: 7, M: 10, Q: 13, H: 17 },
        2: { L: 10, M: 16, Q: 22, H: 28 },
        3: { L: 15, M: 26, Q: 18, H: 22 },
        4: { L: 20, M: 18, Q: 26, H: 16 },
        5: { L: 26, M: 24, Q: 18, H: 22 },
        6: { L: 18, M: 16, Q: 24, H: 28 },
        7: { L: 20, M: 18, Q: 18, H: 26 },
        8: { L: 24, M: 22, Q: 22, H: 26 },
        9: { L: 30, M: 22, Q: 20, H: 24 },
        10: { L: 18, M: 26, Q: 24, H: 28 }
    };

    // Determine best version for data length
    function getMinVersion(dataLength, ecLevel) {
        var levelKey = ['M', 'L', 'H', 'Q'][ecLevel];
        for (var v = 1; v <= 20; v++) {
            if (VERSION_CAPACITIES[v][levelKey] >= dataLength) {
                return v;
            }
        }
        return 20;
    }

    // Get module size for version
    function getModuleCount(version) {
        return version * 4 + 17;
    }

    // Create QR matrix
    function createMatrix(version) {
        var size = getModuleCount(version);
        var matrix = [];
        for (var i = 0; i < size; i++) {
            matrix[i] = new Array(size).fill(null);
        }
        return matrix;
    }

    // Add finder patterns
    function addFinderPatterns(matrix) {
        var size = matrix.length;
        var positions = [[0, 0], [size - 7, 0], [0, size - 7]];
        
        positions.forEach(function(pos) {
            var row = pos[0], col = pos[1];
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 7; c++) {
                    if ((r === 0 || r === 6 || c === 0 || c === 6) ||
                        (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                        matrix[row + r][col + c] = 1;
                    } else {
                        matrix[row + r][col + c] = 0;
                    }
                }
            }
        });
    }

    // Add separators
    function addSeparators(matrix) {
        var size = matrix.length;
        // Top-left
        for (var i = 0; i < 8; i++) {
            if (matrix[7][i] === null) matrix[7][i] = 0;
            if (matrix[i][7] === null) matrix[i][7] = 0;
        }
        // Top-right
        for (var i = 0; i < 8; i++) {
            if (matrix[7][size - 8 + i] === null) matrix[7][size - 8 + i] = 0;
            if (matrix[i][size - 8] === null) matrix[i][size - 8] = 0;
        }
        // Bottom-left
        for (var i = 0; i < 8; i++) {
            if (matrix[size - 8][i] === null) matrix[size - 8][i] = 0;
            if (matrix[size - 8 + i][7] === null) matrix[size - 8 + i][7] = 0;
        }
    }

    // Add timing patterns
    function addTimingPatterns(matrix) {
        var size = matrix.length;
        for (var i = 8; i < size - 8; i++) {
            matrix[6][i] = i % 2 === 0 ? 1 : 0;
            matrix[i][6] = i % 2 === 0 ? 1 : 0;
        }
    }

    // Add alignment patterns (version >= 2)
    function addAlignmentPatterns(matrix, version) {
        if (version < 2) return;
        
        var positions = getAlignmentPositions(version);
        var size = matrix.length;
        
        positions.forEach(function(row) {
            positions.forEach(function(col) {
                // Skip if overlapping with finder patterns
                if ((row < 9 && col < 9) ||
                    (row < 9 && col > size - 10) ||
                    (row > size - 10 && col < 9)) {
                    return;
                }
                
                for (var r = -2; r <= 2; r++) {
                    for (var c = -2; c <= 2; c++) {
                        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
                            matrix[row + r][col + c] = 1;
                        } else {
                            matrix[row + r][col + c] = 0;
                        }
                    }
                }
            });
        });
    }

    function getAlignmentPositions(version) {
        if (version === 1) return [];
        var intervals = Math.floor(version / 7) + 2;
        var size = getModuleCount(version);
        var step = Math.floor((size - 13) / (intervals - 1));
        if (step % 2 === 1) step++;
        
        var positions = [6];
        var pos = size - 7;
        while (positions.length < intervals) {
            positions.splice(1, 0, pos);
            pos -= step;
        }
        return positions;
    }

    // Add dark module and reserve format info
    function addDarkModuleAndReserve(matrix, version) {
        var size = matrix.length;
        
        // Dark module
        matrix[size - 8][8] = 1;
        
        // Reserve format information areas
        for (var i = 0; i < 9; i++) {
            if (matrix[8][i] === null) matrix[8][i] = 0;
            if (matrix[i][8] === null) matrix[i][8] = 0;
            if (i < 8) {
                if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = 0;
                if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = 0;
            }
        }
    }

    // Encode data
    function encodeData(text, version, ecLevel) {
        var bits = [];
        
        // Mode indicator (byte mode = 0100)
        bits.push(0, 1, 0, 0);
        
        // Character count indicator
        var countBits = version < 10 ? 8 : 16;
        var len = text.length;
        for (var i = countBits - 1; i >= 0; i--) {
            bits.push((len >> i) & 1);
        }
        
        // Data
        for (var i = 0; i < text.length; i++) {
            var byte = text.charCodeAt(i);
            for (var j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        
        // Terminator
        var capacity = getDataCapacity(version, ecLevel);
        while (bits.length < capacity * 8 && bits.length < capacity * 8) {
            bits.push(0);
            if (bits.length >= capacity * 8) break;
        }
        
        // Pad to byte boundary
        while (bits.length % 8 !== 0) {
            bits.push(0);
        }
        
        // Pad bytes
        var padBytes = [236, 17];
        var padIndex = 0;
        while (bits.length < capacity * 8) {
            var padByte = padBytes[padIndex % 2];
            for (var j = 7; j >= 0; j--) {
                bits.push((padByte >> j) & 1);
            }
            padIndex++;
        }
        
        return bits;
    }

    function getDataCapacity(version, ecLevel) {
        // Simplified capacity calculation
        var totalCodewords = Math.floor((getModuleCount(version) * getModuleCount(version) - 225) / 8);
        var ecCodewords = EC_CODEWORDS[Math.min(version, 10)] || EC_CODEWORDS[10];
        var levelKey = ['M', 'L', 'H', 'Q'][ecLevel];
        return totalCodewords - ecCodewords[levelKey] * 2;
    }

    // Place data bits
    function placeDataBits(matrix, bits) {
        var size = matrix.length;
        var bitIndex = 0;
        var upward = true;
        
        for (var col = size - 1; col >= 1; col -= 2) {
            if (col === 6) col = 5; // Skip timing pattern column
            
            for (var row = upward ? size - 1 : 0; 
                 upward ? row >= 0 : row < size; 
                 row += upward ? -1 : 1) {
                
                for (var c = 0; c < 2; c++) {
                    var actualCol = col - c;
                    if (matrix[row][actualCol] === null) {
                        matrix[row][actualCol] = bitIndex < bits.length ? bits[bitIndex++] : 0;
                    }
                }
            }
            upward = !upward;
        }
    }

    // Apply mask pattern
    function applyMask(matrix, pattern) {
        var size = matrix.length;
        var masked = [];
        
        for (var row = 0; row < size; row++) {
            masked[row] = [];
            for (var col = 0; col < size; col++) {
                var shouldMask = false;
                switch (pattern) {
                    case 0: shouldMask = (row + col) % 2 === 0; break;
                    case 1: shouldMask = row % 2 === 0; break;
                    case 2: shouldMask = col % 3 === 0; break;
                    case 3: shouldMask = (row + col) % 3 === 0; break;
                    case 4: shouldMask = (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0; break;
                    case 5: shouldMask = (row * col) % 2 + (row * col) % 3 === 0; break;
                    case 6: shouldMask = ((row * col) % 2 + (row * col) % 3) % 2 === 0; break;
                    case 7: shouldMask = ((row + col) % 2 + (row * col) % 3) % 2 === 0; break;
                }
                
                masked[row][col] = matrix[row][col];
                if (shouldMask && isDataModule(row, col, size)) {
                    masked[row][col] = matrix[row][col] ^ 1;
                }
            }
        }
        
        return masked;
    }

    function isDataModule(row, col, size) {
        // Check if this position is a data module (not function pattern)
        // Simplified check - excludes finder, timing, alignment
        if (row < 9 && col < 9) return false;
        if (row < 9 && col > size - 9) return false;
        if (row > size - 9 && col < 9) return false;
        if (row === 6 || col === 6) return false;
        return true;
    }

    // Add format information
    function addFormatInfo(matrix, ecLevel, maskPattern) {
        var size = matrix.length;
        var formatBits = getFormatBits(ecLevel, maskPattern);
        
        // Place format bits around finder patterns
        for (var i = 0; i < 15; i++) {
            var bit = formatBits[14 - i];
            
            // Top-left
            if (i < 6) {
                matrix[i][8] = bit;
            } else if (i < 8) {
                matrix[i + 1][8] = bit;
            } else {
                matrix[8][14 - i] = bit;
            }
            
            // Other corners
            if (i < 8) {
                matrix[8][size - 1 - i] = bit;
            } else {
                matrix[size - 15 + i][8] = bit;
            }
        }
    }

    function getFormatBits(ecLevel, maskPattern) {
        var data = (ecLevel << 3) | maskPattern;
        var bits = new Array(15).fill(0);
        
        // Calculate BCH code
        var poly = 0x537;
        var format = data << 10;
        
        for (var i = 4; i >= 0; i--) {
            if (format & (1 << (i + 10))) {
                format ^= poly << i;
            }
        }
        
        var result = ((data << 10) | format) ^ 0x5412;
        
        for (var i = 0; i < 15; i++) {
            bits[i] = (result >> i) & 1;
        }
        
        return bits;
    }

    // Main QR Code generator
    function generateQR(text, options) {
        options = options || {};
        var ecLevel = options.errorCorrectionLevel || ErrorCorrectionLevel.M;
        if (typeof ecLevel === 'string') {
            ecLevel = ErrorCorrectionLevel[ecLevel] || ErrorCorrectionLevel.M;
        }
        
        var version = options.version || getMinVersion(text.length, ecLevel);
        var maskPattern = 0;
        
        // Create and setup matrix
        var matrix = createMatrix(version);
        addFinderPatterns(matrix);
        addSeparators(matrix);
        addTimingPatterns(matrix);
        addAlignmentPatterns(matrix, version);
        addDarkModuleAndReserve(matrix, version);
        
        // Encode and place data
        var bits = encodeData(text, version, ecLevel);
        placeDataBits(matrix, bits);
        
        // Apply mask and add format info
        matrix = applyMask(matrix, maskPattern);
        addFormatInfo(matrix, ecLevel, maskPattern);
        
        return matrix;
    }

    // Render QR to canvas
    function renderToCanvas(matrix, canvas, options) {
        options = options || {};
        var moduleSize = options.scale || 4;
        var margin = options.margin !== undefined ? options.margin : 4;
        var darkColor = options.color && options.color.dark || '#000000';
        var lightColor = options.color && options.color.light || '#ffffff';
        
        var size = matrix.length;
        var canvasSize = (size + margin * 2) * moduleSize;
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        var ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        
        // Modules
        ctx.fillStyle = darkColor;
        for (var row = 0; row < size; row++) {
            for (var col = 0; col < size; col++) {
                if (matrix[row][col]) {
                    ctx.fillRect(
                        (col + margin) * moduleSize,
                        (row + margin) * moduleSize,
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }
    }

    // Public API
    function QRCode(element, options) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        this._element = element;
        this._options = options || {};
        
        if (options && (options.text || typeof options === 'string')) {
            var text = typeof options === 'string' ? options : options.text;
            this.makeCode(text);
        }
    }

    QRCode.prototype.makeCode = function(text) {
        this._element.innerHTML = '';
        
        var matrix = generateQR(text, {
            errorCorrectionLevel: this._options.correctLevel || ErrorCorrectionLevel.M
        });
        
        var canvas = document.createElement('canvas');
        renderToCanvas(matrix, canvas, {
            scale: Math.floor((this._options.width || 256) / (matrix.length + 8)),
            margin: 4,
            color: {
                dark: this._options.colorDark || '#000000',
                light: this._options.colorLight || '#ffffff'
            }
        });
        
        if (this._options.width) {
            canvas.style.width = this._options.width + 'px';
            canvas.style.height = this._options.height || this._options.width + 'px';
        }
        
        this._element.appendChild(canvas);
        this._canvas = canvas;
    };

    QRCode.prototype.clear = function() {
        this._element.innerHTML = '';
    };

    QRCode.prototype.toDataURL = function(mimeType) {
        return this._canvas ? this._canvas.toDataURL(mimeType || 'image/png') : null;
    };

    // Static methods
    QRCode.toCanvas = function(canvas, text, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};
        
        try {
            var matrix = generateQR(text, {
                errorCorrectionLevel: options.errorCorrectionLevel || 'M'
            });
            
            renderToCanvas(matrix, canvas, {
                scale: options.scale || Math.floor((options.width || 256) / (matrix.length + 8)),
                margin: options.margin !== undefined ? options.margin : 4,
                color: options.color || { dark: '#000000', light: '#ffffff' }
            });
            
            if (callback) callback(null, canvas);
        } catch (e) {
            if (callback) callback(e);
        }
    };

    QRCode.toDataURL = function(text, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};
        
        var canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, text, options, function(err) {
            if (err) {
                if (callback) callback(err);
                return;
            }
            var dataURL = canvas.toDataURL(options.type || 'image/png');
            if (callback) callback(null, dataURL);
        });
    };

    QRCode.toString = function(text, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        try {
            var matrix = generateQR(text, {
                errorCorrectionLevel: options.errorCorrectionLevel || 'M'
            });
            
            var str = '';
            var margin = options.margin !== undefined ? options.margin : 4;
            
            for (var m = 0; m < margin; m++) {
                str += new Array(matrix.length + margin * 2 + 1).join('██') + '\n';
            }
            
            for (var row = 0; row < matrix.length; row++) {
                str += new Array(margin + 1).join('██');
                for (var col = 0; col < matrix.length; col++) {
                    str += matrix[row][col] ? '  ' : '██';
                }
                str += new Array(margin + 1).join('██') + '\n';
            }
            
            for (var m = 0; m < margin; m++) {
                str += new Array(matrix.length + margin * 2 + 1).join('██') + '\n';
            }
            
            if (callback) callback(null, str);
            return str;
        } catch (e) {
            if (callback) callback(e);
        }
    };

    // Correction levels
    QRCode.CorrectLevel = ErrorCorrectionLevel;

    return QRCode;
})();

// Support for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRCode;
}
