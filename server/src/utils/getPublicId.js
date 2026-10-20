const { BadRequestError } = require('../core/error.response');

function getPublicId(url) {
    if (!url || typeof url !== 'string') return null;
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) {
        return null;
    }

    const pathParts = parts.slice(uploadIndex + 1);
    const pathWithoutVersion = pathParts[0] && pathParts[0].startsWith('v') ? pathParts.slice(1) : pathParts;
    const publicIdWithExt = pathWithoutVersion.join('/');
    const dotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = dotIndex !== -1 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt;

    return publicId;
}

module.exports = getPublicId;

