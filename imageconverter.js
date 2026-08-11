/**
 * ==========================================================================
 * IMAGECONVERTER.JS - Modular & Ultra-Fast Image Converter Engine
 * (Self-Contained UI, CSS, Events & Core Canvas/PDF Processing Logic)
 * ==========================================================================
 */

(function () {
    'use strict';

    // ==========================================================================
    // 1. DYNAMIC CSS INJECTION (Converter Specific UI & Format Card Styles)
    // ==========================================================================
    const converterStyles = `
        .converter-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
        }

        .format-selector-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.85rem;
        }

        @media (min-width: 640px) {
            .format-selector-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }

        .format-card-modern {
            position: relative;
            background-color: var(--card-bg, #ffffff);
            border: 2px solid var(--card-border, #e5e7eb);
            border-radius: 1.25rem;
            padding: 1rem 0.85rem;
            text-align: center;
            cursor: pointer;
            overflow: hidden;
            transform: translate3d(0, 0, 0);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                        border-color 0.25s ease,
                        box-shadow 0.25s ease,
                        background-color 0.25s ease;
            user-select: none;
        }

        .format-card-modern:hover {
            transform: translate3d(0, -3px, 0);
            border-color: rgba(99, 102, 241, 0.5);
            box-shadow: 0 10px 20px -5px var(--shadow-color, rgba(99, 102, 241, 0.15));
        }

        .format-card-modern.selected {
            border-color: var(--primary-color, #6366f1) !important;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
            box-shadow: 0 0 20px -2px rgba(99, 102, 241, 0.3),
                        inset 0 0 0 1px var(--primary-color, #6366f1);
            transform: scale(1.02);
        }

        .format-card-modern .selected-check {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--primary-color, #6366f1);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            opacity: 0;
            transform: scale(0.3) rotate(-45deg);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
        }

        .format-card-modern.selected .selected-check {
            opacity: 1;
            transform: scale(1) rotate(0deg);
        }

        .format-card-modern i {
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .format-card-modern:hover i,
        .format-card-modern.selected i {
            transform: scale(1.18);
        }

        .preset-btn {
            padding: 0.35rem 0.75rem;
            border-radius: 0.75rem;
            font-size: 0.7rem;
            font-weight: 700;
            border: 1px solid var(--card-border, #e5e7eb);
            background-color: var(--bg-main, #f8fafc);
            color: var(--text-light, #475569);
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
            cursor: pointer;
        }

        .preset-btn:hover,
        .preset-btn.active {
            background-color: var(--primary-color, #6366f1);
            color: #ffffff;
            border-color: var(--primary-color, #6366f1);
            box-shadow: 0 4px 12px var(--shadow-color, rgba(99, 102, 241, 0.15));
        }

        .format-intel-box {
            background: linear-gradient(135deg, var(--bg-subtle, #f1f5f9), var(--card-bg, #ffffff));
            border: 1px solid var(--card-border, #e5e7eb);
            border-radius: 1rem;
            padding: 0.85rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.85rem;
            transition: all 0.25s ease;
        }
    `;

    function injectStyles() {
        if (!document.getElementById('imgcon-converter-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'imgcon-converter-styles';
            styleEl.textContent = converterStyles;
            document.head.appendChild(styleEl);
        }
    }

    // ==========================================================================
    // 2. DYNAMIC HTML TEMPLATE INJECTION
    // ==========================================================================
    const converterOptionsHTML = `
        <template id="converterOptionsTemplate">
            <div class="converter-options-wrapper space-y-5 animate__animated animate__fadeIn">
                <!-- Header -->
                <div class="converter-header">
                    <div>
                        <h3 class="text-base font-black uppercase tracking-wider" style="color: var(--text-dark);">
                            <i class="fas fa-sliders-h text-indigo-500 mr-2"></i>Converter Settings
                        </h3>
                        <p class="text-xs font-medium" style="color: var(--text-light);">Select desired target format & compression profile</p>
                    </div>
                    <span class="text-xxs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 font-extrabold uppercase tracking-wider">Fast Engine</span>
                </div>

                <!-- Modern Format Selection Grid -->
                <div>
                    <label class="font-bold text-xs uppercase tracking-wider block mb-3" style="color: var(--text-light);">Select Output Format</label>
                    <div class="format-selector-grid format-selector">
                        <div class="format-card format-card-modern" data-format="webp">
                            <div class="selected-check"><i class="fas fa-check"></i></div>
                            <i class="fas fa-bolt text-2xl mb-1 text-teal-500"></i>
                            <h4 class="font-extrabold text-sm" style="color: var(--text-dark);">WEBP</h4>
                            <span class="text-xxs font-bold opacity-75 block mt-0.5" style="color: var(--text-light);">Small & Fast</span>
                        </div>
                        <div class="format-card format-card-modern" data-format="jpg">
                            <div class="selected-check"><i class="fas fa-check"></i></div>
                            <i class="fas fa-camera-retro text-2xl mb-1 text-amber-500"></i>
                            <h4 class="font-extrabold text-sm" style="color: var(--text-dark);">JPG</h4>
                            <span class="text-xxs font-bold opacity-75 block mt-0.5" style="color: var(--text-light);">Standard</span>
                        </div>
                        <div class="format-card format-card-modern" data-format="png">
                            <div class="selected-check"><i class="fas fa-check"></i></div>
                            <i class="fas fa-image text-2xl mb-1 text-indigo-500"></i>
                            <h4 class="font-extrabold text-sm" style="color: var(--text-dark);">PNG</h4>
                            <span class="text-xxs font-bold opacity-75 block mt-0.5" style="color: var(--text-light);">Transparent</span>
                        </div>
                        <div class="format-card format-card-modern" data-format="avif">
                            <div class="selected-check"><i class="fas fa-check"></i></div>
                            <i class="fas fa-feather-alt text-2xl mb-1 text-purple-500"></i>
                            <h4 class="font-extrabold text-sm" style="color: var(--text-dark);">AVIF</h4>
                            <span class="text-xxs font-bold opacity-75 block mt-0.5" style="color: var(--text-light);">Next-Gen</span>
                        </div>
                        <div class="format-card format-card-modern" data-format="pdf">
                            <div class="selected-check"><i class="fas fa-check"></i></div>
                            <i class="fas fa-file-pdf text-2xl mb-1 text-red-500"></i>
                            <h4 class="font-extrabold text-sm" style="color: var(--text-dark);">PDF</h4>
                            <span class="text-xxs font-bold opacity-75 block mt-0.5" style="color: var(--text-light);">Document</span>
                        </div>
                        <div class="format-card format-card-modern" data-format="ico">
                            <div class="selected-check"><i class="fas fa-check"></i></div>
                            <i class="fas fa-desktop text-2xl mb-1 text-blue-500"></i>
                            <h4 class="font-extrabold text-sm" style="color: var(--text-dark);">ICO</h4>
                            <span class="text-xxs font-bold opacity-75 block mt-0.5" style="color: var(--text-light);">Favicon</span>
                        </div>
                    </div>
                </div>

                <!-- Format Intelligence Summary Box -->
                <div id="formatIntelBox" class="format-intel-box">
                    <div class="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg flex-shrink-0">
                        <i class="fas fa-lightbulb" id="formatIntelIcon"></i>
                    </div>
                    <div class="text-xs">
                        <p class="font-bold" id="formatIntelTitle" style="color: var(--text-dark);">Selected Format Information</p>
                        <p class="font-medium opacity-80" id="formatIntelDesc" style="color: var(--text-light);">Click any format card above to view details & recommended settings.</p>
                    </div>
                </div>

                <!-- Quality Control Section -->
                <div class="options-section p-4 rounded-2xl border space-y-3" id="qualitySection" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <div class="flex items-center justify-between">
                        <label class="font-bold text-xs uppercase tracking-wider" style="color: var(--text-dark);">
                            Image Quality: <span class="quality-value text-indigo-500 text-sm font-black">85</span>%
                        </label>
                        <div class="flex items-center gap-1.5" id="qualityPresets">
                            <button type="button" class="preset-btn" data-quality="100">Max</button>
                            <button type="button" class="preset-btn active" data-quality="85">Balanced</button>
                            <button type="button" class="preset-btn" data-quality="60">Compact</button>
                        </div>
                    </div>
                    <input type="range" class="quality-slider w-full cursor-pointer" min="1" max="100" value="85">
                </div>

                <!-- PDF Settings Section -->
                <div class="options-section p-4 rounded-2xl border hidden space-y-3" id="pdfOptionsSection" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <h4 class="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2" style="color: var(--text-dark);">
                        <i class="fas fa-file-pdf text-red-500"></i> PDF Document Settings
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label for="pdf-page-size" class="text-xxs font-bold uppercase" style="color: var(--text-light);">Page Size</label>
                            <select id="pdf-page-size" class="w-full mt-1 p-2 rounded-xl border text-xs font-bold outline-none" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);">
                                <option value="a4">A4 (Standard)</option>
                                <option value="letter">Letter</option>
                                <option value="legal">Legal</option>
                            </select>
                        </div>
                        <div>
                            <label for="pdf-orientation" class="text-xxs font-bold uppercase" style="color: var(--text-light);">Orientation</label>
                            <select id="pdf-orientation" class="w-full mt-1 p-2 rounded-xl border text-xs font-bold outline-none" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);">
                                <option value="p">Portrait</option>
                                <option value="l">Landscape</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    `;

    function injectTemplate() {
        if (!document.getElementById('converterOptionsTemplate')) {
            const div = document.createElement('div');
            div.innerHTML = converterOptionsHTML.trim();
            document.body.appendChild(div.firstElementChild);
        }
    }

    // ==========================================================================
    // 3. CONVERTER MODULE DATA & CONFIGURATION
    // ==========================================================================
    const formatTips = {
        png: { title: 'PNG (Lossless Transparency)', desc: 'Best for graphics, logos, and images requiring background transparency.', icon: 'fa-image' },
        jpg: { title: 'JPG (Universal Compatibility)', desc: 'Ideal for real-world photos. Supported on all browsers & devices.', icon: 'fa-camera-retro' },
        webp: { title: 'WEBP (30% Smaller for Web)', desc: 'Google next-gen format with superior compression for faster websites.', icon: 'fa-bolt' },
        avif: { title: 'AVIF (Ultra High Efficiency)', desc: 'Maximum file size reduction with crisp visual quality. Modern web standard.', icon: 'fa-feather-alt' },
        pdf: { title: 'PDF (Document Archive)', desc: 'Combines your images into a single print-ready PDF document.', icon: 'fa-file-pdf' },
        ico: { title: 'ICO (Favicon Generator)', desc: 'Converts images to multi-resolution icon file for websites.', icon: 'fa-desktop' }
    };

    // ==========================================================================
    // 4. CORE CONVERSION PROCESSING ENGINE (Self-Contained Processing)
    // ==========================================================================

    /**
     * Converts a single image file to the desired format using HTML5 Canvas / OffscreenCanvas
     * @param {File} file 
     * @param {Object} options - { format: 'webp'|'jpg'|'png'|'avif'|'ico', quality: 0.85 }
     * @returns {Promise<Object>} Result object with blob, dimensions, and metadata
     */
    async function processImage(file, options = {}) {
        const targetFormat = (options.format || 'webp').toLowerCase();
        const quality = typeof options.quality === 'number' ? options.quality : 0.85;

        // Load image into bitmap
        const bitmap = await createImageBitmap(file);
        const width = bitmap.width;
        const height = bitmap.height;

        // Setup Canvas
        let canvas, ctx;
        if (typeof OffscreenCanvas !== 'undefined') {
            canvas = new OffscreenCanvas(width, height);
            ctx = canvas.getContext('2d');
        } else {
            canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext('2d');
        }

        // Fill white background for JPG (since JPG doesn't support transparency)
        if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        if (typeof bitmap.close === 'function') bitmap.close();

        // Map target format to MIME type
        let mimeType = 'image/webp';
        let extension = targetFormat;

        switch (targetFormat) {
            case 'jpg':
            case 'jpeg':
                mimeType = 'image/jpeg';
                extension = 'jpg';
                break;
            case 'png':
                mimeType = 'image/png';
                extension = 'png';
                break;
            case 'avif':
                mimeType = 'image/avif';
                extension = 'avif';
                break;
            case 'ico':
                mimeType = 'image/x-icon';
                extension = 'ico';
                break;
            case 'webp':
            default:
                mimeType = 'image/webp';
                extension = 'webp';
                break;
        }

        // Convert canvas to Blob
        let blob;
        if (canvas.convertToBlob) {
            try {
                blob = await canvas.convertToBlob({ type: mimeType, quality });
            } catch (err) {
                // Fallback to PNG if AVIF/WEBP convertToBlob is unsupported on old browser
                blob = await canvas.convertToBlob({ type: 'image/png' });
            }
        } else {
            blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
        }

        const newFileName = file.name.replace(/\.[^/.]+$/, "") + '.' + extension;

        return {
            success: true,
            blob,
            fileName: newFileName,
            intendedFormat: extension,
            newWidth: width,
            newHeight: height
        };
    }

    /**
     * Compiles multiple converted images into a single PDF Document
     * @param {Array} results - Array of conversion result objects
     * @returns {Promise<Blob>} Compiled PDF Blob
     */
    async function compilePDF(results) {
        if (typeof window.loadExternalLibrary === 'function') {
            await window.loadExternalLibrary('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
        }
        const { jsPDF } = window.jspdf;

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

            const finalW = imgW * ratio;
            const finalH = imgH * ratio;
            const posX = (pdfWidth - finalW) / 2;
            const posY = (pdfHeight - finalH) / 2;

            pdf.addImage(dataUrl, 'JPEG', posX, posY, finalW, finalH);
        }
        return pdf.output('blob');
    }

    // ==========================================================================
    // 5. EVENT BINDINGS & UI LISTENERS
    // ==========================================================================
    function initConverterEvents(container) {
        if (!container) return;

        const formatCards = container.querySelectorAll('.format-card');
        const intelTitle = container.querySelector('#formatIntelTitle');
        const intelDesc = container.querySelector('#formatIntelDesc');
        const intelIcon = container.querySelector('#formatIntelIcon');

        // Smart Format Selection & Dual-Sync Helper Function
        function selectFormat(card) {
            if (!card) return;
            formatCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            const chosenFormat = card.dataset.format || 'webp';

            // Dual-Sync Format State across window and script.js
            window.selectedFormat = chosenFormat;
            if (typeof window.setSelectedFormat === 'function') {
                window.setSelectedFormat(chosenFormat);
            }

            const tip = formatTips[chosenFormat];
            if (tip && intelTitle && intelDesc) {
                intelTitle.textContent = tip.title;
                intelDesc.textContent = tip.desc;
                if (intelIcon) intelIcon.className = `fas ${tip.icon}`;
            }

            const pdfSection = container.querySelector('#pdfOptionsSection');
            if (pdfSection) pdfSection.classList.toggle('hidden', chosenFormat !== 'pdf');

            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        }

        // Attach Click Listener to Format Cards
        formatCards.forEach(card => {
            card.addEventListener('click', () => selectFormat(card));
        });

        // Auto-Select Default Format (WEBP)
        const defaultCard = container.querySelector('.format-card[data-format="webp"]') || formatCards[0];
        if (defaultCard) {
            selectFormat(defaultCard);
        }

        // Quality Preset Buttons Listener
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

                if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                    window.triggerRealtimeSizeUpdate();
                }
            });
        });
    }

    // Initialize HTML & CSS on Script Load
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        injectTemplate();
    });

    // ==========================================================================
    // 6. EXPOSE MODULE GLOBALLY
    // ==========================================================================
    window.ImageConverterModule = {
        processImage,
        compilePDF,
        initConverterEvents,
        formatTips
    };

})();