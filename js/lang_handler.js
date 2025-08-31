let translations = {};

// Function to fetch language data from the PHP endpoint
async function fetchLanguageData(lang = '') {
    try {
        const response = await fetch(`php/get_language.php?lang=${lang}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        translations = await response.json();
    } catch (error) {
        console.error('Failed to load language data:', error);
    }
}

// Function to translate the DOM based on the current page
function applyTranslations() {
    // Determine the current page to get the correct set of translations
    const currentPage = window.location.pathname.split('/').pop();

    const pageTranslations = {
        // -- folders.html --
        'folders.html': {
            '#pageTitle': 'my_folders_title',
            '#searchPlaceholder': {
                placeholder: 'find_folder'
            },
            '#noFoldersMessage': 'no_folders_found',
            '#addNewFolderButton': 'add_new_folder',
        },

        // -- files.html --
        'files.html': {
            '#folderTitlePrefix': 'files_in_folder_title_prefix',
            '#browseFilesMessage': 'browse_files_message',
            '#searchFilesPlaceholder': {
                placeholder: 'search_files'
            },
            '#noFilesMessage': 'no_files_found',
            '#backToFoldersLink': 'back_to_folders',
            // Specific translation keys for files.js
            '#folderTitle': 'allUploadedFiles',
            '#noFilesMessage': 'noFilesFound',
            '#noMatchingFiles': 'noMatchingFiles',
        },

        // -- dashboard.html --
        'dashboard.html': {
            '#addFileBtn': 'add_file_button',
            '#clickUpload': 'click_upload',
            '#renameFile' : 'rename_file',
            '#deleteFile' : 'delete_file',
            '#deleteFileNameText' : 'delete_msg',
            '#rename' : 'rename',
            '#selectFile': 'select_file_title',
            '#showMyFilesBtn': 'my_files_button',
            '#showSharedFilesBtn': 'shared_with_me_button',
        },

        // -- user.html --
        'user.html': {
            '#userProfileTitle': 'user_profile_title',
            '#myDirectoryTitle': 'my_directory_title',
            '#yourInsightsTitle': 'your_insights_title',
            '#fileTypeDistribution': 'file_type_distribution',
            '#totalFiles': 'total_files',
            '#totalDownloads': 'total_downloads',
            '#filesShared': 'files_shared',
            '#activityTrend': 'activity_trend',
            '#updatePasswordBtn': 'update_password',
            '#oldPasswordPlaceholder': {
                placeholder: 'old_password_placeholder'
            },
            '#newPasswordPlaceholder': {
                placeholder: 'new_password_placeholder'
            },
            '#logoutButton': 'logout_button',
        },

        // -- Dynamic elements (modals, etc.) --
        'modals': {
            '#uploadStatusTitle': 'upload_status',
            '#okButton': 'ok_button',
            '#createFolderTitle': 'create_folder_title',
            '#folderNamePlaceholder': {
                placeholder: 'folder_name_placeholder'
            },
            '#createButton': 'create_button',
            '#closeButton': 'close_button',
            '#deleteFileTitle': 'delete_file_title',
            '#deleteConfirmation': 'delete_confirmation',
            '#deleteButton': 'delete_button',
            '#cancelButton': 'cancel_button',
            '#shareFileTitle': 'share_file_title',
            '#shareEmailPlaceholder': {
                placeholder: 'share_email_placeholder'
            },
            '#permission': 'permission',
            '#viewPermission': 'view_permission',
            '#editPermission': 'edit_permission',
            '#deletePermission': 'delete_permission',
            '#shareButton': 'share_button',
            '#commentsTitle': 'comments_title',
            '#commentPlaceholder': {
                placeholder: 'comment_placeholder'
            },
            '#postCommentButton': 'post_comment_button',
            // Specific keys for modals from files.js
            '#deleteFileTitle': 'deleteFileTitle',
            '#confirmDelete': 'deleteButton',
            '#cancelDelete': 'cancelButton',
        }
    };

    // Get the translations for the current page
    const pageKeys = pageTranslations[currentPage] || {};

    // Apply translations to the DOM
    for (const selector in pageKeys) {
        const element = document.querySelector(selector);
        if (element) {
            const key = pageKeys[selector];
            if (typeof key === 'object') {
                // Update attributes like placeholder
                for (const attr in key) {
                    element.setAttribute(attr, translations[key[attr]]);
                }
            } else if (translations[key]) {
                // Update text content
                element.textContent = translations[key];
            }
        }
    }
}

// Function to retrieve a translated string by key
window.getTranslation = function (key) {
    return translations[key] || key; // Fallback to key if translation is not found
}

// Initial language load on page load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchLanguageData();
    applyTranslations();

    // Add event listeners for language switch buttons
    document.querySelectorAll('.lang-switcher').forEach(button => {
        button.addEventListener('click', async (event) => {
            const newLang = event.target.dataset.lang;
            if (newLang) {
                // Fetch the translations for the new language
                await fetchLanguageData(newLang);
                // Apply the new translations to the page
                applyTranslations();
            }
        });
    });
});