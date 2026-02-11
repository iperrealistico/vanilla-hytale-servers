"use client";

import { useEffect } from 'react';

declare global {
    interface Window {
        gsap: any;
        ScrollTrigger: any;
        EmblaCarousel: any;
    }
}

export default function ClientEffects() {
    useEffect(() => {
        let emblaApi: any = null;

        const init = () => {
            if (typeof window === 'undefined') return;

            const gsap = window.gsap;
            const ScrollTrigger = window.ScrollTrigger;
            const EmblaCarousel = window.EmblaCarousel;

            if (gsap && ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);

                // Reveal animations
                const revealElements = document.querySelectorAll('[data-reveal]');
                revealElements.forEach((el) => {
                    gsap.fromTo(el,
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: "power2.out",
                            scrollTrigger: {
                                trigger: el,
                                start: "top 90%",
                                toggleActions: "play none none none"
                            }
                        }
                    );
                });

                // Tilt effect
                const tiltElements = document.querySelectorAll('.tilt');
                tiltElements.forEach((el: any) => {
                    const handleMouseMove = (e: MouseEvent) => {
                        const rect = el.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;

                        const strength = parseFloat(el.getAttribute('data-tilt-strength') || '1');

                        // Calculate raw rotation values (max range +/- 2 before strength for subtler effect)
                        let rotateX = ((y - centerY) / centerY) * -2 * strength;
                        let rotateY = ((x - centerX) / centerX) * 2 * strength;

                        // Clamp values to ensure they don't exceed +/- 8 degrees
                        const maxTilt = 8;
                        rotateX = Math.max(-maxTilt, Math.min(maxTilt, rotateX));
                        rotateY = Math.max(-maxTilt, Math.min(maxTilt, rotateY));

                        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                        el.style.transition = 'transform 0.1s ease-out';
                    };

                    const handleMouseLeave = () => {
                        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
                        el.style.transition = 'transform 0.4s ease-out';
                    };

                    el.addEventListener('mousemove', handleMouseMove);
                    el.addEventListener('mouseleave', handleMouseLeave);
                });
            }

            // Embla Carousel
            const emblaNode = document.querySelector('[data-embla]');
            if (emblaNode && EmblaCarousel) {
                // Determine if we should treat drag as click based on drag amount
                emblaApi = EmblaCarousel(emblaNode, {
                    loop: true,
                    skipSnaps: false
                });

                // Add dragging class to cursor style
                emblaApi.on('pointerDown', () => {
                    const node = emblaApi.rootNode();
                    node.style.cursor = 'grabbing';
                });
                emblaApi.on('pointerUp', () => {
                    const node = emblaApi.rootNode();
                    node.style.cursor = 'grab';
                });
            }

            // Copy buttons
            const copyButtons = document.querySelectorAll('[data-copy]');
            copyButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const text = btn.getAttribute('data-copy');
                    if (text) {
                        navigator.clipboard.writeText(text).then(() => {
                            const toast = document.getElementById('toast');
                            if (toast) {
                                toast.textContent = 'IP Copied!';
                                toast.classList.add('show');
                                setTimeout(() => toast.classList.remove('show'), 2000);
                            }
                        });
                    }
                });
            });

            // Contact button email swap
            const contactBtns = document.querySelectorAll('.contact-btn');
            contactBtns.forEach((btn: any) => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    if (btn.classList.contains('is-email')) {
                        window.location.href = `mailto:${email}`;
                    } else {
                        navigator.clipboard.writeText(email);
                        btn.classList.add('is-email');
                        setTimeout(() => btn.classList.remove('is-email'), 3000);
                    }
                });
            });
        };

        // Wait for external scripts to load - check multiple times
        let attempts = 0;
        const maxAttempts = 20;
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.gsap && window.ScrollTrigger && window.EmblaCarousel) {
                clearInterval(checkInterval);
                init();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('External scripts did not load in time');
                init(); // Try anyway
            }
        }, 100);

        return () => {
            clearInterval(checkInterval);
            if (emblaApi) emblaApi.destroy();
        };
    }, []);

    return null;
}
