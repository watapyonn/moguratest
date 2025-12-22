document.addEventListener('DOMContentLoaded', () => {

    // --- Carousel Logic ---
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-btn.next');
    const prevButton = document.querySelector('.carousel-btn.prev');

    let currentIndex = 0;
    const slideIntervalTime = 5000; // 5 seconds

    const updateSlide = (index) => {
        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        // Add active class to current
        slides[index].classList.add('active');
    }

    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlide(currentIndex);
    }

    const prevSlide = () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlide(currentIndex);
    }

    // Event Listeners
    if (nextButton) nextButton.addEventListener('click', () => {
        nextSlide();
        resetTimer();
    });

    if (prevButton) prevButton.addEventListener('click', () => {
        prevSlide();
        resetTimer();
    });

    // Auto Play
    let slideInterval = setInterval(nextSlide, slideIntervalTime);

    const resetTimer = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, slideIntervalTime);
    }

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    console.log('Mole Smashers: Ready for Adventure!');
});
