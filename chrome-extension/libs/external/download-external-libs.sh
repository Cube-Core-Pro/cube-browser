#!/bin/bash
# download-external-libs.sh
# Downloads external JavaScript libraries for CUBE Chrome Extension

set -e  # Exit on error

echo "📦 CUBE Chrome Extension - External Library Downloader"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to the script's directory
cd "$(dirname "$0")"

echo "📂 Current directory: $(pwd)"
echo ""

# SheetJS
echo -e "${BLUE}⬇️  Downloading SheetJS (xlsx.full.min.js)...${NC}"
curl -L -o xlsx.full.min.js https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ SheetJS downloaded successfully${NC}"
else
  echo -e "${RED}❌ Failed to download SheetJS${NC}"
  exit 1
fi
echo ""

# PDF.js main library
echo -e "${BLUE}⬇️  Downloading PDF.js (pdf.min.js)...${NC}"
curl -L -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ PDF.js downloaded successfully${NC}"
else
  echo -e "${RED}❌ Failed to download PDF.js${NC}"
  exit 1
fi
echo ""

# PDF.js worker
echo -e "${BLUE}⬇️  Downloading PDF.js Worker (pdf.worker.min.js)...${NC}"
curl -L -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ PDF.js Worker downloaded successfully${NC}"
else
  echo -e "${RED}❌ Failed to download PDF.js Worker${NC}"
  exit 1
fi
echo ""

# Verify files
echo -e "${BLUE}📊 Verifying downloaded files...${NC}"
echo ""

if [ -f "xlsx.full.min.js" ]; then
  XLSX_SIZE=$(stat -f%z xlsx.full.min.js 2>/dev/null || stat -c%s xlsx.full.min.js)
  XLSX_SIZE_MB=$(echo "scale=2; $XLSX_SIZE / 1048576" | bc)
  echo -e "${GREEN}✅ xlsx.full.min.js${NC}: $XLSX_SIZE bytes (${XLSX_SIZE_MB} MB)"
  
  # Verify it's a valid JS file
  if head -n 1 xlsx.full.min.js | grep -q "^/"; then
    echo "   Valid JavaScript file detected"
  fi
else
  echo -e "${RED}❌ xlsx.full.min.js not found${NC}"
fi

if [ -f "pdf.min.js" ]; then
  PDF_SIZE=$(stat -f%z pdf.min.js 2>/dev/null || stat -c%s pdf.min.js)
  PDF_SIZE_MB=$(echo "scale=2; $PDF_SIZE / 1048576" | bc)
  echo -e "${GREEN}✅ pdf.min.js${NC}: $PDF_SIZE bytes (${PDF_SIZE_MB} MB)"
else
  echo -e "${RED}❌ pdf.min.js not found${NC}"
fi

if [ -f "pdf.worker.min.js" ]; then
  WORKER_SIZE=$(stat -f%z pdf.worker.min.js 2>/dev/null || stat -c%s pdf.worker.min.js)
  WORKER_SIZE_MB=$(echo "scale=2; $WORKER_SIZE / 1048576" | bc)
  echo -e "${GREEN}✅ pdf.worker.min.js${NC}: $WORKER_SIZE bytes (${WORKER_SIZE_MB} MB)"
else
  echo -e "${RED}❌ pdf.worker.min.js not found${NC}"
fi

echo ""
TOTAL_SIZE=$((XLSX_SIZE + PDF_SIZE + WORKER_SIZE))
TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1048576" | bc)
echo -e "${BLUE}📦 Total size:${NC} $TOTAL_SIZE bytes (${TOTAL_SIZE_MB} MB)"

echo ""
echo -e "${GREEN}🎉 Download complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Load chrome-extension in Chrome (chrome://extensions/)"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select chrome-extension folder"
echo "4. Test Excel/PDF parsing with real files"
echo ""
echo "🔍 To verify libraries loaded correctly, open DevTools Console and run:"
echo "   console.log('SheetJS:', typeof XLSX)"
echo "   console.log('PDF.js:', typeof pdfjsLib)"
echo ""
