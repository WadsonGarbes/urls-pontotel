
document.addEventListener('DOMContentLoaded', function () {
  const hardcodedUrlsWithLabels = [
    { label: 'Gestão PROD', url: 'https://gestao.pontotel.com.br' },
    { label: 'Bateponto PROD', url: 'https://bateponto.pontotel.com.br' },
    { label: 'Intranet PROD', url: 'https://intranet.pontotel.com.br' },
    { label: 'Aloque PROD', url: 'https://aloque.pontotel.com.br/' },
    { label: 'Aloque HML', url: 'https://tinyurl.com/4c3339sy' },
    { label: 'Gestão HML', url: 'https://hml.pontotel.com.br/pontotel/new-front/index.html#/cognito/login' },
    { label: 'Intranet HML', url: 'https://hml.pontotel.com.br/pontotel/back' },
  ];

  const urlsList = document.getElementById('urlsList');

  // Display hardcoded labels with buttons
  hardcodedUrlsWithLabels.forEach(function (entry) {
    const buttonItem = document.createElement('button');
    buttonItem.textContent = entry.label;

    // Store the URL as a data attribute
    buttonItem.dataset.url = entry.url;

    // Add a click event listener to open the link
    buttonItem.addEventListener('click', function () {
      const url = buttonItem.dataset.url;
      if (url) {
        // Open the link in a new tab
        chrome.tabs.create({ url: url });
      }
    });

    urlsList.appendChild(buttonItem);
  });
});
