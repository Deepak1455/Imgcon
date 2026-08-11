/**
 * ==========================================================================
 * IMAGERESIZER.JS - Modular & High-Precision Image Resizer Engine
 * (Self-Contained UI, CSS, Social Presets, Aspect Ratio Lock & Canvas Scaling)
 * ==========================================================================
 */

(function () {
    'use strict';

    // ==========================================================================
    // 1. DYNAMIC CSS INJECTION (Resizer Specific UI Styling)
    // ==========================================================================
    const resizerStyles = `
        /* Resizer Toggle Mode Buttons */
        .resize-by-btn {
            background-color: transparent;
            color: var(--text-light, #475569);
            border: none;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .resize-by-btn.active {
            background-color: var(--primary-color, #6366f1) !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px var(--shadow-color, rgba(99, 102, 241, 0.2));
        }

        /* Resizer Input Fields Focus Ring */
        #resize-width:focus, #resize-height:focus, #social-presets:focus {
            border-color: var(--primary-color, #6366f1) !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        /* Aspect Ratio Switch Styling */
        .aspect-switch-wrapper {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            flex-shrink: 0;
        }

        .aspect-switch-wrapper input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .aspect-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--card-border, #cbd5e1);
            transition: .3s cubic-bezier(0.25, 0.8, 0.25, 1);
            border-radius: 9999px;
        }

        .aspect-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s cubic-bezier(0.25, 0.8, 0.25, 1);
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }

        input:checked + .aspect-slider {
            background-color: var(--primary-color, #6366f1);
        }

        input:checked + .aspect-slider:before {
            transform: translateX(20px);
        }
    `;

    function injectStyles() {
        if (!document.getElementById('imgcon-resizer-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'imgcon-resizer-styles';
            styleEl.textContent = resizerStyles;
            document.head.appendChild(styleEl);
        }
    }

    // ==========================================================================
    // 2. DYNAMIC HTML TEMPLATE INJECTION
    // ==========================================================================
    const resizerOptionsHTML = `
        <template id="resizerOptionsTemplate">
            <div class="resizer-options-wrapper space-y-4 animate__animated animate__fadeIn">
                <!-- Header -->
                <div class="flex items-center justify-between pb-1 border-b" style="border-color: var(--card-border);">
                    <h3 class="text-base font-black uppercase tracking-wider" style="color: var(--text-dark);">
                        <i class="fas fa-expand-arrows-alt text-blue-500 mr-2"></i>Resizer Options
                    </h3>
                    <span class="text-xxs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 font-extrabold uppercase tracking-wider">Dimension Scaler</span>
                </div>

                <div class="p-4 rounded-2xl border space-y-4" style="background-color: var(--bg-subtle); border-color: var(--card-border);">
                    <!-- Mode Selector Tab -->
                    <div>
                        <label class="font-bold text-xs uppercase tracking-wider block mb-2" style="color: var(--text-light);">Resize Mode</label>
                        <div class="flex rounded-xl border p-1" style="border-color: var(--card-border); background-color: var(--card-bg);">
                            <button class="resize-by-btn active w-1/2 p-2 rounded-lg text-xs font-extrabold" data-mode="pixels">Pixels (W x H)</button>
                            <button class="resize-by-btn w-1/2 p-2 rounded-lg text-xs font-extrabold" data-mode="percentage">Percentage (%)</button>
                        </div>
                    </div>

                    <!-- Pixels Mode Options -->
                    <div id="pixels-mode-container" class="space-y-3">
                        <div class="grid grid-cols-2 gap-3 items-center">
                            <div>
                                <label for="resize-width" class="text-xs font-bold block mb-1" style="color: var(--text-light);">Width (px)</label>
                                <input type="number" id="resize-width" class="w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition-all" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);" placeholder="Width">
                            </div>
                            <div>
                                <label for="resize-height" class="text-xs font-bold block mb-1" style="color: var(--text-light);">Height (px)</label>
                                <input type="number" id="resize-height" class="w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition-all" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);" placeholder="Height">
                            </div>
                        </div>

                        <!-- Social Media Presets -->
                        <div>
                            <label for="social-presets" class="text-xs font-bold block mb-1" style="color: var(--text-light);">Social Media Presets</label>
                            <select id="social-presets" class="w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer transition-all" style="border-color: var(--card-border); background-color: var(--card-bg); color: var(--text-dark);">
                                <option value="custom">Custom Dimensions</option>
                                <option value="1080x1080">Instagram Post (1080 x 1080 px)</option>
                                <option value="1080x1350">Instagram Portrait (1080 x 1350 px)</option>
                                <option value="1080x1920">Instagram Story / Reel (1080 x 1920 px)</option>
                                <option value="1200x630">Facebook Post (1200 x 630 px)</option>
                                <option value="820x312">Facebook Cover (820 x 312 px)</option>
                                <option value="1024x512">Twitter Post (1024 x 512 px)</option>
                                <option value="1500x500">Twitter Header (1500 x 500 px)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Percentage Mode Options -->
                    <div id="percentage-mode-container" class="hidden space-y-3">
                        <div>
                            <label class="font-bold text-xs sm:text-sm block mb-2" style="color: var(--text-dark);">Scale: <span id="percentage-value" class="text-indigo-500 font-black">50</span>%</label>
                            <input type="range" id="percentage-slider" class="w-full accent-indigo-500 cursor-pointer" min="1" max="100" value="50">
                        </div>
                        <div class="text-center text-xs font-semibold p-2 rounded-xl" style="background-color: var(--card-bg);">
                            New Dimensions: <span id="percentage-dims" class="font-black text-indigo-500">0 x 0 px</span>
                        </div>
                    </div>

                    <!-- Maintain Aspect Ratio Toggle -->
                    <div class="flex items-center justify-between pt-3 border-t" style="border-color: var(--card-border);">
                        <div>
                            <label for="aspect-ratio-toggle" class="font-bold text-xs cursor-pointer block" style="color: var(--text-dark);">Maintain Aspect Ratio</label>
                            <p class="text-xxs font-medium" style="color: var(--text-light);">Prevents image distortion & stretching</p>
                        </div>
                        <label class="aspect-switch-wrapper">
                            <input type="checkbox" id="aspect-ratio-toggle" checked>
                            <span class="aspect-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </template>
    `;

    function injectTemplate() {
        if (!document.getElementById('resizerOptionsTemplate')) {
            const div = document.createElement('div');
            div.innerHTML = resizerOptionsHTML.trim();
            document.body.appendChild(div.firstElementChild);
        }
    }

    // ==========================================================================
    // 3. CORE RESIZING ENGINE LOGIC (High Quality Canvas Rescaler)
    // ==========================================================================

    /**
     * Resizes an image file by Pixels or Percentage
     * @param {File} file 
     * @param {Object} options - Resizing options
     * @returns {Promise<Object>} Resized result object
     */
    async function processImage(file, options = {}) {
        const mode = options.mode || 'pixels';
        const quality = typeof options.quality === 'number' ? options.quality : 0.9;
        
        const bitmap = await createImageBitmap(file);
        const origW = bitmap.width;
        const origH = bitmap.height;

        let targetWidth = origW;
        let targetHeight = origH;

        if (mode === 'percentage') {
            const scalePct = (parseFloat(options.percentage) || 50) / 100;
            targetWidth = Math.max(1, Math.round(origW * scalePct));
            targetHeight = Math.max(1, Math.round(origH * scalePct));
        } else {
            targetWidth = parseInt(options.width, 10) || origW;
            targetHeight = parseInt(options.height, 10) || origH;
        }

        // Setup High-Quality Canvas
        let canvas, ctx;
        if (typeof OffscreenCanvas !== 'undefined') {
            canvas = new OffscreenCanvas(targetWidth, targetHeight);
            ctx = canvas.getContext('2d');
        } else {
            canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx = canvas.getContext('2d');
        }

        // Determine MIME Type & Background Fill
        let mimeType = file.type || 'image/jpeg';
        let extension = mimeType.split('/')[1] || 'jpg';
        if (extension === 'jpeg') extension = 'jpg';

        if (extension === 'jpg' || extension === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // High Quality Image Scaling Algorithms
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        if (typeof bitmap.close === 'function') bitmap.close();

        // Canvas to Blob Conversion
        let blob;
        if (canvas.convertToBlob) {
            blob = await canvas.convertToBlob({ type: mimeType, quality });
        } else {
            blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
        }

        const newFileName = file.name.replace(/\.[^/.]+$/, "") + '_resized.' + extension;

        return {
            success: true,
            blob,
            fileName: newFileName,
            intendedFormat: extension,
            newWidth: targetWidth,
            newHeight: targetHeight
        };
    }

    // ==========================================================================
    // 4. EVENT BINDINGS & RESIZER LOGIC
    // ==========================================================================
    function initResizerEvents(container) {
        if (!container) return;

        const modeButtons = container.querySelectorAll('.resize-by-btn');
        const widthInput = container.querySelector('#resize-width');
        const heightInput = container.querySelector('#resize-height');
        const aspectToggle = container.querySelector('#aspect-ratio-toggle');
        const socialPresets = container.querySelector('#social-presets');
        const percentageSlider = container.querySelector('#percentage-slider');
        const percentageValue = container.querySelector('#percentage-value');
        const percentageDims = container.querySelector('#percentage-dims');

        // Mode Switching (Pixels vs Percentage)
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

            const currentIdx = typeof window.currentImageIdx !== 'undefined' ? window.currentImageIdx : 0;
            const details = window.originalFileDetails ? window.originalFileDetails[currentIdx] : null;

            if (percentageDims && details) {
                const origW = details.width || 0;
                const origH = details.height || 0;
                const newW = Math.round(origW * (scalePct / 100));
                const newH = Math.round(origH * (scalePct / 100));
                percentageDims.textContent = `${newW} x ${newH} px`;
            }
        });

        // Social Media Preset Selection
        socialPresets?.addEventListener('change', () => {
            if (socialPresets.value !== 'custom') {
                const [w, h] = socialPresets.value.split('x').map(Number);
                if (widthInput && heightInput) {
                    widthInput.value = w;
                    heightInput.value = h;
                }
            }
        });

        // Aspect Ratio Width Auto Calculation
        widthInput?.addEventListener('input', () => {
            const currentIdx = typeof window.currentImageIdx !== 'undefined' ? window.currentImageIdx : 0;
            const details = window.originalFileDetails ? window.originalFileDetails[currentIdx] : null;

            if (aspectToggle?.checked && window.files && window.files.length > 0 && details) {
                const ratio = details.ratio;
                if (ratio && heightInput) {
                    heightInput.value = Math.round(parseInt(widthInput.value, 10) / ratio) || '';
                }
            }
        });

        // Aspect Ratio Height Auto Calculation
        heightInput?.addEventListener('input', () => {
            const currentIdx = typeof window.currentImageIdx !== 'undefined' ? window.currentImageIdx : 0;
            const details = window.originalFileDetails ? window.originalFileDetails[currentIdx] : null;

            if (aspectToggle?.checked && window.files && window.files.length > 0 && details) {
                const ratio = details.ratio;
                if (ratio && widthInput) {
                    widthInput.value = Math.round(parseInt(heightInput.value, 10) * ratio) || '';
                }
            }
        });
    }

    // Inject CSS & HTML Template on DOM Ready
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        injectTemplate();
    });

    // ==========================================================================
    // 5. EXPOSE MODULE GLOBALLY
    // ==========================================================================
    window.ImageResizerModule = {
        processImage,
        initResizerEvents
    };

})();