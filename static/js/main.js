// ========================
// Theme Toggle
// ========================
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
} else {
    body.classList.add('light-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light-mode');
    }
});

// ========================
// Drag and Drop Handling
// ========================
document.querySelectorAll('.upload-area').forEach(area => {
    const fileInput = area.querySelector('input[type="file"]');
    const selectedFilesElem = area.querySelector('.selected-files');

    // Show file names in the .selected-files paragraph
    function updateSelectedFilesList(files) {
        if (!files || files.length === 0) {
            selectedFilesElem.textContent = '';
            return;
        }
        const fileNames = Array.from(files).map(f => f.name);
        selectedFilesElem.textContent = fileNames.join(', ');
    }

    // On drag over, highlight
    area.addEventListener('dragover', e => {
        e.preventDefault();
        area.classList.add('dragging');
    });

    // On drag leave, remove highlight
    area.addEventListener('dragleave', () => {
        area.classList.remove('dragging');
    });

    // On drop, pass files to hidden input
    area.addEventListener('drop', e => {
        e.preventDefault();
        fileInput.files = e.dataTransfer.files;
        area.classList.remove('dragging');
        updateSelectedFilesList(fileInput.files);
    });

    // On regular file selection
    fileInput.addEventListener('change', () => {
        updateSelectedFilesList(fileInput.files);
    });
});

// ========================
// Unified Form Submission
// ========================
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // 1) Check if there's at least one file selected in any file input
        let hasFile = false;
        form.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.files && input.files.length > 0) {
                hasFile = true;
            }
        });

        if (!hasFile) {
            alert("No file selected. Please choose a file before submitting.");
            return;
        }

        // 2) Proceed with the request
        const formData = new FormData(this);
        const actionUrl = this.action;

        try {
            const response = await fetch(actionUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                // If backend returns an error JSON, try parse it
                let errorData = null;
                try {
                    errorData = await response.json();
                } catch(e) {
                    // Not JSON
                }
                const message = errorData?.message || `Error: ${response.status}`;
                alert(message);
                return;
            }

            // Convert response to Blob
            const blob = await response.blob();

            // Attempt to extract filename from content-disposition
            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = "downloaded-file";
            if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                filename = contentDisposition
                    .split('filename=')[1]
                    .replace(/["']/g, "")
                    .trim();
            }

            // Trigger file download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error('Error:', err);
            alert("Something went wrong. Check console for details.");
        }
    });
});
