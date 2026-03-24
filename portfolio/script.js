// Global GSAP Animations handled via ScrollTrigger below.

// Initialize GSAP Animations
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // General Fade/Slide up for major blocks (excluding bespoke lateral blocks)
        const revealElements = gsap.utils.toArray('.bento-card, .project-row, .advisory-card, .inquiry-form-container, .transition-bridge, .tech-card');
        
        revealElements.forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });
        });

        // Vision Section Cards Staggered Reveal
        const visionCards = gsap.utils.toArray('.vision-card, .expertise-board');
        visionCards.forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" },
                y: 30, opacity: 0, duration: 0.8, ease: "power3.out", delay: i * 0.15
            });
        });

        // "Build With Me" ZigZag Staggered Slide In
        const buildRows = gsap.utils.toArray('.build-row');
        buildRows.forEach((row, i) => {
            // Determine incoming direction based on whether it's the reverse row
            let xOffset = row.classList.contains('reverse') ? 60 : -60;
            
            gsap.from(row, {
                scrollTrigger: {
                    trigger: row,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                x: xOffset,
                y: 30,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
                delay: i * 0.15 // Stagger effect based on index
            });
        });

        // "Beyond the Code" & "Articles" Lateral Slides
        gsap.from(".impact-content", {
            scrollTrigger: { trigger: ".impact-content", start: "top 85%", toggleActions: "play none none reverse" },
            x: -60, y: 30, opacity: 0, duration: 1, ease: "power3.out"
        });
        gsap.from(".gallery-wrapper", {
            scrollTrigger: { trigger: ".gallery-wrapper", start: "top 85%", toggleActions: "play none none reverse" },
            x: 60, y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.15
        });
        gsap.from(".featured-article", {
            scrollTrigger: { trigger: ".featured-article", start: "top 85%", toggleActions: "play none none reverse" },
            x: -60, y: 30, opacity: 0, duration: 1, ease: "power3.out"
        });

        // Education Page Animations (Degree Hero, Vaults, Projects)
        if (document.querySelector(".degree-hero")) {
            gsap.from(".degree-info", {
                scrollTrigger: { trigger: ".degree-hero", start: "top 85%", toggleActions: "play none none reverse" },
                x: -60, opacity: 0, duration: 1, ease: "power3.out"
            });
            gsap.from(".degree-hero-slider, .degree-hero-img", {
                scrollTrigger: { trigger: ".degree-hero", start: "top 85%", toggleActions: "play none none reverse" },
                x: 60, opacity: 0, duration: 1, ease: "power3.out", delay: 0.15
            });
        }

        const vaultItems = gsap.utils.toArray('.vault-item');
        if (vaultItems.length > 0) {
            vaultItems.forEach((item, i) => {
                let xOffset = i % 2 === 0 ? -50 : 50; // Alternating left-right entrance
                gsap.from(item, {
                    scrollTrigger: { trigger: item, start: "top 90%", toggleActions: "play none none reverse" },
                    x: xOffset, y: 20, opacity: 0, duration: 0.8, ease: "power3.out"
                });
            });
        }
        
        const eduCards = gsap.utils.toArray('.discipline-card, .edu-project-card');
        if (eduCards.length > 0) {
            eduCards.forEach((card, i) => {
                gsap.from(card, {
                    scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse" },
                    y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
                });
            });
        }
    }
});

// Global animations are now controlled by GSAP.

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Profile Image Slider (5 Seconds)
const profile1 = document.getElementById('profileSlide1');
const profile2 = document.getElementById('profileSlide2');

if (profile1 && profile2) {
    setInterval(() => {
        profile1.classList.toggle('slide-hidden');
        profile2.classList.toggle('slide-hidden');
    }, 5000);
}

// Project Image Slider (7 Seconds)
const articulateContainer = document.getElementById('articulateSlider');
if (articulateContainer) {
    const slides = articulateContainer.querySelectorAll('.project-slide');
    let currentSlide = 0;

    if (slides.length > 0) {
        setInterval(() => {
            // Remove active from current
            slides[currentSlide].classList.remove('active');

            // Move to next slide
            currentSlide = (currentSlide + 1) % slides.length;

            // Add active to new slide
            slides[currentSlide].classList.add('active');
        }, 7000);
    }
}

// CogniTrace Image Slider (7 Seconds, offset by 3.5s to prevent sync)
const cogniContainer = document.getElementById('cogniSlider');
if (cogniContainer) {
    const slides = cogniContainer.querySelectorAll('.project-slide');
    let currentSlide = 0;

    const transitionSlide = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    if (slides.length > 0) {
        setTimeout(() => {
            transitionSlide(); // First transition after 3.5s
            setInterval(transitionSlide, 7000); // Recurring every 7s
        }, 3500);
    }
}

// Build With Me Multi-Sliders (Automated Staggered Crossfade)
const buildMultiSliders = document.querySelectorAll('.slider-mode');
buildMultiSliders.forEach((slider, index) => {
    const slides = slider.querySelectorAll('.build-slide');
    if (slides.length > 1) {
        let currentSlide = 0;
        
        // Offset the interval start time by 800ms per row so they don't sync flash
        setTimeout(() => {
            setInterval(() => {
                slides[currentSlide].classList.remove('active');
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].classList.add('active');
            }, 4000);
        }, index * 800);
    }
});

// Mobile Menu Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.getElementById('nav-links');

if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const links = navLinks.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// Education Card Expansion Toggle
function toggleEducation(event) {
    // Prevent event bubbling if clicking the close button
    if (event) {
        event.stopPropagation();
    }

    const card = document.getElementById('educationCard');
    const overlay = document.getElementById('eduOverlay');

    if (card && overlay) {
        card.classList.toggle('expanded');
        overlay.classList.toggle('active');

        // Prevent background scrolling when modal is open
        if (card.classList.contains('expanded')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}
