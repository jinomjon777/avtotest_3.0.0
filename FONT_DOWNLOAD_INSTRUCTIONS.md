# Font Files Required for Performance Optimization

## Download Instructions

You need to download the following WOFF2 font files and place them in `/public/fonts/` directory:

### Inter Font Files (Latin subset)
1. **inter-400.woff2** - Inter Regular (400)
   - Download from: https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap
   - Extract the WOFF2 URL from the CSS file (look for `src: url(...)`)
   - Save as: `public/fonts/inter-400.woff2`

2. **inter-500.woff2** - Inter Medium (500)
   - Download from: https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap
   - Extract the WOFF2 URL from the CSS file
   - Save as: `public/fonts/inter-500.woff2`

3. **inter-600.woff2** - Inter SemiBold (600)
   - Download from: https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap
   - Extract the WOFF2 URL from the CSS file
   - Save as: `public/fonts/inter-600.woff2`

### Montserrat Font Files (Latin subset)
4. **montserrat-600.woff2** - Montserrat SemiBold (600)
   - Download from: https://fonts.googleapis.com/css2?family=Montserrat:wght@600&display=swap
   - Extract the WOFF2 URL from the CSS file
   - Save as: `public/fonts/montserrat-600.woff2`

5. **montserrat-700.woff2** - Montserrat Bold (700)
   - Download from: https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap
   - Extract the WOFF2 URL from the CSS file
   - Save as: `public/fonts/montserrat-700.woff2`

## Quick Download Method

### Option 1: Using google-webfonts-helper
1. Visit: https://gwfh.mranftl.com/fonts
2. Search for "Inter" and select it
3. Select charsets: latin
4. Select styles: regular (400), 500, 600
5. Click "Download" button
6. Extract and rename files to match the names above
7. Repeat for "Montserrat" with styles: 600, 700

### Option 2: Direct Download via Browser
1. Open each Google Fonts CSS URL above in your browser
2. Copy the WOFF2 URL from the `src: url(...)` line
3. Paste that URL in a new browser tab to download the .woff2 file
4. Save with the correct filename in `public/fonts/`

### Option 3: Using curl (if available)
```bash
# First, get the CSS to find the actual WOFF2 URLs
curl "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&display=swap" -H "User-Agent: Mozilla/5.0"

# Then download each WOFF2 file using the URLs from the CSS
# Example (replace URL with actual URL from CSS):
curl -o public/fonts/inter-400.woff2 "https://fonts.gstatic.com/s/inter/v13/..."
```

## Verification

After downloading all 5 files, verify they exist:
- `public/fonts/inter-400.woff2`
- `public/fonts/inter-500.woff2`
- `public/fonts/inter-600.woff2`
- `public/fonts/montserrat-600.woff2`
- `public/fonts/montserrat-700.woff2`

Then run `npm run build` to test the build.

## Expected File Sizes
- Inter fonts: ~10-15 KB each
- Montserrat fonts: ~12-18 KB each
- Total: ~60-80 KB (much smaller than loading from Google Fonts with network overhead)
