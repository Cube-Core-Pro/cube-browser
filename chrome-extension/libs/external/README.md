# External Libraries for CUBE Chrome Extension

This directory contains external JavaScript libraries required for advanced document parsing.

## Required Files

### 1. SheetJS (Excel/CSV Parsing)
**File**: `xlsx.full.min.js`  
**Version**: 0.18.5 or later  
**Download**: https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js  
**Purpose**: Parse Excel (.xlsx, .xls) and CSV files  
**Size**: ~700 KB  

**Quick Download**:
```bash
cd chrome-extension/libs/external
curl -o xlsx.full.min.js https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js
```

### 2. PDF.js (PDF Parsing)
**Files**: 
- `pdf.min.js` (main library)
- `pdf.worker.min.js` (web worker)

**Version**: 3.11.174 or later  
**Download**: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/  
**Purpose**: Parse PDF files and extract text  
**Size**: ~800 KB total  

**Quick Download**:
```bash
cd chrome-extension/libs/external
curl -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
curl -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
```

## Installation Script

Run this script from the `chrome-extension/libs/external` directory:

```bash
#!/bin/bash
# download-external-libs.sh

echo "📦 Downloading external libraries for CUBE Chrome Extension..."
echo ""

# SheetJS
echo "⬇️  Downloading SheetJS (xlsx.full.min.js)..."
curl -L -o xlsx.full.min.js https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js
if [ $? -eq 0 ]; then
  echo "✅ SheetJS downloaded successfully"
else
  echo "❌ Failed to download SheetJS"
fi
echo ""

# PDF.js
echo "⬇️  Downloading PDF.js (pdf.min.js)..."
curl -L -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
if [ $? -eq 0 ]; then
  echo "✅ PDF.js downloaded successfully"
else
  echo "❌ Failed to download PDF.js"
fi
echo ""

echo "⬇️  Downloading PDF.js Worker (pdf.worker.min.js)..."
curl -L -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
if [ $? -eq 0 ]; then
  echo "✅ PDF.js Worker downloaded successfully"
else
  echo "❌ Failed to download PDF.js Worker"
fi
echo ""

# Verify files
echo "📊 Verifying files..."
if [ -f "xlsx.full.min.js" ]; then
  XLSX_SIZE=$(wc -c < xlsx.full.min.js)
  echo "✅ xlsx.full.min.js: $(numfmt --to=iec-i --suffix=B $XLSX_SIZE)"
else
  echo "❌ xlsx.full.min.js not found"
fi

if [ -f "pdf.min.js" ]; then
  PDF_SIZE=$(wc -c < pdf.min.js)
  echo "✅ pdf.min.js: $(numfmt --to=iec-i --suffix=B $PDF_SIZE)"
else
  echo "❌ pdf.min.js not found"
fi

if [ -f "pdf.worker.min.js" ]; then
  WORKER_SIZE=$(wc -c < pdf.worker.min.js)
  echo "✅ pdf.worker.min.js: $(numfmt --to=iec-i --suffix=B $WORKER_SIZE)"
else
  echo "❌ pdf.worker.min.js not found"
fi

echo ""
echo "🎉 Download complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify file sizes match expected values"
echo "2. Load chrome-extension in Chrome (chrome://extensions/)"
echo "3. Test Excel/PDF parsing functionality"
```

## Alternative: CDN Links

If you prefer using CDN links (not recommended for production):

### SheetJS CDN
```html
<script src="https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js"></script>
```

### PDF.js CDN
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
```

## License Information

### SheetJS
- **License**: Apache-2.0
- **Repository**: https://github.com/SheetJS/sheetjs
- **Documentation**: https://docs.sheetjs.com/

### PDF.js
- **License**: Apache-2.0
- **Repository**: https://github.com/mozilla/pdf.js
- **Documentation**: https://mozilla.github.io/pdf.js/

## Troubleshooting

### Files Not Loading
1. Check Chrome DevTools Console for errors
2. Verify files exist in `chrome-extension/libs/external/`
3. Check manifest.json includes files in correct order
4. Reload extension in `chrome://extensions/`

### PDF.js Worker Errors
If you see "Failed to load worker script":
1. Ensure `pdf.worker.min.js` is downloaded
2. Verify manifest.json includes worker in `web_accessible_resources`
3. Check worker path in `parser.js` matches manifest

### SheetJS Not Found
If you see "XLSX is not defined":
1. Ensure `xlsx.full.min.js` loads BEFORE `parser.js`
2. Check content_scripts order in manifest.json
3. Verify file downloaded correctly (should be ~700KB)

### Memory Issues
For large files:
1. Increase Chrome memory limit
2. Use streaming parsers for >10MB files
3. Process files in chunks
4. Consider background script processing

## Testing

After installation, test with:

```javascript
// Test SheetJS
console.log('SheetJS version:', XLSX.version);

// Test PDF.js
console.log('PDF.js version:', pdfjsLib.version);
```

## Production Considerations

For production deployment:
1. ✅ Download files locally (don't use CDN)
2. ✅ Verify file integrity with checksums
3. ✅ Minify and compress if needed
4. ✅ Update manifest.json with correct paths
5. ✅ Test on multiple Chrome versions
6. ✅ Monitor performance with large files
7. ✅ Implement error handling for missing files
8. ✅ Add loading indicators for slow parsing

## File Structure

After installation, your directory should look like:

```
chrome-extension/libs/external/
├── README.md                (this file)
├── xlsx.full.min.js         (~700 KB)
├── pdf.min.js               (~500 KB)
└── pdf.worker.min.js        (~300 KB)
```

Total size: ~1.5 MB

---

**Last Updated**: October 19, 2025  
**Maintainer**: CUBE Development Team  
**Version**: 5.2.0
