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
