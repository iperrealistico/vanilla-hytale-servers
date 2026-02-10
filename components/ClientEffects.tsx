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

                // Tilt effect (minimal manual implementation if VanillaTilt is not used, 
                // but here we just follow the data-tilt-strength attribute)
                const tiltElements = document.querySelectorAll('.tilt');
                tiltElements.forEach((el: any) => {
                    el.addEventListener('mousemove', (e: MouseEvent) => {
                        const rect = el.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const strength = parseFloat(el.getAttribute('data-tilt-strength') || '1');
                        const rotateX = ((y - centerY) / centerY) * -10 * strength;
                        const rotateY = ((x - centerX) / centerX) * 10 * strength;

                        el.style.setProperty('--rx', `${rotateX}deg`);
                        el.style.setProperty('--ry', `${rotateY}deg`);
                    });
                    el.addEventListener('mouseleave', () => {
                        el.style.setProperty('--rx', '0deg');
                        el.style.setProperty('--ry', '0deg');
                    });
                });
            }

            // Embla Carousel
            const emblaNode = document.querySelector('[data-embla]');
            if (emblaNode && EmblaCarousel) {
                EmblaCarousel(emblaNode, { loop: true });
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

        // Wait for external scripts to load if they are still loading
        const timer = setTimeout(init, 500);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
