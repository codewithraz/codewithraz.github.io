// Set scroll restoration to manual
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    // ✅ PRODUCTS FILTER FUNCTIONALITY
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productItems = document.querySelectorAll('.product-item');

    // Safety check: ensure elements exist
    if (filterButtons.length === 0 || productItems.length === 0) {
        console.warn('Filter buttons or product items missing. Check HTML structure.');
        return;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            productItems.forEach(item => {
                const category = item.getAttribute('data-category');
                const shouldShow = (filterValue === 'all' || category === filterValue);

                if (shouldShow) {
                    item.classList.remove('hidden');
                    // Trigger reflow for CSS transition
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    requestAnimationFrame(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    });
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // Initial staggered animation on page load
    productItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 80);
    });
});
