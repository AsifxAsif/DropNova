async function loadAll() {
    try {
        const res = await fetch('php/admin.php?action=get_all');
        const data = await res.json();

        // If the session is invalid, the PHP script will return an error
        if (data.error) {
            // Redirect to login page on forbidden access
            if (data.error === "Forbidden") {
                window.location.href = 'login.html';
            }
            console.error("Error fetching data:", data.error);
            return;
        }

        // Helper function to render tables
        function renderTable(tableId, headers, data, deleteFn) {
            let html = '<thead><tr>';
            headers.forEach(header => {
                html += `<th>${header}</th>`;
            });
            if (deleteFn) {
                html += '<th>Actions</th>';
            }
            html += '</tr></thead><tbody>';

            if (data.length > 0) {
                data.forEach(item => {
                    html += '<tr>';
                    Object.values(item).forEach(value => {
                        html += `<td>${value}</td>`;
                    });
                    if (deleteFn) {
                        html += `<td><button class="delete-btn" onclick="${deleteFn}(${item.id})">Delete</button></td>`;
                    }
                    html += '</tr>';
                });
            } else {
                html += `<tr><td class="no-data" colspan="${headers.length + (deleteFn ? 1 : 0)}">No data available.</td></tr>`;
            }

            html += '</tbody>';
            document.getElementById(tableId).innerHTML = html;
        }

        // Render tables
        renderTable('usersTable', ['ID', 'User name', 'Email', 'Role', 'Created At'], data.users, 'deleteUser');
        renderTable('filesTable', ['ID', 'File name', 'Directory', 'Category', 'Uploaded At', 'Owner'], data.files, null);
        renderTable('sharedTable', ['ID', 'File name', 'Shared By', 'Shared With', 'Permission', 'Shared At'], data.shared_files, null);
        renderTable('downloadsTable', ['ID', 'File name', 'Owner', 'Downloader', 'Downloaded At'], data.downloads, null);
        renderTable('commentsTable', ['ID', 'File name', 'Commenter', 'Comment', 'Commented At'], data.comments, null);

    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}

async function deleteUser(id) {
    const confirmed = confirm('Are you sure you want to delete this user?');
    if (confirmed) {
        const res = await fetch('php/admin.php?action=delete_user', {
            method: 'POST',
            body: new URLSearchParams({ id })
        });
        const result = await res.json();
        if (result.success) {
            loadAll();
        } else {
            alert(result.error);
        }
    }
}

async function logout() {
    // A simple logout could just be clearing the session, which we'll simulate by redirecting.
    // In a real app, you'd have a logout.php script.
    window.location.href = 'php/logout.php';
}

// Initial load
window.onload = loadAll;