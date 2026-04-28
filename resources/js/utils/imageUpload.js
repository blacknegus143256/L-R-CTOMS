export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

const ACCEPTED_IMAGE_PATTERN = /\.(jpe?g|png|gif|webp)$/i;

export function getImageUploadError(file) {
    if (!file) {
        return '';
    }

    const looksLikeImage = file.type?.startsWith('image/') || ACCEPTED_IMAGE_PATTERN.test(file.name || '');

    if (!looksLikeImage) {
        return 'Please choose a JPG, PNG, GIF, or WebP image.';
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        return 'Image must be 2MB or smaller.';
    }

    return '';
}

export function filterImageFiles(files) {
    const validFiles = [];
    let invalidCount = 0;

    for (const file of Array.from(files || [])) {
        if (getImageUploadError(file)) {
            invalidCount += 1;
            continue;
        }

        validFiles.push(file);
    }

    return {
        validFiles,
        errorMessage: invalidCount > 0 ? 'Only image files up to 2MB each are allowed.' : '',
    };
}