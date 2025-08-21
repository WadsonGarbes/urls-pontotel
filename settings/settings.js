document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('json-file');
    const loadBtn = document.getElementById('load-json-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-current-btn');
    const statusMessage = document.getElementById('status-message');
    const currentSource = document.getElementById('current-source');
    const environmentCount = document.getElementById('environment-count');
    const urlCount = document.getElementById('url-count');
    const jsonExample = document.getElementById('json-example');

    let selectedFile = null;

    // Show JSON format example
    const exampleJson = {
        "environments": [
            {
                "name": "Produção",
                "class": "cetacean-blue",
                "urls": [
                    {
                        "name": "Gestão Web",
                        "url": "https://gestao.pontotel.com.br"
                    },
                    {
                        "name": "API Swagger",
                        "url": "https://api.pontotel.com.br/docs"
                    }
                ]
            },
            {
                "name": "Homolog",
                "class": "midnight-blue",
                "urls": [
                    {
                        "name": "Gestão HML",
                        "url": "https://hml.pontotel.com.br/pontotel/new-front"
                    }
                ]
            },
            {
                "name": "Desenvolvimento",
                "class": "star-command-blue",
                "urls": [
                    {
                        "name": "Local Frontend",
                        "url": "http://localhost:3000"
                    }
                ]
            }
        ],
    };
    jsonExample.textContent = JSON.stringify(exampleJson, null, 2);

    // Load current configuration info
    loadCurrentConfig();

    // File input handler
    fileInput.addEventListener('change', function(e) {
        selectedFile = e.target.files[0];
        loadBtn.disabled = !selectedFile;

        if (selectedFile) {
            showStatus(`Arquivo selecionado: ${selectedFile.name}`, 'success');
        }
    });

    // Load JSON button handler
    loadBtn.addEventListener('click', function() {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);

                // Validate JSON structure
                if (!validateJsonStructure(jsonData)) {
                    showStatus('Formato JSON inválido. Verifique a estrutura do arquivo.', 'error');
                    return;
                }

                // Save custom configuration
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.set({
                        customConfig: jsonData,
                        useCustomConfig: true
                    }, function() {
                        if (chrome.runtime.lastError) {
                            showStatus('Erro ao salvar configuração: ' + chrome.runtime.lastError.message, 'error');
                        } else {
                            showStatus('Configuração carregada com sucesso!', 'success');
                            loadCurrentConfig();

                            // Reset file input
                            fileInput.value = '';
                            selectedFile = null;
                            loadBtn.disabled = true;
                        }
                    });
                } else {
                    showStatus('Erro: Extensão não pode acessar o storage do Chrome', 'error');
                }

            } catch (error) {
                showStatus('Erro ao processar arquivo JSON: ' + error.message, 'error');
            }
        };
        reader.readAsText(selectedFile);
    });

    // Reset button handler
    resetBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja restaurar a configuração padrão?')) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    useCustomConfig: false
                }, function() {
                    if (chrome.runtime.lastError) {
                        showStatus('Erro ao restaurar configuração: ' + chrome.runtime.lastError.message, 'error');
                    } else {
                        chrome.storage.local.remove('customConfig', function() {
                            if (chrome.runtime.lastError) {
                                console.warn('Aviso ao remover customConfig:', chrome.runtime.lastError);
                            }
                            showStatus('Configuração padrão restaurada!', 'success');
                            loadCurrentConfig();
                        });
                    }
                });
            } else {
                showStatus('Erro: Extensão não pode acessar o storage do Chrome', 'error');
            }
        }
    });

    // Download current config button handler
    downloadBtn.addEventListener('click', function() {
        getCurrentConfig().then(config => {
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'pontotel-urls-config.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showStatus('Configuração baixada!', 'success');
        }).catch(error => {
            showStatus('Erro ao baixar configuração: ' + error.message, 'error');
        });
    });

    function validateJsonStructure(data) {
        if (!data || !data.environments || !Array.isArray(data.environments)) {
            return false;
        }

        for (const env of data.environments) {
            if (!env.name || !env.class || !env.urls || !Array.isArray(env.urls)) {
                return false;
            }

            for (const url of env.urls) {
                if (!url.name || !url.url) {
                    return false;
                }
            }
        }

        return true;
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        statusMessage.style.display = 'block';

        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }

    async function getCurrentConfig() {
        return new Promise((resolve) => {
            // Verificar se chrome.storage está disponível
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['useCustomConfig', 'customConfig'], async function(result) {
                    if (chrome.runtime.lastError) {
                        console.error('Erro ao acessar storage:', chrome.runtime.lastError);
                        // Fallback para configuração padrão
                        loadDefaultConfig().then(resolve).catch(() => resolve({ environments: [] }));
                        return;
                    }

                    if (result.useCustomConfig && result.customConfig) {
                        resolve(result.customConfig);
                    } else {
                        // Load default config
                        loadDefaultConfig().then(resolve).catch(() => resolve({ environments: [] }));
                    }
                });
            } else {
                console.warn('chrome.storage não disponível, carregando configuração padrão');
                // Fallback se chrome.storage não estiver disponível
                loadDefaultConfig().then(resolve).catch(() => resolve({ environments: [] }));
            }
        });
    }

    async function loadDefaultConfig() {
        try {
            const response = await fetch(chrome.runtime.getURL('urls.json'));
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro ao carregar configuração padrão:', error);
            throw error;
        }
    }

    async function loadCurrentConfig() {
        try {
            const config = await getCurrentConfig();

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['useCustomConfig'], function(result) {
                    if (chrome.runtime.lastError) {
                        console.error('Erro ao verificar configuração:', chrome.runtime.lastError);
                        currentSource.textContent = 'Erro ao verificar';
                        environmentCount.textContent = '-';
                        urlCount.textContent = '-';
                        return;
                    }

                    currentSource.textContent = result.useCustomConfig ? 'Configuração Personalizada' : 'Configuração Padrão';
                    environmentCount.textContent = config.environments ? config.environments.length : 0;

                    let totalUrls = 0;
                    if (config.environments) {
                        config.environments.forEach(env => {
                            if (env.urls) {
                                totalUrls += env.urls.length;
                            }
                        });
                    }
                    urlCount.textContent = totalUrls;
                });
            } else {
                // Fallback se storage não estiver disponível
                currentSource.textContent = 'Configuração Padrão (Storage indisponível)';
                environmentCount.textContent = config.environments ? config.environments.length : 0;

                let totalUrls = 0;
                if (config.environments) {
                    config.environments.forEach(env => {
                        if (env.urls) {
                            totalUrls += env.urls.length;
                        }
                    });
                }
                urlCount.textContent = totalUrls;
            }
        } catch (error) {
            console.error('Erro ao carregar configuração atual:', error);
            currentSource.textContent = 'Erro ao carregar';
            environmentCount.textContent = '-';
            urlCount.textContent = '-';
        }
    }
});