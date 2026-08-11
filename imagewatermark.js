/**
 * ==========================================================================
 * IMAGEWATERMARK.JS - Modular & High-Precision Watermark Tool Engine
 * (Self-Contained UI, CSS, 9-Grid Position Engine, Text & Logo Watermarking)
 * ==========================================================================
 */

(function () {
    'use strict';

    // ==========================================================================
    // 1. DYNAMIC CSS INJECTION (Watermark Specific UI Styling)
    // ==========================================================================
    const watermarkStyles = `
        /* Watermark Type Selector Tabs */
        .watermark-type-btn {
            background-color: transparent;
            color: var(--text-light, #475569);
            border: none;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .watermark-type-btn.active {
            background-color: var(--primary-color, #6366f1) !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px var(--shadow-color, rgba(99, 102, 241, 0.2));
        }

        /* 9-Grid Position Buttons */
        .position-btn {
            background-color: var(--card-bg, #ffffff);
            border: 1px solid var(--card-border, #e5e7eb);
            color: var(--text-dark, #1e293b);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .position-btn:hover {
            border-color: var(--primary-color, #6366f1);
            background-color: var(--bg-subtle, #f1f5f9);
        }

        .position-btn.active {
            background-color: var(--primary-color, #6366f1) !important;
            border-color: var(--primary-color, #6366f1) !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px var(--shadow-color, rgba(99, 102, 241, 0.25));
        }

        /* Focus State for Watermark Text Input */
        #watermark-text:focus {
            border-color: var(--primary-color, #6366f1) !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
    `;

    function injectStyles() {
        if (!document.getElementById('imgcon-watermark-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'imgcon-watermark-styles';
            styleEl.textContent = watermarkStyles;
            document.head.appendChild(styleEl);
        }
    }

    // ==========================================================================
    // 2. DYNAMIC HTML TEMPLATE INJECTION
    // ==========================================================================
    const watermarkOptionsHTML = `
        <template id="watermarkOptionsTemplate">
            <div class="watermark-options-wrapper space-y-4 animate__animated animate__fadeIn">
                <!-- Header -->
                <div class="flex items-center justify-between pb-1 border-b" style="border-color: var(--card-border);">
                    <h3 class="text-base font-black uppercase tracking-wider" style="color: var(--text-dark);">
                        <i class="fas fa-copyright text-amber-500 mr-2"></i>Watermark Options
                    </h3>
                    <span class="text-xxs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 font-extrabold uppercase tracking-wider">Copyright Tool</span>
                </div>

                <div class="p-4 rounded-2xl border space-y-4" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <!-- Watermark Type Tabs (Text / Image) -->
                    <div>
                        <label class="font-bold text-xs uppercase tracking-wider block mb-2" style="color: var(--text-light);">Watermark Type</label>
                        <div class="flex rounded-xl border p-1" style="border-color: var(--card-border); background-color: var(--card-bg);">
                            <button type="button" class="watermark-type-btn active w-1/2 p-2 rounded-lg text-xs font-extrabold" data-type="text">Custom Text</button>
                            <button type="button" class="watermark-type-btn w-1/2 p-2 rounded-lg text-xs font-extrabold" data-type="image">Logo Image</button>
                        </div>
                    </div>

                    <!-- Text Watermark Input -->
                    <div id="text-watermark-options">
                        <label for="watermark-text" class="text-xs font-bold block mb-1" style="color: var(--text-light);">Watermark Text</label>
                        <input type="text" id="watermark-text" class="w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition-all" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);" value="© ImgCon" placeholder="e.g. © Your Brand Name">
                    </div>

                    <!-- Image Logo Watermark Upload -->
                    <div id="image-watermark-options" class="hidden space-y-2">
                        <label for="watermark-image-input" class="secondary-btn w-full flex items-center justify-center py-2.5 rounded-xl cursor-pointer text-xs font-bold transition-all hover:shadow-xs">
                            <i class="fas fa-upload mr-2 text-indigo-500"></i> Upload Transparent Logo
                            <input type="file" id="watermark-image-input" class="hidden" accept="image/png, image/jpeg, image/webp">
                        </label>
                        <div class="text-center">
                            <img id="watermark-preview" class="hidden max-h-20 mx-auto p-2 border rounded-xl shadow-xs" style="border-color: var(--card-border); background-color: var(--card-bg);" alt="Logo Preview">
                        </div>
                    </div>

                    <!-- Opacity Slider -->
                    <div class="pt-2 border-t" style="border-color: var(--card-border);">
                        <label class="font-bold text-xs sm:text-sm block mb-1.5" style="color: var(--text-dark);">Opacity: <span id="opacity-value" class="text-indigo-500 font-black">70</span>%</label>
                        <input type="range" id="opacity-slider" class="w-full accent-indigo-500 cursor-pointer" min="0" max="100" value="70">
                    </div>

                    <!-- Scale Slider -->
                    <div>
                        <label class="font-bold text-xs sm:text-sm block mb-1.5" style="color: var(--text-dark);">Scale Size: <span id="scale-value" class="text-indigo-500 font-black">20</span>%</label>
                        <input type="range" id="scale-slider" class="w-full accent-indigo-500 cursor-pointer" min="1" max="100" value="20">
                    </div>

                    <!-- 9-Grid Positioning System -->
                    <div>
                        <label class="font-bold text-xs uppercase tracking-wider block mb-2" style="color: var(--text-dark);">Watermark Position</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="top-left" title="Top Left"><i class="fas fa-arrow-up text-xs"></i><i class="fas fa-arrow-left text-xs ml-0.5"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="top-center" title="Top Center"><i class="fas fa-arrow-up text-xs"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="top-right" title="Top Right"><i class="fas fa-arrow-up text-xs"></i><i class="fas fa-arrow-right text-xs ml-0.5"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="center-left" title="Center Left"><i class="fas fa-arrow-left text-xs"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center active" data-position="center" title="Center"><i class="fas fa-crosshairs text-xs"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="center-right" title="Center Right"><i class="fas fa-arrow-right text-xs"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="bottom-left" title="Bottom Left"><i class="fas fa-arrow-down text-xs"></i><i class="fas fa-arrow-left text-xs ml-0.5"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="bottom-center" title="Bottom Center"><i class="fas fa-arrow-down text-xs"></i></button>
                            <button type="button" class="position-btn p-2.5 border rounded-xl flex items-center justify-center" data-position="bottom-right" title="Bottom Right"><i class="fas fa-arrow-down text-xs"></i><i class="fas fa-arrow-right text-xs ml-0.5"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    `;

    function injectTemplate() {
        if (!document.getElementById('watermarkOptionsTemplate')) {
            const div = document.createElement('div');
            div.innerHTML = watermarkOptionsHTML.trim();
            document.body.appendChild(div.firstElementChild);
        }
    }

    // ==========================================================================
    // 3. CORE WATERMARKING ENGINE LOGIC (Canvas & 9-Grid Position Calculations)
    // ==========================================================================

    /**
     * Renders text or logo watermark onto base image
     * @param {File} file - Source Image File
     * @param {Object} options - Watermarking options
     * @returns {Promise<Object>} Processed result object
     */
    async function processImage(file, options = {}) {
        const type = options.watermarkType || 'text';
        const text = options.watermarkText || '© ImgCon';
        const opacity = typeof options.watermarkOpacity === 'number' ? options.watermarkOpacity : 0.7;
        const scale = typeof options.watermarkScale === 'number' ? options.watermarkScale : 0.2;
        const position = options.watermarkPosition || 'center';
        const logoBitmap = options.watermarkBitmap || window.watermarkImage || null;
        const quality = typeof options.quality === 'number' ? options.quality : 0.9;

        const baseBitmap = await createImageBitmap(file);
        const width = baseBitmap.width;
        const height = baseBitmap.height;

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

        // Draw Base Image
        let mimeType = file.type || 'image/jpeg';
        let extension = mimeType.split('/')[1] || 'jpg';
        if (extension === 'jpeg') extension = 'jpg';

        if (extension === 'jpg' || extension === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(baseBitmap, 0, 0, width, height);

        // Set Transparency Alpha
        ctx.globalAlpha = opacity;
        const padding = Math.min(width, height) * 0.03;

        // 1. TEXT WATERMARK RENDERING
        if (type === 'text') {
            const fontSize = Math.max(14, Math.round(width * 0.08 * scale));
            ctx.font = `bold ${fontSize}px sans-serif, Arial`;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            const pos = { x: 0, y: 0 };

            // Horizontal Alignment
            switch (position) {
                case 'top-left':
                case 'center-left':
                case 'bottom-left':
                    ctx.textAlign = 'left';
                    pos.x = padding;
                    break;
                case 'top-center':
                case 'center':
                case 'bottom-center':
                    ctx.textAlign = 'center';
                    pos.x = width / 2;
                    break;
                case 'top-right':
                case 'center-right':
                case 'bottom-right':
                    ctx.textAlign = 'right';
                    pos.x = width - padding;
                    break;
            }

            // Vertical Alignment
            switch (position) {
                case 'top-left':
                case 'top-center':
                case 'top-right':
                    ctx.textBaseline = 'top';
                    pos.y = padding;
                    break;
                case 'center-left':
                case 'center':
                case 'center-right':
                    ctx.textBaseline = 'middle';
                    pos.y = height / 2;
                    break;
                case 'bottom-left':
                case 'bottom-center':
                case 'bottom-right':
                    ctx.textBaseline = 'bottom';
                    pos.y = height - padding;
                    break;
            }

            ctx.fillText(text, pos.x, pos.y);
        }
        // 2. LOGO IMAGE WATERMARK RENDERING
        else if (type === 'image' && logoBitmap) {
            const logoRatio = logoBitmap.width / logoBitmap.height;
            let logoW = width * scale;
            let logoH = logoW / logoRatio;

            if (logoH > height * scale) {
                logoH = height * scale;
                logoW = logoH * logoRatio;
            }

            const pos = { x: 0, y: 0 };

            // Horizontal Calculation
            switch (position) {
                case 'top-left':
                case 'center-left':
                case 'bottom-left':
                    pos.x = padding;
                    break;
                case 'top-center':
                case 'center':
                case 'bottom-center':
                    pos.x = (width - logoW) / 2;
                    break;
                case 'top-right':
                case 'center-right':
                case 'bottom-right':
                    pos.x = width - logoW - padding;
                    break;
            }

            // Vertical Calculation
            switch (position) {
                case 'top-left':
                case 'top-center':
                case 'top-right':
                    pos.y = padding;
                    break;
                case 'center-left':
                case 'center':
                case 'center-right':
                    pos.y = (height - logoH) / 2;
                    break;
                case 'bottom-left':
                case 'bottom-center':
                case 'bottom-right':
                    pos.y = height - logoH - padding;
                    break;
            }

            ctx.drawImage(logoBitmap, pos.x, pos.y, logoW, logoH);
        }

        ctx.globalAlpha = 1.0;
        if (typeof baseBitmap.close === 'function') baseBitmap.close();

        // Convert to Blob
        let blob;
        if (canvas.convertToBlob) {
            blob = await canvas.convertToBlob({ type: mimeType, quality });
        } else {
            blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
        }

        const newFileName = file.name.replace(/\.[^/.]+$/, "") + '_watermarked.' + extension;

        return {
            success: true,
            blob,
            fileName: newFileName,
            intendedFormat: extension,
            newWidth: width,
            newHeight: height
        };
    }

    // ==========================================================================
    // 4. EVENT BINDINGS & WATERMARK UI LISTENERS
    // ==========================================================================
    function initWatermarkEvents(container) {
        if (!container) return;

        const typeButtons = container.querySelectorAll('.watermark-type-btn');
        typeButtons.forEach(btn => btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            container.querySelector('#text-watermark-options')?.classList.toggle('hidden', type !== 'text');
            container.querySelector('#image-watermark-options')?.classList.toggle('hidden', type !== 'image');

            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        }));

        const logoInput = container.querySelector('#watermark-image-input');
        logoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const bitmap = await createImageBitmap(file);
                    window.watermarkImage = bitmap;
                    const preview = container.querySelector('#watermark-preview');
                    if (preview) {
                        preview.src = URL.createObjectURL(file);
                        preview.classList.remove('hidden');
                    }
                    if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                        window.triggerRealtimeSizeUpdate();
                    }
                } catch (err) {
                    console.error("Failed to load watermark logo image", err);
                }
            }
        });

        container.querySelector('#opacity-slider')?.addEventListener('input', (e) => {
            const opacityVal = container.querySelector('#opacity-value');
            if (opacityVal) opacityVal.textContent = e.target.value;
            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        });

        container.querySelector('#scale-slider')?.addEventListener('input', (e) => {
            const scaleVal = container.querySelector('#scale-value');
            if (scaleVal) scaleVal.textContent = e.target.value;
            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        });

        container.querySelector('#watermark-text')?.addEventListener('input', () => {
            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        });

        const posButtons = container.querySelectorAll('.position-btn');
        posButtons.forEach(btn => btn.addEventListener('click', () => {
            posButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (typeof window.triggerRealtimeSizeUpdate === 'function') {
                window.triggerRealtimeSizeUpdate();
            }
        }));
    }

    // Inject CSS & HTML Template on DOM Ready
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        injectTemplate();
    });

    // ==========================================================================
    // 5. EXPOSE MODULE GLOBALLY
    // ==========================================================================
    window.ImageWatermarkModule = {
        processImage,
        initWatermarkEvents
    };

})();