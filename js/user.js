$(document).ready(function () {
    fetch('./navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbarContainer').innerHTML = data;
            AOS.init();
        })
        .catch(error => console.error('Error loading navbar:', error));

    fetchUserData();
    fetchInsights(); // Renamed and updated function to fetch insights
    loadProjectTree(); // Load the file tree on page load

    // Intercept form submission to handle profile update via AJAX
    $("#updateProfileForm").submit(function (e) {
        e.preventDefault(); // Prevent the default form submission

        const username = $("input[name='username']").val();
        const oldPassword = $("input[name='old_password']").val();
        const newPassword = $("input[name='new_password']").val();

        // Make the AJAX request
        $.ajax({
            url: 'php/update_profile.php',
            type: 'POST',
            data: {
                username: username,
                old_password: oldPassword,
                new_password: newPassword
            },
            dataType: 'json', // This line is crucial to prevent page redirection
            success: function (data) {
                if (data.success) {
                    $('#message').html(`<span style="color: green;">${data.message}</span>`).fadeIn();
                    $("input[name='old_password']").val('');
                    $("input[name='new_password']").val('');
                    setTimeout(function () {
                        $('#message').fadeOut();
                    }, 2000);
                } else {
                    $('#message').html(`<span style="color: red;">${data.message}</span>`).fadeIn();
                    setTimeout(function () {
                        $('#message').fadeOut();
                    }, 2000);
                }
            },
            error: function (xhr, status, error) {
                $('#message').html(`<span style="color: red;">Error: ${error}</span>`).fadeIn();
                setTimeout(function () {
                    $('#message').fadeOut();
                }, 2000);
            }
        });
    });
});

function fetchUserData() {
    $.get('php/get_user.php', function (data) {
        if (data.success) {
            $('#username').val(data.user.username);
            $('#email').val(data.user.email);
        } else {
            console.error("Error loading user data.");
        }
    });
}

// Function to fetch and display insights
function fetchInsights() {
    $.ajax({
        url: 'php/fetch_insights.php',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.error) {
                console.error("Error fetching insights:", response.error);
                return;
            }

            // Update the stat cards
            $('#totalFilesCount').text(response.totalFiles);
            $('#totalDownloadsCount').text(response.totalDownloads);
            $('#filesSharedCount').text(response.filesShared);

            // Create File Type Distribution Chart
            const fileTypeLabels = response.fileTypeDistribution.map(item => item.file_extension);
            const fileTypeCounts = response.fileTypeDistribution.map(item => item.count);

            const fileTypeChartCtx = document.getElementById('fileTypeChart').getContext('2d');
            new Chart(fileTypeChartCtx, {
                type: 'pie',
                data: {
                    labels: fileTypeLabels,
                    datasets: [{
                        data: fileTypeCounts,
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#2ecc71',
                            '#f1c40f',
                            '#9b59b6',
                            '#34495e'
                        ],
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });

            // Create Activity Trend Chart
            const activityLabels = response.activityTrend.map(item => item.date);
            const activityData = response.activityTrend.map(item => item.count);

            const activityChartCtx = document.getElementById('activityChart').getContext('2d');
            new Chart(activityChartCtx, {
                type: 'line',
                data: {
                    labels: activityLabels,
                    datasets: [{
                        label: 'Files Uploaded',
                        data: activityData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        x: { // Add this section to configure the x-axis
                            ticks: {
                                maxRotation: 90, // Set the maximum rotation to 90 degrees
                                minRotation: 90 // Set the minimum rotation to 90 degrees
                            }
                        }
                    }
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("AJAX Error:", status, error);
            $('#message').html('<span style="color:red;">Failed to load insights.</span>');
        }
    });
}

// Load the project tree based on uploaded files and folders
function loadProjectTree() {
    $.get('php/get_project_tree.php', function (data) {
        console.log(data);
        if (data.success) {
            const tree = data.tree;
            if (typeof tree === 'object' && tree !== null) {
                let treeHtml = '';
                for (let category in tree) {
                    if (tree.hasOwnProperty(category)) {
                        treeHtml += generateTreeHtml(category, tree[category], true);
                    }
                }
                $('#projectTree').html(treeHtml);
            } else {
                console.error('Tree is not an object:', tree);
            }
        } else {
            console.error("Error loading project tree.");
        }
    });
}

// Generate the HTML for the project structure
function generateTreeHtml(category, subfolders, isRoot = false) {
    let html = '';
    if (isRoot) {
        html += `<li class="py-1"><i class="fas fa-folder"></i> ${category}</li>`;
    }
    if (Array.isArray(subfolders)) {
        html += `<ul class="pl-4 space-y-1">`;
        subfolders.forEach(function (subfolder) {
            if (subfolder.subfolders && subfolder.subfolders.length > 0) {
                html += `<li class="py-1"><i class="fas fa-folder"></i> ${subfolder.name}</li>`;
                html += generateTreeHtml(subfolder.name, subfolder.subfolders);
            } else {
                const fileExtension = subfolder.name.split('.').pop();
                const icon = getFileIcon(fileExtension);
                html += `<li class="py-1"><i class="fas ${icon}"></i> ${subfolder.name}</li>`;
            }
        });
        html += `</ul>`;
    }
    return html;
}

// Function to get the file icon based on extension
function getFileIcon(extension) {
    const ext = extension.toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'ico':
            return 'fa-image';
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'mkv':
            return 'fa-video';
        case 'xls':
        case 'xlsx':
        case 'xlsm':
        case 'csv':
            return 'fa-file-excel';
        case 'ppt':
        case 'pptx':
            return 'fa-file-powerpoint';
        case 'mp3':
        case 'wav':
        case 'ogg':
            return 'fa-file-audio';
        case 'c':
        case 'cpp':
        case 'py':
        case 'java':
        case 'php':
        case 'js':
        case 'html':
        case 'css':
            return 'fa-file-code';
        case 'doc':
        case 'docx':
            return 'fa-file-word';
        case 'pdf':
            return 'fa-file-pdf';
        case 'txt':
        case 'md':
        case 'log':
            return 'fa-file-alt';
        case 'zip':
        case 'rar':
            return 'fa-file-archive';
        default:
            return 'fa-file';
    }
}

// Toggle password visibility function
function togglePassword(passwordId, iconId) {
    const passwordField = document.getElementById(passwordId);
    const icon = document.getElementById(iconId);

    if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}
