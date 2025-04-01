document.addEventListener('DOMContentLoaded', () => {
    const optionsButton = document.querySelector('.options');
    const dropdown = document.querySelector('.dropdown');

    optionsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});
