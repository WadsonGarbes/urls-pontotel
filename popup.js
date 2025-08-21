document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load the URLs configuration from JSON file
        const response = await fetch('./urls.json');
        const config = await response.json();

        // Get the container where we'll insert the URLs
        const container = document.getElementById('urls-container');

        // Clear any existing content
        container.innerHTML = '';

        // Generate HTML for each environment
        config.environments.forEach(environment => {
            // Create header row for the environment
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <td class="${environment.class}" colspan="2">
                    <strong>${environment.name}</strong>
                </td>
            `;
            container.appendChild(headerRow);

            // Create rows for each URL in this environment
            environment.urls.forEach(urlItem => {
                const urlRow = document.createElement('tr');
                urlRow.innerHTML = `
                    <td>
                        <a class="btn ${environment.class}" href="${urlItem.url}" target="_blank">
                            ${urlItem.name}
                        </a>
                    </td>
                `;
                container.appendChild(urlRow);
            });
        });

        // Add click event listeners to all links
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                // Open URL in new tab
                chrome.tabs.create({
                    url: this.href,
                    active: true
                });

                // Close the popup (optional)
                window.close();
            });
        });

    } catch (error) {
        console.error('Error loading URLs configuration:', error);

        // Show error message to user
        const container = document.getElementById('urls-container');
        container.innerHTML = `
            <tr>
                <td colspan="2" style="color: red; text-align: center; padding: 20px;">
                    Erro ao carregar configuração de URLs
                </td>
            </tr>
        `;
    }
});