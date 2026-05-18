/**
 * Premium Stories Controller & Interactive CMS Engine
 * Handles dynamic routing, real-time search/filters, editorial reading features,
 * and the WYSIWYG long-form editor and publishing pipeline.
 */

// State Management
let activeTag = "All";
let searchQuery = "";
let mergedPosts = [];
let activeScrollListener = null;
let isAdmin = localStorage.getItem("isAdmin") === "true";
let editingSlug = null;

// DOM Elements
const hubView = document.getElementById("hub-view");
const readerView = document.getElementById("reader-view");
const writerView = document.getElementById("writer-view");

const searchBox = document.getElementById("search-box");
const tagsFilterBar = document.getElementById("tags-filter-bar");
const featuredContainer = document.getElementById("featured-story-container");
const postsGridContainer = document.getElementById("posts-grid-container");

const openWriterBtn = document.getElementById("open-writer-btn");

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  // Load and merge hardcoded posts with local storage published stories
  loadAndMergeStories();
  
  // Initialize SPA Client-Side Routing
  initRouter();
  
  // Set up Hub Interactions (Search & Filtering)
  initHubControls();
  
  // Set up Writer CMS Interactions
  initWriterCMS();

  // Set up Admin Control Gate
  initAdminGate();

  // Handle browser back/forward buttons
  window.addEventListener("popstate", () => {
    handleRouting();
  });
});

/**
 * Loads stories from posts.js and appends any stories created in localStorage.
 */
function loadAndMergeStories() {
  const localStoriesRaw = localStorage.getItem("published_stories");
  let localStories = [];
  
  if (localStoriesRaw) {
    try {
      localStories = JSON.parse(localStoriesRaw);
    } catch (e) {
      console.error("Error parsing local stories:", e);
      localStories = [];
    }
  }
  
  // Merge: local stories take priority at the top, followed by posts.js items
  // Ensure we avoid duplicate slugs
  const localSlugs = new Set(localStories.map(p => p.slug));
  const coreStories = POSTS.filter(p => !localSlugs.has(p.slug));
  
  let allMerged = [...localStories, ...coreStories];
  
  // Handle deleted static overrides
  const deletedSlugsRaw = localStorage.getItem("deleted_slugs");
  let deletedSlugs = [];
  if (deletedSlugsRaw) {
    try {
      deletedSlugs = JSON.parse(deletedSlugsRaw);
    } catch (e) {
      deletedSlugs = [];
    }
  }
  
  mergedPosts = allMerged.filter(p => !deletedSlugs.includes(p.slug));
  
  // Sort by date descending
  mergedPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

/**
 * Router Engine mapping query parameters to dynamic views.
 */
function initRouter() {
  // Setup SPA navigation links
  document.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("stories.html")) {
      link.addEventListener("click", (e) => {
        const url = new URL(link.href);
        if (url.search) {
          e.preventDefault();
          navigateTo(url.search);
        }
      });
    }
  });

  // Attach navigation triggers
  openWriterBtn.addEventListener("click", () => navigateTo("?write=true"));

  // Initial routing
  handleRouting();
}

/**
 * Changes search string in URL and triggers navigation without reloading the page.
 */
function navigateTo(searchParams) {
  const url = new URL(window.location);
  url.search = searchParams;
  window.history.pushState({}, "", url);
  handleRouting();
}

/**
 * Reads URL search parameters and toggles layout views.
 */
function handleRouting() {
  // Clean scroll listeners if any
  if (activeScrollListener) {
    window.removeEventListener("scroll", activeScrollListener);
    activeScrollListener = null;
  }
  
  // Hide progress bar by default
  document.getElementById("reading-progress").style.width = "0%";

  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get("post");
  const isWriting = params.get("write") === "true";
  const categoryFilter = params.get("category");

  // Reset active links in navbar
  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  const storiesNavLink = document.querySelector(".nav-links a[href='stories.html']");
  if (storiesNavLink) storiesNavLink.classList.add("active");

  if (isWriting) {
    // Show Writer View
    hubView.style.display = "none";
    readerView.style.display = "none";
    writerView.style.display = "block";
    document.title = "Write a Story | Jabess Omane";
    
    // Check if we are in Edit Mode
    const editSlug = params.get("edit");
    if (editSlug) {
      loadStoryIntoEditor(editSlug);
    } else {
      restoreDraftState();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  } 
  else if (postSlug) {
    // Show Reader View
    hubView.style.display = "none";
    writerView.style.display = "none";
    readerView.style.display = "block";
    
    const post = mergedPosts.find(p => p.slug === postSlug);
    if (post) {
      renderArticle(post);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Fallback if post not found
      navigateTo("");
    }
  } 
  else {
    // Show Hub View
    readerView.style.display = "none";
    writerView.style.display = "none";
    hubView.style.display = "block";
    document.title = "Stories | Jabess Omane";
    
    // Apply URL category filters
    if (categoryFilter) {
      activeTag = decodeURIComponent(categoryFilter);
    } else {
      activeTag = "All";
    }

    renderHub();
  }
}

/**
 * ----------------------------------------------------
 * STORIES HUB (LIST & GRID VIEW) CONTROLS
 * ----------------------------------------------------
 */

function initHubControls() {
  // Search box live input filter
  searchBox.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderHubGrid();
  });
}

function renderHub() {
  renderTagsBar();
  renderHubGrid();
}

/**
 * Gathers unique tags across all posts and dynamically creates tag filters.
 */
function renderTagsBar() {
  const allTags = new Set();
  mergedPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => allTags.add(tag));
    }
  });

  const uniqueTags = ["All", ...Array.from(allTags)];
  
  tagsFilterBar.innerHTML = "";
  uniqueTags.forEach(tag => {
    const pill = document.createElement("button");
    pill.className = `filter-pill ${tag === activeTag ? 'active' : ''}`;
    pill.textContent = tag;
    pill.addEventListener("click", () => {
      activeTag = tag;
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      
      // Update URL silently
      const param = tag === "All" ? "" : `?category=${encodeURIComponent(tag)}`;
      navigateTo(param);
    });
    tagsFilterBar.appendChild(pill);
  });
}

/**
 * Dynamic filtering of active stories based on search and tag.
 */
function renderHubGrid() {
  let filtered = mergedPosts;

  // 1. Tag filter
  if (activeTag !== "All") {
    filtered = filtered.filter(p => p.tags && p.tags.includes(activeTag));
  }

  // 2. Search query filter
  if (searchQuery !== "") {
    filtered = filtered.filter(p => {
      const titleMatch = p.title.toLowerCase().includes(searchQuery);
      const excerptMatch = p.excerpt.toLowerCase().includes(searchQuery);
      const contentMatch = p.content.toLowerCase().includes(searchQuery);
      return titleMatch || excerptMatch || contentMatch;
    });
  }

  // Clear existing containers
  featuredContainer.innerHTML = "";
  postsGridContainer.innerHTML = "";

  if (filtered.length === 0) {
    postsGridContainer.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-face-frown-open"></i>
        <h3>No articles found</h3>
        <p>Try refining your search terms or selecting another category.</p>
      </div>
    `;
    return;
  }

  // Identify Featured Post
  // The first post matching 'featured = true' gets the top slot. If none is marked, the first item in the list is used.
  let featuredPost = filtered.find(p => p.featured);
  let otherPosts = [];

  if (featuredPost) {
    otherPosts = filtered.filter(p => p.slug !== featuredPost.slug);
  } else {
    featuredPost = filtered[0];
    otherPosts = filtered.slice(1);
  }

  // RENDER FEATURED CARD
  if (featuredPost) {
    const tagBadges = featuredPost.tags.map(t => `<span class="card-tag">${t}</span>`).join("");
    const formattedDate = formatDate(featuredPost.publishedAt);
    
    // Conditional Admin Floating Buttons
    const adminButtons = isAdmin ? `
      <div class="card-admin-actions" onclick="event.stopPropagation();">
        <button class="card-admin-btn edit" onclick="editStory('${featuredPost.slug}');" title="Edit story"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="card-admin-btn delete" onclick="deleteStory('${featuredPost.slug}');" title="Delete story"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    ` : "";

    featuredContainer.innerHTML = `
      <article class="featured-story-card" onclick="navigateTo('?post=${featuredPost.slug}')">
        <div class="featured-img-container">
          ${adminButtons}
          <span class="featured-badge">Featured Essay</span>
          <img src="${featuredPost.coverImage || 'assets/images/ai_safety_institutions.png'}" alt="${featuredPost.title}" class="featured-image">
        </div>
        <div class="featured-content">
          <div class="card-meta">
            <span><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${formattedDate}</span>
            <span><i class="fa-regular fa-clock" style="margin-right: 6px;"></i> ${featuredPost.readingTime}</span>
          </div>
          <div class="card-tags">${tagBadges}</div>
          <h2 class="featured-story-title">${featuredPost.title}</h2>
          <p class="featured-excerpt">${featuredPost.excerpt}</p>
          <a href="?post=${featuredPost.slug}" class="read-article-link">Read article <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </article>
    `;
  }

  // RENDER GRID POSTS
  if (otherPosts.length > 0) {
    otherPosts.forEach(post => {
      const tagBadges = post.tags.map(t => `<span class="card-tag">${t}</span>`).join("");
      const formattedDate = formatDate(post.publishedAt);

      // Conditional Admin Floating Buttons
      const adminButtons = isAdmin ? `
        <div class="card-admin-actions" onclick="event.stopPropagation();">
          <button class="card-admin-btn edit" onclick="editStory('${post.slug}');" title="Edit story"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="card-admin-btn delete" onclick="deleteStory('${post.slug}');" title="Delete story"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      ` : "";

      const card = document.createElement("article");
      card.className = "post-card";
      card.onclick = () => navigateTo(`?post=${post.slug}`);
      card.innerHTML = `
        <div class="card-img-container">
          ${adminButtons}
          <img src="${post.coverImage || 'assets/images/ai_safety_institutions.png'}" alt="${post.title}" class="card-image">
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span><i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${formattedDate}</span>
            <span><i class="fa-regular fa-clock" style="margin-right: 6px;"></i> ${post.readingTime}</span>
          </div>
          <div class="card-tags">${tagBadges}</div>
          <h3 class="post-title">${post.title}</h3>
          <p class="post-excerpt">${post.excerpt}</p>
          <a href="?post=${post.slug}" class="read-article-link" style="margin-top: auto;">Read article <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      `;
      postsGridContainer.appendChild(card);
    });
  } else if (!featuredPost) {
    // If no featured card exists at all (empty filtered), let's show no-results
    postsGridContainer.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>No matches found</h3>
        <p>No results match your search keywords or tags.</p>
      </div>
    `;
  }
}

/**
 * ----------------------------------------------------
 * SINGLE ARTICLE READER VIEW CONTROLS
 * ----------------------------------------------------
 */

function renderArticle(post) {
  document.title = `${post.title} | Jabess Omane`;

  // Dynamic meta tags injection for SEO simulation
  const metaDescEl = document.getElementById("meta-description");
  const ogTitleEl = document.getElementById("og-title");
  const ogDescEl = document.getElementById("og-description");
  if (metaDescEl) metaDescEl.setAttribute("content", post.excerpt);
  if (ogTitleEl) ogTitleEl.setAttribute("content", post.title);
  if (ogDescEl) ogDescEl.setAttribute("content", post.excerpt);

  // Setup basic back links
  document.getElementById("close-reader-btn").onclick = (e) => {
    e.preventDefault();
    navigateTo("");
  };

  // Dynamic admin controls insertion inside reader view
  let adminBar = document.getElementById("reader-admin-control-bar");
  if (adminBar) adminBar.remove();

  if (isAdmin) {
    adminBar = document.createElement("div");
    adminBar.id = "reader-admin-control-bar";
    adminBar.className = "reader-admin-bar";
    adminBar.innerHTML = `
      <span class="reader-admin-info"><i class="fa-solid fa-circle-user"></i> Administrative Controls</span>
      <div class="reader-admin-actions">
        <button class="reader-admin-btn edit" onclick="editStory('${post.slug}');"><i class="fa-solid fa-pen-to-square"></i> Edit Article</button>
        <button class="reader-admin-btn delete" onclick="deleteStory('${post.slug}');"><i class="fa-solid fa-trash-can"></i> Delete Article</button>
      </div>
    `;
    const hero = document.querySelector(".article-hero");
    hero.parentNode.insertBefore(adminBar, hero);
  }

  // Populate hero
  document.getElementById("reader-title").textContent = post.title;
  document.getElementById("reader-date").innerHTML = `<i class="fa-regular fa-calendar" style="margin-right: 6px;"></i> ${formatDate(post.publishedAt)}`;
  document.getElementById("reader-reading-time").innerHTML = `<i class="fa-regular fa-clock" style="margin-right: 6px;"></i> ${post.readingTime}`;
  document.getElementById("reader-cover-image").src = post.coverImage || "assets/images/ai_safety_institutions.png";
  document.getElementById("reader-cover-image").alt = post.title;

  // Populate tags
  const readerTagsEl = document.getElementById("reader-tags");
  readerTagsEl.innerHTML = post.tags.map(t => `<span class="card-tag">${t}</span>`).join("");

  // Populate HTML content body
  const bodyEl = document.getElementById("reader-content-body");
  bodyEl.innerHTML = post.content;

  // Scan content headings and inject anchor ids to build Table of Contents (ToC)
  setupHeadingsAndToC(bodyEl);

  // Hook into Share Link Button inside Sidebar dynamically to copy absolute shareable URL
  const shareLinkBtn = document.querySelector(".reader-sidebar a.social-icon[onclick]");
  if (shareLinkBtn) {
    shareLinkBtn.removeAttribute("onclick");
    shareLinkBtn.onclick = (e) => {
      e.preventDefault();
      const shareUrl = window.location.origin + window.location.pathname + "?post=" + post.slug;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("<i class='fa-solid fa-copy toast-icon' style='color:#10b981;'></i> Share link copied to clipboard!");
      }).catch(err => {
        console.error("Link copy failed: ", err);
        alert("Share Link: " + shareUrl);
      });
    };
  }

  // Set up top reading progress bar calculation
  setupReadingProgressBar();

  // Set up Previous/Next Article bottom navigation cards
  renderPagination(post);
}

/**
 * Scans generated elements in the article, injects anchor ids, and builds
 * an interactive dynamic Table of Contents sidebar.
 */
function setupHeadingsAndToC(bodyEl) {
  const headings = bodyEl.querySelectorAll("h2, h3");
  const tocListEl = document.getElementById("reader-toc-list");
  tocListEl.innerHTML = "";

  if (headings.length === 0) {
    document.querySelector(".sidebar-widget").style.display = "none";
    return;
  }
  document.querySelector(".sidebar-widget").style.display = "block";

  headings.forEach((heading, index) => {
    // Generate clean id
    const cleanId = `heading-anchor-${index}`;
    heading.setAttribute("id", cleanId);

    // Create sidebar link
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${cleanId}`;
    link.className = `toc-link ${heading.tagName === "H3" ? 'sub-heading' : ''}`;
    link.style.paddingLeft = heading.tagName === "H3" ? "12px" : "0px";
    link.style.fontSize = heading.tagName === "H3" ? "0.8rem" : "0.85rem";
    link.textContent = heading.textContent;
    
    // Smooth scroll event
    link.addEventListener("click", (e) => {
      e.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    li.appendChild(link);
    tocListEl.appendChild(li);
  });

  // Setup Scroll Observer for active heading highlight
  setupToCScrollObserver(headings);
}

/**
 * Highlights ToC items dynamically as their related headings are scrolled into view.
 */
function setupToCScrollObserver(headings) {
  const observerOptions = {
    root: null,
    rootMargin: "-10% 0px -65% 0px", // Focus highlight center viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        document.querySelectorAll(".toc-link").forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }, observerOptions);

  headings.forEach(h => observer.observe(h));
}

/**
 * Calculates scroll percentage within the body to drive the top reading progress indicator.
 */
function setupReadingProgressBar() {
  const progressBar = document.getElementById("reading-progress");
  
  activeScrollListener = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    
    const scrolled = (window.scrollY / docHeight) * 100;
    progressBar.style.width = `${scrolled}%`;
  };
  
  window.addEventListener("scroll", activeScrollListener);
}

/**
 * Generates previous/next dynamic article pagination elements at the bottom.
 */
function renderPagination(currentPost) {
  const navContainer = document.getElementById("reader-navigation");
  navContainer.innerHTML = "";

  const currentIndex = mergedPosts.findIndex(p => p.slug === currentPost.slug);
  
  // Previous story (next older article, higher index)
  const prevPost = currentIndex < mergedPosts.length - 1 ? mergedPosts[currentIndex + 1] : null;
  // Next story (newer article, lower index)
  const nextPost = currentIndex > 0 ? mergedPosts[currentIndex - 1] : null;

  if (prevPost) {
    const prevBlock = document.createElement("a");
    prevBlock.className = "nav-block prev";
    prevBlock.onclick = (e) => {
      e.preventDefault();
      navigateTo(`?post=${prevPost.slug}`);
    };
    prevBlock.innerHTML = `
      <span class="nav-block-label"><i class="fa-solid fa-arrow-left"></i> Previous Story</span>
      <span class="nav-block-title">${prevPost.title}</span>
    `;
    navContainer.appendChild(prevBlock);
  } else {
    // Spacer empty element to align next item to the right
    const spacer = document.createElement("div");
    navContainer.appendChild(spacer);
  }

  if (nextPost) {
    const nextBlock = document.createElement("a");
    nextBlock.className = "nav-block next";
    nextBlock.onclick = (e) => {
      e.preventDefault();
      navigateTo(`?post=${nextPost.slug}`);
    };
    nextBlock.innerHTML = `
      <span class="nav-block-label">Next Story <i class="fa-solid fa-arrow-right"></i></span>
      <span class="nav-block-title">${nextPost.title}</span>
    `;
    navContainer.appendChild(nextBlock);
  }
}

/**
 * ----------------------------------------------------
 * DYNAMIC WRITER & WYSIWYG EDITOR WORKSPACE CONTROLLERS
 * ----------------------------------------------------
 */

function initWriterCMS() {
  const cancelBtn = document.getElementById("writer-cancel-btn");
  const publishBtn = document.getElementById("writer-publish-btn");
  const editorArea = document.getElementById("edit-content");
  const toolbar = document.getElementById("editor-toolbar");
  
  const titleInput = document.getElementById("edit-title");
  const excerptInput = document.getElementById("edit-excerpt");
  const tagsInput = document.getElementById("edit-tags");
  const coverInput = document.getElementById("edit-cover");
  const featuredCheck = document.getElementById("edit-featured");

  const fontStyleToggle = document.getElementById("font-family-toggle");
  const activeFontName = document.getElementById("active-font-name");

  const insertImgBtn = document.getElementById("insert-img-btn");
  const uploadImgBtn = document.getElementById("upload-img-btn");
  const localImageUploader = document.getElementById("local-image-uploader");

  // CANCEL WRITING
  cancelBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to discard your draft? Any unsaved edits will be permanently lost.")) {
      editingSlug = null;
      clearDraftState();
      navigateTo("");
    }
  });

  // FORMATTING TOOLBAR BUTTONS (document.execCommand engine)
  toolbar.querySelectorAll(".toolbar-btn[data-cmd]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute("data-cmd");
      const val = btn.getAttribute("data-val") || null;
      
      document.execCommand(cmd, false, val);
      editorArea.focus();
      
      // Update preview and auto-save
      syncEditorToPreview();
      saveDraftState();
    });
  });

  // INSERT IMAGE URL POPUP
  insertImgBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const url = prompt("Enter the absolute Image URL (e.g., assets/images/kasa_ai_robot.jpg or a HTTPS web link):");
    if (!url) return;
    const desc = prompt("Enter a short descriptive caption for the image:") || "Editorial image embed";
    
    // Create modern inline block image structure
    const imgHtml = `<p><img src="${url}" alt="${desc}" style="width: 100%; border-radius: var(--radius-sm); margin: 1.5rem 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display:block;"><span style="display:block; text-align:center; font-size:0.8rem; font-family:var(--font-sans); color:rgba(0,0,0,0.4); margin-top:-1rem; margin-bottom:1.5rem;">${desc}</span></p><p><br></p>`;
    
    document.execCommand("insertHTML", false, imgHtml);
    editorArea.focus();
    
    syncEditorToPreview();
    saveDraftState();
  });

  // LOCAL DEVICE PHOTO UPLOADER (FileReader DataURL / Base64 pipeline)
  uploadImgBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localImageUploader.click();
  });

  localImageUploader.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const caption = prompt("Enter a short descriptive caption for the uploaded photo:") || "Uploaded photo";

      // Generate modern inline block image structure with Base64 data URL
      const imgHtml = `<p><img src="${dataUrl}" alt="${caption}" style="width: 100%; border-radius: var(--radius-sm); margin: 1.5rem 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display:block;"><span style="display:block; text-align:center; font-size:0.8rem; font-family:var(--font-sans); color:rgba(0,0,0,0.4); margin-top:-1rem; margin-bottom:1.5rem;">${caption}</span></p><p><br></p>`;

      editorArea.focus();
      document.execCommand("insertHTML", false, imgHtml);

      syncEditorToPreview();
      saveDraftState();
    };

    reader.readAsDataURL(file);
    // Clear input value so selecting the same file again triggers change event
    localImageUploader.value = "";
  });

  // TYPOGRAPHY FONT STYLE SELECTOR
  const fontStyles = ["font-serif", "font-sans", "font-mono"];
  const fontNames = ["Editorial Serif", "Clean Sans-Serif", "Technical Monospace"];
  let activeFontIndex = 0;

  fontStyleToggle.addEventListener("click", (e) => {
    e.preventDefault();
    // Remove current font class
    editorArea.classList.remove(fontStyles[activeFontIndex]);
    
    // Cycle next
    activeFontIndex = (activeFontIndex + 1) % fontStyles.length;
    
    // Apply new font
    editorArea.classList.add(fontStyles[activeFontIndex]);
    activeFontName.textContent = fontNames[activeFontIndex];
    
    // Preview sync
    const previewBody = document.getElementById("preview-body");
    previewBody.className = `article-body ${fontStyles[activeFontIndex]}`;
    
    saveDraftState();
  });

  // SYNC INPUT TRIGGERS FOR LIVE PREVIEW & AUTO-DRAFT PERSISTENCE
  [titleInput, excerptInput, tagsInput, coverInput, featuredCheck].forEach(el => {
    el.addEventListener("input", () => {
      syncEditorToPreview();
      saveDraftState();
    });
  });

  // Track editable document keyups to live sync
  editorArea.addEventListener("keyup", () => {
    syncEditorToPreview();
    saveDraftState();
  });
  
  editorArea.addEventListener("paste", (e) => {
    // Simple text paste sanitation to keep layout pristine
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    document.execCommand("insertHTML", false, text.replace(/\n/g, '<br>'));
    
    syncEditorToPreview();
    saveDraftState();
  });

  // PUBLISHING COMMAND ACTIONS
  publishBtn.addEventListener("click", () => {
    const titleVal = titleInput.value.trim();
    const excerptVal = excerptInput.value.trim();
    const tagsVal = tagsInput.value.trim();
    const coverVal = coverInput.value.trim() || "assets/images/ai_safety_institutions.png";
    const contentVal = editorArea.innerHTML;
    const isFeatured = featuredCheck.checked;

    // Validation
    if (!titleVal) { alert("Please provide a title for your story."); titleInput.focus(); return; }
    if (!excerptVal) { alert("Please provide a short excerpt."); excerptInput.focus(); return; }
    if (!tagsVal) { alert("Please provide at least one tag."); tagsInput.focus(); return; }
    if (editorArea.textContent.trim() === "" || editorArea.textContent.trim() === "Start typing your long-form essay here...") {
      alert("Please write some content before publishing.");
      editorArea.focus();
      return;
    }

    // Process variables
    const cleanTags = tagsVal.split(",").map(t => t.trim()).filter(t => t !== "");
    const generatedSlug = slugify(titleVal);
    const readingTimeStr = calculateReadingTime(editorArea.textContent);
    
    const finalSlug = editingSlug || generatedSlug;

    // Create New Post Object
    const newPost = {
      slug: finalSlug,
      title: titleVal,
      excerpt: excerptVal,
      tags: cleanTags,
      coverImage: coverVal,
      publishedAt: new Date().toISOString().split("T")[0],
      readingTime: readingTimeStr,
      featured: isFeatured,
      content: contentVal
    };

    // Save permanently to local storage
    const localStoriesRaw = localStorage.getItem("published_stories");
    let localStories = [];
    if (localStoriesRaw) {
      try {
        localStories = JSON.parse(localStoriesRaw);
      } catch (e) {
        localStories = [];
      }
    }
    
    // If flagged as featured, remove featured flags from other localStorage posts
    if (isFeatured) {
      localStories.forEach(p => p.featured = false);
    }

    const existingLocalIndex = localStories.findIndex(p => p.slug === finalSlug);
    if (existingLocalIndex > -1) {
      localStories[existingLocalIndex] = newPost;
    } else {
      localStories.unshift(newPost);
    }

    localStorage.setItem("published_stories", JSON.stringify(localStories));
    
    // Reset global editing state
    editingSlug = null;

    // Reload RAM entries
    loadAndMergeStories();

    // Trigger Developer Code Export Modal
    triggerCodeExporter(newPost);
  });

  // MODAL BUTTON ACTIONS
  document.getElementById("export-close-btn").onclick = closeModal;
  document.getElementById("export-done-btn").onclick = closeModal;
  
  const copyBtn = document.getElementById("copy-code-btn");
  copyBtn.onclick = () => {
    const codeArea = document.getElementById("export-code-block");
    
    navigator.clipboard.writeText(codeArea.textContent).then(() => {
      copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
      copyBtn.classList.add("copied");
      
      setTimeout(() => {
        copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy Code`;
        copyBtn.classList.remove("copied");
      }, 3000);
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      alert("Copy failed. Please manually select the code inside the block.");
    });
  };
}

/**
 * Closes modal and navigates to the newly rendered post.
 */
function closeModal() {
  const modal = document.getElementById("export-modal-overlay");
  modal.classList.remove("active");
  
  const params = new URLSearchParams(window.location.search);
  const newlyCreatedSlug = document.getElementById("export-modal-overlay").getAttribute("data-target-slug");
  
  editingSlug = null;
  clearDraftState();
  
  if (newlyCreatedSlug) {
    navigateTo(`?post=${newlyCreatedSlug}`);
  } else {
    navigateTo("");
  }
}

/**
 * Triggers and populates the developer copyable code modal.
 */
function triggerCodeExporter(post) {
  const modal = document.getElementById("export-modal-overlay");
  const codeEl = document.getElementById("export-code-block");
  
  // Format beautifully as an identical JS Object block
  const codeString = `  {
    slug: ${JSON.stringify(post.slug)},
    title: ${JSON.stringify(post.title)},
    excerpt: ${JSON.stringify(post.excerpt)},
    tags: ${JSON.stringify(post.tags)},
    coverImage: ${JSON.stringify(post.coverImage)},
    publishedAt: ${JSON.stringify(post.publishedAt)},
    readingTime: ${JSON.stringify(post.readingTime)},
    featured: ${post.featured},
    content: \`
      ${post.content.trim().replace(/\n/g, '\n      ')}
    \`
  }`;

  codeEl.textContent = codeString;
  
  // Set meta attributes
  modal.setAttribute("data-target-slug", post.slug);
  modal.classList.add("active");
}

/**
 * Syncs workspace form data in real-time to the preview panel.
 */
function syncEditorToPreview() {
  const title = document.getElementById("edit-title").value.trim() || "Draft Article Title";
  const excerpt = document.getElementById("edit-excerpt").value.trim() || "Live preview excerpt renders here...";
  const content = document.getElementById("edit-content").innerHTML;
  
  const wordCount = document.getElementById("edit-content").textContent.trim().split(/\s+/).filter(w => w !== "").length;
  const readingTimeStr = calculateReadingTime(document.getElementById("edit-content").textContent);

  document.getElementById("preview-title").textContent = title;
  document.getElementById("preview-readtime").innerHTML = `<i class="fa-regular fa-clock" style="margin-right: 4px;"></i> ${readingTimeStr}`;
  
  // Sync structured body content (apply first paragraph class drop-cap simulation)
  const previewBody = document.getElementById("preview-body");
  
  if (content === "" || content === "<p>Start typing your long-form essay here...</p>" || content === "<p><br></p>") {
    previewBody.innerHTML = `<p>${excerpt}</p>`;
  } else {
    // Render clean content
    previewBody.innerHTML = content;
    // Set first paragraph class to drop-cap dynamically
    const firstP = previewBody.querySelector("p");
    if (firstP && firstP.textContent.length > 5) {
      firstP.classList.add("drop-cap");
    }
  }
}

/**
 * Saves writing session to localStorage to secure drafting state from browser reloads.
 */
function saveDraftState() {
  const draft = {
    title: document.getElementById("edit-title").value,
    excerpt: document.getElementById("edit-excerpt").value,
    tags: document.getElementById("edit-tags").value,
    cover: document.getElementById("edit-cover").value,
    featured: document.getElementById("edit-featured").checked,
    fontClass: document.getElementById("edit-content").className,
    fontName: document.getElementById("active-font-name").textContent,
    content: document.getElementById("edit-content").innerHTML
  };
  localStorage.setItem("writer_draft_state", JSON.stringify(draft));
}

/**
 * Restores unsaved drafting session when loading the editor area.
 */
function restoreDraftState() {
  const raw = localStorage.getItem("writer_draft_state");
  if (!raw) return;

  try {
    const draft = JSON.parse(raw);
    document.getElementById("edit-title").value = draft.title || "";
    document.getElementById("edit-excerpt").value = draft.excerpt || "";
    document.getElementById("edit-tags").value = draft.tags || "";
    document.getElementById("edit-cover").value = draft.cover || "";
    document.getElementById("edit-featured").checked = !!draft.featured;
    
    const editor = document.getElementById("edit-content");
    editor.className = draft.fontClass || "editor-textarea font-serif";
    document.getElementById("active-font-name").textContent = draft.fontName || "Editorial Serif";
    
    // Apply content
    if (draft.content) {
      editor.innerHTML = draft.content;
    }
    
    syncEditorToPreview();
  } catch (e) {
    console.error("Draft restore failed: ", e);
  }
}

/**
 * Clears auto-save session states.
 */
function clearDraftState() {
  localStorage.removeItem("writer_draft_state");
  
  // Clear HTML form inputs
  document.getElementById("edit-title").value = "";
  document.getElementById("edit-excerpt").value = "";
  document.getElementById("edit-tags").value = "";
  document.getElementById("edit-cover").value = "";
  document.getElementById("edit-featured").checked = false;
  
  const editor = document.getElementById("edit-content");
  editor.className = "editor-textarea font-serif";
  document.getElementById("active-font-name").textContent = "Editorial Serif";
  editor.innerHTML = "<p>Start typing your long-form essay here...</p>";
  
  syncEditorToPreview();
}

/**
 * ----------------------------------------------------
 * UTILITY HELPERS
 * ----------------------------------------------------
 */

/**
 * Converts a raw date YYYY-MM-DD into a premium readable journal string (e.g. May 15, 2026).
 */
function formatDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

/**
 * Generates URL-friendly slugs from strings.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

/**
 * Estimates reading time based on a standard speed of 200 words per minute.
 */
function calculateReadingTime(text) {
  if (!text) return "1 min read";
  const words = text.trim().split(/\s+/).filter(w => w !== "").length;
  const time = Math.max(1, Math.round(words / 200));
  return `${time} min read`;
}

/**
 * ----------------------------------------------------
 * Stage 3: PASSCODE GATE, CMS OVERRIDES & TOAST COPIERS
 * ----------------------------------------------------
 */

function initAdminGate() {
  const lockToggle = document.getElementById("admin-lock-toggle");
  const passcodeModal = document.getElementById("passcode-modal-overlay");
  const passcodeField = document.getElementById("admin-passcode-input");
  const passcodeError = document.getElementById("passcode-error-msg");
  const passcodeSubmit = document.getElementById("passcode-submit-btn");
  const passcodeCancel = document.getElementById("passcode-cancel-btn");
  const passcodeClose = document.getElementById("passcode-close-btn");

  if (!lockToggle) return;

  // Sync initial view states
  updateAdminUI();

  // Toggle lock icon clicked
  lockToggle.addEventListener("click", () => {
    if (isAdmin) {
      if (confirm("Are you sure you want to sign out of Admin Mode?")) {
        isAdmin = false;
        localStorage.removeItem("isAdmin");
        updateAdminUI();
        showToast("<i class='fa-solid fa-lock toast-icon' style='color:#ef4444;'></i> Signed out of Admin Mode.");
      }
    } else {
      passcodeModal.classList.add("active");
      passcodeField.value = "";
      passcodeError.style.display = "none";
      setTimeout(() => passcodeField.focus(), 150);
    }
  });

  // Modal Submit actions
  passcodeSubmit.addEventListener("click", validatePasscode);
  
  passcodeField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      validatePasscode();
    }
  });

  // Cancel triggers
  passcodeCancel.addEventListener("click", () => passcodeModal.classList.remove("active"));
  passcodeClose.addEventListener("click", () => passcodeModal.classList.remove("active"));

  function validatePasscode() {
    const enteredCode = passcodeField.value.trim();
    if (enteredCode === "1997") {
      isAdmin = true;
      localStorage.setItem("isAdmin", "true");
      passcodeModal.classList.remove("active");
      updateAdminUI();
      showToast("<i class='fa-solid fa-lock-open toast-icon' style='color:#10b981;'></i> Admin Mode unlocked successfully!");
    } else {
      passcodeError.style.display = "block";
      passcodeField.value = "";
      passcodeField.focus();
    }
  }

  function updateAdminUI() {
    if (isAdmin) {
      lockToggle.classList.add("unlocked");
      lockToggle.innerHTML = `<i class="fa-solid fa-lock-open"></i>`;
      openWriterBtn.style.display = "inline-flex";
    } else {
      lockToggle.classList.remove("unlocked");
      lockToggle.innerHTML = `<i class="fa-solid fa-lock"></i>`;
      openWriterBtn.style.display = "none";
    }

    // Refresh active layout listing or details
    const params = new URLSearchParams(window.location.search);
    const postSlug = params.get("post");

    if (hubView.style.display !== "none") {
      renderHub();
    } else if (postSlug) {
      const post = mergedPosts.find(p => p.slug === postSlug);
      if (post) renderArticle(post);
    }
  }
}

/**
 * Loads selected article parameters back into editor form for modification.
 */
function loadStoryIntoEditor(slug) {
  const post = mergedPosts.find(p => p.slug === slug);
  if (!post) {
    navigateTo("?write=true");
    return;
  }

  editingSlug = slug;
  document.getElementById("edit-title").value = post.title;
  document.getElementById("edit-excerpt").value = post.excerpt;
  document.getElementById("edit-tags").value = post.tags.join(", ");
  document.getElementById("edit-cover").value = post.coverImage || "";
  document.getElementById("edit-featured").checked = !!post.featured;

  const editor = document.getElementById("edit-content");
  editor.className = "editor-textarea font-serif";
  document.getElementById("active-font-name").textContent = "Editorial Serif";
  editor.innerHTML = post.content;

  syncEditorToPreview();
}

/**
 * Deletes local drafts from localStorage, or appends static post slugs to deleted override list.
 */
function deleteStory(slug) {
  const post = mergedPosts.find(p => p.slug === slug);
  if (!post) return;

  if (confirm(`Are you sure you want to delete the story "${post.title}"? This action is irreversible.`)) {
    const localStoriesRaw = localStorage.getItem("published_stories");
    let localStories = [];
    if (localStoriesRaw) {
      try {
        localStories = JSON.parse(localStoriesRaw);
      } catch (e) {
        localStories = [];
      }
    }

    const isLocal = localStories.some(p => p.slug === slug);

    if (isLocal) {
      const updated = localStories.filter(p => p.slug !== slug);
      localStorage.setItem("published_stories", JSON.stringify(updated));
    } else {
      const deletedRaw = localStorage.getItem("deleted_slugs");
      let deletedSlugs = [];
      if (deletedRaw) {
        try {
          deletedSlugs = JSON.parse(deletedRaw);
        } catch (e) {
          deletedSlugs = [];
        }
      }
      deletedSlugs.push(slug);
      localStorage.setItem("deleted_slugs", JSON.stringify(deletedSlugs));
    }

    showToast("<i class='fa-solid fa-trash-can toast-icon' style='color:#ef4444;'></i> Story deleted successfully.");

    // Reload RAM entries
    loadAndMergeStories();

    // Route transitions
    const params = new URLSearchParams(window.location.search);
    if (params.get("post") === slug) {
      navigateTo("");
    } else {
      renderHub();
    }
  }
}

/**
 * Opens the Writer workspace with query selectors pre-populated.
 */
function editStory(slug) {
  navigateTo(`?write=true&edit=${slug}`);
}

/**
 * Renders non-disruptive toast alerts.
 */
function showToast(message) {
  const toastEl = document.getElementById("toast-notification");
  const toastMsgEl = document.getElementById("toast-message");
  if (toastEl && toastMsgEl) {
    toastMsgEl.innerHTML = message;
    toastEl.classList.add("active");

    setTimeout(() => {
      toastEl.classList.remove("active");
    }, 3500);
  }
}
