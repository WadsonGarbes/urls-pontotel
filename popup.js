document.addEventListener('DOMContentLoaded', async function() {
    console.log('Popup carregado, iniciando configuração...');

    try {
        // Check if user has custom configuration
        const config = await new Promise((resolve) => {
            // Verificar se chrome.storage está disponível
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['useCustomConfig', 'customConfig'], async function(result) {
                    console.log('Storage result:', result);

                    if (result.useCustomConfig && result.customConfig) {
                        console.log('Usando configuração personalizada');
                        resolve(result.customConfig);
                    } else {
                        console.log('Carregando configuração padrão...');
                        // Load default configuration from JSON file
                        try {
                            const response = await fetch('./urls.json');
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            const defaultConfig = await response.json();
                            console.log('Configuração padrão carregada:', defaultConfig);
                            resolve(defaultConfig);
                        } catch (error) {
                            console.error('Error loading default config:', error);
                            resolve({ environments: [] });
                        }
                    }
                });
            } else {
                console.warn('Chrome storage não disponível, tentando carregar JSON diretamente');
                // Fallback se chrome.storage não estiver disponível
                fetch('./urls.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(defaultConfig => {
                        console.log('Configuração padrão carregada (fallback):', defaultConfig);
                        resolve(defaultConfig);
                    })
                    .catch(error => {
                        console.error('Error loading config (fallback):', error);
                        resolve({ environments: [] });
                    });
            }
        });

        // Get the container where we'll insert the URLs
        const container = document.getElementById('urls-container');

        if (!container) {
            console.error('Container urls-container não encontrado!');
            return;
        }

        // Clear any existing content
        container.innerHTML = '';

        // Verificar se há ambientes na configuração
        if (!config || !config.environments || !Array.isArray(config.environments)) {
            console.error('Configuração inválida:', config);
            container.innerHTML = `
                <tr>
                    <td colspan="2" style="color: red; text-align: center; padding: 20px;">
                        Erro: Configuração de URLs inválida ou não encontrada
                    </td>
                </tr>
            `;
            return;
        }

        if (config.environments.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; padding: 20px;">
                        Nenhum ambiente configurado
                    </td>
                </tr>
            `;
            return;
        }

        console.log(`Carregando ${config.environments.length} ambientes...`);

        // Generate HTML for each environment
        config.environments.forEach((environment, envIndex) => {
            console.log(`Processando ambiente ${envIndex + 1}: ${environment.name}`);

            // Validar estrutura do ambiente
            if (!environment.name || !environment.class || !Array.isArray(environment.urls)) {
                console.warn(`Ambiente inválido ignorado:`, environment);
                return;
            }

            // Create header row for the environment
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <td class="${environment.class}" colspan="2">
                    <strong>${environment.name}</strong>
                </td>
            `;
            container.appendChild(headerRow);

            // Create rows for each URL in this environment
            environment.urls.forEach((urlItem, urlIndex) => {
                if (!urlItem.name || !urlItem.url) {
                    console.warn(`URL inválida ignorada:`, urlItem);
                    return;
                }

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

        // Add click event listeners to all links using your existing logic
        document.querySelectorAll('.btn').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent the default anchor behavior
                const url = link.getAttribute('href'); // Get the URL from href
                console.log('Abrindo URL:', url);
                chrome.tabs.create({ url: url }); // Open in a new tab
            });
        });

        // Settings button handler
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                console.log('Abrindo configurações...');
                if (chrome.runtime && chrome.runtime.openOptionsPage) {
                    chrome.runtime.openOptionsPage();
                } else {
                    console.warn('openOptionsPage não disponível');
                }
            });
        }

        console.log('Popup configurado com sucesso!');

    } catch (error) {
        console.error('Erro geral no popup:', error);

        // Show error message to user
        const container = document.getElementById('urls-container');
        if (container) {
            container.innerHTML = `
                <tr>
                    <td colspan="2" style="color: red; text-align: center; padding: 20px;">
                        Erro ao carregar configuração: ${error.message}
                        <br><small>Verifique o console para mais detalhes</small>
                    </td>
                </tr>
            `;
        }
    }
});