const allowedExtensions = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'ico', 'webp', 'bmp', 'tiff'],
    'video': ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
    'excel': ['xls', 'xlsx', 'xlsm', 'csv'],
    'ppt': ['ppt', 'pptx'],
    'audio': ['mp3', 'wav', 'ogg', 'flac', 'aac'],
    'code': ['c', 'cpp', 'py', 'java', 'php', 'js', 'html', 'css', 'json', 'xml', 'sql'],
    'documents': ['doc', 'docx', 'txt', 'pdf', 'md', 'log', 'rtf', 'odt'],
    'archive': ['zip', 'rar', '7z', 'tar', 'gz'],
    'other': []
};

let currentTargetCategory = '';
let currentSubfolder = '';

function getFolderThumbnail(categoryName) {
    const lowerCategory = categoryName.toLowerCase();
    switch (lowerCategory) {
        case 'image':
            return 'resource/image.jpg';
        case 'video':
            return 'resource/video.jpg';
        case 'excel':
            return 'resource/excel.jpg';
        case 'ppt':
            return 'resource/ppt.jpg';
        case 'audio':
            return 'resource/audio.jpg';
        case 'code':
            return 'resource/code.jpg';
        case 'documents':
            return 'resource/document.jpg';
        case 'archive':
            return 'resource/archive.jpg';
        case 'other':
            return 'resource/other.jpg';
        default:
            return 'resource/default-folder.jpg';
    }
}

function getFolderIconHtml(folderName) {
    const lowerCaseFolderName = folderName.toLowerCase();
    let iconClass = 'fas fa-file';

    switch (lowerCaseFolderName) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'ico':
        case 'webp':
        case 'bmp':
        case 'tiff':
            iconClass = 'fas fa-image';
            break;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'mkv':
        case 'webm':
        case 'flv':
            iconClass = 'fas fa-video';
            break;
        case 'xls':
        case 'xlsx':
        case 'xlsm':
        case 'csv':
            iconClass = 'fas fa-file-excel';
            break;
        case 'ppt':
        case 'pptx':
            iconClass = 'fas fa-file-powerpoint';
            break;
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
        case 'aac':
            iconClass = 'fas fa-file-audio';
            break;
        case 'c':
        case 'cpp':
        case 'py':
        case 'java':
        case 'php':
        case 'js':
        case 'html':
        case 'css':
        case 'json':
        case 'xml':
        case 'sql':
            iconClass = 'fas fa-file-code';
            break;
        case 'doc':
        case 'docx':
        case 'txt':
        case 'pdf':
        case 'md':
        case 'log':
        case 'rtf':
        case 'odt':
            iconClass = 'fas fa-file-alt';
            break;
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
            iconClass = 'fas fa-file-archive';
            break;
        default:
            iconClass = 'fas fa-folder-open'; 
    }
    return `<i class="${iconClass}"></i>`;
}

function showModal(title, message, showSpinner = false, showOkButton = false) {
    $('#modalTitle').text(title);
    $('#uploadMessage').html(message);
    if (showSpinner) {
        $('#uploadSpinner').show();
    } else {
        $('#uploadSpinner').hide();
    }
    if (showOkButton) {
        $('#modalOkButton').show();
    } else {
        $('#modalOkButton').hide();
    }
    $('#uploadStatusModal').css('display', 'flex');
}

function hideModal() {
    $('#uploadStatusModal').hide();
}

$(document).ready(function () {
    fetch('./navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbarContainer').innerHTML = data;
        })
        .catch(error => console.error('Error loading navbar:', error));

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category'); 

    const pageTitleElement = $('#pageTitle'); 
    const htmlTitleElement = $('title'); 

    let displayTitle = 'My Folders 📂'; 

    if (categoryParam) {
        displayTitle = `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} Folders 📁`;
    }

    pageTitleElement.text(displayTitle);
    htmlTitleElement.text(displayTitle.replace(' 📁', ''));

    function loadFolders(parentCategory = null) {
        let url = '';
        let data = {};
        let isSubfolderView = false; 

        if (parentCategory) {
            url = './php/list_folders.php'; 
            data = { category: parentCategory };
            isSubfolderView = true;
        } else {
            url = './php/list_main_categories.php'; 
        }

        $.ajax({
            url: url,
            method: 'GET',
            data: data,
            dataType: 'json', 
            success: function (folderData) {
                if (!Array.isArray(folderData) || folderData.length === 0) {
                    $('#noFoldersMessage').removeClass('hidden');
                    return;
                }

                $('#noFoldersMessage').addClass('hidden');
                $('#folderGrid').removeClass('flex items-center justify-center min-h-[400px] w-full');
                $('#folderGrid').empty();

                folderData.forEach(function (folder) {
                    const folderName = folder.name;
                    const lowerCaseFolderName = folderName.toLowerCase();

                    let thumbnailContent = '';
                    let openLink = '';

                    if (isSubfolderView) {
                        thumbnailContent = `<div class="icon-placeholder">${getFolderIconHtml(folderName)}</div>`;
                        openLink = `files.html?category=${parentCategory}&subfolder=${lowerCaseFolderName}`;
                    } else {
                        thumbnailContent = `<img src="${getFolderThumbnail(folderName)}" alt="${folderName} Folder Thumbnail" class="w-full h-full object-cover rounded-2xl">`;
                        openLink = `folders.html?category=${lowerCaseFolderName}`;
                    }

                    var folderCard = `
                <div class="folder-card glass p-5 relative overflow-hidden" data-folder-name="${lowerCaseFolderName}">
                    <div class="shine-effect"></div>
                    <div class="folder-thumbnail mb-4 relative">
                        ${thumbnailContent} </div>
                    <div class="folder-details">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-xl font-bold text-blue-600">${folderName}</h3>
                        </div>
                        <div class="flex items-center text-xs text-blue-400 mb-3">
                            <span class="mr-3"><i class="fas fa-calendar-alt mr-1"></i> Last Updated on ${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center">
                        <a href="${openLink}" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-folder-open mr-1"></i> Open Folder
                        </a>
                        <button type="button" class="text-blue-500 hover:text-blue-700 js-upload-button"
                                data-main-category="${parentCategory || lowerCaseFolderName}"
                                data-subfolder-name="${isSubfolderView ? lowerCaseFolderName : ''}">
                            <i class="fas fa-upload mr-1"></i> Upload
                        </button>
                    </div>
                </div>
                `;
                    $('#folderGrid').append(folderCard);
                    AOS.refresh();
                });
            },
            error: function (xhr, status, error) {
                console.error("Error loading folders: " + error);
                $('#folderGrid').addClass('flex items-center justify-center min-h-[400px] w-full');
                $('#folderGrid').html('<p class="text-center text-white text-xl p-4">Failed to load folders. Please try again later.</p>');
            }
        });
    }

    if (categoryParam) {
        loadFolders(categoryParam);
    } else {
        loadFolders();
    }

    $('#search').on('keyup', function () {
        const searchTerm = $(this).val().toLowerCase();
        $('.folder-card').each(function () {
            const folderName = $(this).data('folder-name');
            if (folderName.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    $(document).on('click', '.js-upload-button', function () {
        const mainCategory = $(this).data('main-category');
        const subfolderName = $(this).data('subfolder-name');

        currentTargetCategory = mainCategory;
        currentSubfolder = subfolderName;

        let targetExtensions = [];
        if (currentSubfolder) {
            targetExtensions = [currentSubfolder];
        } else if (currentTargetCategory && allowedExtensions[currentTargetCategory]) {
            targetExtensions = allowedExtensions[currentTargetCategory];
        }

        const acceptString = targetExtensions.map(ext => `.${ext}`).join(',');
        $('#hiddenFileUploadInput').attr('accept', acceptString || '*/*');

        $('#hiddenFileUploadInput').click();
    });


    $('#hiddenFileUploadInput').on('change', function () {
        const files = this.files;
        if (files.length === 0) {
            return;
        }

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('file[]', file));

        formData.append('category', currentTargetCategory);
        if (currentSubfolder) {
            formData.append('subfolder', currentSubfolder);
        }

        let modalTitle = `Uploading files to ${currentSubfolder || currentTargetCategory} folder...`;
        showModal('Uploading...', modalTitle, true);

        $.ajax({
            url: './php/upload.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                let displayMessage = '';

                if (Array.isArray(result)) {
                    result.forEach(fileResult => {
                        if (fileResult.status === 'success') {
                            displayMessage += `<p><strong class="text-green-600">Success</strong>: ${fileResult.filename} → ${fileResult.folder}</p>`;
                        } else {
                            displayMessage += `<p><strong class="text-red-600">Error</strong>: ${fileResult.filename} → ${fileResult.message || 'Failed'}</p>`;
                        }
                    });
                } else {
                    displayMessage = `<p><strong class="text-red-600">Error</strong>: ${result.message || 'An unexpected error occurred.'}</p>`;
                }

                showModal('Upload Status', displayMessage, false, true);

                if (categoryParam) {
                    loadFolders(categoryParam);
                } else {
                    loadFolders();
                }
            },
            error: function (xhr, status, error) {
                console.error("Upload AJAX error:", status, error, xhr.responseText);
                let errorMessage = `An error occurred: ${error}`;
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.message) {
                        errorMessage = errorResponse.message;
                    }
                } catch (e) {
                    errorMessage = xhr.responseText || errorMessage;
                }
                showModal('Upload Error', errorMessage, false, true);
            },
            complete: function () {
                $('#hiddenFileUploadInput').val('');
            }
        });
    });

    $('.close-button, #modalOkButton').on('click', function () {
        hideModal();
    });

    $(window).on('click', function (event) {
        if ($(event.target).is('#uploadStatusModal')) {
            hideModal();
        }
    });

    AOS.init({
        duration: 800,
        once: true,
    });
});