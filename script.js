const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    },
    {
        rootMargin: '0px 0px -10% 0px', // Adjusts the bottom threshold for triggering the intersection
    }
);

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));


const hamMenu = document.querySelector(".ham_menu");
const offScreenMenu = document.querySelector(".sidenav");

hamMenu.addEventListener("click", () => {
  hamMenu.classList.toggle("active");
  offScreenMenu.classList.toggle("active");
});

// Function to show the insights modal for a specific section
function showInsights(section) {
    // Display the modal for the given section
    document.getElementById(section).style.display = "block";
}

// Function to close the insights modal for a specific section
function closeInsights(section) {
    // Hide the modal for the given section
    document.getElementById(section).style.display = "none";
}

// Optional: Close the modal if the user clicks outside the modal content
window.onclick = function(event) {
    // Check if the clicked target is the modal background (the area outside the content)
    if (event.target && event.target.classList.contains("modal")) {
        // Close all modals if clicked outside the modal content
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.style.display = "none");
    }
}

function switchTab1(tabId) {
    // Remove 'active' class from all tab buttons and tab contents
    document.querySelectorAll('.tab-btn1').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content1').forEach(content => content.classList.remove('active'));

    // Add 'active' class to the clicked button and corresponding tab content
    document.querySelector(`[onclick="switchTab1('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function switchTab2(tabId) {
    // Remove 'active' class from all tab buttons and tab contents
    document.querySelectorAll('.tab-btn2').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content2').forEach(content => content.classList.remove('active'));

    // Add 'active' class to the clicked button and corresponding tab content
    document.querySelector(`[onclick="switchTab2('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}