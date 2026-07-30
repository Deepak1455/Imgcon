// --- State Management ---
let files = [], originalFileDetails = [], processedResults = [], currentImageIdx = 0, selectedFormat = null, workerPool = [], activeTool = null, debouncedPreview, lazyLoadObserver, deferredInstallPrompt = null, watermarkImage = null;
const SESSION_STORAGE_KEY = 'imgcon_session_v3';

// --- DOM Elements ---
const allScreens = document.querySelectorAll('.screen');
const homeBtn = document.getElementById('homeBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const previewModal = document.getElementById('previewModal');
const mainContainer = document.querySelector('main.app-container');
const mainFooter = document.getElementById('main-footer');
const cardFooter = document.getElementById('card-footer');

// --- Dynamic External Library Loader ---
const loadedLibraries = {};
function loadExternalLibrary(src) {
    if (loadedLibraries[src]) return loadedLibraries[src];
    loadedLibraries[src] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (err) => {
            delete loadedLibraries[src];
            reject(err);
        };
        document.head.appendChild(script);
    });
    return loadedLibraries[src];
}

// --- PWA Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully.', reg.scope))
            .catch(err => console.error('Service Worker registration failed.', err));
    });
}

// --- Router Maps with Custom Meta Descriptions & Titles for 20 Articles ---
const routes = {
    '/': { screen: 'homeScreen', title: 'ImgCon - Free Online Image Converter, Compressor & Resizer', desc: 'ImgCon is a free online tool to convert, compress, resize, watermark, and clean EXIF metadata from images.' },
    
    '/blog': { screen: 'blogScreen', title: 'ImgCon Blog - Image Optimization, Web Performance & Photography Guides', desc: 'Welcome to ImgCon Blog! Read tutorials, guides, and tips about image compression, WebP, AVIF, and web speed.' },
    '/image-converter': { screen: 'toolScreen', tool: 'converter', title: 'Image Converter - Convert JPG, PNG, WebP, AVIF, PDF Online | ImgCon', desc: 'Convert image formats instantly in your browser. Supports batch PNG, JPG, WebP, AVIF, PDF.' },
    '/image-compressor': { screen: 'toolScreen', tool: 'compressor', title: 'Image Compressor - Reduce Image File Size Online | ImgCon', desc: 'Compress JPG and WebP images without losing quality using target size settings.' },
    '/image-resizer': { screen: 'toolScreen', tool: 'resizer', title: 'Image Resizer - Resize Photo Pixels & Percentage | ImgCon', desc: 'Resize photos by pixels or ratio for Instagram, Facebook, Twitter, and web.' },
    '/image-watermark': { screen: 'toolScreen', tool: 'watermark', title: 'Watermark Tool - Protect Images with Custom Text & Logo | ImgCon', desc: 'Add text or logo watermarks to your photos safely without uploading.' },
    '/exif-cleaner': { screen: 'exifScreen', title: 'EXIF Data Cleaner & GPS Location Remover | ImgCon', desc: 'Inspect camera model, timestamp, and remove GPS location tracking data from JPEG photos.' },
    '/about-us': { screen: 'aboutScreen', title: 'About Us - ImgCon Team Story', desc: 'Learn about ImgCon and our mission to provide 100% private client-side image processing.' },
    '/privacy-policy': { screen: 'privacyScreen', title: 'Privacy Policy - ImgCon', desc: 'Our zero-upload privacy policy guarantees your files never leave your device.' },
    '/terms-conditions': { screen: 'termsScreen', title: 'Terms and Conditions - ImgCon', desc: 'Terms and conditions for using ImgCon online tools.' },
    '/contact-us': { screen: 'contactScreen', title: 'Contact Us - ImgCon Support', desc: 'Get in touch with the ImgCon support team.' },

    // ALL 20 BLOG POSTS MAPPING
    '/blog/png-vs-jpg-difference': { screen: 'blogScreen', title: 'PNG vs JPG: What is the Difference and Which One to Use? | ImgCon Blog', isPost: true, desc: 'Learn differences between PNG and JPG image formats.' },
    '/blog/how-to-reduce-photo-size': { screen: 'blogScreen', title: 'How to Reduce Photo Size Without Losing Quality | ImgCon Blog', isPost: true, desc: 'Step by step guide to shrinking image sizes for faster website speeds.' },
    '/blog/webp-the-future-of-web-images': { screen: 'blogScreen', title: 'Why WebP is the Future of Web Images | ImgCon Blog', isPost: true, desc: 'Discover why Google created WebP and how it speeds up websites.' },
    '/blog/avif-vs-webp-speed-battle': { screen: 'blogScreen', title: 'AVIF vs WebP Speed Battle: Which Format is Better? | ImgCon Blog', isPost: true, desc: 'Detailed comparison between AVIF and WebP next-gen image formats.' },
    '/blog/image-compression-seo-pagespeed': { screen: 'blogScreen', title: 'How Image Compression Boosts SEO & PageSpeed Scores | ImgCon Blog', isPost: true, desc: 'Optimize image file sizes to improve Google Core Web Vitals.' },
    '/blog/best-image-compression-plugins-wordpress': { screen: 'blogScreen', title: 'Best Image Compression Plugins for WordPress | ImgCon Blog', isPost: true, desc: 'Top plugins to optimize WordPress image media libraries.' },
    '/blog/what-is-svg-vector-graphics': { screen: 'blogScreen', title: 'What is SVG Vector Graphics? Complete Guide | ImgCon Blog', isPost: true, desc: 'Learn vector SVG graphics advantages for logos and web design.' },
    '/blog/understanding-exif-data': { screen: 'blogScreen', title: 'Understanding EXIF Data & Photo Location Privacy | ImgCon Blog', isPost: true, desc: 'How EXIF data stores camera settings and GPS locations in photos.' },
    '/blog/how-to-fix-lazy-loading-images': { screen: 'blogScreen', title: 'How to Fix Lazy Loading Image Issues on Websites | ImgCon Blog', isPost: true, desc: 'Fix image lazy loading bugs for smooth web user experience.' },
    '/blog/impact-of-image-format-on-mobile-ux': { screen: 'blogScreen', title: 'Impact of Image Formats on Mobile UX and Load Times | ImgCon Blog', isPost: true, desc: 'How optimized image formats improve mobile browsing experiences.' },
    '/blog/how-to-convert-heic-to-jpg': { screen: 'blogScreen', title: 'How to Convert iPhone HEIC Photos to JPG Easily | ImgCon Blog', isPost: true, desc: 'Convert Apple HEIC images to standard JPG format.' },
    '/blog/retina-display-images-guide': { screen: 'blogScreen', title: 'Retina Display Images Optimization Guide | ImgCon Blog', isPost: true, desc: 'How to serve crisp high-DPI images for modern screens.' },
    '/blog/the-importance-of-image-alt-text': { screen: 'blogScreen', title: 'The Importance of Image Alt Text for SEO & Accessibility | ImgCon Blog', isPost: true, desc: 'Write descriptive Alt Text for image SEO rankings.' },
    '/blog/how-to-watermark-photos-safely': { screen: 'blogScreen', title: 'How to Watermark Photos Safely Without Losing Quality | ImgCon Blog', isPost: true, desc: 'Protect photography copyright with custom logo watermarks.' },
    '/blog/lossy-vs-lossless-compression-explained': { screen: 'blogScreen', title: 'Lossy vs Lossless Image Compression Explained | ImgCon Blog', isPost: true, desc: 'Understand the core technical difference between lossy and lossless algorithms.' },
    '/blog/ico-favicon-generator-guide': { screen: 'blogScreen', title: 'Complete Guide to Creating ICO Favicons for Websites | ImgCon Blog', isPost: true, desc: 'Generate multi-resolution ICO favicons for browsers.' },
    '/blog/image-seo-best-practices': { screen: 'blogScreen', title: 'Top 10 Image SEO Best Practices to Rank on Google Images | ImgCon Blog', isPost: true, desc: 'Rank higher on Google Image search with image SEO tactics.' },
    '/blog/optimizing-e-commerce-product-photos': { screen: 'blogScreen', title: 'How to Optimize E-Commerce Product Photos for Sales | ImgCon Blog', isPost: true, desc: 'Fast product photo loading strategies for online stores.' },
    '/blog/how-to-batch-resize-images-fast': { screen: 'blogScreen', title: 'How to Batch Resize Dozens of Images Fast | ImgCon Blog', isPost: true, desc: 'Resize multiple images at once without software.' },
    '/blog/future-of-ai-image-optimization': { screen: 'blogScreen', title: 'The Future of AI Image Optimization & Upscaling | ImgCon Blog', isPost: true, desc: 'How AI neural networks are transforming web image compression.' }
};

// --- Smart Clean URLs HTML5 Router Engine (No Home Screen Fallback Bug) ---
const router = async () => {
    // 1. यूआरएल को साफ़ करें (Trailing Slash हटाएं)
    let path = window.location.pathname || '/';
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    // 2. राउट चेक करें
    let route = routes[path];

    // 🔥 Dynamic Wildcard: अगर लिंक /blog/ से शुरू होता है तो blogScreen खोलें
    if (!route && path.startsWith('/blog/')) {
        route = {
            screen: 'blogScreen',
            title: 'ImgCon Blog',
            isPost: true,
            desc: 'Read image optimization guides and tutorials on ImgCon.'
        };
    }

    // 3. अगर कोई भी राउट न मिले तभी होम स्क्रीन पर जाएं
    if (!route) {
        route = routes['/'];
        path = '/';
    }

    // Document Title Update
    document.title = route.title;

    // Dynamically update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && route.desc) {
        metaDesc.setAttribute("content", route.desc);
    }

    // Dynamically update Canonical Link for imgcon.online
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
        canonicalTag.setAttribute("href", "https://imgcon.online" + path);
    }

    if (route.screen === 'blogScreen') {
        if (activeTool) resetTool();
        showPage('blogScreen');
        
        // imgconblog.js के फ़ंक्शन से ब्लॉग कंटेंट रेंडर करें
        if (typeof handleRouteChanges === 'function') {
            handleRouteChanges();
        } else {
            // 🔥 FIX: अगर imgconblog.js लोड होने में समय ले, तो blogModuleReady इवेंट का इंतज़ार करें
            window.addEventListener('blogModuleReady', () => {
                if (typeof handleRouteChanges === 'function') handleRouteChanges();
            }, { once: true });
        }
    } else if (route.screen === 'exifScreen') {
        if (activeTool) resetTool();
        showPage('exifScreen');
        if (window.ExifModule && typeof window.ExifModule.renderUI === 'function') {
            window.ExifModule.renderUI('exifToolApp');
        }
    } else if (route.tool) {
        if (activeTool !== route.tool) {
            if (activeTool) resetTool();
            showTool(route.tool);
        }
    } else {
        if (activeTool) resetTool();
        showPage(route.screen);
    }
};

// Clean Navigation Interceptor (Without '#' in URL)
const navigateTo = (e) => {
    const link = e.target.closest('a');
    if (link) {
        if (link.hasAttribute('download') || link.href.startsWith('blob:') || link.hostname !== window.location.hostname || link.href.includes('mailto:') || link.target) {
            return; 
        }
        e.preventDefault();
        
        const targetPath = link.pathname;
        if (window.location.pathname !== targetPath) {
            history.pushState(null, '', targetPath);
            router();
        }
    }
};

// --- Web Worker Engine ---
function initializeWorkerPool() {
    if (workerPool.length > 0) return; 
    const numWorkers = navigator.hardwareConcurrency || 4;
    const workerCode = `self.onmessage=async e=>{let{imageBitmap:t,fileName:i,fileIndex:o,tool:a,options:s}=e.data;try{let e,n;const l=new OffscreenCanvas(t.width,t.height),d=l.getContext("2d");if(d.drawImage(t,0,0),"resizer"===a||"watermark"===a){const{newWidth:e,newHeight:i}=s;l.width=e,l.height=i,d.drawImage(t,0,0,e,i)}if("watermark"===a){const{watermarkType:t,watermarkText:i,watermarkOpacity:o,watermarkScale:a,watermarkPosition:n,watermarkBitmap:r}=s,c=l.width*.03;let m,h;if(d.globalAlpha=o,"text"===t){const e=Math.max(12,.1*l.width*a);d.font=\`bold \${e}px Arial\`,d.fillStyle="white",d.shadowColor="rgba(0,0,0,0.7)",d.shadowBlur=5,d.shadowOffsetX=2,d.shadowOffsetY=2;const s={x:0,y:0};switch(n){case"top-left":case"center-left":case"bottom-left":d.textAlign="left",s.x=c;break;case"top-center":case"center":case"bottom-center":d.textAlign="center",s.x=l.width/2;break;case"top-right":case"center-right":case"bottom-right":d.textAlign="right",s.x=l.width-c}switch(n){case"top-left":case"top-center":case"top-right":d.textBaseline="top",s.y=c;break;case"center-left":case"center":case"center-right":d.textBaseline="middle",s.y=l.height/2;break;case"bottom-left":case"bottom-center":case"bottom-right":d.textBaseline="bottom",s.y=l.height-c}d.fillText(i,s.x,s.y)}else if("image"===t&&r){const t=r.width/r.height;let e=l.width*a,i=e/t;i>l.height*a&&(i=l.height*a,e=i*t);const o={x:0,y:0};switch(n){case"top-left":case"center-left":case"bottom-left":o.x=c;break;case"top-center":case"center":case"bottom-center":o.x=(l.width-e)/2;break;case"top-right":case"center-right":case"bottom-right":o.x=l.width-e-c}switch(n){case"top-left":case"top-center":case"top-right":o.y=c;break;case"center-left":case"center":case"center-right":o.y=(l.height-i)/2;break;case"bottom-left":case"bottom-center":case"bottom-right":o.y=l.height-i-c}d.drawImage(r,o.x,o.y,e,i)}}const r="image/"+(s.format||"jpeg"),c=await l.convertToBlob({type:r,quality:s.quality});self.postMessage({success:!0,blob:c,fileName:i,intendedFormat:s.format||"jpeg",fileIndex:o,newWidth:l.width,newHeight:l.height})}catch(e){self.postMessage({success:!1,error:e.message,fileName:i,fileIndex:o})}}`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    for (let i = 0; i < numWorkers; i++) workerPool.push({ worker: new Worker(workerUrl), busy: false });
}

// --- UI Navigation ---
function showPage(pageId) {
    allScreens.forEach(s => s.classList.add('hidden'));
    const activeScreen = document.getElementById(pageId);
    if (activeScreen) {
         activeScreen.classList.remove('hidden');
         requestAnimationFrame(() => {
             const h = activeScreen.clientHeight;
             requestAnimationFrame(() => {
                 if (mainContainer) mainContainer.style.minHeight = h + 'px';
             });
         });
    }

    const isHomePage = pageId === 'homeScreen';
    if (homeBtn) homeBtn.classList.toggle('hidden', isHomePage);
    
    if (isHomePage) {
        if (mainFooter) mainFooter.style.display = 'block';
        if (cardFooter) cardFooter.style.display = 'none';
    } else {
        if (mainFooter) mainFooter.style.display = 'none';
        if (cardFooter) cardFooter.style.display = 'block';
    }
    
    if (pageId !== 'toolScreen') activeTool = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTool(toolName, preloadedFiles = null) {
    activeTool = toolName;
    showPage('toolScreen');
    setupToolUI(activeTool);
    if (preloadedFiles) handleFiles(preloadedFiles);
}

// ==========================================================================
// DYNAMIC TOOL HEADER METADATA MAP
// ==========================================================================
const toolMetaDetails = {
    converter: {
        badge: "⚡ 100% Private Format Converter",
        title: "Image Converter & Batch Format Switcher",
        desc: "Convert PNG, JPG, WebP, AVIF, HEIC, PDF & ICO formats instantly in your browser. Batch processing with 100% private zero-server upload.",
        prompt: "Drag & drop or browse images from your device to start converting"
    },
    compressor: {
        badge: "📉 100% Private File Size Reducer",
        title: "Image Compressor & Size Optimizer",
        desc: "Shrink JPG, WebP & PNG file sizes up to 90% without losing visual quality. Set custom target KB/MB sizes with live comparison preview.",
        prompt: "Drag & drop or browse photos from your device to start compressing"
    },
    resizer: {
        badge: "📐 100% Private Image Resizer",
        title: "Image Resizer & Dimension Scaler",
        desc: "Resize photos by exact pixels or percentage. Maintain aspect ratio lock and apply built-in social media presets for Instagram, Facebook & Twitter.",
        prompt: "Drag & drop or browse photos from your device to start resizing"
    },
    watermark: {
        badge: "🛡️ 100% Private Copyright Protection",
        title: "Image Watermark & Logo Overlay Tool",
        desc: "Protect your photography copyright with custom text or transparent logo watermarks. Full opacity, scale, and positioning control.",
        prompt: "Drag & drop or browse photos from your device to add watermarks"
    }
};

// ==========================================================================
// SETUP TOOL UI ENGINE (SMOOTH & FAST RENDERING)
// ==========================================================================
function setupToolUI(toolName) {
    activeTool = toolName;
    selectedFormat = null;
    
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;

    const toolTemplate = document.getElementById('toolLayoutTemplate');
    if (!toolTemplate) return;

    // Clone Tool Base Layout
    const toolLayout = toolTemplate.content.cloneNode(true);
    toolScreen.innerHTML = '';
    toolScreen.appendChild(toolLayout);

    // Populate Dynamic Tool Header Banner Text
    const meta = toolMetaDetails[toolName];
    if (meta) {
        const badgeEl = toolScreen.querySelector('.tool-header-badge');
        const titleEl = toolScreen.querySelector('.tool-header-title');
        const descEl = toolScreen.querySelector('.tool-header-desc');
        const promptEl = toolScreen.querySelector('.tool-header-prompt');

        if (badgeEl) badgeEl.textContent = meta.badge;
        if (titleEl) titleEl.textContent = meta.title;
        if (descEl) descEl.textContent = meta.desc;
        if (promptEl) promptEl.innerHTML = `${meta.prompt} or <span class="text-indigo-500 underline font-bold cursor-pointer">click to browse</span>`;
    }

    // Clone & Append Specific Tool Options
    const optionsContainer = toolScreen.querySelector('.options-container');
    const optionsTemplate = document.getElementById(`${toolName}OptionsTemplate`);
    if (optionsContainer && optionsTemplate) {
        optionsContainer.appendChild(optionsTemplate.content.cloneNode(true));
    }
    
    // Configure File Input Constraints
    const fileInput = toolScreen.querySelector('.file-input');
    const addMoreInput = toolScreen.querySelector('.add-more-files-input');
    const acceptType = (toolName === 'compressor') ? 'image/jpeg, image/webp' : 'image/*';

    if (fileInput) fileInput.accept = acceptType;
    if (addMoreInput) addMoreInput.accept = acceptType;

    // Attach Action Event Listeners to New Screen DOM
    attachToolEventListeners(toolScreen);

    // 🔥 AUTOMATIC SEO GUIDE & ACCORDION FAQS RENDERER
    if (typeof renderToolSeoGuide === 'function') {
        renderToolSeoGuide(toolName, toolScreen);
    }
}
// ==========================================================================
// RESET TOOL & MEMORY CLEANUP ENGINE (ZERO MEMORY LEAKS & NO WHITE SCREEN)
// ==========================================================================
function resetTool(softReset = false) {
    // 1. Revoke Blob Preview URLs
    if (Array.isArray(files)) {
        files.forEach(f => { 
            if (f && f.previewUrl) {
                try { URL.revokeObjectURL(f.previewUrl); } catch (e) {}
            } 
        });
    }
    
    // 2. Revoke Processed Output Blobs
    if (Array.isArray(processedResults) && processedResults.length > 0) {
        processedResults.forEach(r => {
            if (r && r.blob) {
                try { 
                    const blobUrl = URL.createObjectURL(r.blob);
                    URL.revokeObjectURL(blobUrl); 
                } catch (e) {}
            }
        });
    }

    // 3. Free Watermark Image Bitmap Memory
    if (watermarkImage && typeof watermarkImage.close === 'function') {
        try { watermarkImage.close(); } catch (e) {}
    }
    
    const currentTool = activeTool;

    // 4. Reset Global Application State
    files = []; 
    originalFileDetails = []; 
    processedResults = []; 
    selectedFormat = null; 
    currentImageIdx = 0; 
    watermarkImage = null;
    
    const toolScreen = document.getElementById('toolScreen');
    
    // 5. Smart UI Recovery (Restores Initial Drop Zone smoothly)
    if ((softReset || (toolScreen && !toolScreen.classList.contains('hidden'))) && currentTool) {
        setupToolUI(currentTool);
    } else {
        activeTool = null;
        if (toolScreen) toolScreen.innerHTML = ''; 
    }
}

// --- Core App Functionality (Memory Safe File Handler) ---
function handleFiles(fileList, isAddingMore = false) {
    let newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;
    
    // Safety check: नई फ़ाइल्स अपलोड होने पर पुरानी फ़ाइल्स की RAM मेमोरी साफ़ करें
    if (!isAddingMore && files.length > 0) {
        files.forEach(f => {
            if (f && f.previewUrl) {
                try { URL.revokeObjectURL(f.previewUrl); } catch (e) {}
            }
        });
    }

    newFiles.forEach(file => {
        file.previewUrl = URL.createObjectURL(file);
    });

    if (isAddingMore) {
        const startIndex = files.length;
        files.push(...newFiles);
        populateFileDetails(newFiles, startIndex).then(() => {
            displayFiles();
            renderFileManagementUI();
            showFilePreview(files.length - 1);
            triggerRealtimeSizeUpdate();
        });
    } else {
        files = newFiles;
        confirmSelection();
    }
}
async function populateFileDetails(fileList, startIndex = 0) {
    await Promise.all(fileList.map((file, i) => new Promise(resolve => {
        const index = startIndex + i;
        const img = new Image();
        img.onload = () => { 
            originalFileDetails[index] = { width: img.width, height: img.height, size: file.size, name: file.name, type: file.type, ratio: img.width / img.height }; 
            resolve(); 
        };
        img.onerror = () => { 
            originalFileDetails[index] = { width: 0, height: 0, size: file.size, name: file.name, type: file.type, ratio: 0 }; 
            resolve(); 
        };
        img.src = file.previewUrl;
    })));
}

async function confirmSelection() {
    const toolScreen = document.getElementById('toolScreen');
    const processUI = toolScreen.querySelector('.process-ui');
    const dropZoneContainer = toolScreen.querySelector('.drop-zone-container');
    
    if (dropZoneContainer) dropZoneContainer.classList.add('hidden');
    if (processUI) {
        processUI.classList.remove('hidden');
        processUI.classList.add('animate__animated', 'animate__fadeInUp');
    }
    
    await populateFileDetails(files);
    displayFiles();
    renderFileManagementUI();
    showFilePreview(0);
    
    if (activeTool === 'resizer' && originalFileDetails[0]) {
        const widthInput = toolScreen.querySelector('#resize-width');
        const heightInput = toolScreen.querySelector('#resize-height');
        if (widthInput && heightInput) {
            widthInput.value = originalFileDetails[0].width;
            heightInput.value = originalFileDetails[0].height;
        }
    }
    
    triggerRealtimeSizeUpdate();
}

function displayFiles() {
    const toolScreen = document.getElementById('toolScreen');
    const galleryContainer = toolScreen.querySelector('.gallery-container');
    galleryContainer.innerHTML = files.map(file => `<div class="gallery-item w-full h-full flex-shrink-0 flex items-center justify-center p-2"><img src="${file.previewUrl}" class="max-w-full max-h-full object-contain" loading="lazy"></div>`).join('');
}

function showFilePreview(index) {
    if (index < 0 || index >= files.length) return;
    currentImageIdx = index;
    const toolScreen = document.getElementById('toolScreen');
    toolScreen.querySelector('.gallery-container').style.transform = `translateX(-${index * 100}%)`;
    toolScreen.querySelector('.current-image-index').textContent = index + 1;
    toolScreen.querySelector('.total-images').textContent = files.length;
    
    if (activeTool === 'resizer' && originalFileDetails[index]) {
        const widthInput = toolScreen.querySelector('#resize-width');
        const heightInput = toolScreen.querySelector('#resize-height');
        if (widthInput && heightInput) {
            widthInput.value = originalFileDetails[index].width;
            heightInput.value = originalFileDetails[index].height;
        }
    }
}

function renderFileManagementUI() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen.querySelector('.file-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = files.map((file, index) => {
        const details = originalFileDetails[index] || { size: file.size, width: '?', height: '?' };
        return `<div class="file-item flex items-center gap-2 p-1.5 rounded-md hover:bg-card-bg cursor-grab transition-all border border-transparent hover:border-indigo-200" draggable="true" data-index="${index}"><img src="${file.previewUrl}" class="w-10 h-10 object-cover rounded shadow-sm" loading="lazy"><div class="flex-grow truncate text-xs"><p class="font-bold truncate" style="color: var(--text-dark);">${file.name}</p><p class="text-xxs text-light" style="color: var(--text-light);">${formatBytes(details.size)} &middot; ${details.width}x${details.height}</p></div><button class="delete-file-btn p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" data-index="${index}"><i class="fas fa-times"></i></button></div>`;
    }).join('');
    
    attachFileManagementListeners();
    initDragAndDropReorder(listContainer);
}

function initDragAndDropReorder(listContainer) {
    let dragSrcEl = null;
    const items = listContainer.querySelectorAll('.file-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            dragSrcEl = item;
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('opacity-40');
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            return false;
        });
        item.addEventListener('dragenter', () => {
            item.classList.add('bg-indigo-50', 'dark:bg-indigo-950/30', 'border-indigo-300');
        });
        item.addEventListener('dragleave', () => {
            item.classList.remove('bg-indigo-50', 'dark:bg-indigo-950/30', 'border-indigo-300');
        });
        item.addEventListener('drop', (e) => {
            e.stopPropagation();
            if (dragSrcEl !== item) {
                const srcIndex = parseInt(dragSrcEl.dataset.index, 10);
                const targetIndex = parseInt(item.dataset.index, 10);
                
                const tempFile = files[srcIndex];
                files[srcIndex] = files[targetIndex];
                files[targetIndex] = tempFile;
                
                const tempDetails = originalFileDetails[srcIndex];
                originalFileDetails[srcIndex] = originalFileDetails[targetIndex];
                originalFileDetails[targetIndex] = tempDetails;
                
                displayFiles();
                renderFileManagementUI();
                showFilePreview(targetIndex);
            }
            return false;
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('opacity-40');
            items.forEach(i => i.classList.remove('bg-indigo-50', 'dark:bg-indigo-950/30', 'border-indigo-300'));
        });
    });
}

function deleteFile(index) {
    if (files[index] && files[index].previewUrl) {
        try { URL.revokeObjectURL(files[index].previewUrl); } catch (e) {}
    }
    files.splice(index, 1);
    originalFileDetails.splice(index, 1);
    
    // 🔥 FIX: सब फ़ाइल्स डिलीट होने पर सॉफ्ट रिसेट (Soft Reset) करें ताकि व्हाइट स्क्रीन न आये
    if (files.length === 0) { 
        resetTool(true); 
        return; 
    }
    
    if (currentImageIdx >= files.length) {
        currentImageIdx = files.length - 1;
    }
    
    displayFiles(); 
    renderFileManagementUI(); 
    showFilePreview(currentImageIdx);
    
    if (typeof triggerRealtimeSizeUpdate === 'function') {
        triggerRealtimeSizeUpdate();
    }
}

function attachFileManagementListeners() {
    const toolScreen = document.getElementById('toolScreen');
    const listContainer = toolScreen?.querySelector('.file-list-container');
    if (!listContainer) return;
    
    // सुरक्षित और क्लीन इवेंट डेलिगेशन
    listContainer.onclick = e => { 
        const deleteBtn = e.target.closest('.delete-file-btn'); 
        if (deleteBtn) {
            e.stopPropagation();
            deleteFile(parseInt(deleteBtn.dataset.index, 10)); 
        }
    };
}

function runSingleCompressionPromise(workerItem, file, quality, targetWidth, targetHeight, format) {
    return new Promise(async (resolve) => {
        try {
            workerItem.worker.onmessage = (e) => {
                resolve(e.data);
            };
            const imageBitmap = await createImageBitmap(file);
            workerItem.worker.postMessage({
                imageBitmap,
                fileName: file.name,
                fileIndex: 0,
                tool: 'compressor',
                options: { quality, format, newWidth: targetWidth, newHeight: targetHeight }
            }, [imageBitmap]);
        } catch (err) {
            // एरर आने पर प्रॉमिस हैंग होने से बचाएं
            resolve({ success: false, error: err.message });
        }
    });
}

// --- Dynamic PDF Compilation Handler (Centered & Perfect Page Fit) ---
async function compilePDF(results) {
    await loadExternalLibrary('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
    const { jsPDF } = window.jspdf;
    
    // Standard A4 PDF Document (210mm x 297mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxW = pdfWidth - (margin * 2);
    const maxH = pdfHeight - (margin * 2);
    
    for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (i > 0) pdf.addPage();
        
        const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(res.blob);
        });
        
        const imgW = res.newWidth || 800;
        const imgH = res.newHeight || 600;
        const ratio = Math.min(maxW / imgW, maxH / imgH);
        
        // इमेजेस को A4 पेज के सेंटर में परफेक्ट फ़िट करें
        const finalW = imgW * ratio;
        const finalH = imgH * ratio;
        const posX = (pdfWidth - finalW) / 2;
        const posY = (pdfHeight - finalH) / 2;
        
        pdf.addImage(dataUrl, 'JPEG', posX, posY, finalW, finalH);
    }
    return pdf.output('blob');
}
// --- Web Worker Process Flow ---
async function processFiles() {
    const toolScreen = document.getElementById('toolScreen');
    if (activeTool === 'converter' && !selectedFormat) { showToast('Please select an output format.'); return; }

    toolScreen.querySelector('.options-container').classList.add('hidden');
    toolScreen.querySelector('.output-section .start-btn').classList.add('hidden');
    const conversionProcess = toolScreen.querySelector('.conversion-process');
    conversionProcess.classList.remove('hidden');
    toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-cog fa-spin mr-2"></i>Processing...`;

    initializeWorkerPool();
    const results = new Array(files.length);
    let filesProcessed = 0;
    
    let qualitySlider = toolScreen.querySelector('.quality-slider');
    let qualityVal = qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.85;

    const isTargetSizeActive = document.getElementById('target-size-toggle')?.checked;
    
    for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const originalDetails = originalFileDetails[index];
        let targetWidth = originalDetails.width;
        let targetHeight = originalDetails.height;

        if (activeTool === 'resizer') {
            const mode = toolScreen.querySelector('.resize-by-btn.active').dataset.mode;
            if (mode === 'pixels') {
                targetWidth = parseInt(document.getElementById('resize-width').value, 10) || originalDetails.width;
                targetHeight = parseInt(document.getElementById('resize-height').value, 10) || originalDetails.height;
            } else {
                const scale = parseInt(document.getElementById('percentage-slider').value, 10) / 100;
                targetWidth = Math.round(originalDetails.width * scale);
                targetHeight = Math.round(originalDetails.height * scale);
            }
        }

        const formatExt = selectedFormat || file.type.split('/')[1] || 'jpeg';

        if (activeTool === 'compressor' && isTargetSizeActive) {
            const targetSizeInputVal = parseFloat(document.getElementById('target-size-kb-input').value) || 100;
            const targetUnit = document.getElementById('target-size-unit-select').value;
            const targetBytes = targetSizeInputVal * (targetUnit === 'MB' ? 1024 * 1024 : 1024);

            toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-search-dollar fa-spin mr-2"></i>Finding optimal settings...`;
            
            let low = 0.05, high = 0.98, bestResult = null;
            const freeWorker = workerPool.find(w => !w.busy) || workerPool[0];
            if (freeWorker) {
                freeWorker.busy = true;
                for (let iter = 0; iter < 5; iter++) {
                    let mid = (low + high) / 2;
                    let trailResult = await runSingleCompressionPromise(freeWorker, file, mid, targetWidth, targetHeight, formatExt);
                    if (trailResult.success) {
                        if (trailResult.blob.size <= targetBytes) {
                            bestResult = trailResult;
                            low = mid + 0.01;
                        } else {
                            high = mid - 0.01;
                        }
                    }
                }
                freeWorker.busy = false;
                if (bestResult) {
                    bestResult.fileIndex = index;
                    results[index] = bestResult;
                } else {
                    const defaultResult = await runSingleCompressionPromise(freeWorker, file, 0.1, targetWidth, targetHeight, formatExt);
                    defaultResult.fileIndex = index;
                    results[index] = defaultResult;
                }
                filesProcessed++;
                toolScreen.querySelector('.progress-bar-fill').style.width = `${(filesProcessed / files.length) * 100}%`;
                if (filesProcessed === files.length) {
                    toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Complete!`;
                    setTimeout(() => handleCompletion(results), 500);
                }
            }
            continue;
        }

        const options = { 
            quality: qualityVal, 
            format: formatExt,
            newWidth: targetWidth,
            newHeight: targetHeight
        };

        if (activeTool === 'watermark') {
            const activeType = toolScreen.querySelector('.watermark-type-btn.active').dataset.type;
            const textValue = document.getElementById('watermark-text')?.value || '© ImgCon';
            const opacity = parseInt(document.getElementById('opacity-slider')?.value || '70', 10) / 100;
            const scale = parseInt(document.getElementById('scale-slider')?.value || '20', 10) / 100;
            const position = toolScreen.querySelector('.position-btn.active')?.dataset.position || 'center';
            
            options.newWidth = originalDetails.width;
            options.newHeight = originalDetails.height;
            options.watermarkType = activeType;
            options.watermarkText = textValue;
            options.watermarkOpacity = opacity;
            options.watermarkScale = scale;
            options.watermarkPosition = position;
            options.watermarkBitmap = watermarkImage || null;
        }

        const freeWorker = workerPool.find(w => !w.busy) || workerPool[0];
        if (freeWorker) {
            freeWorker.busy = true;
            freeWorker.worker.onmessage = e => {
                if (e.data.success) results[e.data.fileIndex] = e.data;
                filesProcessed++;
                toolScreen.querySelector('.progress-bar-fill').style.width = `${(filesProcessed / files.length) * 100}%`;
                freeWorker.busy = false;
                if (filesProcessed === files.length) {
                    toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Complete!`;
                    setTimeout(() => handleCompletion(results), 500);
                }
            };
            const imageBitmap = await createImageBitmap(file);
            freeWorker.worker.postMessage({ imageBitmap, fileName: file.name, fileIndex: index, tool: activeTool, options }, [imageBitmap]);
        }
    }
}

async function handleCompletion(results) {
    const toolScreen = document.getElementById('toolScreen');
    processedResults = results;
    const resultsContainer = toolScreen.querySelector('.results-container');
    resultsContainer.innerHTML = '';
    
    if (activeTool === 'converter' && selectedFormat === 'pdf') {
        toolScreen.querySelector('.processing-text').innerHTML = `<i class="fas fa-file-pdf text-red-500 mr-2"></i>Compiling PDF...`;
        const pdfBlob = await compilePDF(results);
        processedResults = [{ blob: pdfBlob, fileName: 'compiled_images.pdf', intendedFormat: 'pdf', fileIndex: 0 }];
    }

    resultsContainer.insertAdjacentHTML('beforeend', `
        <div class="results-summary text-center p-4 rounded-2xl mb-6 border animate__animated animate__fadeIn" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
            <h3 class="text-sm font-black uppercase tracking-wider text-indigo-500">Processing Complete!</h3>
            <p class="text-xs font-semibold" style="color: var(--text-light);">Successfully processed ${processedResults.length} file(s).</p>
        </div>
    `);
    
    processedResults.forEach((res, i) => {
        const originalFile = files[res.fileIndex];
        const originalDetails = originalFileDetails[res.fileIndex];
        const isPdf = res.intendedFormat === 'pdf';
        
        const savedPercent = Math.round(((originalDetails.size - res.blob.size) / originalDetails.size) * 100);
        const isSavedPositive = savedPercent >= 0;
        const downloadUrl = URL.createObjectURL(res.blob);
        
        const fileNode = document.createElement('div');
        fileNode.className = 'result-card p-5 sm:p-6 rounded-2xl border mb-5 shadow-sm hover:shadow-md transition-all duration-300 animate__animated animate__slideInUp';
        fileNode.style.borderColor = 'var(--card-border)';
        fileNode.style.backgroundColor = 'var(--card-bg)';
        
        fileNode.innerHTML = `
            <div class="flex items-center gap-4 mb-5 border-b pb-4" style="border-color: var(--bg-subtle);">
                <div class="relative w-14 h-14 rounded-xl overflow-hidden border shadow-sm" style="border-color: var(--card-border);">
                    <img src="${originalFile.previewUrl}" class="w-full h-full object-cover" loading="lazy">
                </div>
                <div class="flex-grow truncate">
                    <h4 class="font-bold text-sm truncate" style="color: var(--text-dark);">${res.fileName}</h4>
                    <div class="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider" style="background-color: var(--bg-subtle); color: var(--text-light);">
                        <span>${originalFile.type.split('/')[1]?.toUpperCase() || 'IMG'}</span>
                        <i class="fas fa-arrow-right text-xxs opacity-60"></i>
                        <span style="color: var(--primary-color);">${res.intendedFormat ? res.intendedFormat.toUpperCase() : 'OUT'}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-center mb-5 p-3 rounded-xl" style="background-color: var(--bg-subtle);">
                <div class="border-r" style="border-color: var(--card-border);">
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">Before</p>
                    <p class="text-lg font-black mt-1" style="color: var(--text-dark);">${formatBytes(originalDetails.size)}</p>
                    <p class="text-xxs font-semibold opacity-75" style="color: var(--text-light);">${originalDetails.width} x ${originalDetails.height}px</p>
                </div>
                <div>
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">After</p>
                    <p class="text-lg font-black mt-1 ${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">${formatBytes(res.blob.size)}</p>
                    <p class="text-xxs font-semibold opacity-75" style="color: var(--text-light);">${res.newWidth || originalDetails.width} x ${res.newHeight || originalDetails.height}px</p>
                </div>
            </div>

            <div class="space-y-2 mb-6">
                <div class="flex justify-between items-center text-xs font-bold">
                    <span style="color: var(--text-light);">${isSavedPositive ? 'File Size Reduced' : 'Lossless Re-encoding Increase'}</span>
                    <span class="${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">
                        Saved: ${isSavedPositive ? '+' : ''}${savedPercent}%
                    </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: var(--bg-main);">
                    <div class="savings-bar-fill h-full rounded-full transition-all duration-1000 ease-out" 
                         style="width: 0%; background: ${isSavedPositive ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'};">
                    </div>
                </div>
                ${!isSavedPositive ? `
                    <p class="text-xxs font-semibold opacity-80 mt-1" style="color: var(--text-light);">
                        💡 Pro-tip: Convert PNG to WEBP/AVIF format for efficient client-side savings.
                    </p>
                ` : ''}
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3">
                ${!isPdf ? `
                    <button class="preview-before-after-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800" style="background-color: var(--card-bg); border-color: var(--card-border); color: var(--text-dark);" data-index="${i}">
                        <i class="fas fa-eye text-sm opacity-85"></i> Preview
                    </button>
                ` : ''}
                <a href="${downloadUrl}" download="${res.fileName}" class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:opacity-90 text-white" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); border-color: var(--primary-color);">
                    <i class="fas fa-download text-sm"></i> Download
                </a>
                <button class="delete-result-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 hover:bg-red-50 hover:text-red-600" style="background-color: var(--card-bg); border-color: var(--card-border); color: var(--text-dark);" data-index="${i}">
                    <i class="fas fa-trash-alt text-sm opacity-85"></i> Delete
                </button>
            </div>
        `;
        
        resultsContainer.appendChild(fileNode);
        
        setTimeout(() => {
            const bar = fileNode.querySelector('.savings-bar-fill');
            if (bar) {
                bar.style.width = isSavedPositive ? `${savedPercent}%` : `${Math.abs(savedPercent)}%`;
            }
        }, 150);
    });

    resultsContainer.querySelectorAll('.preview-before-after-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.closest('.preview-before-after-btn').dataset.index, 10);
            openComparisonModal(idx);
        });
    });

    resultsContainer.querySelectorAll('.delete-result-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.closest('.delete-result-btn').dataset.index, 10);
            processedResults.splice(idx, 1);
            if (processedResults.length === 0) {
                resetTool();
            } else {
                handleCompletion(processedResults);
            }
        });
    });

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn upload-button w-full justify-center py-3.5 text-sm mt-4 shadow-md';
    downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-3"></i><span>Download All (ZIP)</span>`;
    
    downloadBtn.onclick = async () => {
        if (processedResults.length > 1) {
            downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-3"></i><span>Creating ZIP...</span>`;
            try {
                await Promise.all([
                    loadExternalLibrary('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'),
                    loadExternalLibrary('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js')
                ]);
                const zip = new JSZip();
                processedResults.forEach(r => zip.file(r.fileName.replace(/\.[^/.]+$/, "") + '.' + r.intendedFormat, r.blob));
                const zipBlob = await zip.generateAsync({ type: "blob" });
                saveAs(zipBlob, `optimized_images.zip`);
            } catch (err) {
                showToast("Failed to compile ZIP archive.");
            } finally {
                downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-3"></i><span>Download All (ZIP)</span>`;
            }
        } else {
            await loadExternalLibrary('https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js');
            saveAs(processedResults[0].blob, processedResults[0].fileName);
        }
    };
    
    if (processedResults.length > 1) {
        resultsContainer.appendChild(downloadBtn);
    }
    
    toolScreen.querySelector('.conversion-process').classList.add('hidden');
    resultsContainer.classList.remove('hidden');
}

// --- Open Comparison Modal ---
function openComparisonModal(index) {
    const result = processedResults[index];
    const originalFile = files[result.fileIndex];
    const splitDirection = document.getElementById('split-orientation')?.value || 'horizontal-split';

    const container = document.getElementById('modalPreviewContainer');
    container.className = `before-after-container h-full w-full ${splitDirection}`;
    
    const beforeImg = container.querySelector('.before-image');
    const afterImg = container.querySelector('.after-image');
    
    beforeImg.src = originalFile.previewUrl;
    afterImg.src = URL.createObjectURL(result.blob);
    
    document.getElementById('modalFileName').textContent = `Quality Comparison: ${result.fileName}`;
    previewModal.classList.add('show');
    
    const viewport = container.querySelector('.comparison-viewport');
    if (viewport) {
        viewport.style.transform = `translate(0px, 0px) scale(1)`;
    }

    initBeforeAfterSlider(container);
}

// --- Zoom & Pan Before-After Slider System ---
function initBeforeAfterSlider(container) {
    const slider = container.querySelector('.before-after-slider');
    const clipper = container.querySelector('.before-image-clipper');
    const viewport = container.querySelector('.comparison-viewport');
    
    if (!slider || !clipper || !viewport) return;
    
    let isSliderDragging = false;
    let isPanning = false;
    
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let startX = 0;
    let startY = 0;

    const isVertical = container.classList.contains('vertical-split');

    const updateSliderPosition = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        if (isVertical) {
            let y = clientY - rect.top;
            if (y < 0) y = 0;
            if (y > rect.height) y = rect.height;
            const pct = (y / rect.height) * 100;
            slider.style.top = `${pct}%`;
            clipper.style.clipPath = `inset(0 0 ${100 - pct}% 0)`;
        } else {
            let x = clientX - rect.left;
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;
            const pct = (x / rect.width) * 100;
            slider.style.left = `${pct}%`;
            clipper.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        }
    };

    const updateViewportTransform = () => {
        viewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    };

    const handleDown = (e) => {
        const target = e.target;
        if (target === slider || slider.contains(target)) {
            isSliderDragging = true;
            e.preventDefault();
        } else {
            isPanning = true;
            startX = (e.touches ? e.touches[0].clientX : e.clientX) - translateX;
            startY = (e.touches ? e.touches[0].clientY : e.clientY) - translateY;
            e.preventDefault();
        }
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
    };

    const handleMove = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (isSliderDragging) {
            updateSliderPosition(clientX, clientY);
        } else if (isPanning && scale > 1) {
            translateX = clientX - startX;
            translateY = clientY - startY;
            updateViewportTransform();
        }
    };

    const handleUp = () => {
        isSliderDragging = false;
        isPanning = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchend', handleUp);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        
        scale += e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
        scale = Math.min(Math.max(1, scale), 5);

        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }
        updateViewportTransform();
    };

    container.addEventListener('mousedown', handleDown);
    container.addEventListener('touchstart', handleDown, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });
}

// --- Debounced Real-Time Quality Size Estimator Helper ---
function debounce(func, delay) {
    let debounceTimer;
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

const triggerRealtimeSizeUpdate = debounce(async () => {
    if (files.length === 0 || !activeTool) return;
    const toolScreen = document.getElementById('toolScreen');
    const previewInfo = toolScreen.querySelector('.realtime-preview-info');
    if (!previewInfo || previewInfo.classList.contains('hidden')) return;

    const qualitySlider = toolScreen.querySelector('.quality-slider');
    if (!qualitySlider) return;

    const qualityVal = parseInt(qualitySlider.value, 10) / 100;
    const currentFile = files[currentImageIdx];
    const formatExt = selectedFormat || currentFile.type.split('/')[1] || 'jpeg';

    initializeWorkerPool();
    const freeWorker = workerPool.find(w => !w.busy) || workerPool[0];
    if (freeWorker) {
        freeWorker.busy = true;
        const result = await runSingleCompressionPromise(freeWorker, currentFile, qualityVal, originalFileDetails[currentImageIdx].width, originalFileDetails[currentImageIdx].height, formatExt);
        freeWorker.busy = false;
        
        if (result.success) {
            const originalSizeSpan = previewInfo.querySelector('.original-size');
            const newSizeSpan = previewInfo.querySelector('.new-size');
            if (originalSizeSpan && newSizeSpan) {
                originalSizeSpan.textContent = formatBytes(originalFileDetails[currentImageIdx].size);
                newSizeSpan.textContent = formatBytes(result.blob.size);
            }
        }
    }
}, 250);


// --- Attach Action Event Listeners ---
function attachToolEventListeners(container) {
    const dropZone = container.querySelector('#dropZone');
    const fileInput = container.querySelector('.file-input');
    
    // 1. Drop Zone Event Listeners (with Smooth Drag-Over Glow)
    if (dropZone) {
        dropZone.addEventListener('dragover', e => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragenter', e => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', e => { 
            e.preventDefault(); 
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files); 
            }
        });
        dropZone.addEventListener('click', e => {
            // अगर यूज़र कंफर्म बटन पर क्लिक न कर रहा हो तो फ़ाइल पिकर खोलें
            if (!e.target.closest('.confirm-btn')) {
                fileInput?.click();
            }
        });
        fileInput?.addEventListener('change', e => handleFiles(e.target.files));
    }
    
    // Core Buttons
    container.querySelector('.confirm-btn')?.addEventListener('click', () => confirmSelection());
    container.querySelector('.add-more-files-input')?.addEventListener('change', e => handleFiles(e.target.files, true));
    container.querySelector('.prev-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx - 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.next-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx + 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.start-btn')?.addEventListener('click', processFiles);
    
    // 🔥 FIX: Clear All पर सॉफ्ट रिसेट (true) पास करें ताकि ड्रॉप-ज़ोन पर बिना व्हाइट स्क्रीन वापस जाएं
    container.querySelector('.clear-all-btn')?.addEventListener('click', () => resetTool(true));
    
    // Quality Sliders Animation & Live Updates
    container.querySelectorAll('.quality-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const parent = slider.closest('.options-section') || slider.parentElement || container;
            const valSpan = parent.querySelector('.quality-value');
            if (valSpan) {
                valSpan.textContent = e.target.value;
                valSpan.style.transform = 'scale(1.25)';
                setTimeout(() => valSpan.style.transform = 'scale(1)', 100);
            }

            // Sync preset buttons active status
            const presetBtns = container.querySelectorAll('.preset-btn');
            presetBtns.forEach(btn => {
                if (btn.dataset.quality === e.target.value) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            triggerRealtimeSizeUpdate();
        });
    });

    // ==========================================================================
    // 1. CONVERTER TOOL EVENT LISTENERS
    // ==========================================================================
    if (activeTool === 'converter') {
        const formatCards = container.querySelectorAll('.format-card');
        const intelTitle = container.querySelector('#formatIntelTitle');
        const intelDesc = container.querySelector('#formatIntelDesc');
        const intelIcon = container.querySelector('#formatIntelIcon');

        // Dynamic Format Tips Data
        const formatTips = {
            png: { title: 'PNG (Lossless Transparency)', desc: 'Best for graphics, logos, and images requiring background transparency.', icon: 'fa-image' },
            jpg: { title: 'JPG (Universal Compatibility)', desc: 'Ideal for real-world photos. Supported on all browsers & devices.', icon: 'fa-camera-retro' },
            webp: { title: 'WEBP (30% Smaller for Web)', desc: 'Google next-gen format with superior compression for faster websites.', icon: 'fa-bolt' },
            avif: { title: 'AVIF (Ultra High Efficiency)', desc: 'Maximum file size reduction with crisp visual quality. Modern web standard.', icon: 'fa-feather-alt' },
            pdf: { title: 'PDF (Document Archive)', desc: 'Combines your images into a single print-ready PDF document.', icon: 'fa-file-pdf' },
            ico: { title: 'ICO (Favicon Generator)', desc: 'Converts images to multi-resolution icon file for websites.', icon: 'fa-desktop' }
        };

        // Format Card Click Event
        formatCards.forEach(card => card.addEventListener('click', () => {
            formatCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedFormat = card.dataset.format;
            
            // Update Format Intelligence Box dynamically
            const tip = formatTips[selectedFormat];
            if (tip && intelTitle && intelDesc) {
                intelTitle.textContent = tip.title;
                intelDesc.textContent = tip.desc;
                if (intelIcon) intelIcon.className = `fas ${tip.icon}`;
            }

            // Show/Hide PDF Settings Section
            const pdfSection = container.querySelector('#pdfOptionsSection');
            if (pdfSection) pdfSection.classList.toggle('hidden', selectedFormat !== 'pdf');
            
            triggerRealtimeSizeUpdate();
        }));

        // Quick Quality Presets Event Handler (Max / Balanced / Compact)
        const presetBtns = container.querySelectorAll('.preset-btn');
        const qualitySlider = container.querySelector('.quality-slider');
        const qualityValueSpan = container.querySelector('.quality-value');

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const qVal = btn.dataset.quality;
                if (qualitySlider) qualitySlider.value = qVal;
                if (qualityValueSpan) {
                    qualityValueSpan.textContent = qVal;
                    qualityValueSpan.style.transform = 'scale(1.25)';
                    setTimeout(() => qualityValueSpan.style.transform = 'scale(1)', 100);
                }
                
                triggerRealtimeSizeUpdate();
            });
        });
    }

    // ==========================================================================
    // 2. WATERMARK TOOL EVENT LISTENERS
    // ==========================================================================
    if (activeTool === 'watermark') {
        const typeButtons = container.querySelectorAll('.watermark-type-btn');
        typeButtons.forEach(btn => btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            container.querySelector('#text-watermark-options')?.classList.toggle('hidden', type !== 'text');
            container.querySelector('#image-watermark-options')?.classList.toggle('hidden', type !== 'image');
        }));

        const logoInput = container.querySelector('#watermark-image-input');
        logoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                watermarkImage = await createImageBitmap(file);
                const preview = container.querySelector('#watermark-preview');
                if (preview) {
                    preview.src = URL.createObjectURL(file);
                    preview.classList.remove('hidden');
                }
            }
        });

        container.querySelector('#opacity-slider')?.addEventListener('input', (e) => {
            const opacityVal = container.querySelector('#opacity-value');
            if (opacityVal) opacityVal.textContent = e.target.value;
        });

        container.querySelector('#scale-slider')?.addEventListener('input', (e) => {
            const scaleVal = container.querySelector('#scale-value');
            if (scaleVal) scaleVal.textContent = e.target.value;
        });

        container.querySelector('#watermark-text')?.addEventListener('input', triggerRealtimeSizeUpdate);

        const posButtons = container.querySelectorAll('.position-btn');
        posButtons.forEach(btn => btn.addEventListener('click', () => {
            posButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }));
    }

    // ==========================================================================
    // 3. COMPRESSOR TOOL EVENT LISTENERS
    // ==========================================================================
    if (activeTool === 'compressor') {
        const toggle = container.querySelector('#target-size-toggle');
        const unitContainer = container.querySelector('.target-size-input-container');
        toggle?.addEventListener('change', () => {
            unitContainer?.classList.toggle('hidden', !toggle.checked);
            triggerRealtimeSizeUpdate();
        });

        container.querySelector('#target-size-kb-input')?.addEventListener('input', triggerRealtimeSizeUpdate);
        container.querySelector('#target-size-unit-select')?.addEventListener('change', triggerRealtimeSizeUpdate);

        const beforeAfterToggle = container.querySelector('#before-after-toggle');
        const previewInfo = container.querySelector('.realtime-preview-info');
        beforeAfterToggle?.addEventListener('change', () => {
            if (previewInfo) {
                previewInfo.classList.toggle('hidden', !beforeAfterToggle.checked);
                if (beforeAfterToggle.checked) {
                    triggerRealtimeSizeUpdate();
                }
            }
        });
    }

    // ==========================================================================
    // 4. RESIZER TOOL EVENT LISTENERS
    // ==========================================================================
    if (activeTool === 'resizer') {
        const modeButtons = container.querySelectorAll('.resize-by-btn');
        const widthInput = container.querySelector('#resize-width');
        const heightInput = container.querySelector('#resize-height');
        const aspectToggle = container.querySelector('#aspect-ratio-toggle');
        const socialPresets = container.querySelector('#social-presets');
        const percentageSlider = container.querySelector('#percentage-slider');
        const percentageValue = container.querySelector('#percentage-value');
        const percentageDims = container.querySelector('#percentage-dims');

        modeButtons.forEach(btn => btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const isPixels = btn.dataset.mode === 'pixels';
            container.querySelector('#pixels-mode-container')?.classList.toggle('hidden', !isPixels);
            container.querySelector('#percentage-mode-container')?.classList.toggle('hidden', isPixels);
        }));

        // Percentage Slider Live Dimension Calculation
        percentageSlider?.addEventListener('input', (e) => {
            const scalePct = parseInt(e.target.value, 10);
            if (percentageValue) percentageValue.textContent = scalePct;

            if (percentageDims && originalFileDetails[currentImageIdx]) {
                const origW = originalFileDetails[currentImageIdx].width || 0;
                const origH = originalFileDetails[currentImageIdx].height || 0;
                const newW = Math.round(origW * (scalePct / 100));
                const newH = Math.round(origH * (scalePct / 100));
                percentageDims.textContent = `${newW} x ${newH} px`;
            }
        });

        socialPresets?.addEventListener('change', () => {
            if (socialPresets.value !== 'custom') {
                const [w, h] = socialPresets.value.split('x').map(Number);
                if (widthInput && heightInput) {
                    widthInput.value = w;
                    heightInput.value = h;
                }
            }
        });

        widthInput?.addEventListener('input', () => {
            if (aspectToggle?.checked && files.length > 0 && originalFileDetails[currentImageIdx]) {
                const ratio = originalFileDetails[currentImageIdx].ratio;
                if (ratio && heightInput) {
                    heightInput.value = Math.round(parseInt(widthInput.value, 10) / ratio) || '';
                }
            }
        });

        heightInput?.addEventListener('input', () => {
            if (aspectToggle?.checked && files.length > 0 && originalFileDetails[currentImageIdx]) {
                const ratio = originalFileDetails[currentImageIdx].ratio;
                if (ratio && widthInput) {
                    widthInput.value = Math.round(parseInt(heightInput.value, 10) * ratio) || '';
                }
            }
        });
    }
}
// --- Theme Switcher (With Radial Ripple Wave Animation) ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleThemeWithRipple(e) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Calculate click coordinates for radial ripple origin
    let x, y;
    if (e && e.clientX && e.clientY) {
        x = e.clientX;
        y = e.clientY;
    } else if (themeToggleBtn) {
        const rect = themeToggleBtn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
    }

    // 1. Modern View Transitions API (Chrome, Edge, Brave, Safari)
    if (document.startViewTransition) {
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });

        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 650,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });
    } else {
        // 2. Smooth Cross-Browser Fallback for Older Browsers
        const ripple = document.createElement('div');
        ripple.className = 'theme-ripple-fallback';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.backgroundColor = newTheme === 'dark' ? '#0f172a' : '#f8fafc';
        document.body.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.classList.add('active');
        });

        setTimeout(() => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            ripple.remove();
        }, 550);
    }
}

// Attach Event Listener to Theme Toggle Button
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleThemeWithRipple);
}

// --- Helper Utilities ---
function showToast(message) { 
    toastMessage.textContent = message; 
    toast.classList.add('show'); 
    setTimeout(() => toast.classList.remove('show'), 3000); 
}
window.showToast = showToast; // Global exposure for ExifData.js module

function formatBytes(bytes) { 
    if (!+bytes) return '0 Bytes'; 
    const k = 1024; 
    const sizes = ['Bytes', 'KB', 'MB']; 
    const i = Math.floor(Math.log(bytes) / Math.log(k)); 
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`; 
}

document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
});

document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
    previewModal.classList.remove('show');
});

// --- Scroll Reveal Observer System ---
let scrollObserver = null;

function initScrollReveal() {
    // Purge old observer if re-navigating
    if (scrollObserver) {
        scrollObserver.disconnect();
    }

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Once revealed, stop observing so animation happens once smoothly
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -50px 0px', // Starts revealing slightly before reaching viewport bottom
        threshold: 0.1
    });

    revealElements.forEach(el => {
        // Reset state if coming back via SPA route
        el.classList.remove('revealed');
        scrollObserver.observe(el);
    });
}

// --- Dynamic Subtitle Text Rotator Engine ---
let subtitleRotationTimer = null;

function initSubtitleRotator() {
    // Clear existing interval if re-navigating
    if (subtitleRotationTimer) {
        clearInterval(subtitleRotationTimer);
        subtitleRotationTimer = null;
    }

    const container = document.getElementById('rotatingSubtitleContainer');
    if (!container) return;

    const phrases = container.querySelectorAll('.rotating-phrase');
    if (phrases.length <= 1) return;

    let currentIndex = 0;

    subtitleRotationTimer = setInterval(() => {
        const currentPhrase = phrases[currentIndex];
        
        // Calculate next index
        currentIndex = (currentIndex + 1) % phrases.length;
        const nextPhrase = phrases[currentIndex];

        // 1. Current phrase slides UP and exits
        currentPhrase.classList.remove('active');
        currentPhrase.classList.add('exit');

        // 2. Next phrase enters from BOTTOM
        nextPhrase.classList.remove('exit');
        nextPhrase.classList.add('active');

        // Clean up 'exit' class after animation finishes
        setTimeout(() => {
            currentPhrase.classList.remove('exit');
        }, 600);
    }, 3200); // Rotates every 3.2 seconds
}

// --- Unified Page Navigation Override ---
const originalShowPage = showPage;
showPage = function(pageId) {
    if (typeof originalShowPage === 'function') originalShowPage(pageId);
    if (pageId === 'homeScreen') {
        requestAnimationFrame(() => {
            initScrollReveal();
            initSubtitleRotator();
        });
    }
};

// --- Clean App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.body.addEventListener('click', navigateTo);
    window.addEventListener('popstate', router); // Clean URLs listener
    
    // Initial triggers on load
    initScrollReveal();
    initSubtitleRotator();
    
    router();
});
// --- PWA Service Worker & Install Banner Manager (Bug Fixed Update) ---
function initPWAInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    const installBtn = document.getElementById('pwaInstallBtn');
    const closeBtn = document.getElementById('pwaCloseBtn');

    if (!banner || !installBtn || !closeBtn) return;

    // Check if user previously dismissed banner in current session
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
        banner.classList.add('hidden');
    }

    // Capture Native Browser PWA install prompt event using globally declared variable
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e; // Uses existing global variable

        // Reveal Banner if not dismissed
        if (sessionStorage.getItem('pwa_banner_dismissed') !== 'true') {
            banner.classList.remove('hidden');
        }
    });

    // Handle 'Install Now' Button Click
    installBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
            showToast('To install: tap Share/Menu in your browser and select "Add to Home Screen".');
            return;
        }

        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('Thank you for installing ImgCon!');
        }
        
        deferredInstallPrompt = null;
        banner.classList.add('hidden');
    });

    // Handle Close/Dismiss Button Click
    closeBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
        sessionStorage.setItem('pwa_banner_dismissed', 'true');
    });

    // Handle Successful App Installation
    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        banner.classList.add('hidden');
        showToast('ImgCon installed successfully! Now works 100% offline.');
    });
}

// Initialize PWA Manager on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initPWAInstallBanner();
});

// Smart Mouse Spotlight Follower for Tool Cards
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.tool-choice-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});
// ==========================================================================
// DYNAMIC TOOL SEO GUIDES & ACCORDION FAQS DATABASE (AdSense Compliant)
// ==========================================================================
const toolGuidesData = {
    converter: {
        title: "How to Convert Images Online (Step-by-Step Guide)",
        steps: [
            "<strong>Upload Source Files:</strong> Click the dropzone or drag and drop your photos (supports JPG, PNG, WEBP, AVIF, HEIC, and PDF).",
            "<strong>Select Target Output Format:</strong> Choose from PNG, JPG, WEBP, AVIF, PDF, or ICO favicon format.",
            "<strong>Adjust Compression Quality:</strong> Set the quality slider (80% - 85% recommended for optimal balance).",
            "<strong>Process & Download:</strong> Click 'Start Processing' to generate converted images instantly in your browser memory."
        ],
        whyTitle: "Why Use ImgCon Client-Side Image Converter?",
        features: [
            { icon: "fa-shield-alt", title: "100% Private Processing", desc: "Your photos stay strictly inside your browser memory. Zero server uploads." },
            { icon: "fa-bolt", title: "Web Worker Accelerated", desc: "Multi-threaded Web Worker architecture converts batch images at desktop speeds." },
            { icon: "fa-layer-group", title: "Batch Processing Support", desc: "Convert dozens of files simultaneously and download them in a single compiled ZIP archive." },
            { icon: "fa-file-pdf", title: "PDF Document Compiler", desc: "Combine multiple image uploads directly into a single multi-page printable PDF file." }
        ],
        faqs: [
            { q: "Is ImgCon Image Converter completely free with no processing limits?", a: "Yes, ImgCon is 100% free with zero file upload limits or daily restrictions." },
            { q: "Will converting PNG with transparency to WEBP preserve background transparency?", a: "Yes, WEBP retains 100% full alpha channel transparency while reducing file size by up to 30% compared to PNG." },
            { q: "Can I convert iPhone HEIC photos to standard JPG format?", a: "Yes, upload your iPhone HEIC photos and ImgCon converts them to universally supported JPG or PNG format." },
            { q: "Are my photos uploaded or stored on any external server?", a: "No. All conversion operations execute locally on your device via browser Web Worker JavaScript." }
        ]
    },
    compressor: {
        title: "How to Compress Photo File Sizes Without Losing Quality",
        steps: [
            "<strong>Select Your Photos:</strong> Drag and drop JPG, PNG, or WEBP images into the compressor dropzone.",
            "<strong>Set Compression Settings:</strong> Keep quality slider at 80% or toggle Target File Size to specify an exact KB limit (e.g. 100 KB).",
            "<strong>Enable EXIF Stripping:</strong> Check 'Strip EXIF Metadata' to remove hidden camera specs for extra space savings.",
            "<strong>Preview & Save:</strong> Use the live split comparison slider to inspect visual quality before downloading."
        ],
        whyTitle: "Why Use ImgCon Smart Image Compressor?",
        features: [
            { icon: "fa-bullseye", title: "Target Size Calculation", desc: "Enter your required KB/MB limit (e.g. 100 KB) and ImgCon automatically calculates the exact quality algorithm." },
            { icon: "fa-eye", title: "Live Comparison Slider", desc: "Compare original vs compressed results with zoom and pan side-by-side view." },
            { icon: "fa-user-shield", title: "EXIF Location Protection", desc: "Automatically strips camera model, date, and GPS location coordinates." },
            { icon: "fa-tachometer-alt", title: "Core Web Vitals Booster", desc: "Optimizes image payload to dramatically improve Google PageSpeed Insights and LCP scores." }
        ],
        faqs: [
            { q: "How much file size reduction can I expect?", a: "Typical compression saves 60% to 80% file weight without noticeable visual quality loss." },
            { q: "Does compressing images reduce pixel dimensions?", a: "No, compression alters data bitrate density while leaving pixel width and height unchanged." },
            { q: "What is Target File Size compression?", a: "Enter your exact required limit (e.g. 100 KB for portal uploads), and ImgCon iteratively calculates the optimal settings." },
            { q: "Why should I strip EXIF metadata?", a: "EXIF metadata contains camera hardware details and GPS coordinates. Stripping it saves 10-20 KB per photo and protects privacy." }
        ]
    },
    resizer: {
        title: "How to Resize Photo Dimensions by Pixels or Percentage",
        steps: [
            "<strong>Upload Photos:</strong> Drag and drop your images into the resizer staging area.",
            "<strong>Choose Scaling Mode:</strong> Select Pixel Mode (Width x Height) or Percentage Mode (Scale Slider).",
            "<strong>Lock Aspect Ratio:</strong> Keep 'Maintain Aspect Ratio' checked to prevent stretched or distorted photos.",
            "<strong>Apply Social Presets or Process:</strong> Pick Instagram, Facebook, or Twitter presets, then click process."
        ],
        whyTitle: "Why Choose ImgCon Online Image Resizer?",
        features: [
            { icon: "fa-share-alt", title: "Social Media Presets", desc: "Built-in pixel presets for Instagram Posts (1080x1080), Stories (1080x1920), Facebook Covers, and Twitter Headers." },
            { icon: "fa-lock", title: "Aspect Ratio Protection", desc: "Automatically adjusts height when width changes to ensure photos never look squished or stretched." },
            { icon: "fa-sliders-h", title: "Percentage Scaling", desc: "Quickly scale photos down by 50%, 25%, or custom percentage ratios." },
            { icon: "fa-microchip", title: "Local Browser Processing", desc: "Resizes dozens of large digital photography files in batch instantly without server lag." }
        ],
        faqs: [
            { q: "What does 'Maintain Aspect Ratio' mean?", a: "When locked, changing image width automatically scales height proportionally to maintain natural photo proportions." },
            { q: "What are the recommended dimensions for Instagram posts?", a: "Square Post: 1080x1080px | Portrait Post: 1080x1350px | Story/Reels: 1080x1920px." },
            { q: "Can I batch resize multiple photos at once?", a: "Yes, upload all your files together; ImgCon scales all images simultaneously in browser memory." },
            { q: "Will scaling an image up increase its visual sharpness?", a: "Upscaling increases pixel dimensions but cannot restore details that were not originally captured by the camera." }
        ]
    },
    watermark: {
        title: "How to Add Custom Text or Logo Watermarks to Photos",
        steps: [
            "<strong>Upload Base Photos:</strong> Drag and drop your photography or graphic files.",
            "<strong>Choose Watermark Type:</strong> Select Text Watermark (e.g. © Your Brand) or Image Watermark (Upload PNG logo).",
            "<strong>Adjust Opacity & Scale:</strong> Tune opacity (30%-70%) and scale sliders for subtle protection.",
            "<strong>Set Positioning:</strong> Pick position (Center, Top-Right, Bottom-Left, etc.) and apply."
        ],
        whyTitle: "Why Use ImgCon Copyright Protection Tool?",
        features: [
            { icon: "fa-copyright", title: "Custom Text & Logo Overlay", desc: "Add transparent text notices or full-color company logos over your images." },
            { icon: "fa-adjust", title: "Full Opacity Control", desc: "Blend watermarks smoothly over complex photo backgrounds without ruining image details." },
            { icon: "fa-th", title: "9-Grid Position Matrix", desc: "Place watermarks accurately in corners, sides, or directly in the center." },
            { icon: "fa-user-secret", title: "Zero Data Logging", desc: "Watermarked copies generate locally in memory; your unwatermarked originals remain untouched." }
        ],
        faqs: [
            { q: "What is the recommended opacity for photo watermarks?", a: "We recommend 30% to 50% opacity so the copyright notice is clear without overwhelming the photo subject." },
            { q: "Can I use a transparent PNG logo as a watermark?", a: "Yes, transparent PNG logos blend smoothly over photographs." },
            { q: "Does ImgCon store uploaded watermarked photos?", a: "No, watermarks are applied using local HTML5 Canvas JavaScript. Your files stay on your device." }
        ]
    },
    exif: {
        title: "How to View and Clean EXIF GPS Metadata from JPEG Photos",
        steps: [
            "<strong>Upload Photo:</strong> Drop your JPEG photo into the EXIF Privacy Inspector.",
            "<strong>Inspect Embedded Data:</strong> View camera specs, shutter speed, capture timestamp, and GPS map coordinates.",
            "<strong>Click Clean Privacy Data:</strong> Generate a privacy-cleared photograph file.",
            "<strong>Download Clean Photo:</strong> Save the photo free of location tracking headers."
        ],
        whyTitle: "Why Clean EXIF Metadata Before Sharing Online?",
        features: [
            { icon: "fa-map-marker-alt", title: "GPS Coordinates Stripping", desc: "Removes latitude and longitude tracking data embedded by smartphone cameras." },
            { icon: "fa-camera", title: "Hardware Information Removal", desc: "Erases camera brand, serial numbers, and exposure settings." },
            { icon: "fa-weight-hanging", title: "Extra File Size Savings", desc: "Stripping EXIF headers saves 10-20 KB per photo without affecting visual pixels." },
            { icon: "fa-lock", title: "100% Client-Side Inspection", desc: "Inspects metadata locally without exposing personal location data to remote servers." }
        ],
        faqs: [
            { q: "What is EXIF data in digital photos?", a: "EXIF (Exchangeable Image File Format) stores camera settings, hardware info, and GPS coordinates inside JPEG headers." },
            { q: "Why should I strip EXIF data before uploading photos?", a: "Sharing photos with unstripped GPS data allows strangers to pinpoint your location on maps." },
            { q: "Does stripping EXIF data lower photo quality?", a: "No, EXIF is text metadata; removing it leaves image pixels untouched while saving file weight." }
        ]
    }
};

// ==========================================================================
// RENDER TOOL SEO GUIDE & ACCORDION FAQS FUNCTION
// ==========================================================================
function renderToolSeoGuide(toolName, container) {
    if (!container) return;
    
    // Remove existing guide if present
    const oldGuide = container.querySelector('.tool-seo-guide-container');
    if (oldGuide) oldGuide.remove();

    const guideData = toolGuidesData[toolName];
    if (!guideData) return;

    const guideSection = document.createElement('div');
    guideSection.className = 'tool-seo-guide-container animate__animated animate__fadeIn';

    guideSection.innerHTML = `
        <!-- How-To Guide Section -->
        <h2>${guideData.title}</h2>
        <ol class="mb-6">
            ${guideData.steps.map(step => `<li class="mb-2">${step}</li>`).join('')}
        </ol>

        <!-- Why Choose Feature Cards -->
        <h2>${guideData.whyTitle}</h2>
        <div class="tool-guide-badge-grid">
            ${guideData.features.map(f => `
                <div class="tool-guide-feature-card">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                            <i class="fas ${f.icon}"></i>
                        </div>
                        <h3 class="font-bold text-sm m-0" style="color: var(--text-dark);">${f.title}</h3>
                    </div>
                    <p class="text-xs m-0" style="color: var(--text-light);">${f.desc}</p>
                </div>
            `).join('')}
        </div>

        <!-- Accordion FAQs Section -->
        <h2>Frequently Asked Questions (FAQ)</h2>
        <div class="space-y-3 mt-4">
            ${guideData.faqs.map(faq => `
                <details class="tool-faq-accordion">
                    <summary>${faq.q}</summary>
                    <div class="tool-faq-content">${faq.a}</div>
                </details>
            `).join('')}
        </div>
    `;

    container.appendChild(guideSection);
}
