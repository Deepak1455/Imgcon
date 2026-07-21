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
        `;
        document.head.appendChild(style);
    }

    // 2. High-Quality SEO-optimized blog articles HTML database
    const posts = {
        "png-vs-jpg-difference": {
            title: "PNG vs JPG: What's the Difference and Which One Should You Use?",
            excerpt: "When it comes to saving images, choosing between PNG and JPG can have a big impact on your image's quality and file size. Learn which one to use for photography vs graphics...",
            content: `
                <p>When it comes to saving, uploading, or exporting images, two of the most popular file formats you'll encounter are <strong>PNG (Portable Network Graphics)</strong> and <strong>JPG or JPEG (Joint Photographic Experts Group)</strong>. While they may look identical on your screen at first glance, they are fundamentally different in terms of compression, file size, quality, and use cases. Choosing the wrong format can result in bloated websites or blurry images.</p>
                
                <h2>What is JPG (Joint Photographic Experts Group)?</h2>
                <p>JPG is the standard file format for digital photography and web images. It uses a <strong>lossy compression</strong> algorithm. This means that when an image is saved as a JPG, some unnecessary data is permanently discarded to reduce the file size. This reduction makes JPGs incredibly lightweight and perfect for web delivery where fast loading times are critical.</p>
                <ul>
                    <li><strong>Best For:</strong> Real-world photographs, complex color gradients, and scenery.</li>
                    <li><strong>Pros:</strong> Extremely small file sizes, compatible with every device and browser.</li>
                    <li><strong>Cons:</strong> Quality degrades every time you edit and re-save the file; does not support transparent backgrounds.</li>
                </ul>

                <h2>What is PNG (Portable Network Graphics)?</h2>
                <p>PNG was created as a modern successor to the older GIF format. It uses <strong>lossless compression</strong>, meaning that no image data is lost during compression. The image quality remains perfectly intact, regardless of how many times you open, edit, and save the file. Crucially, PNG supports <strong>alpha transparency</strong>, allowing parts of the image to be fully transparent.</p>
                <ul>
                    <li><strong>Best For:</strong> Logos, transparent graphics, screenshots, text-heavy images, and digital illustrations.</li>
                    <li><strong>Pros:</strong> Supports transparency, infinite re-saving without quality loss, sharp edges on text.</li>
                    <li><strong>Cons:</strong> File sizes are significantly larger than JPGs, which can slow down website loading speeds.</li>
                </ul>

                <h2>Summary: Which One Should You Choose?</h2>
                <p>If you are uploading complex, colorful photos to your website, use <strong>JPG</strong>. If you are uploading a brand logo, a website icon, or a graphic that requires a transparent background, use <strong>PNG</strong>. For the best of both worlds, modern web formats like WebP or AVIF should be considered.</p>
            `
        },
        "how-to-reduce-photo-size": {
            title: "How to Reduce Photo Size Without Losing Quality (The Definitive Guide)",
            excerpt: "Large image files are a major cause of slow-loading websites. This detailed guide walks you through the best techniques for compressing image file sizes cleanly...",
            content: `
                <p>Whether you are a professional photographer trying to save storage space or a web developer aiming to pass Google's PageSpeed Insights, reducing image file sizes is essential. Large images cause websites to load slowly, which harms your search engine rankings and frustrates mobile users. This comprehensive guide will show you how to shrink your photo sizes while keeping them looking incredibly sharp.</p>
                
                <h2>1. Understand Lossy vs. Lossless Compression</h2>
                <p>To reduce photo size efficiently, you must choose between two compression types. Lossless compression removes metadata and redundant technical data without changing a single pixel. Lossy compression, on the other hand, slightly reduces color variations and minor details that the human eye cannot easily notice. For web use, <strong>lossy compression is highly recommended</strong> because it can reduce file size by up to 80% with almost no visible loss in quality.</p>

                <h2>2. Resize the Physical Dimensions</h2>
                <p>Many users make the mistake of uploading raw 4000x3000px camera photos directly to their blog. If your blog post's maximum display width is only 800px, the browser has to download the massive file and scale it down anyway. By physically resizing your image to the exact dimensions needed (e.g., 1200px width for high-DPI displays), you can immediately save megabytes of bandwidth.</p>

                <h2>3. Use Modern Web Formats (WebP and AVIF)</h2>
                <p>Traditional formats like JPG and PNG are no longer the most efficient options. Google's WebP and the newer AVIF format offer much better compression ratios. Converting your images to WebP can reduce the size by up to 30% compared to JPG without any change in resolution or clarity.</p>

                <blockquote>With free client-side tools like <strong>ImgCon</strong>, you can resize, compress, and convert your photos right in your browser in seconds. This ensures complete privacy and optimal web performance without the need to upload sensitive assets to remote servers.</blockquote>
            `
        },
        "webp-the-future-of-web-images": {
            title: "Why WebP is the Future of Web Images",
            excerpt: "Developed by Google, WebP is a modern image format that provides superior lossless and lossy compression for images on the web, making websites load instantly...",
            content: `
                <p>Web performance has never been more critical. Google's Core Web Vitals update has made page speed a direct ranking factor in SEO. Since images account for more than 60% of an average webpage's total payload, optimization is key. This is where <strong>WebP</strong> comes in—a modern image format developed by Google specifically designed to make the web faster.</p>
                
                <h2>What is WebP?</h2>
                <p>WebP is a next-generation image format introduced by Google in 2010. It supports both lossy and lossless compression, transparency (like PNG), and animation (like GIF). Its primary goal is to create smaller, richer images that make the web faster.</p>

                <h2>How WebP Compares to PNG and JPG</h2>
                <p>According to Google's official research, WebP offers significant advantages over older formats:</p>
                <ul>
                    <li><strong>WebP lossless images</strong> are 26% smaller in size compared to PNGs.</li>
                    <li><strong>WebP lossy images</strong> are 25% to 34% smaller than comparable JPG images at equivalent quality index.</li>
                    <li>WebP supports transparency at an additional cost of just 22% more bytes, making it a perfect replacement for heavy transparent PNGs.</li>
                </ul>

                <h2>Browser Compatibility</h2>
                <p>Initially, WebP adoption was slow due to a lack of support from Safari and Firefox. However, as of today, WebP is supported by all major modern web browsers, including Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge, and Opera. There is no longer any reason to avoid using WebP for your web projects.</p>
            `
        },
        "avif-vs-webp-speed-battle": {
            title: "AVIF vs WebP: Which Next-Gen Format Wins the Web Speed Battle?",
            excerpt: "AVIF is the newest image format designed for ultra-small file sizes. Discover how it compares directly to Google's WebP format in speed and clarity...",
            content: `
                <p>As if WebP wasn't fast enough, a new contender has emerged in the world of image compression: <strong>AVIF (AV1 Image File Format)</strong>. This article compares these two next-generation image formats to help you choose the best one for your website's performance and design.</p>
                
                <h2>What is AVIF?</h2>
                <p>AVIF is an open-source, royalty-free file format derived from the keyframes of the AV1 video codec. Backed by industry giants like Google, Apple, Microsoft, and Netflix, AVIF offers compression efficiency that far surpasses JPG, PNG, and in many cases, WebP.</p>

                <h2>AVIF vs WebP: The Key Differences</h2>
                <p>While both formats support lossy/lossless compression and transparency, they excel in different areas:</p>
                <ul>
                    <li><strong>Compression Efficiency:</strong> AVIF can make files up to 20% smaller than WebP at identical visual quality, especially in highly detailed or complex images.</li>
                    <li><strong>Color Support:</strong> AVIF supports 10-bit and 12-bit color depth, allowing for stunning High Dynamic Range (HDR) graphics with no color banding, whereas WebP is limited to 8-bit.</li>
                    <li><strong>Encoding Speed:</strong> WebP encodes much faster than AVIF. Compressing a batch of images to AVIF on older computers can take noticeably longer than WebP.</li>
                </ul>

                <h2>Recommendation</h2>
                <p>If your primary goal is maximizing page speed scores, <strong>AVIF</strong> is the absolute winner. However, for general daily use and maximum browser compatibility, <strong>WebP</strong> remains an exceptional and extremely fast choice.</p>
            `
        },
        "image-compression-seo-pagespeed": {
            title: "Why Image Compression is Crucial for SEO and PageSpeed Insights",
            excerpt: "Did you know slow loading images can ruin your organic Google rankings? Explore how optimized images boost your Core Web Vitals and LCP scores...",
            content: `
                <p>Many website owners spend thousands of dollars on keyword research and backlinks, yet completely ignore a major SEO factor right on their own site: <strong>image optimization</strong>. Slow load times can trigger high bounce rates, destroying your search rankings. Let's look at how image compression directly influences SEO.</p>
                
                <h2>Google's Core Web Vitals and SEO</h2>
                <p>Google uses <strong>Core Web Vitals</strong> as ranking signals. Specifically, <strong>LCP (Largest Contentful Paint)</strong> measures how quickly the main content of your webpage loads. Since the largest element above the fold is almost always a hero image, optimizing that image directly lowers your LCP score, boosting your search engine ranking.</p>

                <h2>The Impact on Mobile Users</h2>
                <p>Over 60% of global web traffic comes from mobile devices, often connected via slower 4G or 3G networks. An uncompressed 4MB homepage image might load in 1 second on a fast office desktop, but take 10 seconds to render on a mobile device, causing users to abandon your site.</p>

                <h2>Best Practices for Image SEO</h2>
                <ul>
                    <li>Always compress images before uploading them to your server using client-side tools like <code>ImgCon</code>.</li>
                    <li>Use descriptive, keyword-rich filenames (e.g., <code>vintage-leather-jacket.jpg</code>).</li>
                    <li>Always include an <code>alt</code> tag to help search engine crawlers understand what the image represents.</li>
                </ul>
            `
        }
    };

    // 3. Export global ImgConBlog module to window scope
    window.ImgConBlog = {
        renderList: function (container) {
            if (!container) return;
            container.innerHTML = `
                <h2>ImgCon Blog</h2>
                <p class="text-sm" style="color: var(--text-light); margin-bottom: 2rem;">Welcome to our blog! Here we share tips, tricks, and insights into the world of digital images and web performance.</p>
                <div class="space-y-8 mt-6">
                    ${Object.keys(posts).map(slug => {
                        const post = posts[slug];
                        return `
                            <article data-slug="${slug}" class="p-6 rounded-2xl border text-left animate__animated animate__fadeInUp" style="border-color: var(--card-border); background-color: var(--bg-subtle);">
                                <h3 class="text-xl font-bold mb-2" style="color: var(--text-dark);">${post.title}</h3>
                                <p class="text-sm mb-4" style="color: var(--text-light);">${post.excerpt}</p>
                                <a href="/blog/${slug}" class="font-bold text-sm read-more-btn flex items-center gap-1 hover:underline" style="color: var(--primary-color);">Read More &rarr;</a>
                            </article>
                        `;
                    }).join('')}
                </div>
            `;
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
})();
