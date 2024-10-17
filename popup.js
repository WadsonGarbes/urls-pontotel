document.querySelectorAll('.btn').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default anchor behavior
        const url = link.getAttribute('href'); // Get the URL from href
        chrome.tabs.create({ url: url }); // Open in a new tab
    });
});
