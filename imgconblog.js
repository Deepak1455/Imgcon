/**
 * ImgCon Blog Content & UI Manager
 * Smart, Smooth & Fast on-demand blog rendering engine
 */
(function () {
    // 1. Dynamic CSS Injection (keeps style.css lightweight and clean)
    const styleId = 'imgcon-blog-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .blog-prose {
                text-align: left;
                max-width: 52rem;
                margin: 0 auto;
                line-height: 1.8;
            }
            .blog-prose h2 {
                font-size: 1.875rem;
                font-weight: 900;
                margin-top: 2rem;
                margin-bottom: 1rem;
                color: var(--text-dark);
                line-height: 1.25;
            }
            .blog-prose h3 {
                font-size: 1.35rem;
                font-weight: 800;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                color: var(--text-dark);
                line-height: 1.3;
            }
            .blog-prose p {
                font-size: 0.95rem;
                margin-bottom: 1.25rem;
                color: var(--text-light);
            }
            .blog-prose ul {
                list-style-type: disc;
                padding-left: 1.5rem;
                margin-bottom: 1.25rem;
                color: var(--text-light);
            }
            .blog-prose li {
                font-size: 0.95rem;
                margin-bottom: 0.5rem;
                line-height: 1.6;
            }
            .blog-prose strong {
                color: var(--text-dark);
                font-weight: 700;
            }
            .blog-prose blockquote {
                border-left: 4px solid var(--primary-color);
                padding: 0.75rem 1.25rem;
                margin: 1.5rem 0;
                background-color: var(--bg-subtle);
                color: var(--text-light);
                font-style: italic;
                border-radius: 0 0.75rem 0.75rem 0;
            }
            .blog-prose code {
                background-color: var(--bg-subtle);
                color: var(--primary-color);
                padding: 0.2rem 0.4rem;
                border-radius: 0.25rem;
                font-size: 0.85rem;
                font-family: monospace;
            }
            #blog-reading-progress {
                position: sticky;
                top: 0;
                left: 0;
                height: 4px;
                width: 0%;
                background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
                z-index: 100;
                border-radius: 2px;
                will-change: width;
            }
            .blog-logo-container img {
                max-height: 60px;
                width: auto;
                object-fit: contain;
                margin: 0 auto 1rem auto;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. High-Quality SEO-optimized blog articles HTML database (Total 20 Articles)
    const posts = {
        "png-vs-jpg-difference": {
            title: "PNG vs JPG: What's the Difference and Which One Should You Use?",
            excerpt: "When it comes to saving images, choosing between PNG and JPG can have a big impact on your image's quality and file size. Learn which one to use for photography vs graphics...",
            content: `
                <p>When it comes to saving, uploading, or exporting images, two of the most popular file formats you'll encounter are <strong>PNG (Portable Network Graphics)</strong> and <strong>JPG or JPEG (Joint Photographic Experts Group)</strong>. While they may look identical on your screen at first glance, they are fundamentally different in terms of compression, file size, quality, and use cases.</p>
                <h2>What is JPG (Joint Photographic Experts Group)?</h2>
                <p>JPG is the standard file format for digital photography and web images. It uses a <strong>lossy compression</strong> algorithm. This means that when an image is saved as a JPG, some unnecessary data is permanently discarded to reduce the file size.</p>
                <h2>What is PNG (Portable Network Graphics)?</h2>
                <p>PNG was created as a modern successor to the older GIF format. It uses <strong>lossless compression</strong>, meaning that no image data is lost during compression. The image quality remains perfectly intact. Crucially, PNG supports <strong>alpha transparency</strong>, allowing parts of the image to be fully transparent.</p>
            `
        },
        "how-to-reduce-photo-size": {
            title: "How to Reduce Photo Size Without Losing Quality (The Definitive Guide)",
            excerpt: "Large image files are a major cause of slow-loading websites. This detailed guide walks you through the best techniques for compressing image file sizes cleanly...",
            content: `
                <p>Whether you are a professional photographer trying to save storage space or a web developer aiming to pass Google's PageSpeed Insights, reducing image file sizes is essential. Large images cause websites to load slowly, which harms your search engine rankings.</p>
                <h2>1. Understand Lossy vs. Lossless Compression</h2>
                <p>Lossless compression removes metadata and redundant technical data without changing a single pixel. Lossy compression, on the other hand, slightly reduces color variations and details that the human eye cannot easily notice. For web use, lossy compression is highly recommended.</p>
                <h2>2. Resize the Physical Dimensions</h2>
                <p>By physically resizing your image to the exact dimensions needed (e.g., 1200px width for high-DPI displays), you can immediately save megabytes of bandwidth.</p>
            `
        },
        "webp-the-future-of-web-images": {
            title: "Why WebP is the Future of Web Images",
            excerpt: "Developed by Google, WebP is a modern image format that provides superior lossless and lossy compression for images on the web, making websites load instantly...",
            content: `
                <p>Web performance has never been more critical. Google uses page speed as a direct ranking factor in SEO. Since images account for more than 60% of an average webpage's total payload, optimization is key. This is where WebP comes in—a modern image format developed by Google specifically designed to make the web faster.</p>
                <h2>How WebP Compares to PNG and JPG</h2>
                <ul>
                    <li>WebP lossless images are 26% smaller in size compared to PNGs.</li>
                    <li>WebP lossy images are 25% to 34% smaller than comparable JPG images.</li>
                </ul>
            `
        },
        "avif-vs-webp-speed-battle": {
            title: "AVIF vs WebP: Which Next-Gen Format Wins the Web Speed Battle?",
            excerpt: "AVIF is the newest image format designed for ultra-small file sizes. Discover how it compares directly to Google's WebP format in speed and clarity...",
            content: `
                <p>As if WebP wasn't fast enough, a new contender has emerged in the world of image compression: AVIF (AV1 Image File Format). This article compares these two next-generation image formats to help you choose the best one for your website.</p>
                <h2>What is AVIF?</h2>
                <p>AVIF is an open-source, royalty-free file format derived from the keyframes of the AV1 video codec. AVIF offers compression efficiency that far surpasses JPG, PNG, and in many cases, WebP.</p>
                <h2>AVIF vs WebP: The Key Differences</h2>
                <p>AVIF can make files up to 20% smaller than WebP at identical visual quality, especially in highly detailed or complex images. However, WebP encodes much faster than AVIF.</p>
            `
        },
        "image-compression-seo-pagespeed": {
            title: "Why Image Compression is Crucial for SEO and PageSpeed Insights",
            excerpt: "Did you know slow loading images can ruin your organic Google rankings? Explore how optimized images boost your Core Web Vitals and LCP scores...",
            content: `
                <p>Many website owners spend thousands of dollars on keyword research, yet completely ignore a major SEO factor right on their own site: image optimization. Let's look at how image compression directly influences SEO.</p>
                <h2>Google's Core Web Vitals and SEO</h2>
                <p>Google uses Core Web Vitals as ranking signals. Specifically, LCP (Largest Contentful Paint) measures how quickly the main content of your webpage loads. Optimizing above-the-fold images directly lowers your LCP score, boosting your search engine ranking.</p>
            `
        },
        // 15 NEW BLOG POSTS ADDED BELOW
        "what-is-svg-vector-graphics": {
            title: "What is SVG? Understanding Vector Graphics for Modern Web Design",
            excerpt: "SVG graphics are scale-independent web assets. Learn why scalable vector graphics are essential for responsive interfaces, icons, and logos...",
            content: `
                <p>Unlike raster formats (such as JPEG and PNG) which store images in grids of pixels, <strong>SVG (Scalable Vector Graphics)</strong> is an XML-based vector image format. This means it renders shapes, lines, and paths using mathematical formulas. As a result, SVG images can scale to any size without losing crispness or quality.</p>
                <h2>Why SVG is Essential for Modern Sites</h2>
                <p>SVGs are incredibly lightweight because they are essentially text files. They are perfect for logos, system icons, and illustrative diagrams. Additionally, because they are XML elements, you can easily style them with CSS or animate them using JavaScript.</p>
            `
        },
        "best-image-compression-plugins-wordpress": {
            title: "Best Image Compression Plugins for WordPress in 2026",
            excerpt: "Looking to speed up your WordPress site? Here is a breakdown of the top image compression plugins that optimize your library automatically...",
            content: `
                <p>If you run a WordPress website, your media library can quickly become bloated. While client-side tools like ImgCon are perfect for prep-work, automating compression during uploads can save significant time. Here are the top-performing plugins for automated image optimization:</p>
                <h2>1. Smush Image Compression</h2>
                <p>Smush is one of the most popular plugins. It offers lossless compression and can scan and compress your entire media library in bulk.</p>
                <h2>2. Imagify</h2>
                <p>Developed by the creators of WP Rocket, Imagify integrates WebP conversion seamlessly and offers three levels of compression quality.</p>
            `
        },
        "how-to-fix-lazy-loading-images": {
            title: "How to Correctly Implement Lazy Loading for Web Images",
            excerpt: "Lazy loading deferrals keep your page loading speeds high. Learn how to implement native HTML lazy loading without creating layout shifts...",
            content: `
                <p>Lazy loading is a strategy to defer the loading of non-critical resources (like off-screen images) at page load time. Instead, these images are loaded only when the user scrolls near them. This drastically improves the initial loading performance of your webpages.</p>
                <h2>Native HTML Lazy Loading</h2>
                <p>Modern browsers now support native lazy loading with a simple attribute: <code>loading="lazy"</code>. Adding this to your image elements ensures fast delivery without heavy JS libraries.</p>
            `
        },
        "understanding-exif-data": {
            title: "Understanding EXIF Data: What Metadata is Hidden in Your Photos?",
            excerpt: "Every digital photo contains EXIF metadata revealing camera settings, locations, and dates. Find out how this affects your privacy...",
            content: `
                <p>When you snap a photo with your phone or camera, the file saves more than just pixels. It embeds technical metadata called <strong>EXIF (Exchangeable Image File Format)</strong> data. This information is highly valuable for photographers but can raise privacy concerns.</p>
                <h2>What is stored in EXIF?</h2>
                <p>EXIF data typically includes camera model, aperture, shutter speed, ISO, capture date/time, and sometimes exact GPS coordinates. When uploading images to public portals, stripping this metadata using compression tools is a recommended security measure.</p>
            `
        },
        "how-to-convert-heic-to-jpg": {
            title: "How to Convert HEIC to JPG: A Guide for Apple iPhone Users",
            excerpt: "Apple devices save photos in the efficient HEIC format, but compatibility is limited. Learn how to convert your HEIC images to widely supported JPEGs...",
            content: `
                <p>If you take photos on an iPhone, they are likely saved as <strong>HEIC (High Efficiency Image Container)</strong> files. While HEIC offers excellent compression and quality preservation, it is not widely compatible with older Windows machines, Android devices, or online forms.</p>
                <h2>The Simple Conversion Process</h2>
                <p>To convert HEIC to JPEG, you can use specialized web converters that parse the file container right in your browser. This transforms the raw HEIC data into highly compatible, compressed JPEGs instantly.</p>
            `
        },
        "impact-of-image-format-on-mobile-ux": {
            title: "The Impact of Image Formats on Mobile User Experience",
            excerpt: "Mobile networks are unpredictable. Discover why serving optimized image payloads is the foundation of modern responsive mobile design...",
            content: `
                <p>Responsive design is about more than making layouts fit smaller screens; it's about optimizing resource delivery. Mobile devices often operate on slower cellular networks, where loading oversized PNG or JPG graphics can degrade user retention rates.</p>
                <h2>Why Weight Matters on Mobile</h2>
                <p>Unoptimized graphics increase data usage, drain battery life, and cause visible layout stuttering on budget mobile phones. Serving modern WebP or AVIF variants is crucial for seamless responsive performance.</p>
            `
        },
        "the-importance-of-image-alt-text": {
            title: "Image Alt Text: The Guide to Accessibility and Image SEO",
            excerpt: "Learn how to write descriptive alt text that helps search engine crawlers index your photos while keeping your site accessible for visually impaired users...",
            content: `
                <p>Alt text (alternative text) is a descriptive HTML attribute applied to image elements. It serves two primary functions: providing accessibility context for screen readers and helping search engines understand image contents.</p>
                <h2>Best Practices for Writing Alt Text</h2>
                <p>Avoid stuffing alt attributes with keywords. Instead, write clear, contextually relevant descriptions of what is visually depicted in the photo. Keep it under 125 characters for optimal screen-reader compatibility.</p>
            `
        },
        "how-to-compress-animated-gifs": {
            title: "How to Compress Animated GIFs Without Ruining the Framerate",
            excerpt: "Animated GIFs are notoriously heavy. Explore tips for optimizing GIF sizes or replacing them with modern HTML5 video elements...",
            content: `
                <p>Animated GIFs are incredibly popular for quick visual guides, but they are highly inefficient. Because a GIF stores every frame as an individual indexed color image, a short 5-second animation can easily exceed 10 megabytes in size.</p>
                <h2>GIF Optimization Tips</h2>
                <p>To shrink GIFs, reduce the global color palette size, discard redundant intermediate frames, or use web tools to lossily compress the file. Alternatively, converting heavy GIFs to loopable MP4 or WebM video containers is the cleanest solution.</p>
            `
        },
        "retina-display-images-guide": {
            title: "Retina Display Images: How to Keep Web Assets Crisp on High-DPI Screens",
            excerpt: "Retina displays use double the pixel density of standard monitors. Learn how to serve high-resolution imagery without bloating page weight...",
            content: `
                <p>High-DPI screens, commonly marketed as Retina displays, feature a dense pixel layout that makes standard images appear blurry. To resolve this, web developers must serve double-resolution assets (2x) to render crisp details.</p>
                <h2>Using HTML Srcset for Dynamic Delivery</h2>
                <p>Instead of forcing all users to download heavy high-resolution files, use the HTML <code>srcset</code> attribute. This allows the browser to automatically request the standard resolution image for regular monitors, and the 2x image for high-density screens.</p>
            `
        },
        "common-image-optimization-mistakes": {
            title: "5 Common Image Optimization Mistakes That Slow Down Websites",
            excerpt: "Are you making these basic errors? Avoid these critical image delivery mistakes to preserve your PageSpeed score...",
            content: `
                <p>Optimizing web images seems simple, but minor missteps can render your optimization efforts useless. Let's look at the most common errors made by content publishers:</p>
                <h2>1. Not Resizing Before Compressing</h2>
                <p>Compressing an image without reducing its native dimensions is inefficient. Always crop or scale the image to its maximum display size first.</p>
                <h2>2. Relying Entirely on CSS Scaling</h2>
                <p>Using CSS to shrink a massive 4000px image down to 400px still forces the user's browser to download the full, heavy file.</p>
            `
        },
        "color-spaces-rgb-cmyk-srgb": {
            title: "Color Spaces Explained: RGB vs. CMYK vs. sRGB",
            excerpt: "Choosing the correct color space is vital for design accuracy. Learn why sRGB is the standard for the web, while CMYK rules print...",
            content: `
                <p>Have you ever uploaded a vibrant photo to your website only to see the colors look dull? This happens because of a color space mismatch. Color spaces define the range of colors a file can display.</p>
                <h2>RGB and sRGB: Built for Screens</h2>
                <p>RGB uses red, green, and blue light to create colors on monitors. sRGB is the universal standard for web images. Uploading images in the printing-focused CMYK color space will result in incorrect rendering online.</p>
            `
        },
        "how-to-optimize-e-commerce-product-images": {
            title: "How to Optimize E-Commerce Product Images for Fast Sales",
            excerpt: "Fast loading times translate directly to high conversion rates. Discover the standard guide for optimizing online store product images...",
            content: `
                <p>In online retail, your product images do the selling. However, if your catalog pages take more than three seconds to render, shoppers will leave. Optimizing product imagery is vital for conversion rates.</p>
                <h2>The Ideal Setup for E-Commerce</h2>
                <p>Use a consistent white background to keep file sizes small, crop empty borders, and compress all product photos to the WebP format. Additionally, offer zoomable high-resolution images only on demand.</p>
            `
        },
        "what-is-lossless-compression": {
            title: "Deep Dive: What is Lossless Compression and How Does It Work?",
            excerpt: "Explore the internal mechanics of lossless compression algorithms that shrink files without losing a single pixel of data...",
            content: `
                <p>Lossless compression algorithms (used in PNG and GIF) shrink files by reorganizing internal data structures rather than discarding details. It works similarly to a ZIP archive, ensuring perfect data restoration upon expansion.</p>
                <h2>How It Reduces File Size</h2>
                <p>Algorithms like LZW or DEFLATE find patterns and repetitive structures in the image data. For example, instead of writing 'blue pixel' 500 times, it writes a short reference code, saving valuable storage space.</p>
            `
        },
        "how-to-use-images-in-newsletters": {
            title: "How to Use and Optimize Images in Email Newsletters",
            excerpt: "Email clients handle assets differently than web browsers. Learn the rules for optimizing newsletter images to avoid spam filters...",
            content: `
                <p>Images in email newsletters can boost engagement, but they present unique rendering challenges. Email clients (like Outlook or Gmail) have strict, sometimes outdated rendering engines that require carefully structured HTML.</p>
                <h2>Best Practices for Email Images</h2>
                <p>Keep your total email file size low to prevent spam filters from blocking it. Host your images on an external server, use clear fallback inline dimensions, and always include alt text, as many clients block images by default.</p>
            `
        },
        "cumulative-layout-shift-images": {
            title: "Cumulative Layout Shift: How Images Affect CLS and How to Fix It",
            excerpt: "Do your pages jump around as images load? Fix layout shifting issues by defining correct dimension bounds...",
            content: `
                <p><strong>CLS (Cumulative Layout Shift)</strong> measures how much your page's elements shift position during loading. It is an important Core Web Vitals metric. Images loading without defined dimensions are a primary cause of high CLS scores.</p>
                <h2>The Easy Fix: Explicit Width and Height</h2>
                <p>Always specify <code>width</code> and <code>height</code> attributes directly on your HTML image tags. This reserves an aspect-ratio placeholder box, preventing content shifts as the image loads.</p>
            `
        }
    };

    /**
     * 3. DOM Recovery Mechanism
     * Appends containers immediately into DOM to prevent timing mismatches.
     */
    function ensureBlogElements() {
        const container = document.querySelector('.app-container') || document.querySelector('main') || document.body;
        
        let blogScreen = document.getElementById('blogScreen');
        if (!blogScreen) {
            blogScreen = document.createElement('section');
            blogScreen.id = 'blogScreen';
            blogScreen.className = 'screen hidden';
            
            const footer = document.getElementById('card-footer') || document.querySelector('footer');
            if (footer && footer.parentNode) {
                footer.parentNode.insertBefore(blogScreen, footer);
            } else if (container) {
                container.appendChild(blogScreen);
            }
        }
        
        let blogListing = document.getElementById('blog-listing');
        if (!blogListing) {
            blogListing = document.createElement('div');
            blogListing.id = 'blog-listing';
            blogListing.className = 'max-w-4xl mx-auto space-y-6';
            blogScreen.appendChild(blogListing);
        }
        
        let blogPost = document.getElementById('blog-post');
        if (!blogPost) {
            blogPost = document.createElement('div');
            blogPost.id = 'blog-post';
            blogPost.className = 'hidden max-w-4xl mx-auto text-left';
            
            const progressBar = document.createElement('div');
            progressBar.id = 'blog-reading-progress';
            blogPost.appendChild(progressBar);

            const backBtn = document.createElement('a');
            backBtn.href = '/blog';
            backBtn.id = 'back-to-blog-btn';
            backBtn.className = 'secondary-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold mb-6 transition-all duration-300 hover:shadow-md';
            backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Blog';
            blogPost.appendChild(backBtn);
            
            const contentDiv = document.createElement('div');
            contentDiv.id = 'blog-post-content';
            contentDiv.className = 'blog-prose';
            blogPost.appendChild(contentDiv);
            
            blogScreen.appendChild(blogPost);
        }
    }

    /**
     * 4. Dynamic Template Sync
     * Direct fragment sync to avoid element nesting issues in template.content query.
     */
    function syncBlogTemplates() {
        let template = document.getElementById('blogPostsTemplate');
        if (!template) {
            template = document.createElement('template');
            template.id = 'blogPostsTemplate';
            document.body.appendChild(template);
        }
        
        const fragment = document.createDocumentFragment();
        Object.keys(posts).forEach(slug => {
            const post = posts[slug];
            const postDiv = document.createElement('div');
            postDiv.setAttribute('data-slug', slug);
            postDiv.className = 'space-y-4';
            postDiv.innerHTML = `
                <h2 class="text-2xl sm:text-3xl font-black mb-4" style="color: var(--text-dark);">${post.title}</h2>
                <div class="blog-prose mt-6">${post.content}</div>
            `;
            fragment.appendChild(postDiv);
        });
        
        template.content.innerHTML = '';
        template.content.appendChild(fragment);
    }

    /**
     * 5. Scroll Progress Tracker
     */
    function updateReadingProgress() {
        const blogPost = document.getElementById('blog-post');
        const progressBar = document.getElementById('blog-reading-progress');
        if (blogPost && progressBar && !blogPost.classList.contains('hidden')) {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            progressBar.style.width = scrolled + "%";
        }
    }

    /**
     * 6. Bulletproof SPA Hash Routing Guard
     */
    function handleRouteChanges() {
        ensureBlogElements();
        
        const path = window.location.hash.slice(1) || '/';
        const blogScreen = document.getElementById('blogScreen');
        const blogListing = document.getElementById('blog-listing');
        const blogPost = document.getElementById('blog-post');
        const blogPostContent = document.getElementById('blog-post-content');

        if (path === '/blog' || path === '/blog/') {
            if (blogListing) {
                window.ImgConBlog.renderList(blogListing);
                blogListing.classList.remove('hidden');
            }
            if (blogPost) {
                blogPost.classList.add('hidden');
            }
            if (blogScreen) {
                blogScreen.classList.remove('hidden');
            }
            
            // Hide all other screens to avoid page layout collision
            document.querySelectorAll('.screen').forEach(screen => {
                if (screen.id !== 'blogScreen') {
                    screen.classList.add('hidden');
                }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } else if (path.startsWith('/blog/')) {
            const slug = path.split('/').pop();
            const post = posts[slug];
            if (post) {
                if (blogListing) {
                    blogListing.classList.add('hidden');
                }
                if (blogPost && blogPostContent) {
                    blogPostContent.innerHTML = post.content;
                    blogPost.classList.remove('hidden');
                }
                if (blogScreen) {
                    blogScreen.classList.remove('hidden');
                }
                
                // Hide all other screens to avoid page layout collision
                document.querySelectorAll('.screen').forEach(screen => {
                    if (screen.id !== 'blogScreen') {
                        screen.classList.add('hidden');
                    }
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            // Safe clean shutdown of blog view when visiting main app views
            if (blogScreen) {
                blogScreen.classList.add('hidden');
            }
        }
    }

    // 7. Global API Export
    window.ImgConBlog = {
        renderList: function (container) {
            if (!container) return;
            container.innerHTML = `
                <div class="text-center mb-10">
                    <!-- Dynamic logo.png with safety onerror fallback -->
                    <div class="blog-logo-container mb-4">
                        <img src="logo.png" alt="ImgCon Logo" onerror="this.style.display='none'">
                    </div>
                    <h2 class="text-3xl font-extrabold tracking-tight" style="color: var(--text-dark);">ImgCon Blog</h2>
                    <p class="text-sm mt-2" style="color: var(--text-light);">Image optimization, speed, and standard web guidelines compiled in a clean database.</p>
                </div>
                
                <!-- Live Search Bar -->
                <div class="mb-8 p-4 rounded-2xl border" style="background-color: var(--card-bg); border-color: var(--card-border);">
                    <div class="relative">
                        <input type="text" id="blog-search-input" placeholder="Search articles..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-indigo-500 transition-all duration-300" style="border-color: var(--card-border); background-color: var(--bg-subtle); color: var(--text-dark);">
                        <i class="fas fa-search absolute left-3.5 top-3.5 text-gray-400 text-sm"></i>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6" id="blog-articles-container">
                    ${Object.keys(posts).map(slug => {
                        const post = posts[slug];
                        return `
                            <article data-slug="${slug}" class="p-6 rounded-2xl border text-left hover:shadow-md transition-all duration-300 flex flex-col justify-between" style="border-color: var(--card-border); background-color: var(--card-bg);">
                                <div>
                                    <h3 class="text-xl font-bold mb-2" style="color: var(--text-dark);">${post.title}</h3>
                                    <p class="text-sm mb-4" style="color: var(--text-light);">${post.excerpt}</p>
                                </div>
                                <a href="/blog/${slug}" class="font-bold text-sm read-more-btn flex items-center gap-1 hover:underline mt-auto" style="color: var(--primary-color);">Read More &rarr;</a>
                            </article>
                        `;
                    }).join('')}
                </div>
            `;

            const searchInput = container.querySelector('#blog-search-input');
            const articlesContainer = container.querySelector('#blog-articles-container');
            if (searchInput && articlesContainer) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    const articles = articlesContainer.querySelectorAll('article');
                    articles.forEach(article => {
                        const title = article.querySelector('h3').textContent.toLowerCase();
                        const excerpt = article.querySelector('p').textContent.toLowerCase();
                        if (title.includes(query) || excerpt.includes(query)) {
                            article.style.display = 'flex';
                        } else {
                            article.style.display = 'none';
                        }
                    });
                });
            }
        },
        getPost: function (slug) {
            const post = posts[slug];
            if (!post) return null;
            return `
                <h2 class="text-2xl sm:text-3xl font-black mb-4" style="color: var(--text-dark);">${post.title}</h2>
                <div class="blog-prose mt-6">${post.content}</div>
            `;
        }
    };

    /**
     * 8. Navigation Click Interceptor (SPA Hijacker)
     * Captures and intercepts clicks on any blog links to bypass script.js's path-building bug.
     */
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Check if the clicked target is a blog path
        const isBlogLink = href.startsWith('/blog') || 
                           href.startsWith('#/blog') || 
                           link.pathname.startsWith('/blog') || 
                           (link.hash && link.hash.startsWith('#/blog'));

        if (isBlogLink) {
            e.preventDefault();
            e.stopPropagation(); // Stop script.js from intercepting and breaking the path
            e.stopImmediatePropagation();

            // Formulate standardized hash-route manually
            let targetHash = '#/blog';
            if (href.startsWith('/blog/')) {
                targetHash = '#/blog/' + href.slice(6);
            } else if (href.startsWith('#/blog/')) {
                targetHash = href;
            } else if (link.pathname.startsWith('/blog/')) {
                targetHash = '#/blog/' + link.pathname.slice(6);
            } else if (link.hash && link.hash.startsWith('#/blog/')) {
                targetHash = link.hash;
            }

            if (window.location.hash !== targetHash) {
                history.pushState(null, '', targetHash);
                // Dispatch hashchange event to trigger sync update on both routers
                window.dispatchEvent(new Event('hashchange'));
            }
        }
    }, true); // useCapture is true to process this before other global handlers on the page

    // 9. Synchronous Initial Run
    ensureBlogElements();
    syncBlogTemplates();
    handleRouteChanges();

    // 10. Event Observers
    window.addEventListener('hashchange', handleRouteChanges);
    window.addEventListener('popstate', handleRouteChanges);
    window.addEventListener('scroll', updateReadingProgress);

    document.addEventListener('DOMContentLoaded', () => {
        ensureBlogElements();
        syncBlogTemplates();
        handleRouteChanges();
    });
})();
