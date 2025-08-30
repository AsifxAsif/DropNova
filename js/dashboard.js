document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileList = document.getElementById('fileList');
    const myFilesView = document.getElementById('my-files-view');
    const sharedFilesView = document.getElementById('shared-files-view');
    const showMyFilesBtn = document.getElementById('showMyFilesBtn');
    const showSharedFilesBtn = document.getElementById('showSharedFilesBtn');
    const uploadModal = document.getElementById('uploadModal');
    const renameModal = document.getElementById('renameModal');
    const deleteModal = document.getElementById('deleteModal');
    const viewFileModal = document.getElementById('viewFileModal');
    const shareModal = document.getElementById('share-modal');
    const commentsModal = document.getElementById('comments-modal');
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.getElementById('file-name');
    const search = document.getElementById('search');
    const createFolderModal = document.getElementById('createFolderModal');

    let fileIdToDelete = null;

    // Custom Alert Modal
    function showCustomAlert(message, isSuccess = true) {
        let alertModal = document.getElementById('customAlertModal');
        if (!alertModal) {
            alertModal = document.createElement('div');
            alertModal.id = 'customAlertModal';
            alertModal.classList.add('modal');
            alertModal.innerHTML = `
                <div class="modal-content">
                    <i class="bx bxs-x-circle close-modal"></i>
                    <p id="customAlertMessage"></p>
                    <button class="upload-ok-button" onclick="closeCustomAlert()">OK</button>
                </div>
            `;
            document.body.appendChild(alertModal);
            alertModal.querySelector('.close-modal').addEventListener('click', closeCustomAlert);
            alertModal.querySelector('.upload-ok-button').addEventListener('click', closeCustomAlert);
        }
        document.getElementById('customAlertMessage').textContent = message;
        alertModal.classList.add('active');
        document.getElementById('customAlertMessage').style.color = isSuccess ? 'green' : 'red';
    }

    window.closeCustomAlert = function () {
        document.getElementById('customAlertModal').classList.remove('active');
    };

    // Initial view setup and file loading
    myFilesView.style.display = 'block';
    sharedFilesView.style.display = 'none';
    loadFiles();

    // Event listeners for switching views
    showMyFilesBtn.addEventListener('click', () => {
        myFilesView.style.display = 'block';
        sharedFilesView.style.display = 'none';
        loadFiles();
    });

    showSharedFilesBtn.addEventListener('click', () => {
        myFilesView.style.display = 'none';
        sharedFilesView.style.display = 'block';
        fetchSharedFiles();
    });

    // File input change listener
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length === 0) {
            fileNameDisplay.textContent = '';
            return;
        }
        const names = Array.from(fileInput.files).map(f => `• ${f.name}`).join('\n');
        fileNameDisplay.textContent = names;
    });

    // Check if a file already exists
    function checkFileExists(fileName) {
        const existingFiles = document.querySelectorAll('.file-item span');
        return Array.from(existingFiles).some(existingFile => existingFile.textContent === fileName);
    }

    // Modal control functions
    window.openModal = function () {
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        uploadModal.classList.add('active');
    }

    window.closeModal = function () {
        uploadModal.classList.remove('active');
    }

    window.openViewFileModal = function () {
        viewFileModal.classList.add('active');
    }

    window.closeViewFileModal = function () {
        viewFileModal.classList.remove('active');
        const video = document.querySelector('#viewFileVideo');
        if (video) {
            video.pause();
        }
    }

    window.openRenameModal = function () {
        renameModal.classList.add('active');
    }

    window.closeRenameModal = function () {
        renameModal.classList.remove('active');
    }

    window.openDeleteModal = function () {
        deleteModal.classList.add('active');
    }

    window.closeDeleteModal = function () {
        deleteModal.classList.remove('active');
        fileIdToDelete = null;
        document.getElementById('deleteMessage').textContent = '';
    }

    // Function to fetch shared users and populate the form
    async function fetchAndPopulateShareForm(fileId) {
        const emailInput = document.getElementById('share-email');
        const permissionSelect = document.getElementById('permission-select');

        // Clear previous values
        emailInput.value = '';
        permissionSelect.value = 'view';

        try {
            const response = await fetch(`php/get_shared_users.php?file_id=${fileId}`);
            const data = await response.json();

            // Check if the file is shared with any user
            if (data.success && data.users && data.users.length > 0) {
                const sharedUser = data.users[0];
                emailInput.value = sharedUser.email;
                permissionSelect.value = sharedUser.permission;
            }
        } catch (error) {
            console.error('Error fetching shared user data:', error);
        }
    }

    window.openShareModal = function (fileId, filename) {
        document.getElementById('share-file-id').value = fileId;
        document.getElementById('file-to-share-name').textContent = filename;
        shareModal.classList.add('active');
        // Fetch and populate the form with existing shared data
        fetchAndPopulateShareForm(fileId);
    }

    window.closeShareModal = function () {
        shareModal.classList.remove('active');
    }

    window.openCommentsModal = function (fileId, filename) {
        document.getElementById('comment-file-id').value = fileId;
        document.getElementById('file-comments-title').textContent = filename;
        commentsModal.classList.add('active');
        fetchComments(fileId);
    }

    window.closeCommentsModal = function () {
        commentsModal.classList.remove('active');
    }

    window.openFolderModal = function () {
        createFolderModal.classList.add('active');
    }

    window.closeFolderModal = function () {
        createFolderModal.classList.remove('active');
    }

    // Main file operations
    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (fileInput.files.length === 0) {
            showCustomAlert("Please select at least one file", false);
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            if (checkFileExists(file.name)) {
                showCustomAlert(`A file named "${file.name}" already exists. Please rename or delete it.`, false);
                return;
            }
            formData.append('file[]', file);
        }

        try {
            const response = await fetch('php/upload.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                showCustomAlert('File(s) uploaded successfully!');
            }
            loadFiles();
        } catch (err) {
            console.error('Upload failed:', err);
            showCustomAlert('Upload failed. Please try again.', false);
        }

        fileInput.value = '';
        fileNameDisplay.textContent = '';
        closeModal();
    });

    // Helper function to get file icon based on extension
    function getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
                return 'bx bxs-file-image';
            case 'mp4':
            case 'avi':
            case 'mov':
                return 'bx bxs-file-video';
            case 'mp3':
            case 'wav':
            case 'ogg':
                return 'bx bxs-file-music';
            case 'pdf':
                return 'bx bxs-file-pdf';
            case 'doc':
            case 'docx':
                return 'bx bxs-file-doc';
            case 'xls':
            case 'xlsx':
                return 'bx bxs-file-xls';
            case 'ppt':
            case 'pptx':
                return 'bx bxs-file-ppt';
            case 'zip':
            case 'rar':
                return 'bx bxs-file-archive';
            case 'txt':
            case 'md':
            case 'log':
                return 'bx bxs-file-txt';
            case 'php':
            case 'js':
            case 'html':
            case 'css':
                return 'bx bxs-file-code';
            default:
                return 'bx bxs-file';
        }
    }

    // Helper function to render a single file item
    function renderFileItem(file) {
        const item = document.createElement('div');
        item.className = 'file-item';

        const fileIcon = getFileIcon(file.filename);
        item.innerHTML = `
            <span>${file.filename}</span>
            <div class="file-actions">
                <button class="view-btn" onclick="viewFile(${file.id})"><i class="fas fa-eye"></i></button>
                <button class="rename-btn" onclick="renameFile(${file.id})"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteFile(${file.id})"><i class="fas fa-trash-alt"></i></button>
                <button class="download-btn" onclick="downloadFile(${file.id})"><i class="fas fa-download"></i></button>
                <button class="share-btn" onclick="openShareModal(${file.id}, '${file.filename}')"><i class="fas fa-share-nodes"></i></button>
                <button class="comments-btn" onclick="openCommentsModal(${file.id}, '${file.filename}')"><i class="fas fa-comment"></i></button>
            </div>
        `;
        return item;
    }

    // File listing and rendering
    async function loadFiles() {
        try {
            const res = await fetch('php/list_files.php');
            const files = await res.json();

            fileList.innerHTML = '';

            if (!files || files.length === 0) {
                fileList.innerHTML = '<p style="text-align: center; color: #888;">No files uploaded</p>';
                return;
            }

            const groupedFiles = groupFilesByDate(files);

            Object.keys(groupedFiles).forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'file-category';
                categoryDiv.innerHTML = `<h3>${category}</h3>`;

                groupedFiles[category].forEach(file => {
                    const item = renderFileItem(file);
                    categoryDiv.appendChild(item);
                });

                fileList.appendChild(categoryDiv);
            });
        } catch (error) {
            console.error('Error fetching or parsing files:', error);
            fileList.innerHTML = '<p style="text-align: center; color: red;">Error loading files. Please try again later.</p>';
        }
    }

    function groupFilesByDate(files) {
        const groupedFiles = {};
        files.forEach(file => {
            const fileDate = new Date(file.upload_date);
            const formattedDate = fileDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            if (!groupedFiles[formattedDate]) {
                groupedFiles[formattedDate] = [];
            }
            groupedFiles[formattedDate].push(file);
        });
        const sortedGrouped = {};
        Object.keys(groupedFiles)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(date => sortedGrouped[date] = groupedFiles[date]);
        return sortedGrouped;
    }

    search.addEventListener('input', () => {
        const term = search.value.toLowerCase();
        const fileItems = document.querySelectorAll('.file-item');
        const categories = document.querySelectorAll('.file-category');

        fileItems.forEach(item => {
            const fileName = item.querySelector('span').textContent.toLowerCase();
            if (fileName.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        categories.forEach(category => {
            const visibleFiles = category.querySelectorAll('.file-item:not([style*="display: none"])');
            category.style.display = visibleFiles.length > 0 ? '' : 'none';
        });
    });

    window.viewFile = function (fileId) {
        fetch(`php/get_files.php?id=${fileId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const fileExtension = data.filename.split('.').pop().toLowerCase();
                    const viewFileContent = document.getElementById('viewFileContent');
                    let content = '';

                    // Pause any existing media
                    document.querySelectorAll('video, audio').forEach(media => media.pause());

                    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                        content = `<img src="${data.filepath}" alt="File Image" style="max-width: 100%; max-height: 500px;">`;
                    } else if (['mp4', 'avi', 'mov'].includes(fileExtension)) {
                        content = `<video id="viewFileVideo" controls style="max-width: 100%; max-height: 500px;"><source src="${data.filepath}" type="video/${fileExtension}"></video>`;
                    } else if (['pdf'].includes(fileExtension)) {
                        content = `<iframe src="${data.filepath}" width="100%" height="500px"></iframe>`;
                    } else if (['pptx', 'xlsx'].includes(fileExtension)) {
                        const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(data.filepath)}`;
                        content = `<iframe src="${viewerUrl}" width="100%" height="500px"></iframe>`;
                    } else if (['txt', 'md', 'log', 'php', 'html', 'css', 'js'].includes(fileExtension)) {
                        fetch(data.filepath).then(res => res.text()).then(textContent => {
                            viewFileContent.innerHTML = `<pre>${textContent}</pre>`;
                        }).catch(() => viewFileContent.innerHTML = `<p>Unable to preview this file type.</p>`);
                        openViewFileModal();
                        return;
                    } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
                        content = `<audio controls style="max-width: 100%;"><source src="${data.filepath}" type="audio/${fileExtension}"></audio>`;
                    } else {
                        content = `<p>Unable to preview this file type.</p>`;
                    }
                    viewFileContent.innerHTML = content;
                    openViewFileModal();
                } else {
                    console.error('Error opening the file');
                    showCustomAlert('Error opening the file. Please try again.', false);
                }
            })
            .catch(err => {
                console.error('Error viewing file:', err);
                showCustomAlert('Error viewing file. Please try again.', false);
            });
    }

    window.renameFile = function (fileId) {
        fetch(`php/get_files.php?id=${fileId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const newNameInput = document.getElementById('newFileName');
                    newNameInput.value = data.filename;
                    openRenameModal();

                    document.getElementById('renameForm').onsubmit = function (e) {
                        e.preventDefault();
                        const newFileName = newNameInput.value;
                        if (newFileName) {
                            fetch(`php/rename_file.php?id=${fileId}&newName=${newFileName}`)
                                .then(response => response.json())
                                .then(result => {
                                    if (result.success) {
                                        showCustomAlert('File renamed successfully');
                                        loadFiles();
                                        closeRenameModal();
                                    } else {
                                        showCustomAlert('Error renaming the file: ' + result.message, false);
                                    }
                                });
                        }
                    };
                } else {
                    showCustomAlert('Error fetching the current file name', false);
                }
            });
    }

    window.deleteFile = function (fileId) {
        fileIdToDelete = fileId;
        document.getElementById('deleteMessage').textContent = '';
        fetch(`php/get_files.php?id=${fileId}`)
            .then(res => res.json())
            .then(data => {
                const filename = data.success ? data.filename : 'the selected file';
                document.getElementById('deleteFileNameText').innerHTML = `Are you sure you want to delete <br><strong>"${filename}"</strong>?`;
                openDeleteModal();
            });
    }

    document.getElementById('confirmDelete').addEventListener('click', () => {
        if (!fileIdToDelete) return;
        fetch(`php/delete_file.php?id=${fileIdToDelete}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                const messageBox = document.getElementById('deleteMessage');
                if (data.success) {
                    messageBox.textContent = 'File deleted successfully';
                    messageBox.style.color = 'limegreen';
                } else {
                    messageBox.textContent = data.message || 'Error deleting the file';
                    messageBox.style.color = 'red';
                }
                setTimeout(() => {
                    closeDeleteModal();
                    loadFiles();
                }, 1000);
            });
    });

    window.downloadFile = function (fileId) {
        window.location.href = `php/download_file.php?id=${fileId}`;
    }

    // Fetch and display shared files with conditional buttons
    function fetchSharedFiles() {
        fetch('php/get_shared_files.php')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('shared-files-table').querySelector('tbody');
                tableBody.innerHTML = '';
                if (data.success && data.files.length > 0) {
                    data.files.forEach(file => {
                        let actionsHtml = '';

                        // Always available for shared files
                        actionsHtml += `<button class="download-btn" onclick="downloadFile(${file.file_id})"><i class="fas fa-download"></i></button>`;
                        actionsHtml += `<button class="comments-btn" onclick="openCommentsModal(${file.file_id}, '${file.filename}')"><i class="fas fa-comment"></i></button>`;

                        // Conditional buttons based on permission
                        if (file.permission === 'view' || file.permission === 'edit' || file.permission === 'delete') {
                            actionsHtml += `<button class="view-btn" onclick="viewFile(${file.file_id})"><i class="fas fa-eye"></i></button>`;
                        }

                        if (file.permission === 'edit' || file.permission === 'delete') {
                            actionsHtml += `<button class="rename-btn" onclick="renameFile(${file.file_id})"><i class="fas fa-edit"></i></button>`;
                        }

                        if (file.permission === 'delete') {
                            actionsHtml += `<button class="delete-btn" onclick="deleteFile(${file.file_id})"><i class="fas fa-trash-alt"></i></button>`;
                        }

                        // Unshare button allows the user to remove it from their shared list
                        actionsHtml += `<button class="unshare-btn" onclick="removeSharedFile(${file.file_id}, this)"><i class="fas fa-user-minus"></i></button>`;

                        const row = document.createElement('tr');
                        row.innerHTML = `
                        <td>${file.filename}</td>
                        <td>${file.shared_by_username}</td>
                        <td>${file.permission}</td>
                        <td>${new Date(file.shared_at).toLocaleDateString()}</td>
                        <td>${actionsHtml}</td>
                    `;
                        tableBody.appendChild(row);
                    });
                } else {
                    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No files shared with you yet.</td></tr>';
                }
            });
    }

    // New function to remove a shared file from the user's list
    window.removeSharedFile = function (fileId, buttonElement) {
        if (confirm("Are you sure you want to remove this file from your shared list?")) {
            fetch(`php/unshare_file.php?file_id=${fileId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log("File removed successfully!");
                        // Remove the row from the table
                        buttonElement.closest('tr').remove();
                    } else {
                        console.error("Error: " + (data.message || "Could not remove the file."));
                    }
                })
                .catch(error => {
                    console.error('Error removing shared file:', error);
                    console.error("An error occurred. Please try again.");
                });
        }
    };

    // Handle file sharing form submission
    document.getElementById('share-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const fileId = document.getElementById('share-file-id').value;
        const email = document.getElementById('share-email').value;
        const permission = document.getElementById('permission-select').value;

        const formData = new FormData();
        formData.append('file_id', fileId);
        formData.append('shared_with_email', email);
        formData.append('permission', permission);

        fetch('php/share_file.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showCustomAlert(data.message);
                    closeShareModal();
                } else {
                    showCustomAlert('Error: ' + data.error, false);
                }
            });
    });

    // Fetch and display comments for a file
    function fetchComments(fileId) {
        fetch(`php/get_comments.php?file_id=${fileId}`)
            .then(response => response.json())
            .then(data => {
                const commentsList = document.getElementById('comments-list');
                commentsList.innerHTML = '';
                if (data.success && data.comments.length > 0) {
                    // Create table structure
                    const table = document.createElement('table');
                    table.classList.add('comments-table');

                    const tableHeader = document.createElement('thead');
                    tableHeader.innerHTML = `
                        <tr>
                            <th>User</th>
                            <th>Comment</th>
                            <th>Date/Time</th>
                        </tr>
                    `;
                    table.appendChild(tableHeader);

                    const tableBody = document.createElement('tbody');
                    data.comments.forEach(comment => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${comment.username}</td>
                            <td>${comment.comment}</td>
                            <td>${new Date(comment.created_at).toLocaleString()}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    table.appendChild(tableBody);
                    commentsList.appendChild(table);
                } else {
                    commentsList.innerHTML = '<p style="text-align: center;">No comments yet. Be the first to comment!</p>';
                }
            });
    }

    // Handle comment form submission
    document.getElementById('comment-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const fileId = document.getElementById('comment-file-id').value;
        const commentText = document.getElementById('comment-text').value;

        const formData = new FormData();
        formData.append('file_id', fileId);
        formData.append('comment', commentText);

        fetch('php/add_comment.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchComments(fileId);
                    document.getElementById('comment-text').value = '';
                } else {
                    console.error('Error: ' + data.error);
                }
            });
    });

    // Load the navbar
    fetch('./navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbarContainer').innerHTML = data;
        })
        .catch(error => console.error('Error loading navbar:', error));

    // Handle initial user state
    fetch('php/get_user.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const usernameDisplay = document.querySelector('.dashboard-header h1');
                if (usernameDisplay) {
                    usernameDisplay.textContent = `Welcome, ${data.user.username}!`;
                }
            }
        });
});