
document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach(function (dropdown) {
        dropdown.addEventListener("toggle", function () {
            if (!dropdown.open) return;

            dropdowns.forEach(function (otherDropdown) {
                if (otherDropdown !== dropdown) {
                    otherDropdown.open = false;
                }
            });
        });
    });
});

