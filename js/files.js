const allowedExtensions = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'ico'],
    'video': ['mp4', 'avi', 'mov', 'mkv'],
    'excel': ['xls', 'xlsx', 'xlsm', 'csv'],
    'ppt': ['ppt', 'pptx'],
    'audio': ['mp3', 'wav', 'ogg'],
    'code': ['c', 'cpp', 'py', 'java', 'php', 'js', 'html', 'css'],
    'documents': ['doc', 'docx', 'txt', 'pdf', 'md', 'log'],
};

const allKnownExtensions = Object.values(allowedExtensions).flat();
let fileIdToDelete = null;

function getFileIcon(extension) {
    const ext = extension.toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'ico':
            return 'fas fa-image';
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'mkv':
            return 'fas fa-video';
        case 'xls':
        case 'xlsx':
        case 'xlsm':
        case 'csv':
            return 'fas fa-file-excel';
        case 'ppt':
        case 'pptx':
            return 'fas fa-file-powerpoint';
        case 'mp3':
        case 'wav':
        case 'ogg':
            return 'fas fa-file-audio';
        case 'c':
        case 'cpp':
        case 'py':
        case 'java':
        case 'php':
        case 'js':
        case 'html':
        case 'css':
            return 'fas fa-file-code';
        case 'doc':
        case 'docx':
            return 'fas fa-file-word';
        case 'pdf':
            return 'fas fa-file-pdf';
        case 'txt':
        case 'md':
        case 'log':
            return 'fas fa-file-alt';
        case 'zip':
        case 'rar':
            return 'fas fa-file-archive';
        default:
            return 'fas fa-file';
    }
}

function getFileThumbnail(extension, filePath) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const correctedFilePath = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`;

    if (imageExtensions.includes(extension.toLowerCase())) {
        return `<img src="${correctedFilePath}" alt="Thumbnail" onerror="this.onerror=null;this.src='https://placehold.co/160x90/E0E0E0/333333?text=No+Preview';">`;
    }

    return `<div class="icon-placeholder"><i class="${getFileIcon(extension)}"></i></div>`;
}


$(document).ready(function () {
    fetch('./navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbarContainer').innerHTML = data;
            AOS.init();
        })
        .catch(error => console.error('Error loading navbar:', error));

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const subfolder = urlParams.get('subfolder');

    let pageTitle = '';
    let loadFilesCategory = null;
    let loadFilesSubfolder = null;
    let groupDates = true;

    if (category) {
        loadFilesCategory = category;
        groupDates = false;

        if (subfolder) {
            pageTitle = `${subfolder.charAt(0).toUpperCase() + subfolder.slice(1)} Files`;
            loadFilesSubfolder = subfolder;
        } else {
            pageTitle = `${category.charAt(0).toUpperCase() + category.slice(1)} Files`;
        }
    } else {
        pageTitle = 'All Uploaded Files';
    }

    $('#folderTitle').text(pageTitle);
    loadFiles(loadFilesCategory, loadFilesSubfolder, groupDates);

    $('#searchFiles').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();
        let anyFileFound = false;

        $('.date-group-heading').hide();

        $('.file-card').each(function () {
            const fileName = $(this).data('file-name');
            if (fileName && fileName.includes(searchTerm)) {
                $(this).show();
                if (groupDates) {
                    $(this).prevAll('.date-group-heading').first().show();
                }
                anyFileFound = true;
            } else {
                $(this).hide();
            }
        });

        if (!anyFileFound && $('#fileGrid').children(':visible').length === 0) {
            $('#fileGrid').html('<p class="text-center text-white text-3xl font-bold p-4">No files match your search.</p>');
        } else if (anyFileFound && $('#fileGrid').find('p.text-center').length > 0) {
            loadFiles(loadFilesCategory, loadFilesSubfolder, groupDates);
        }
    });

    $('#confirmDelete').on('click', function () {
        performDeleteFile();
    });
});

async function loadFiles(category = null, subfolder = null, groupDates = false) {
    try {
        let fetchUrl = './php/list_files.php';
        const queryParams = [];

        if (category) {
            queryParams.push(`category=${encodeURIComponent(category)}`);
        }
        if (subfolder) {
            queryParams.push(`subfolder=${encodeURIComponent(subfolder)}`);
        }

        if (queryParams.length > 0) {
            fetchUrl += '?' + queryParams.join('&');
        }

        const response = await fetch(fetchUrl);
        const allFiles = await response.json();

        if (!Array.isArray(allFiles)) {
            console.error("Invalid data received from list_files.php");
            $('#fileGrid').addClass('flex items-center justify-center min-h-[300px] w-full');
            $('#fileGrid').html('<p class="text-center text-white text-xl p-4">Error: Could not retrieve file data.</p>');
            return;
        }

        let filesToDisplay = allFiles;

        filesToDisplay.sort((a, b) => {
            const dateA = new Date(a.upload_date);
            const dateB = new Date(b.upload_date);
            return dateB - dateA;
        });

        $('#fileGrid').empty();
        $('#fileGrid').removeClass('flex items-center justify-center min-h-[300px] w-full');

        $('#noFilesMessage').addClass('hidden');

        if (filesToDisplay.length === 0) {
            $('#noFilesMessage').removeClass('hidden');
            return;
        }

        if (groupDates) {
            const filesGroupedByDate = filesToDisplay.reduce((groups, file) => {
                const uploadDate = file.upload_date ? new Date(file.upload_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';
                if (!groups[uploadDate]) {
                    groups[uploadDate] = [];
                }
                groups[uploadDate].push(file);
                return groups;
            }, {});

            for (const dateHeading in filesGroupedByDate) {
                const filesInDateGroup = filesGroupedByDate[dateHeading];

                $('#fileGrid').append(`
                    <div class="col-span-full text-left text-2xl font-bold text-blue-500 mb-4 date-group-heading">
                        ${dateHeading}
                    </div>
                `);

                filesInDateGroup.forEach(function (file) {
                    const fileName = file.filename;
                    const filePath = file.filepath;
                    const fileExtension = fileName.split('.').pop();
                    const uploadDateFormatted = file.upload_date ? new Date(file.upload_date).toLocaleDateString() : 'N/A';

                    const fileCard = `
                        <div class="file-card glass" data-file-name="${fileName.toLowerCase()}" data-file-id="${file.id}">
                            <div class="file-thumbnail">
                                ${getFileThumbnail(fileExtension, filePath)}
                            </div>
                            <div class="file-details">
                                <h3 class="text-base font-semibold text-blue-700 truncate mb-1" title="${fileName}">${fileName}</h3>
                                <div class="flex items-center text-xs text-blue-500 mb-2">
                                    <span class="mr-2"><i class="fas fa-file-alt mr-1"></i> ${fileExtension.toUpperCase()} File</span>
                                </div>
                                <div class="text-xs text-blue-400 mb-3">
                                    <i class="fas fa-calendar-alt mr-1"></i> Uploaded: ${uploadDateFormatted}
                                </div>
                                <div class="flex justify-between items-center text-sm">
                                    <button class="text-green-500 hover:text-green-700" onclick="downloadFile(${file.id})">
                                        <i class="fas fa-download mr-1"></i> Download
                                    </button>
                                    <button class="text-red-500 hover:text-red-700" onclick="deleteFile(${file.id})">
                                        <i class="fas fa-trash-alt mr-1"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    $('#fileGrid').append(fileCard);
                });
            }
        } else {
            filesToDisplay.forEach(function (file) {
                const fileName = file.filename;
                const filePath = file.filepath;
                const fileExtension = fileName.split('.').pop();
                const uploadDateFormatted = file.upload_date ? new Date(file.upload_date).toLocaleDateString() : 'N/A';

                const fileCard = `
                    <div class="file-card glass" data-file-name="${fileName.toLowerCase()}" data-file-id="${file.id}">
                        <div class="file-thumbnail">
                            ${getFileThumbnail(fileExtension, filePath)}
                        </div>
                        <div class="file-details">
                            <h3 class="text-base font-semibold text-blue-700 truncate mb-1" title="${fileName}">${fileName}</h3>
                            <div class="flex items-center text-xs text-blue-500 mb-2">
                                <span class="mr-2"><i class="fas fa-file-alt mr-1"></i> ${fileExtension.toUpperCase()} File</span>
                            </div>
                            <div class="text-xs text-blue-400 mb-3">
                                <i class="fas fa-calendar-alt mr-1"></i> Uploaded: ${uploadDateFormatted}
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <button class="text-green-500 hover:text-green-700" onclick="downloadFile(${file.id})">
                                    <i class="fas fa-download mr-1"></i> Download
                                </button>
                                <button class="text-red-500 hover:text-red-700" onclick="deleteFile(${file.id})">
                                    <i class="fas fa-trash-alt mr-1"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                $('#fileGrid').append(fileCard);
            });
        }

    } catch (error) {
        console.error("Error loading files: ", error);
        $('#fileGrid').addClass('flex items-center justify-center min-h-[300px] w-full');
        $('#fileGrid').html('<p class="text-center text-white text-xl p-4">Failed to load files. Please try again later.</p>');
    }
}

function openDeleteModal() {
    $('#deleteModal').addClass('active');
    $('#deleteMessage').text('');
}

function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal.classList.contains('active')) {
        deleteModal.classList.remove('active');
    }
    fileIdToDelete = null;
    $('#deleteMessage').text('');
}

function deleteFile(fileId) {
    fileIdToDelete = fileId;

    const deleteButton = $('#confirmDelete');
    deleteButton.prop('disabled', false);
    deleteButton.css('background-color', '');
    deleteButton.css('cursor', '');

    $.ajax({
        url: `./php/get_files.php?id=${fileId}`,
        method: 'GET',
        success: function (response) {
            if (response.success) {
                $('#deleteFileNameText').html(`Are you sure you want to delete <strong>"${response.filename}"</strong>?`);
                openDeleteModal();
            } else {
                alert('Error: Could not retrieve file information for deletion.');
                console.error('Error fetching file for delete:', response.error);
            }
        },
        error: function (xhr, status, error) {
            alert('Error: Could not connect to server to get file information.');
            console.error('AJAX error fetching file for delete:', status, error);
        }
    });
}

async function performDeleteFile() {
    if (!fileIdToDelete) {
        console.error('No file ID to delete.');
        return;
    }

    try {
        const response = await fetch(`./php/delete_file.php?id=${fileIdToDelete}`, {
            method: 'DELETE'
        });

        const responseText = await response.text();
        console.log('Raw response from delete_file.php:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            console.error('Response text that caused error:', responseText);
            $('#deleteMessage').text('Server returned invalid response. Check console for details.');
            $('#deleteMessage').css('color', 'red');
            return;
        }

        const messageBox = $('#deleteMessage');
        const deleteButton = $('#confirmDelete');

        if (result.status === 'success') {
            deleteButton.prop('disabled', true);
            deleteButton.css('background-color', '#ccc');
            deleteButton.css('cursor', 'not-allowed');

            messageBox.text('File deleted successfully.');
            messageBox.css('color', 'limegreen');

            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category');
            const subfolder = urlParams.get('subfolder');
            const currentGroupDates = !category;
            loadFiles(category, subfolder, currentGroupDates);
            setTimeout(closeDeleteModal, 1000);
        } else {
            messageBox.text(`Error deleting the file: ${result.message || 'Unknown error occurred.'}`);
            messageBox.css('color', 'red');
        }
    } catch (err) {
        console.error('Error deleting file (network or unexpected):', err);
        $('#deleteMessage').text('An error occurred while deleting the file. Please check your network connection or server logs.');
        $('#deleteMessage').css('color', 'red');
    }
}

function downloadFile(fileId) {
    window.location.href = `./php/download_file.php?id=${fileId}`;
}
