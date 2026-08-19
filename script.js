/**
 * ==========================================================================
 * SCRIPT.JS - ImgCon Central Orchestrator & Application Manager (Optimized)
 * (State Management, SPA Routing, Memory Management & Module Delegation)
 * ==========================================================================
 */

// --- Global State Management ---
let files = [];
let originalFileDetails = [];
let processedResults = [];
let currentImageIdx = 0;
let selectedFormat = null;
let activeTool = null;
let deferredInstallPrompt = null;
let watermarkImage = null;
let currentModalBlobUrl = null;

const SESSION_STORAGE_KEY = 'imgcon_session_v3';

// --- Window Setter Helper for External Modules ---
window.setSelectedFormat = function(fmt) {
    selectedFormat = fmt;
    window.selectedFormat = fmt;
};

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

// --- Dynamic External Library Loader (Cached Promise Engine) ---
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
window.loadExternalLibrary = loadExternalLibrary;

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully. Scope:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}

// --- Router Maps with Meta Descriptions & Titles ---
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

    // Blog Articles Routing
    '/blog/png-vs-jpg-difference': { screen: 'blogScreen', title: 'PNG vs JPG: What is the Difference and Which One to Use? | ImgCon Blog', isPost: true, desc: 'Learn differences between PNG and JPG image formats.' },
    '/blog/how-to-reduce-photo-size': { screen: 'blogScreen', title: 'How to Reduce Photo Size Without Losing Quality | ImgCon Blog', isPost: true, desc: 'Step by step guide to shrinking image sizes for faster website speeds.' },
    '/blog/webp-the-future-of-web-images': { screen: 'blogScreen', title: 'Why WebP is the Future of Web Images | ImgCon Blog', isPost: true, desc: 'Discover why Google created WebP and how it speeds up websites.' },
    '/blog/avif-vs-webp-speed-battle': { screen: 'blogScreen', title: 'AVIF vs WebP Speed Battle: Which Format is Better? | ImgCon Blog', isPost: true, desc: 'Detailed comparison between AVIF and WebP next-gen image formats.' },
    '/blog/image-compression-seo-pagespeed': { screen: 'blogScreen', title: 'How Image Compression Boosts SEO & PageSpeed Scores | ImgCon Blog', isPost: true, desc: 'Optimize image file sizes to improve Google Core Web Vitals.' },
    '/blog/best-image-compression-plugins-wordpress': { screen: 'blogScreen', title: 'Best Image Compression Plugins for WordPress | ImgCon Blog', isPost: true, desc: 'Top plugins to optimize WordPress image media libraries.' },
    '/blog/understanding-exif-data': { screen: 'blogScreen', title: 'Understanding EXIF Data & Photo Location Privacy | ImgCon Blog', isPost: true, desc: 'How EXIF data stores camera settings and GPS locations in photos.' }
};

// --- Smart Clean URLs HTML5 Router Engine ---
const router = async () => {
    let path = window.location.pathname || '/';
    if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }

    let route = routes[path];

    if (!route && path.startsWith('/blog/')) {
        route = {
            screen: 'blogScreen',
            title: 'ImgCon Blog',
            isPost: true,
            desc: 'Read image optimization guides and tutorials on ImgCon.'
        };
    }

    if (!route) {
        route = routes['/'];
        path = '/';
    }

    document.title = route.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && route.desc) {
        metaDesc.setAttribute("content", route.desc);
    }

    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (canonicalTag) {
        canonicalTag.setAttribute("href", "https://imgcon.online" + path);
    }

    if (route.screen === 'blogScreen') {
        if (activeTool) resetTool();
        showPage('blogScreen');
        if (typeof handleRouteChanges === 'function') handleRouteChanges();
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

// Clean Navigation Interceptor
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

// --- UI Navigation ---
function showPage(pageId) {
    allScreens.forEach(s => s.classList.add('hidden'));
    const activeScreen = document.getElementById(pageId);
    if (activeScreen) {
        activeScreen.classList.remove('hidden');
        requestAnimationFrame(() => {
            const h = activeScreen.clientHeight;
            requestAnimationFrame(() => {
                if (mainContainer && h > 0) mainContainer.style.minHeight = h + 'px';
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

// --- Dynamic Tool Header Metadata Map ---
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

// --- Setup Tool UI Engine ---
function setupToolUI(toolName) {
    activeTool = toolName;
    selectedFormat = null;
    window.selectedFormat = null;
    
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;

    const toolTemplate = document.getElementById('toolLayoutTemplate');
    if (!toolTemplate) return;

    const toolLayout = toolTemplate.content.cloneNode(true);
    toolScreen.innerHTML = '';
    toolScreen.appendChild(toolLayout);

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

    const optionsContainer = toolScreen.querySelector('.options-container');
    const optionsTemplate = document.getElementById(`${toolName}OptionsTemplate`);
    if (optionsContainer && optionsTemplate) {
        optionsContainer.appendChild(optionsTemplate.content.cloneNode(true));
    }
    
    const fileInput = toolScreen.querySelector('.file-input');
    const addMoreInput = toolScreen.querySelector('.add-more-files-input');
    const acceptType = (toolName === 'compressor') ? 'image/jpeg, image/webp, image/png' : 'image/*';

    if (fileInput) fileInput.accept = acceptType;
    if (addMoreInput) addMoreInput.accept = acceptType;

    attachToolEventListeners(toolScreen);

    if (typeof renderToolSeoGuide === 'function') {
        renderToolSeoGuide(toolName, toolScreen);
    }
}

// --- Reset Tool Engine (Memory Cleaned) ---
function resetTool(softReset = false) {
    // 1. Revoke all object preview URLs
    if (Array.isArray(files)) {
        files.forEach(f => { 
            if (f && f.previewUrl) {
                try { URL.revokeObjectURL(f.previewUrl); } catch (e) {}
            } 
        });
    }
    
    // 2. Revoke modal preview blob
    if (currentModalBlobUrl) {
        try { URL.revokeObjectURL(currentModalBlobUrl); } catch (e) {}
        currentModalBlobUrl = null;
    }

    // 3. Close bitmaps
    if (watermarkImage && typeof watermarkImage.close === 'function') {
        try { watermarkImage.close(); } catch (e) {}
    }
    if (window.watermarkImage && typeof window.watermarkImage.close === 'function') {
        try { window.watermarkImage.close(); } catch (e) {}
        window.watermarkImage = null;
    }
    
    const currentTool = activeTool;

    files = []; 
    originalFileDetails = []; 
    processedResults = []; 
    selectedFormat = null; 
    window.selectedFormat = null;
    currentImageIdx = 0; 
    watermarkImage = null;
    
    const toolScreen = document.getElementById('toolScreen');
    
    if ((softReset || (toolScreen && !toolScreen.classList.contains('hidden'))) && currentTool) {
        setupToolUI(currentTool);
    } else {
        activeTool = null;
        if (toolScreen) toolScreen.innerHTML = ''; 
    }
}

// --- Core File Handling ---
function handleFiles(fileList, isAddingMore = false) {
    let newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;
    
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
            originalFileDetails[index] = { 
                width: img.naturalWidth || img.width, 
                height: img.naturalHeight || img.height, 
                size: file.size, 
                name: file.name, 
                type: file.type, 
                ratio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height) 
            }; 
            resolve(); 
        };
        img.onerror = () => { 
            originalFileDetails[index] = { width: 0, height: 0, size: file.size, name: file.name, type: file.type, ratio: 1 }; 
            resolve(); 
        };
        img.src = file.previewUrl;
    })));
}

async function confirmSelection() {
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;

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
    const galleryContainer = toolScreen?.querySelector('.gallery-container');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = files.map(file => `<div class="gallery-item w-full h-full flex-shrink-0 flex items-center justify-center p-2"><img src="${file.previewUrl}" class="max-w-full max-h-full object-contain" loading="lazy" alt="Preview"></div>`).join('');
}

function showFilePreview(index) {
    if (index < 0 || index >= files.length) return;
    currentImageIdx = index;
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;

    const gallery = toolScreen.querySelector('.gallery-container');
    if (gallery) gallery.style.transform = `translateX(-${index * 100}%)`;
    
    const curSpan = toolScreen.querySelector('.current-image-index');
    const totSpan = toolScreen.querySelector('.total-images');
    if (curSpan) curSpan.textContent = index + 1;
    if (totSpan) totSpan.textContent = files.length;
    
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
    const listContainer = toolScreen?.querySelector('.file-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = files.map((file, index) => {
        const details = originalFileDetails[index] || { size: file.size, width: '?', height: '?' };
        return `<div class="file-item flex items-center gap-2 p-1.5 rounded-md hover:bg-card-bg cursor-grab transition-all border border-transparent hover:border-indigo-200" draggable="true" data-index="${index}"><img src="${file.previewUrl}" class="w-10 h-10 object-cover rounded shadow-sm" loading="lazy" alt="Item"><div class="flex-grow truncate text-xs"><p class="font-bold truncate" style="color: var(--text-dark);">${file.name}</p><p class="text-xxs text-light" style="color: var(--text-light);">${formatBytes(details.size)} &middot; ${details.width}x${details.height}</p></div><button class="delete-file-btn p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" data-index="${index}" aria-label="Remove image"><i class="fas fa-times"></i></button></div>`;
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
    
    listContainer.onclick = e => { 
        const deleteBtn = e.target.closest('.delete-file-btn'); 
        if (deleteBtn) {
            e.stopPropagation();
            deleteFile(parseInt(deleteBtn.dataset.index, 10)); 
        }
    };
}

// --- Collect Active Tool Settings ---
function collectCurrentToolOptions(container) {
    const qualitySlider = container.querySelector('.quality-slider');
    const qualityVal = qualitySlider ? parseInt(qualitySlider.value, 10) / 100 : 0.85;
    
    let fmt = selectedFormat || window.selectedFormat || 'webp';
    if (fmt === 'jpeg') fmt = 'jpg';

    const opts = {
        quality: qualityVal,
        format: fmt
    };

    if (activeTool === 'compressor') {
        opts.targetSizeActive = !!document.getElementById('target-size-toggle')?.checked;
        opts.targetSizeKB = parseFloat(document.getElementById('target-size-kb-input')?.value) || 100;
        opts.targetUnit = document.getElementById('target-size-unit-select')?.value || 'KB';
        opts.stripExif = !!document.getElementById('metadata-toggle')?.checked;
    } else if (activeTool === 'resizer') {
        const mode = container.querySelector('.resize-by-btn.active')?.dataset.mode || 'pixels';
        opts.mode = mode;
        if (mode === 'pixels') {
            opts.width = parseInt(document.getElementById('resize-width')?.value, 10);
            opts.height = parseInt(document.getElementById('resize-height')?.value, 10);
        } else {
            opts.percentage = parseInt(document.getElementById('percentage-slider')?.value, 10) || 50;
        }
        opts.maintainAspectRatio = !!document.getElementById('aspect-ratio-toggle')?.checked;
    } else if (activeTool === 'watermark') {
        opts.watermarkType = container.querySelector('.watermark-type-btn.active')?.dataset.type || 'text';
        opts.watermarkText = document.getElementById('watermark-text')?.value || '© ImgCon';
        opts.watermarkOpacity = parseInt(document.getElementById('opacity-slider')?.value || '70', 10) / 100;
        opts.watermarkScale = parseInt(document.getElementById('scale-slider')?.value || '20', 10) / 100;
        opts.watermarkPosition = container.querySelector('.position-btn.active')?.dataset.position || 'center';
        opts.watermarkBitmap = window.watermarkImage || watermarkImage || null;
    }

    return opts;
}

// --- Central Execution Handler (Delegates to Active Module) ---
async function processFiles() {
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen || files.length === 0) return;

    // UI Setup for Processing
    toolScreen.querySelector('.options-container')?.classList.add('hidden');
    toolScreen.querySelector('.output-section .start-btn')?.classList.add('hidden');
    
    const conversionProcess = toolScreen.querySelector('.conversion-process');
    if (conversionProcess) conversionProcess.classList.remove('hidden');

    const processingText = toolScreen.querySelector('.processing-text');
    const progressBarFill = toolScreen.querySelector('.progress-bar-fill');

    if (progressBarFill) progressBarFill.style.width = '0%';
    if (processingText) {
        processingText.innerHTML = `<i class="fas fa-cog fa-spin mr-2"></i>Processing ${files.length} file(s)...`;
    }

    const results = new Array(files.length);
    let filesProcessed = 0;

    const options = collectCurrentToolOptions(toolScreen);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            let result = null;

            if (activeTool === 'converter' && window.ImageConverterModule?.processImage) {
                result = await window.ImageConverterModule.processImage(file, options);
            } else if (activeTool === 'compressor' && window.ImageCompressorModule?.processImage) {
                result = await window.ImageCompressorModule.processImage(file, options);
            } else if (activeTool === 'resizer' && window.ImageResizerModule?.processImage) {
                result = await window.ImageResizerModule.processImage(file, options);
            } else if (activeTool === 'watermark' && window.ImageWatermarkModule?.processImage) {
                result = await window.ImageWatermarkModule.processImage(file, options);
            } else if (window.ImageConverterModule?.processImage) {
                result = await window.ImageConverterModule.processImage(file, options);
            }

            if (result) {
                result.fileIndex = i;
                results[i] = result;
            }
        } catch (err) {
            console.error(`Error processing file ${i}:`, err);
            results[i] = { success: false, fileName: file.name, fileIndex: i, error: err.message };
        }

        filesProcessed++;
        if (progressBarFill) progressBarFill.style.width = `${(filesProcessed / files.length) * 100}%`;
    }

    if (processingText) processingText.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-2"></i>Complete!`;
    setTimeout(() => handleCompletion(results), 300);
}

// --- Render Output Result Cards ---
async function handleCompletion(results) {
    const toolScreen = document.getElementById('toolScreen');
    if (!toolScreen) return;
    
    processedResults = results;
    const resultsContainer = toolScreen.querySelector('.results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    // PDF Compilation Check
    if (activeTool === 'converter' && selectedFormat === 'pdf') {
        const procText = toolScreen.querySelector('.processing-text');
        if (procText) procText.innerHTML = `<i class="fas fa-file-pdf text-red-500 mr-2"></i>Compiling PDF...`;
        
        if (window.ImageConverterModule?.compilePDF) {
            try {
                const pdfBlob = await window.ImageConverterModule.compilePDF(results);
                processedResults = [{ blob: pdfBlob, fileName: 'compiled_images.pdf', intendedFormat: 'pdf', fileIndex: 0 }];
            } catch (pdfErr) {
                console.error("PDF Compilation error:", pdfErr);
                showToast("Failed to compile PDF. Reverting to separate images.");
            }
        }
    }

    // Results Summary Banner
    resultsContainer.insertAdjacentHTML('beforeend', `
        <div class="results-summary text-center p-3.5 rounded-2xl mb-4 border animate__animated animate__fadeIn w-full overflow-hidden" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
            <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-500">Processing Complete!</h3>
            <p class="text-xxs sm:text-xs font-semibold" style="color: var(--text-light);">Successfully processed ${processedResults.length} file(s).</p>
        </div>
    `);
    
    // Render Individual Output Cards
    processedResults.forEach((res, i) => {
        if (!res.blob) return;

        const originalFile = files[res.fileIndex] || { previewUrl: '', type: 'image/png' };
        const originalDetails = originalFileDetails[res.fileIndex] || { size: res.blob.size || 0, width: '?', height: '?' };
        const isPdf = res.intendedFormat === 'pdf';
        
        const origSize = originalDetails.size || 1;
        const savedPercent = Math.round(((origSize - res.blob.size) / origSize) * 100);
        const isSavedPositive = savedPercent >= 0;
        const downloadUrl = URL.createObjectURL(res.blob);
        
        const fileNode = document.createElement('div');
        fileNode.className = 'result-card p-4 sm:p-5 rounded-2xl border mb-4 shadow-sm hover:shadow-md transition-all duration-300 animate__animated animate__slideInUp w-full max-w-full overflow-hidden';
        fileNode.style.borderColor = 'var(--card-border)';
        fileNode.style.backgroundColor = 'var(--card-bg)';
        
        fileNode.innerHTML = `
            <!-- Card Header: Thumbnail & Name -->
            <div class="flex items-center gap-3 mb-3.5 border-b pb-3 w-full overflow-hidden" style="border-color: var(--bg-subtle);">
                <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border shadow-sm flex-shrink-0" style="border-color: var(--card-border);">
                    <img src="${originalFile.previewUrl}" class="w-full h-full object-cover" loading="lazy" alt="Original Preview">
                </div>
                <div class="min-w-0 flex-1">
                    <h4 class="font-bold text-xs sm:text-sm truncate" style="color: var(--text-dark);" title="${res.fileName}">${res.fileName}</h4>
                    <div class="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider" style="background-color: var(--bg-subtle); color: var(--text-light);">
                        <span>${originalFile.type ? originalFile.type.split('/')[1]?.toUpperCase() : 'IMG'}</span>
                        <i class="fas fa-arrow-right text-xxs opacity-60"></i>
                        <span style="color: var(--primary-color);">${res.intendedFormat ? res.intendedFormat.toUpperCase() : 'OUT'}</span>
                    </div>
                </div>
            </div>

            <!-- Specs Grid -->
            <div class="grid grid-cols-2 gap-2 text-center mb-3.5 p-2.5 rounded-xl w-full" style="background-color: var(--bg-subtle);">
                <div class="border-r pr-1" style="border-color: var(--card-border);">
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">Before</p>
                    <p class="text-sm sm:text-base font-black mt-0.5 truncate" style="color: var(--text-dark);">${formatBytes(originalDetails.size)}</p>
                    <p class="text-xxs font-semibold opacity-75 truncate" style="color: var(--text-light);">${originalDetails.width} x ${originalDetails.height}px</p>
                </div>
                <div class="pl-1">
                    <p class="text-xxs font-extrabold uppercase tracking-widest text-gray-400">After</p>
                    <p class="text-sm sm:text-base font-black mt-0.5 truncate ${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">${formatBytes(res.blob.size)}</p>
                    <p class="text-xxs font-semibold opacity-75 truncate" style="color: var(--text-light);">${res.newWidth || originalDetails.width} x ${res.newHeight || originalDetails.height}px</p>
                </div>
            </div>

            <!-- Savings Bar -->
            <div class="space-y-1.5 mb-4 w-full">
                <div class="flex justify-between items-center text-xxs sm:text-xs font-bold">
                    <span style="color: var(--text-light);">${isSavedPositive ? 'File Size Reduced' : 'Lossless Re-encoding'}</span>
                    <span class="${isSavedPositive ? 'text-green-500' : 'text-yellow-600'}">
                        Saved: ${isSavedPositive ? '+' : ''}${savedPercent}%
                    </span>
                </div>
                <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: var(--bg-main);">
                    <div class="savings-bar-fill h-full rounded-full transition-all duration-1000 ease-out" 
                         style="width: 0%; background: ${isSavedPositive ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'};">
                    </div>
                </div>
            </div>

            <!-- Action Buttons Matrix -->
            <div class="grid grid-cols-3 gap-2 w-full">
                ${!isPdf ? `
                    <button class="preview-before-after-btn flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xxs sm:text-xs font-bold transition-all duration-200" style="background-color: var(--card-bg); border-color: var(--card-border); color: var(--text-dark);" data-index="${i}">
                        <i class="fas fa-eye"></i> <span>Preview</span>
                    </button>
                ` : ''}
                <a href="${downloadUrl}" download="${res.fileName}" class="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xxs sm:text-xs font-bold transition-all duration-200 text-white ${isPdf ? 'col-span-2' : ''}" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); border-color: var(--primary-color);">
                    <i class="fas fa-download"></i> <span>Save</span>
                </a>
                <button class="delete-result-btn flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xxs sm:text-xs font-bold transition-all duration-200 text-red-500 hover:bg-red-50" style="background-color: var(--card-bg); border-color: var(--card-border);" data-index="${i}">
                    <i class="fas fa-trash-alt"></i> <span>Delete</span>
                </button>
            </div>
        `;
        
        resultsContainer.appendChild(fileNode);
        
        setTimeout(() => {
            const bar = fileNode.querySelector('.savings-bar-fill');
            if (bar) {
                const barWidth = Math.min(100, Math.max(0, Math.abs(savedPercent)));
                bar.style.width = `${barWidth}%`;
            }
        }, 100);
    });

    // Attach Listeners
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

    // Download All ZIP Button (Batch Mode)
    if (processedResults.length > 1) {
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn upload-button w-full justify-center py-3 text-xs sm:text-sm mt-3 shadow-md';
        downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-2"></i><span>Download All (ZIP)</span>`;
        
        downloadBtn.onclick = async () => {
            downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i><span>Creating ZIP...</span>`;
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
                downloadBtn.innerHTML = `<i class="fas fa-file-archive mr-2"></i><span>Download All (ZIP)</span>`;
            }
        };
        resultsContainer.appendChild(downloadBtn);
    }
    
    toolScreen.querySelector('.conversion-process')?.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
}

// --- Before-After Comparison Modal (Safe Memory Management) ---
function openComparisonModal(index) {
    if (!processedResults || !processedResults[index]) return;
    
    const result = processedResults[index];
    const originalFile = files[result.fileIndex] || { previewUrl: '' };
    const splitDirection = document.getElementById('split-orientation')?.value || 'horizontal-split';

    const container = document.getElementById('modalPreviewContainer');
    if (!container) return;

    // Release old modal Blob URL from browser RAM
    if (currentModalBlobUrl) {
        try { URL.revokeObjectURL(currentModalBlobUrl); } catch (e) {}
        currentModalBlobUrl = null;
    }

    container.className = `before-after-container h-full w-full ${splitDirection}`;
    
    const beforeImg = container.querySelector('.before-image');
    const afterImg = container.querySelector('.after-image');
    
    currentModalBlobUrl = URL.createObjectURL(result.blob);

    if (beforeImg) beforeImg.src = originalFile.previewUrl;
    if (afterImg) afterImg.src = currentModalBlobUrl;
    
    const fileNameEl = document.getElementById('modalFileName');
    if (fileNameEl) fileNameEl.textContent = `Quality Comparison: ${result.fileName}`;
    
    if (previewModal) previewModal.classList.add('show');
    
    const viewport = container.querySelector('.comparison-viewport');
    if (viewport) {
        viewport.style.transform = `translate(0px, 0px) scale(1)`;
    }

    if (typeof initBeforeAfterSlider === 'function') {
        initBeforeAfterSlider(container);
    }
}

function initBeforeAfterSlider(container) {
    const slider = container.querySelector('.before-after-slider');
    const clipper = container.querySelector('.before-image-clipper');
    const viewport = container.querySelector('.comparison-viewport');
    
    if (!slider || !clipper || !viewport) return;
    
    let isSliderDragging = false;
    let isPanning = false;
    let scale = 1, translateX = 0, translateY = 0, startX = 0, startY = 0;

    const isVertical = container.classList.contains('vertical-split');

    const updateSliderPosition = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        if (isVertical) {
            let y = Math.max(0, Math.min(clientY - rect.top, rect.height));
            const pct = (y / rect.height) * 100;
            slider.style.top = `${pct}%`;
            clipper.style.clipPath = `inset(0 0 ${100 - pct}% 0)`;
        } else {
            let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
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

// --- Realtime Preview Size Estimator ---
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
    const previewInfo = toolScreen?.querySelector('.realtime-preview-info');
    if (!previewInfo || previewInfo.classList.contains('hidden')) return;

    const currentFile = files[currentImageIdx];
    if (!currentFile) return;

    const options = collectCurrentToolOptions(toolScreen);

    let result = null;
    if (activeTool === 'converter' && window.ImageConverterModule?.processImage) {
        result = await window.ImageConverterModule.processImage(currentFile, options);
    } else if (activeTool === 'compressor' && window.ImageCompressorModule?.processImage) {
        result = await window.ImageCompressorModule.processImage(currentFile, options);
    } else if (activeTool === 'resizer' && window.ImageResizerModule?.processImage) {
        result = await window.ImageResizerModule.processImage(currentFile, options);
    } else if (activeTool === 'watermark' && window.ImageWatermarkModule?.processImage) {
        result = await window.ImageWatermarkModule.processImage(currentFile, options);
    }

    if (result && result.blob) {
        const originalSizeSpan = previewInfo.querySelector('.original-size');
        const newSizeSpan = previewInfo.querySelector('.new-size');
        if (originalSizeSpan && newSizeSpan) {
            originalSizeSpan.textContent = formatBytes(originalFileDetails[currentImageIdx]?.size || currentFile.size);
            newSizeSpan.textContent = formatBytes(result.blob.size);
        }
    }
}, 250);
window.triggerRealtimeSizeUpdate = triggerRealtimeSizeUpdate;

// --- Attach Event Listeners ---
function attachToolEventListeners(container) {
    const dropZone = container.querySelector('#dropZone');
    const fileInput = container.querySelector('.file-input');
    
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
            if (!e.target.closest('.confirm-btn')) {
                fileInput?.click();
            }
        });
        fileInput?.addEventListener('change', e => handleFiles(e.target.files));
    }
    
    container.querySelector('.confirm-btn')?.addEventListener('click', () => confirmSelection());
    container.querySelector('.add-more-files-input')?.addEventListener('change', e => handleFiles(e.target.files, true));
    container.querySelector('.prev-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx - 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.next-image-btn')?.addEventListener('click', () => { showFilePreview(currentImageIdx + 1); triggerRealtimeSizeUpdate(); });
    container.querySelector('.start-btn')?.addEventListener('click', processFiles);
    container.querySelector('.clear-all-btn')?.addEventListener('click', () => resetTool(true));
    
    container.querySelectorAll('.quality-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const parent = slider.closest('.options-section') || slider.parentElement || container;
            const valSpan = parent.querySelector('.quality-value');
            if (valSpan) {
                valSpan.textContent = e.target.value;
                valSpan.style.transform = 'scale(1.25)';
                setTimeout(() => valSpan.style.transform = 'scale(1)', 100);
            }

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

    // Delegated Modules Events Setup
    if (activeTool === 'converter' && window.ImageConverterModule?.initConverterEvents) {
        window.ImageConverterModule.initConverterEvents(container);
    } else if (activeTool === 'compressor' && window.ImageCompressorModule?.initCompressorEvents) {
        window.ImageCompressorModule.initCompressorEvents(container);
    } else if (activeTool === 'resizer' && window.ImageResizerModule?.initResizerEvents) {
        window.ImageResizerModule.initResizerEvents(container);
    } else if (activeTool === 'watermark' && window.ImageWatermarkModule?.initWatermarkEvents) {
        window.ImageWatermarkModule.initWatermarkEvents(container);
    }
}

// --- Theme Switcher ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleThemeWithRipple(e) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

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
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleThemeWithRipple);
}

// --- Helper Utilities ---
function showToast(message) { 
    if (!toastMessage || !toast) return;
    toastMessage.textContent = message; 
    toast.classList.add('show'); 
    setTimeout(() => toast.classList.remove('show'), 3000); 
}
window.showToast = showToast;

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

// Close Preview Modal & Free Memory
document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
    if (previewModal) previewModal.classList.remove('show');
    if (currentModalBlobUrl) {
        try { URL.revokeObjectURL(currentModalBlobUrl); } catch (e) {}
        currentModalBlobUrl = null;
    }
});

// --- Scroll Reveal Observer System ---
let scrollObserver = null;

function initScrollReveal() {
    if (scrollObserver) scrollObserver.disconnect();

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    });

    revealElements.forEach(el => {
        el.classList.remove('revealed');
        scrollObserver.observe(el);
    });
}

// --- Dynamic Subtitle Text Rotator Engine ---
let subtitleRotationTimer = null;

function initSubtitleRotator() {
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
        
        currentIndex = (currentIndex + 1) % phrases.length;
        const nextPhrase = phrases[currentIndex];

        currentPhrase.classList.remove('active');
        currentPhrase.classList.add('exit');

        nextPhrase.classList.remove('exit');
        nextPhrase.classList.add('active');

        setTimeout(() => {
            currentPhrase.classList.remove('exit');
        }, 600);
    }, 3200);
}

// --- Page Navigation Override ---
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
    window.addEventListener('popstate', router);
    
    initScrollReveal();
    initSubtitleRotator();
    
    router();
});

// --- PWA Banner Manager ---
function initPWAInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    const installBtn = document.getElementById('pwaInstallBtn');
    const closeBtn = document.getElementById('pwaCloseBtn');

    if (!banner || !installBtn || !closeBtn) return;

    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
        banner.classList.add('hidden');
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;

        if (sessionStorage.getItem('pwa_banner_dismissed') !== 'true') {
            banner.classList.remove('hidden');
        }
    });

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

    closeBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
        sessionStorage.setItem('pwa_banner_dismissed', 'true');
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        banner.classList.add('hidden');
        showToast('ImgCon installed successfully! Now works 100% offline.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initPWAInstallBanner();
});

// Smart Mouse Spotlight Follower
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.tool-choice-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// --- SEO Guides Accordion Renderer ---
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
    }
};

function renderToolSeoGuide(toolName, container) {
    if (!container) return;
    
    const oldGuide = container.querySelector('.tool-seo-guide-container');
    if (oldGuide) oldGuide.remove();

    const guideData = toolGuidesData[toolName];
    if (!guideData) return;

    const guideSection = document.createElement('div');
    guideSection.className = 'tool-seo-guide-container animate__animated animate__fadeIn';

    guideSection.innerHTML = `
        <h2>${guideData.title}</h2>
        <ol class="mb-6">
            ${guideData.steps.map(step => `<li class="mb-2">${step}</li>`).join('')}
        </ol>

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
